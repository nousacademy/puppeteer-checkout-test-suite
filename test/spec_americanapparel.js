let selenium = require('selenium-webdriver');
let test = require('selenium-webdriver/testing');
let expect = require('chai').expect;
const URL = require('url');

//load configuration file
let config = require('../test_config.json');

// Since mocha is being used for browser-based tests need to up default timeout 2,000ms -> 15,000ms
const DEFAULT_TimeOut = 15000;
   
// Function to check if css selector has localized
let localizedPricesCheck = async (driver, selector, timeOut) => {
  timeOut = timeOut && DEFAULT_TimeOut;
  await driver.wait(selenium.until.elementLocated(selenium.By.css(selector)), timeOut);
  let prices = await driver.findElements(selenium.By.css(selector));
  let values = await selenium.promise.filter(prices, async (el) => {
    return (await el.getAttribute('data-bfx'));
  });
  expect(values).to.not.be.empty && expect(values.length).to.equal(prices.length);  
}

// Function to check proxy leaks
let proxyLeakCheck = async (driver, domesticUrl) => {
  let links = driver.findElements(selenium.By.css('a[href]'));
  let values = await selenium.promise.filter(links, async (link) => {
    let el = await link.getAttribute('href');
    return el.match(new RegExp(domesticUrl,"gim"));
  });
  expect(values).to.be.empty;  
}

const runTests = (testEnv, testUrl) => {

  //declare variables
  let MATSettings = {};
  let driver;
  let pageNotExists = false;
  // Env timeout
  let timeOut = testEnv.timeOut;

  let getPageTransform = (page, transform) => {
    return MATSettings.localizations.pages[page].transforms[transform];
  };

  test.describe(`Test ${testEnv.type} enviroment | ${testUrl.proxy}`, function() {

    test.before(async function(done) {
      this.timeout(timeOut);

      driver = new selenium.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();

      await driver.get(testUrl.proxy);
      let currentUrl = URL.parse(await driver.getCurrentUrl());

      //check if site exists and it is not redirected
      if (currentUrl.hostname == null || testUrl.proxy.indexOf(currentUrl.hostname) == -1) {
        pageNotExists = true;
        done();
        return;     
      }
      //get sessionId
      let sessionId;
      let getCookie = setInterval(async () => {
        let cookie = await driver.manage().getCookie('bfx.sessionId');
        if (cookie && cookie.value) {
          sessionId = cookie.value;
          clearInterval(getCookie);
        }
      }, 200); 
      //wait for session storage
      var getMATSettings = setInterval(async () => {
        //get MAT settings
        let transforms = await driver.executeScript("return window.sessionStorage.getItem('" + sessionId + ":merchant');");
        if (transforms !== null) {
          clearInterval(getMATSettings);
          MATSettings = JSON.parse(transforms);          
          //set domestic country cookie code to get CC popup
          driver.manage().addCookie({ name: "bfx.country", value: MATSettings.profile.country.code });
          //set cookie to prevent welcome MAT showing up
          driver.manage().addCookie({ name: "bfx.isWelcomed", value: "true" });          
          //get new page state
          driver.get(testUrl.proxy);
          done();
        }        
      }, 200);      
    });

    test.after(async function() {
      this.timeout(timeOut);
      //await driver.quit();    
    });
    // Takes a screenshot if test fails
    test.afterEach(async function() {
      this.timeout(timeOut);
      if (this.currentTest.state === 'failed') {
        
        let testTitle = this.currentTest.title.toLowerCase().replace(/\s/g, '_');
        let image = await driver.takeScreenshot();
        let date = new Date();
        let timeStamp = `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}`;
        let fileName = '[FAIL]' + '--' + testEnv.type + '--' + timeStamp + '--'  + testTitle + ".png";
        await require('fs').writeFile('./screenshots/' + fileName, image, 'base64', function(err) {
          err && console.log(err);
        });
      }
    });

    test.describe(`BFX Proxy | Homepage`, function() {            
      this.timeout(timeOut);

      test.before(function () {
        //check if site exists - if not skip tests
        pageNotExists && this.skip();        
      });

      test.it("Check stub.js env value", async function() {
        this.timeout(timeOut);
        //check enviroment
        let bfxEnv = await driver.executeScript("return bfx._env;");
        expect(bfxEnv).to.equal(testEnv.matEnv);
      });

      test.it('Prints title of page', async function() {
        this.timeout(timeOut);

        let title = await driver.getTitle();
        expect(title).to.equal("Ethically Made - Sweatshop Free | American Apparel");
      });

      test.it('Search results shows localized pricing', async function() {          
        this.timeout(timeOut);

        // Selects 'Canada' | Context Chooser
        await driver.wait(selenium.until.elementLocated(selenium.By.css('#bfx-cc-btn')), timeOut);
        await driver.findElement(selenium.By.css('#bfx-cc-countries-select option[value="CA"]')).click();
        await driver.findElement(selenium.By.css('#bfx-cc-btn')).click();
        // Bypass signup popup
        await driver.wait(selenium.until.elementLocated(selenium.By.css('.popup-dialog')), timeOut);
        await driver.findElement(selenium.By.css('.popup-dialog a[data-close-link-position]')).click();
        //wait for signup popup to close
        await driver.sleep(500);

        await driver.wait(selenium.until.elementLocated(selenium.By.css('#header_toolbar_ul [type="submit"]')), timeOut);
        // Enter 'shirt' in search
        await driver.findElement(selenium.By.css('#header_toolbar_ul #Ntt')).sendKeys('shirt');
        await driver.findElement(selenium.By.css('#header_toolbar_ul .aa-search-btn-new')).click();
        await driver.wait(selenium.until.elementsLocated(selenium.By.css(getPageTransform(0, 11).selector)), timeOut);
        await localizedPricesCheck(driver, getPageTransform(0, 11).selector, timeOut);
      });

      test.it('Check a[href] links for proxy leaks', async function() {
        this.timeout(timeOut);
        await proxyLeakCheck(driver, testUrl.origin);
      });
    });

    test.describe('BFX Proxy | PDP', function() {      
      this.timeout(timeOut);

      test.before(function () {
        //check if site exists - if not skip tests
        pageNotExists && this.skip();        
      });
      
      test.it('Shows localized PDP price', async function() {
        this.timeout(timeOut);
        //navigate to PDP
        await driver.wait(selenium.until.elementLocated(selenium.By.css('.product')), timeOut);        
        await driver.findElement(selenium.By.css('.product a')).click();

        await driver.wait(selenium.until.elementsLocated(selenium.By.css(getPageTransform(0, 8).selector)), timeOut);
        await localizedPricesCheck(driver, getPageTransform(0, 8).selector, timeOut);
      });

      test.it('Adds product to cart', async function() {
        this.timeout(timeOut);               
        // Select size & add to cart
        await driver.wait(selenium.until.elementLocated(selenium.By.css('.size[data-name="S"]')), timeOut);        
        await driver.findElement(selenium.By.css('.size[data-name="S"]')).click();        
        await driver.findElement(selenium.By.css('#addProductBtn')).click();

        await driver.wait(selenium.until.elementLocated(selenium.By.css('#mini-cart-qty')), timeOut);
        await driver.sleep(1500);  
        let qty = await driver.findElement(selenium.By.css('#mini-cart-qty')).getAttribute('data-cart-qty');
          
        expect(qty).to.equal('1');                              

        // // Move cursor from PDP zoomed image, blocking add to cart btn
        // let plot0 = driver.findElement(selenium.By.css('.search-section .search'));
        // driver.actions()
        //   .mouseMove(plot0, {x: 1, y: 1}) // 100px from left, 100 px from top of plot0
        //   .mouseDown()
        //   .mouseMove({x: 400, y: 1}) // 400px to the right of current location
        //   .perform();     
      });

      test.it('Check a[href] links for proxy leaks', async function() {
        this.timeout(timeOut);
        await proxyLeakCheck(driver, testUrl.origin);
      });  
    });

    test.describe('BFX Proxy | Cart', function() {
      this.timeout(timeOut);
      let MATCartPage, MATCheckout;

      test.before(function () {
        //check if site exists - if not skip tests
        pageNotExists && this.skip();    
        //find cart page transforms
        MATSettings.localizations.pages.forEach(function (page) {
          page.transforms.forEach(function (transform) {
            if (transform.type === 'checkout') {
              MATCartPage = page;
              MATCheckout = transform;
            }
          });
        });
      });
      
      test.it('Shows localized pricing in checkout', async () => {
        let miniCart = selenium.By.css('#mini-cart-btn');
        await driver.wait(selenium.until.elementLocated(miniCart), timeOut);
        await driver.findElement(miniCart).click();
        //wait for bfx to load & checkout button visible      
        let button = selenium.By.css(MATCheckout.selector);
        await driver.wait(selenium.until.elementLocated(button), timeOut);
        await driver.wait(selenium.until.elementIsVisible(driver.findElement(button)), timeOut);
        await driver.sleep(1000);
        await localizedPricesCheck(driver, getPageTransform(1, 1).selector, timeOut);                  
      });   

      test.it('Check a[href] links for proxy leaks', async function() {
        this.timeout(timeOut);
        await proxyLeakCheck(driver, testUrl.origin);
      });  

      test.it('Envoy loads', async function() {
        this.timeout(timeOut);
        
        await driver.findElement(selenium.By.css(MATCheckout.selector)).click();
        await driver.wait(selenium.until.elementLocated(selenium.By.css('#envoyId')), timeOut);
        let envoy = await driver.findElement(selenium.By.css('#envoyId'))
        expect(envoy).to.exist;        
      });      
    });
  });
};

const startTests = () => {
  //loop thru test enviroments
  config.testEnvs.forEach(env => {
    let testEnv = env;
    //skip if test enviroment shouldn't be tested by jenkins
    if (config.jenkinsEnv !== testEnv.jenkins)
      return;
    //loop thru urls array
    testEnv.urls.forEach(url => {
      let testUrl = url;    
      runTests(testEnv, testUrl);
    });  
  });
};
startTests();



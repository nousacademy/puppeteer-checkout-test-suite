let selenium = require('selenium-webdriver');
let test = require('selenium-webdriver/testing');
let expect = require('chai').expect;

//load configuration file
let config = require('../test_config.json');

// Since mocha is being used for browser-based tests need to up default timeout 2,000ms -> 20,000ms
const timeOut = 20000;
   
// Function to check if css selector has localized
let localizedPricesCheck = (driver, selector) => {
  driver.wait(selenium.until.elementLocated(selenium.By.css(selector)), timeOut).then(() => {
    let prices = driver.findElements(selenium.By.css(selector));
    selenium.promise.filter(prices, (el) => {
      return el.getAttribute('data-bfx');
    }).then((values) => {
      expect(values).to.not.be.empty;
    });
  });
}

// Function to check proxy leaks
let proxyLeakCheck = (driver, domesticUrl) => {
  let links = driver.findElements(selenium.By.css('a[href]'));
  selenium.promise.filter(links, (link) => {
    return link.getAttribute('href').then(function(el) {
      return el.match(new RegExp(domesticUrl,"gim"));
    });
  }).then((values) => {
    expect(values).to.be.empty;
  });
}

const runTests = (env, url) => {

  //declare variables (MAT settings, driver)
  let MATSettings = {};
  let driver;

  test.describe(`Test ${env.type} enviroment | ${url.proxy}`, function() {

    test.before(function(done) {
      this.timeout(timeOut);

      driver = new selenium.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();

      driver.get(url.proxy);

      //get sessionId
      driver.manage().getCookie('bfx.sessionId').then(function (cookie) {
        let sessionId = cookie.value;
        //console.log(sessionId);
        //wait for session storage
        var getMATSettings = setInterval(() => {
          //get MAT settings
          driver.executeScript("return window.sessionStorage.getItem('" + sessionId + ":merchant');").then((transforms) => {
            if (transforms !== null) {
              clearInterval(getMATSettings);
              MATSettings = JSON.parse(transforms);          
              //console.log(MATSettings.localizations.pages[0].transforms[0].selector);

              //set domestic country cookie code to get CC popup
              driver.manage().addCookie({ name: "bfx.country", value: MATSettings.profile.country.code });
              //set cookie to prevent welcome MAT
              //driver.manage().addCookie({ name: "bfx.isWelcomed", value: "true" });
              
              //get new page state
              driver.get(url.proxy);

              done();
            }        
          });
        }, 500);      
      });   
    });
    
    test.after(function(done) {
      this.timeout(timeOut);

      driver.quit();
      done();
    });

    // Takes a screenshot if test fails
    test.afterEach(function(done) {
      this.timeout(timeOut);
      if (this.currentTest.state === 'failed') {
        
        let testTitle = this.currentTest.title.toLowerCase().replace(/\s/g, '_');
        
        driver.takeScreenshot().then(
          function(image, err) {
            let date = new Date();
            let timeStamp = `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
            let fileName = '[FAIL]' + '--'+ timeStamp + '--' + env.type + '--' + testTitle + ".png";
            require('fs').writeFile('./screenshots/' + fileName, image, 'base64', function(err) {
              err && console.log(err);
            });
            done();
          }
        );    
      } else {
        done();
      }
    });

    test.describe(`BFX Proxy | Homepage`, function() {            
      this.timeout(timeOut);

      test.it("Check stub.js env value", function(done) {
        this.timeout(timeOut);
        //check enviroment
        driver.executeScript("return bfx._env;").then((bfxEnv) => {
          expect(bfxEnv).to.equal(env.matEnv);
          done();
        });
      });

      test.it('Prints title of page', function(done) {
        this.timeout(timeOut);
        driver.getTitle().then( (title) => {
          expect(title).to.equal("Ethically Made - Sweatshop Free | American Apparel");
          done();
        });

      });

      test.it('Search results shows localized pricing', function() {          
        this.timeout(timeOut);
        // Selects 'Canada' | Context Chooser
        driver.wait(selenium.until.elementLocated(selenium.By.css('#bfx-cc-btn')), timeOut).then(() => {
          driver.findElement(selenium.By.css('#bfx-cc-countries-select option[value="CA"]')).click();
          driver.findElement(selenium.By.css('#bfx-cc-btn')).click();
        });

        driver.wait(selenium.until.elementLocated(selenium.By.css('#header_toolbar_ul [type="submit"]')), timeOut).then(() => {
          // Bypass 'Welcome Mat'
          driver.wait(selenium.until.elementLocated(selenium.By.css('#bfx-wm-continue-button')), timeOut).then(() => {
            driver.findElement(selenium.By.css('#bfx-wm-continue-button')).click();
            
            // Enter 'shirt' in search
            driver.findElement(selenium.By.css('#header_toolbar_ul #Ntt')).sendKeys('shirt');
            driver.findElement(selenium.By.css('#header_toolbar_ul .aa-search-btn-new')).click().then(() => {
              driver.wait(selenium.until.elementLocated(selenium.By.css('.bfx-price')), timeOut).then(() => {
                localizedPricesCheck(driver, '.bfx-price');
              });
            });        
          });
        });  

        // Bypass signup popup
        driver.wait(selenium.until.elementLocated(selenium.By.css('.popup-dialog')), timeOut).then(() => {
          driver.findElement(selenium.By.css('.popup-dialog a[data-close-link-position]')).click();
        });      
      });

      test.it('Check a[href] links for proxy leaks', function() {
        this.timeout(timeOut);
        proxyLeakCheck(driver, url.origin);
      });

    });

    test.describe('BFX Proxy | PDP', function() {      
      this.timeout(timeOut);
      
      test.it('Shows localized PDP price', function() {
        this.timeout(timeOut);
        driver.wait(selenium.until.elementLocated(selenium.By.css('.product')), timeOut).then(() => {
          driver.findElement(selenium.By.css('.product a')).click();
        });
        
        driver.wait(selenium.until.elementLocated(selenium.By.css('#skuPriceId-2 .bfx-price')), timeOut).then(() => {
          localizedPricesCheck(driver, '#skuPriceId-2 .bfx-price');
        });

      });

      test.it('Adds product to cart', function(done) {
        this.timeout(timeOut);               
        // Select size & add to cart
        driver.wait(selenium.until.elementLocated(selenium.By.css('.size[data-name="S"]')), timeOut).then(() => {
          
          driver.findElement(selenium.By.css('.size[data-name="S"]')).click();

          setTimeout(function() {
            // let addCart = driver.findElement(selenium.By.css('#addProductBtn'));
            // driver.actions().mouseMove(addCart).click().perform();
            
            driver.findElement(selenium.By.css('#addProductBtn')).click();

            driver.wait(selenium.until.elementLocated(selenium.By.css('#mini-cart-qty')), timeOut).then(() => {
              setTimeout(function() {
                let qtyPromise = driver.findElement(selenium.By.css('#mini-cart-qty')).getAttribute('data-cart-qty');
              
                qtyPromise.then((text) => {
                  expect(text).to.equal('1');
                  done();
                });
              }, 1000);
            });        
            
          }, 2000);
        });

        // // Move cursor from PDP zoomed image, blocking add to cart btn
        // let plot0 = driver.findElement(selenium.By.css('.search-section .search'));
        // driver.actions()
        //   .mouseMove(plot0, {x: 1, y: 1}) // 100px from left, 100 px from top of plot0
        //   .mouseDown()
        //   .mouseMove({x: 400, y: 1}) // 400px to the right of current location
        //   .perform();     

      });

      test.it('Check a[href] links for proxy leaks', function() {
        this.timeout(timeOut);
        proxyLeakCheck(driver, url.origin);
      });  

    });

    test.describe('BFX Proxy | Cart', function() {
      this.timeout(timeOut);
      
      test.it('Shows localized pricing in checkout', function(done) {
        this.timeout(timeOut);
        driver.wait(selenium.until.elementLocated(selenium.By.css('#mini-cart-btn')), timeOut).then(() => {
          driver.findElement(selenium.By.css('#mini-cart-btn')).click();
          localizedPricesCheck(driver, '.bfx-price');
          done();
        });  
      });

      test.it('Check a[href] links for proxy leaks', function() {
        this.timeout(timeOut);
        proxyLeakCheck(driver, url.origin);
      });  

      test.it('Envoy loads', function() {
        this.timeout(timeOut);
        driver.wait(selenium.until.elementLocated(selenium.By.css('#cart-continueToCheckout[onclick]')), timeOut).then(() => {
          // Wrapped inside setTimeout as pricebook lookup was causing false positives
          setTimeout(function() {
            driver.findElement(selenium.By.css('#cart-continueToCheckout[onclick]')).click();
          }, 1000);
        });
        driver.wait(selenium.until.elementLocated(selenium.By.css('#envoyId')), timeOut).then(() => {
          let envoy = driver.findElement(selenium.By.css('#envoyId'));
          expect(envoy).to.exist;
        });  
      });
      
    });
  });
};

const startTests = () => {
  //loop thru test enviroments
  config.testEnvs.forEach(env => {
    let testEnv = env;
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

let selenium = require('selenium-webdriver');
let test = require('selenium-webdriver/testing');
let expect = require('chai').expect;

// Since mocha is being used for browser-based tests need to up default timeout 2,000ms -> 15,000ms
const timeOut = 15000;
  
// Function to check if css selector has localized
let localizedPricesCheck = (selector) => {
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
let proxyLeakCheck = () => {
  let links = driver.findElements(selenium.By.css('a[href]'));
  selenium.promise.filter(links, (link) => {
    return link.getAttribute('href').then(function(el) {
      return el.match(/www\.americanapparel\.com/g);
    });
  }).then((values) => {
    expect(values).to.be.empty;
  });
}

test.before(function() {
  this.timeout(timeOut);
  driver = new selenium.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();
  driver.get("http://global.americanapparel.com/");
});
 
// test.after(() => {
//   driver.quit();
// });

// Takes a screenshot if test fails
afterEach(function() {
  if (this.currentTest.state === 'failed') {
    
    let testTitle = this.currentTest.title.toLowerCase().replace(/\s/g, '_');
    
    driver.takeScreenshot().then(
      function(image, err) {
        let date = new Date();
        let timeStamp = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        let fileName = '[FAIL]' + '--' + testTitle + '--' + timeStamp;
        require('fs').writeFile('./screenshots/' + fileName, image, 'base64', function(err) {
          console.log(err);
        });
      }
    );    
  }
});

test.describe('BFX Proxy | Homepage', function() {
  
  this.timeout(timeOut);
  
  test.it('Prints title of page', () => {

    driver.getTitle().then( (title) => {
      expect(title).to.equal("Ethically Made - Sweatshop Free | American Apparel");
    });

  });

  test.it('Search results shows localized pricing', () => {          

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
            localizedPricesCheck('.bfx-price');
          });
        });        
      });
    });  

    // Bypass signup popup
    driver.wait(selenium.until.elementLocated(selenium.By.css('.popup-dialog')), timeOut).then(() => {
      driver.findElement(selenium.By.css('.popup-dialog a[data-close-link-position]')).click();
    });      
  });

  test.it('Check a[href] links for proxy leaks', () => {
    proxyLeakCheck();
  });

});

test.describe('BFX Proxy | PDP', function() {
  
  this.timeout(timeOut);
  
  test.it('Shows localized PDP price', () => {
    
    driver.wait(selenium.until.elementLocated(selenium.By.css('.product')), timeOut).then(() => {
      driver.findElement(selenium.By.css('.product a')).click();
    });
    
    driver.wait(selenium.until.elementLocated(selenium.By.css('#skuPriceId-2 .bfx-price')), timeOut).then(() => {
      localizedPricesCheck('#skuPriceId-2 .bfx-price');
    });

  });

  test.it('Adds product to cart', (done) => {
                
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

  test.it('Check a[href] links for proxy leaks', () => {
    proxyLeakCheck();
  });  

});

test.describe('BFX Proxy | Cart', function() {

  this.timeout(timeOut);
  
  test.it('Shows localized pricing in checkout', () => {
    driver.wait(selenium.until.elementLocated(selenium.By.css('#mini-cart-btn')), timeOut).then(() => {
      driver.findElement(selenium.By.css('#mini-cart-btn')).click();
      localizedPricesCheck('.bfx-price');
    });  
  });

  test.it('Check a[href] links for proxy leaks', () => {
    proxyLeakCheck();
  });  

  test.it('Envoy loads', () => {
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

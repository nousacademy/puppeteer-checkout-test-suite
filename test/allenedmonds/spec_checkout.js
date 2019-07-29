// Behaviour-Driven Development  (BDD)
const { expect } = require('chai'),
// High-level API to control Chrome headlessly
// https://github.com/GoogleChrome/puppeteer
 puppeteer = require('puppeteer'),
 // native event emitter
 events = require('events'),
 // actions lib
 actions = require('../../utility/actions'),
 // config for this merchant
 config = require('./config.json');

let browser,
 page;

 var mochaAsync = (fn) => {
   return done => {
     fn.call().then(done, err => {
       console.log(err)
        done(err);
     });
   };
 };

before(async () => {
  // set headless to false, to view browser launch, good for debugging
  browser = await puppeteer.launch({headless: true});
  page = await browser.newPage();
});

describe(`Perform a checkout on ${config.proxy}`, () => {

  it('can GET to the proxy site', mochaAsync(async () => {
    let response = await page.goto(config.proxy);
    // localize CC on HP
    await actions.localizeCC(page, config);
    expect(response.status()).to.equal(200);
  })).timeout(30000);

  it('has production snippet', mochaAsync(async () => {
    let snippet = await actions.getSnippet(page);
    expect(snippet.env).to.equal('PROD');
  })).timeout(10000);

  it('can GET to the PDP', mochaAsync(async () => {
    let response = await page.goto(config.pdp, { waitUntil: 'networkidle0'});
    expect(response.status()).to.equal(200);
  })).timeout(10000);

  it('checks if the Context Chooser is localized', mochaAsync(async () => {
    let result = await actions.isLocalized(page, config),
      country = new RegExp(config.cc_country, "gm");
    expect(result.flag).to.match(country);
  })).timeout(10000);

  // ADD TO CART functionality
  it('adds to cart on PDP', mochaAsync(async () => {
    // evaluate script
    await page.evaluate(() => {
      // click select bar
      document.querySelector('.toggleSwatchControl').click();
      // select size
      document.querySelector('.beltsize .swatchanchor[desc="30"]').click();
    });
    // wait for page to refresh
    await page.waitFor(4000);
    // evaluate script after content loaded
    await page.evaluate(() => {
      document.getElementById('add-to-cart').click();
    });
    await page.waitFor(4000);
    const result = await page.evaluate(() => {
      let viewCartBtn = document.querySelector('.mini-cart-icon').innerText;
      return { text: viewCartBtn }
    });
    // check if cart counter at 1
    expect(result.text).to.match(/1/gm);
  })).timeout(20000);

  it('goes to checkout and loads the envoy', mochaAsync(async () => {
    await page.goto(`${config.proxy}/cart`);
    let checkoutBtn = 'button[value="Checkout"]';
    let result = await actions.loadEnvoy(page, checkoutBtn);
    expect(result.envoy).to.equal(true);
  })).timeout(10000);

});

afterEach(() => {
  // console.log(this);
});

after(async () => {
  await browser.close();
});

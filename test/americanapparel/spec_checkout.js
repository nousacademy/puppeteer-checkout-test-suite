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

    await page.evaluate(() => {
        document.getElementById('selected_product_size').value = "S";
        document.querySelector('.buttons_container .addProductButton').click();
      });
    // wait for minicart to load
    await page.waitFor(5000);

    const result = await page.evaluate(() => {
        let cartCounter = document.querySelector('.orders-header-___bag_button__bagButton___2xLFN span').innerText;

        return { text: cartCounter }
    });
    // check if cart counter at 1
    expect(result.text).to.match(/1/gm);
  })).timeout(20000);

  it('goes to checkout and loads the envoy', mochaAsync(async () => {
    // click minicart btn, go to cart pg
    await page.click('[class*="orders-header-___bag_button__bagButton"]');
    // wait for minicart to load
    await page.waitFor(5000);

    let checkoutBtn = ".bfx-checkout";
    // test envoy
    let result = await actions.loadEnvoy(page, checkoutBtn);
    expect(result.envoy).to.equal(true);
  })).timeout(20000);

});

afterEach(() => {
  // console.log(this);
});

after(async () => {
  await browser.close()
});

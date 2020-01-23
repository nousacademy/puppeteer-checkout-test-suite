// Behaviour-Driven Development  (BDD)
const { expect } = require('chai'),
// High-level API to control Chrome headlessly
// https://github.com/GoogleChrome/puppeteer
 puppeteer = require('puppeteer'),
 // native event emitter
 events = require('events'),
 // actions lib
 actions = require('../../utility/actions'),
 // add to cart script, bulk of work should be done
 add2cart = require('./add_2_cart'),
 // config for this merchant
 config = require('./config.json');

let browser,
 page;

 var mochaAsync = (fn) => {
   return done => {
     fn.call()
     .then(done, err => {
       console.log(err)
        done(err);
     })
     .catch((err) => {
       done(err);
       console.log(err)
     });
   };
 };

before(async () => {
  // set headless to false, to view browser launch, good for debugging
  // --no-sandbox argument needed for puppeteer to work on CentOS 7 VM
  browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--unlimited-storage', '--full-memory-crash-report']});
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
  })).timeout(20000);

  it('checks if the Context Chooser is localized', mochaAsync(async () => {
    let result = await actions.isLocalized(page, config),
      country = new RegExp(config.cc_country, "gm");
    expect(result.flag).to.match(country);
  })).timeout(10000);

  it('adds to cart on PDP', mochaAsync(async () => {
    // ATC on PDP
    let cartCounter = await add2cart(page);
    // check if cart counter at 1
    expect(cartCounter).to.match(/1/gm);
  })).timeout(20000);

  it('goes to checkout and loads the envoy', mochaAsync(async () => {
    // click minicart btn, go to cart pg, instead of going to URL due to cookie contamination
    await page.click(config.minicartBtn);
    // wait for minicart to load
    await page.waitFor(5000);
    // test envoy
    let result = await actions.loadEnvoy(page, config.checkoutBtn);
    expect(result.envoy).to.equal(true);
  })).timeout(20000);

});

afterEach(function() {
  actions.test4EnvoyFail(page, this, config);
});

after(async () => {
  await browser.close()
});

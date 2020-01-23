const puppeteer = require('puppeteer'),
  // native assert lib
  assert = require('assert'),
  // actions lib
  actions = require('./utility/actions');


let browser,
  page,
  i = 0,
  merchants = [
    "allenedmonds",
    "americanapparel",
    "bergdorfgoodman",
    "drmartens",
    "lastcall",
    "prana",
    "target",
    "ulta"
  ];

const launchPuppeteer = async () => {
  // add to cart script, bulk of work should be done
  let add2cart = require(`./test/${merchants[i]}/add_2_cart`),
  // config for this merchant
  config = require(`./test/${merchants[i]}/config.json`);
  // set headless to false, to view browser launch, good for debugging
  // --no-sandbox argument needed for puppeteer to work on CentOS 7 VM
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--unlimited-storage', '--full-memory-crash-report']
    // devtools: true
  });
  page = await browser.newPage();

  // Go to proxy HP
  let getINTLsite = await page.goto(config.proxy);
  // localize CC on HP
  await actions.localizeCC(page, config);
  let intlStatus = getINTLsite.status();
  console.log(intlStatus);
  assert(intlStatus === 200, "Site is unreachable, possibly redirected or not available.");

  // cookie to get rid of cookie consent pop up
  // let isoDate = new Date().toISOString();
  // await actions.addCookie(page, {name: "OptanonAlertBoxClosed", value: isoDate, domain: ".prana.com"});

  // Check if PROD snippet on Production
  let snippet = await actions.getSnippet(page);
  console.log(snippet.env);
  assert(snippet.env === "PROD", "Production snippet not found.");

  // GET PDP
  let getPDP = await page.goto(config.pdp, {
      waitUntil: 'networkidle0'
    }),
    pdpResponse = getPDP.status();
  console.log(pdpResponse);
  assert(pdpResponse === 200, "PDP unreachable.");
  // Check if CC loaded
  let cc = await actions.isLocalized(page, config),
    country = new RegExp(config.cc_country, "gm");
  console.log(cc.flag);

  assert(cc.flag.match(country), "CC failed to localize.");

  // ATC on PDP
  let cartCounter = await add2cart(page);
  console.log(cartCounter);
  // check if cart counter at 1
  assert(cartCounter.match(/1/gm), "Failed to add anything to cart.");

  // go to Cart page
  await page.goto(config.proxy + config.cart_pg_path);
  // wait for checkout btn to get created
  await page.waitFor(4000);
  let iframe = await actions.loadEnvoy(page, config.checkoutBtn);
  // await page.screenshot({path:'_headless.jpg', fullPage: false });
  console.log(iframe.envoy);
  assert(iframe.envoy === true, "Envoy failed to load");
  // quit browser
  await browser.close();
  i++;
  launchPuppeteer()
  .then()
  .catch(err => console.log(err));
};

launchPuppeteer()
.then()
.catch(err => console.log(err));

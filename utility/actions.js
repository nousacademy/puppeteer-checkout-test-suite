// TODO
// + localizedPricesCheck
// + proxyLeakCheck
// + getMATSettings

const actions = {
  addCookie: async(pg, cookieObj) => {
    let cookies = [];
    // console.log(cookieObj)
      cookies.push({
        name: cookieObj.name,
        value: cookieObj.value,
        domain: cookieObj.domain
      });

    await pg.setCookie(...cookies);
  },
  checkTitle: async(pg, settings) => {
    const title = await pg.title();
    return title;
  },
  getSnippet: async(pg) => {
    const snippet = await pg.evaluate(() => {
      let res = window.bfx._env;
      return {
        env: res
      }
    });
    return snippet;
  },
  isLocalized: async(pg) => {
    const result = await pg.evaluate(() => {
        let flag = document.querySelector('.bfx-cc-flag img').getAttribute('src');
        return { flag }
      });
    return result;
  },
  localizeCC: async(pg, settings) => {
    const cookies = actions.localizeCookies(settings);
    // set cookies
    await pg.setCookie(...cookies);
  },
  localizeCookies: (settings) => {
    // localization cookies
    const cookies = [{
      'name': 'bfx.country',
      'value': settings.cc_country,
      'domain': settings.cookie_domain
    }, {
      'name': 'bfx.currency',
      'value': settings.cc_currency,
      'domain': settings.cookie_domain
    },{
      'name': 'bfx.isWelcomed',
      'value': 'true',
      'domain': settings.cookie_domain
    }];
    return cookies;
  },
  loadEnvoy: async(pg, checkoutBtn) => {
    await pg.content();
    // click button
    await pg.$eval(checkoutBtn, (btn) => {
      console.log(btn)
      btn.click()

    });
    // console.log('here')
    await pg.waitFor('#envoyId');
    const result = await pg.evaluate(() => {
        let envoy = document.body.contains(document.getElementById('envoyId'));
        return { envoy }
      });
    return result;
  },
  sendEmail: async (receivers, title, content) => {
    const { exec } = require('child_process');
    exec(`mail -s "${title}" ${receivers} <<< "${content}"`);
  },
  // usage: actions.takeScreenshot(page, {width: 1000, height: 600, x: 0, y: -200} );
  takeScreenshot: (pg, clip) => {
    pg.screenshot({
      path: 'failure.png',
      clip: clip //{width: 1000, height: 600, x: 0, y: -200}
    });
  },
  test4EnvoyFail: function(p, ctx, testCtx) {
    p.on("error", err => {
        console.log("error", err);
    });
    if (ctx.currentTest.state === 'failed' && ctx.currentTest.title.match(/envoy/)) { 
      actions.sendEmail("alessandro.elkan@pb.com, Jisu.Kim@pb.com, iris.martinez1@pb.com, paul.bruno@pb.com", `We've encountered an issue on ${testCtx.proxy}`, `Envoy failed to load at: ${testCtx.proxy + testCtx.cart_pg_path}`);
    }
  }
};

module.exports = actions;

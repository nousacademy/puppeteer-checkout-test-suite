const nodeMailer = require('nodemailer');

// let transporter = nodeMailer.createTransport({
//   host: 'pb.com',
//   port: 465,
//   secure: true, //true for 465 port, false for other ports
//   auth: {
//     user: 'alessandro.elkan@pb.com',
//     pass: ''
//   }
// });
//
// let mailOptions = {
//     from: '"Alessandro Elkan" <alessandro.elkan@pb.com>', // sender address
//     to: 'jisu.kim@pb.com, iris.martinez@pb.com', // list of receivers
//     subject: 'Hello from Puppeteer ✔', // Subject line
//     text: 'Robot apocalypse?', // plain text body
//     html: '<a href="https://google.com">Robot apocalypse?</b>' // html body
// };

// TODO
// + localizedPricesCheck
// + proxyLeakCheck
// + getMATSettings

const actions = {
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
    await pg.waitFor(checkoutBtn);
    await pg.click(checkoutBtn);
    await pg.waitFor('#envoyId');
    const result = await pg.evaluate(() => {
        let envoy = document.body.contains(document.getElementById('envoyId'));
        return { envoy }
      });
    return result;
  },
  sendEmail: async() => {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
      }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Fred Foo 👻" <foo@example.com>', // sender address
      to: "alessandro.elkan@pb.com, iris.martinez@pb.com, jisu.kim@pb.com, paul.bruno@pb.com", // list of receivers
      subject: "Hello ✔", // Subject line
      // text: "Hello world?", // plain text body
      html: "<b>Hello from Puppeteer</b>" // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  },
  takeScreenshot: (pg) => {
    pg.screenshot({
      path: 'failure.png'
    });
  }
};

module.exports = actions;

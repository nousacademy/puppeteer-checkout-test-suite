# QA | Automated Testing w/ Node, Puppeteer (Headless Chrome) & Mocha

Automated tests for bfx proxy sites.

### Prerequisites

You will need:

[Node](https://nodejs.org/en/) at least version 7.6

### Installing

Clone this repo

```
git clone git@dbygitmsprod.pbi.global.pvt:borderfree/PI/bfx_qa_automation.git
```

Then cd into the cloned directory

```
cd bfx_qa_automation
```

Lastly, install node dependencies

```
npm install
```

### Running the tests

Running the commands in the terminal

```
mocha
```
This command will run all .js files that are a direct child of the `test` folder.

```
mocha test/{{MERCHANT_NAME}}/{{FILE_NAME}}.js
```

This will run the specified js test file in a particular subfolder of the main test folder.

For example: `mocha test/target/spec_checkout.js`, will test checkout for that particular subfolder. All of the subfolders should be named after that particular merchant.
The example just given, would be isolated to Target.

### Debugging Puppeteer

By default, Puppeteer will run headlessly ex: `browser = await puppeteer.launch({headless: true});` - line 26
To debug Puppeteer and watch it run in the browser, we would update this to `browser = await puppeteer.launch({headless: false, devtools: true});`

You can also run `mocha --inspect-brk test/target/spec_checkout.js` for debugging purposes and watch mocha run in browser, just click on the nodejs icon in the upper left corner in the console. In most cases passing the Puppeteer parameters for debugging will be enough.

### Running all tests at once

To run all tests simply run the command of

```
npm test
```

This command is configured in the package.json:

`"scripts": {
  "test": "mocha test/**/spec_checkout.js -R mocha-spec-json-output-reporter --reporter-options fileName=test_results/output.json"
}`

The `npm test` command runs every file that is a subfolder of `test` and generates a json file of Mocha's results under the `test_results` folder and formats it in an `output.json` folder.  
"mocha-spec-json-output-reporter" is used as our Mocha reporter that generates the output for the tests.

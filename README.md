# QA | Automated Testing w/ Node, Selenium & Mocha

Automated tests for bfx proxy sites.

### Prerequisites

You will need:

[Node](https://nodejs.org/en/)

### Installing

Clone this repo

```
git clone git@dbygitmsprod.pbi.global.pvt:borderfree/PI/bfx_qa_automation.git
```

Then cd into the cloned directory

```
cd bfx_qa_automation
```

Download and install [ChromeDriver](http://chromedriver.chromium.org/downloads) to the directory.

Lastly, install node dependencies

```
npm install
```

### Running the tests

Run this command in the terminal

```
mocha
```

This will run the test files in the test directory. Currently the test file 'spec_americanapparel.js' is an end to end test (from selecting the context chooser until the envoy).

You should see a new instance of chrome launch and the test cases in the terminal:
![Example](https://preview.ibb.co/myRmST/example_image.png)

**Note:** For any test cases that fail, a screenshot of the page will be taken and saved to the screenshots folder.

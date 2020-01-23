// routing
const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  // native module
  path = require('path'),
  // utility lib
  actions = require('./utility/actions'),
  // cron job lib
  cron = require("node-cron"),
  // resulting data of QA testing
  test_results = require('./test_results/output.json'),
  // server PORT
  PORT = process.env.PORT || 3000;

// configure the app to use bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));
// parse application/json
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, '/public')));

app.get('/test_data', (req, res) => {
  res.send(test_results);
});

const server = app.listen(PORT, () => {
  console.log(`Express server listening on port ${server.address().port}`);
});

// spawn cron job
const { spawn } = require('child_process');
// minute, hr (0-23), day of month, month, day of week (1-5 = mon - fri)
// 30 9-17 * * 1-5 = At minute 30 past every hour from 9 through 17 on every day-of-week from Monday through Friday. (9:30am - 5:30pm work hrs)
cron.schedule('30 9-17 * * 1-5', () => {
  // console.log('running task');
  const child = spawn('npm', ['test']);
  // on exit listener
  child.on('exit', code => {
    console.log(`Exit code is: ${code}`);
  });
  child.kill();
});

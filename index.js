module.exports = process.env.TEST_COVERAGE ? require('./lib-cov/router') : require('./lib/router');

/*global beforeEach, describe, it*/

'use strict';

var Router = process.env.AK_ROUTER_TEST_COVERAGE ? require('../lib-cov/router') : require('../');
var assert = require('assert');
var originalBaseUrl = Router.getOrigin() + window.location.pathname.replace(/\/$/, '');

describe('Router', function () {
  beforeEach(function () {
    window.history.pushState(null, '', originalBaseUrl);
  });

  it('#push()', function (done) {
    var baseUrl = Router.getOrigin() + window.location.pathname.replace(/\/$/, '');
    var router = new Router();

    router.push('/govinda');
    assert.equal(window.location.href, baseUrl + '/govinda');

    router.push('hari');
    assert.equal(window.location.href, baseUrl + '/govinda/hari');

    router.push('/');
    assert.equal(window.location.href, baseUrl);

    router.push('/govinda');
    assert.equal(window.location.href, baseUrl + '/govinda');

    done();
  });

  it('conf.baseUrl', function (done) {
    var baseUrl = window.location.href + '/tralala';
    var router = new Router({'baseUrl': baseUrl});

    router.push('/govinda');
    assert.equal(window.location.href, baseUrl + '/govinda');

    router.push('hari');
    assert.equal(window.location.href, baseUrl + '/govinda/hari');

    router.push('/');
    assert.equal(window.location.href, baseUrl);

    router.push('/govinda');
    assert.equal(window.location.href, baseUrl + '/govinda');

    done();
  });

  it('#pushRoute(), #route()', function (done) {
    var baseUrl = Router.getOrigin() + window.location.pathname;
    var router = new Router();
    var counter = {
      '1': 1,
      '2': 2,
      '3': 3
    };

    router.pushRoute({
      'regexp': new RegExp('^/govinda/(\\w+)/(\\d+)$'),
      'callback': function (params, query) {
        assert.equal(params.length, 2);
        assert.equal(params[0], 'gopi');
        assert.equal(params[1], 108);
        assert.equal(query.hari, 'bol');

        if (! counter[1]) {
          throw new Error('already done 1');
        }

        delete counter[1];
      }
    });

    router.pushRoute([
      {
        'regexp': new RegExp('^/hari$'),
        'callback': function () {
          if (! counter[2]) {
            throw new Error('already done 2');
          }

          delete counter[2];
        }
      },
      {
        'regexp': new RegExp('^/govinda$'),
        'callback': function () {
          if (! counter[3]) {
            throw new Error('already done 3');
          }

          delete counter[3];
        }
      }
    ]);

    router.route('/hari');
    assert.equal(baseUrl, window.location.href);

    router.route('/govinda/gopi/108?hari=bol');
    assert.equal(baseUrl, window.location.href);

    router.route('/govinda');
    assert.equal(baseUrl, window.location.href);

    if (! Object.keys(counter).length) {
      done();
    }
  });

  it('#start(), #stop(), #start(silent)', function (done) {
    var router = new Router();
    var counter = 0;

    router.pushRoute({
      'regexp': new RegExp('^/hari$'),
      'callback': function () {
        counter += 1;

        if (counter > 6) {
          throw new Error('Should only emit 6 times.');
        }

        if (counter === 6) {
          done();
        }
      }
    });

    router.push('/hari');
    router.start();
    router.push('/hari');
    window.history.back();
    router.stop();
    router.push('/hari');
    window.history.back();
    router.start(true);
    router.push('/hari');
  });

  it('#route(url, emit)', function (done) {
    var router = new Router();
    var routeCounter = 0;
    var prerouteCounter = 0;

    router.on('pre-route', function () {
      prerouteCounter += 1;
    });

    router.on('route', function () {
      routeCounter += 1;
    });

    router.pushRoute({
      'regexp': new RegExp('^/hari$'),
      'callback': function () {}
    });

    router.route('/hari');
    router.route('/govinda/bol');
    router.route('/hari');
    router.route('/hari', false);
    router.push(originalBaseUrl + '/hari');
    router.push('/');

    if (routeCounter === 3 && prerouteCounter === 3) {
      done();
    }
  });

  it('#push(replace = true)', function (done) {
    var router = new Router();
    var historyLength = window.history.length;

    router.pushRoute({
      'regexp': new RegExp('^/hari$'),
      'callback': function () {
      }
    });
    router.push('/hari', true);

    assert.equal(window.history.length, historyLength);

    done();
  });

  it('#pushRoute(name = "haribol")', function (done) {
    var router = new Router();

    router.pushRoute({
      'regexp': new RegExp('^/hari$'),
      'callback': function () {},
      'name': 'haribol'
    });
    router.on('route.haribol', function () {
      done();
    });
    router.route('/hari', true);
  });
});

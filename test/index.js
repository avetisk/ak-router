/*global beforeEach, describe, it*/

'use strict';

var Router = require('../');
var assert = require('assert');
var originalBaseUrl = window.location.origin + window.location.pathname;

describe('Router', function () {
  beforeEach(function () {
    window.history.pushState(null, '', originalBaseUrl);
  });

  it('#push()', function (done) {
    var baseUrl = window.location.origin + window.location.pathname;
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
    var baseUrl = window.location.origin + window.location.pathname;
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

        if (counter > 5) {
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

    router.eventEmitter.on('pre-route', function () {
      prerouteCounter += 1;
    });

    router.eventEmitter.on('route', function () {
      routeCounter += 1;

      if (routeCounter > 1 && prerouteCounter > 1) {
        done();
      }
    });

    router.pushRoute({
      'regexp': new RegExp('^/hari$'),
      'callback': function () {}
    });

    router.route('/hari');
    router.route('/govinda/bol');
    router.route('/hari');
    router.route('/hari', false);
  });
});

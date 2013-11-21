'use strict';

/**
 * Dependencies
 */
var EventEmitter = require('ak-eventemitter');

/**
 * slice
 */
var slice = Array.prototype.slice.call.bind(Array.prototype.slice);

/**
 * Parse query into {Object}
 *
 * @param {String} query
 * @return {Object}
 */
var parseQuery = function (query) {
  if (! query) {
    return {};
  }

  var map = {};
  var pair;
  query = query.split('&');

  for (var i = 0, len = query.length; i < len; i += 1) {
    pair = query[i].split('=');
    map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }

  return map;

};

/**
 * Return current url
 *
 * @return {String}
 */
var currentUrl = function () {
  return window.location.origin + window.location.pathname.replace(/\/$/, '');
};

/**
 * Export `Router`
 *
 * @param {Object} config (optional)
 * @return {Router}
 */
var Router = module.exports = function (config) {
  this.baseUrl = (config && config.baseUrl) ? config.baseUrl : currentUrl();
  this.routes = [];
  this.eventEmitter = new EventEmitter();
};

/**
 * Callback for popState event
 */
Router.prototype._popState = function () {
  this.route(currentUrl());
};

/**
 * Start listening popstate event
 *
 * @param {Boolean} silent (optional) if true, won't route current url
 * @return {Router}
 */
Router.prototype.start = function (silent) {
  window.addEventListener('popstate', this._popState.bind(this));

  if (! silent) {
    this.route(currentUrl());
  }

  return this;
};

/**
 * Stop listening popstate event
 *
 * @return {Router}
 */
Router.prototype.stop = function () {
  window.removeEventListener('popstate', this._popState.bind(this));

  return this;
};

/**
 * Push route
 *
 * @param {Object} route {'regexp': /regex/, 'callback': function () {}}
 * @return {Router}
 */
Router.prototype.pushRoute = function (route) {
  if (route instanceof Array) {
    this.routes = this.routes.concat(route);
  } else {
    this.routes.push(route);
  }

  return this;
};

/**
 * Route given url
 *
 * @param {String} url
 * @param {Boolean} emit (optional)
 * @return {Router}
 */
Router.prototype.route = function (url, emit) {
  var route;
  var query;
  var params;
  var matchRoute = function () {
    params.push.apply(params, slice(arguments));
    params.shift();
    params.pop();
    params.pop();
  };

  if (window.location.href.search(this.baseUrl) !== 0) {
    return this;
  }

  url = url.replace(this.baseUrl, '').split('?');

  for (var i = this.routes.length - 1; i >= 0; i -= 1) {
    route = this.routes[i];

    if (! route.regexp.test(url[0])) {
      continue;
    }

    params = [];
    query = url[1] ? parseQuery(url[1].split('#')[0]) : {};

    url[0].replace(route.regexp, matchRoute);

    var routeName = route.name ? '.' + route.name : '';

    if (emit !== false) {
      this.eventEmitter.emit('pre-route' + routeName);
    }

    if (route.callback(params, query) !== false && emit !== false) {
      this.eventEmitter.emit('route' + routeName, params, query, emit);
    }

    return this;
  }

  return this;
};

/**
 * Push/replace given url into history and route it
 *
 * @param {String} url
 * @param {Boolean} replace (optional)
 * @param {String} title (optional)
 * @return {Router}
 */
Router.prototype.push = function (url, replace, title) {
  if (url[0] !== '/') {
    url = window.location.href + '/' + url;
  } else if (url[1] === '/') {
    url = window.location.protocol + url;
  } else if (url === '/') {
    url = this.baseUrl;
  } else {
    url = this.baseUrl + url;
  }

  window.history[replace ? 'replaceState' : 'pushState'](null, title, url);

  this.route(window.location.href);

  return this;
};

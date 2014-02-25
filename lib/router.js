'use strict';

/**
 * Dependencies
 */
var EventEmitter = require('ak-eventemitter');

var anchor = document.createElement('a');

/**
 * slice
 */
var slice = Array.prototype.slice.call.bind(Array.prototype.slice);

var loc = window.location;

/**
 * Parse query into {Object}
 *
 * @param {String} query
 * @return {Object}
 */
var parseQuery = function (query) {
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
 * Export `Router`
 *
 * @param {Object} config (optional)
 * @return {Router}
 */
var Router = module.exports = function (config) {
  EventEmitter.call(this);

  this.baseUrl = (config && config.baseUrl) ? config.baseUrl : Router.currentUrl();
  this.routes = [];
  this._popState = this._popState.bind(this);
};

var prototype = Router.prototype = Object.create(EventEmitter.prototype);

/**
 * Callback for popState event
 */
prototype._popState = function () {
  this.route(Router.currentUrl());
};

/**
 * Start listening popstate event
 *
 * @param {Boolean} silent (optional) if true, won't route current url
 * @return {Router}
 */
prototype.start = function (silent) {
  window.addEventListener('popstate', this._popState);

  if (! silent) {
    this.route(Router.currentUrl());
  }

  return this;
};

/**
 * Stop listening popstate event
 *
 * @return {Router}
 */
prototype.stop = function () {
  window.removeEventListener('popstate', this._popState);

  return this;
};

/**
 * Push route
 *
 * @param {Object} route {'regexp': /regex/, 'callback': function () {}}
 * @return {Router}
 */
prototype.pushRoute = function (route) {
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
prototype.route = function (url, emit) {
  var route;
  var query;
  var params;
  var matchRoute = function () {
    params.push.apply(params, slice(arguments));
    params.shift();
    params.pop();
    params.pop();
  };

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
      this.emit('pre-route' + routeName);
    }

    if (route.callback(params, query) !== false && emit !== false) {
      this.emit('route' + routeName, params, query, emit);
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
prototype.push = function (url, replace, title) {
  anchor.setAttribute('href', url);
  var href = anchor.href;

  if (url === href) {
    url = href;
  } else if (url[0] !== '/') {
    url = window.location.href + '/' + url;
  } else if (url === '/') {
    url = this.baseUrl;
  } else {
    url = this.baseUrl + url;
  }

  window.history[replace ? 'replaceState' : 'pushState'](null, title, url);

  this.route(window.location.href);

  return this;
};

/**
 * window.location.origin for retarded browsers (i.e IE)
 *
 * @return {String}
 */
Router.getOrigin = function () {
  return loc.protocol + '//' + loc.hostname + (loc.port ? (':' + loc.port) : '');
};

/**
 * Return current url without last '/'
 *
 * @return {String}
 */
Router.currentUrl = function () {
  return Router.getOrigin() + window.location.pathname.replace(/\/$/, '');
};

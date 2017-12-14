/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

const WorkboxSW = (function () {
  class ErrorFactory$1 {
    constructor(a) { this._errors = a; }createError(a, b) {
      if (!(a in this._errors)) throw new Error(`Unable to generate error '${a}'.`); let c = this._errors[a].replace(/\s+/g, ' '),
        d = null; b && (c += ` [${b.message}]`, d = b.stack); const e = new Error(); return e.name = a, e.message = c, e.stack = d, e;
    }
  }

  const errors = { 'not-in-sw': 'workbox-sw must be loaded in your service worker file.', 'unsupported-route-type': 'The first parameter to registerRoute() should be either an Express-style path string, a RegExp, or a function.', 'empty-express-string': 'The Express style route string must have some characters, an empty string is invalid.', 'bad-revisioned-cache-list': 'The \'precache()\' method expects' + 'an array of revisioned urls like so: [\'/example/hello.1234.txt\', ' + '{path: \'hello.txt\', revision: \'1234\'}]', 'navigation-route-url-string': 'The registerNavigationRoute() method ' + 'expects a URL string as its first parameter.', 'bad-cache-id': 'The \'cacheId\' parameter must be a string with at least ' + 'one character', 'bad-skip-waiting': 'The \'skipWaiting\' parameter must be a boolean.', 'bad-clients-claim': 'The \'clientsClaim\' parameter must be a boolean.', 'bad-directory-index': 'The \'directoryIndex\' parameter must be a boolean.' }; const ErrorFactory = new ErrorFactory$1(errors);

  const errors$1 = { 'express-route-invalid-path': `When using ExpressRoute, you must
    provide a path that starts with a '/' character (to match same-origin
    requests) or that starts with 'http' (to match cross-origin requests)` }; const ErrorFactory$3 = new ErrorFactory$1(errors$1);

  const ErrorStackParser = { parse: () => [] };

  function atLeastOne(a) { const b = Object.keys(a); b.some(b => a[b] !== void 0) || throwError(`Please set at least one of the following parameters: ${b.map(a => `'${a}'`).join(', ')}`); } function hasMethod(a, b) {
    const c = Object.keys(a).pop(),
      d = typeof a[c][b]; d != 'function' && throwError(`The '${c}' parameter must be an object that exposes a
      '${b}' method.`);
  } function isInstance(a, b) {
    const c = Object.keys(a).pop(); a[c] instanceof b || throwError(`The '${c}' parameter must be an instance of
      '${b.name}'`);
  } function isOneOf(a, b) {
    const c = Object.keys(a).pop(); b.includes(a[c]) || throwError(`The '${c}' parameter must be set to one of the
      following: ${b}`);
  } function isType(a, b) {
    const c = Object.keys(a).pop(),
      d = typeof a[c]; d !== b && throwError(`The '${c}' parameter has the wrong type. (Expected:
      ${b}, actual: ${d})`);
  } function isArrayOfType(a, b) {
    const c = Object.keys(a).pop(),
      d = `The '${c}' parameter should be an array containing
    one or more '${b}' elements.`; Array.isArray(a[c]) || throwError(d); for (const e of a[c]) typeof e !== b && throwError(d);
  } function isArrayOfClass(a, b) {
    const c = Object.keys(a).pop(),
      d = `The '${c}' parameter should be an array containing
    one or more '${b.name}' instances.`; Array.isArray(a[c]) || throwError(d); for (const e of a[c])e instanceof b || throwError(d);
  } function throwError(a) { a = a.replace(/\s+/g, ' '); const b = new Error(a); b.name = 'assertion-failed'; const c = ErrorStackParser.parse(b); throw c.length >= 3 && (b.message = `Invalid call to ${c[2].functionName}() — ${a}`), b; }

  function normalizeHandler(a) { return typeof a === 'object' ? (hasMethod({ handler: a }, 'handle'), a) : (isType({ handler: a }, 'function'), { handle: a }); }

  const defaultMethod = 'GET'; const validMethods = ['DELETE', 'GET', 'HEAD', 'POST', 'PUT'];

  class Route {constructor({ match: a, handler: b, method: c } = {}) { this.handler = normalizeHandler(b), isType({ match: a }, 'function'), this.match = a, c ? (isOneOf({ method: c }, validMethods), this.method = c) : this.method = defaultMethod; }}

  const index$1 = Array.isArray || function (a) { return Object.prototype.toString.call(a) == '[object Array]'; };

  const index = pathToRegexp; const parse_1 = parse; const compile_1 = compile; const tokensToFunction_1 = tokensToFunction; const tokensToRegExp_1 = tokensToRegExp; const PATH_REGEXP = new RegExp('(\\\\.)|([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))', 'g'); function parse(a, b) {
    for (var c, d = [], e = 0, f = 0, g = '', h = b && b.delimiter || '/'; (c = PATH_REGEXP.exec(a)) != null;) {
      let i = c[0],
        j = c[1],
        k = c.index; if (g += a.slice(f, k), f = k + i.length, j) { g += j[1]; continue; } let l = a[f],
        m = c[2],
        n = c[3],
        o = c[4],
        p = c[5],
        q = c[6],
        r = c[7]; g && (d.push(g), g = ''); let s = c[2] || h,
        t = o || p; d.push({ name: n || e++, prefix: m || '', delimiter: s, optional: q === '?' || q === '*', repeat: q === '+' || q === '*', partial: m != null && l != null && l !== m, asterisk: !!r, pattern: t ? escapeGroup(t) : r ? '.*' : `[^${escapeString(s)}]+?` });
    } return f < a.length && (g += a.substr(f)), g && d.push(g), d;
  } function compile(a, b) { return tokensToFunction(parse(a, b)); } function encodeURIComponentPretty(a) { return encodeURI(a).replace(/[\/?#]/g, a => `%${a.charCodeAt(0).toString(16).toUpperCase()}`); } function encodeAsterisk(a) { return encodeURI(a).replace(/[?#]/g, a => `%${a.charCodeAt(0).toString(16).toUpperCase()}`); } function tokensToFunction(a) {
    for (var b = Array(a.length), c = 0; c < a.length; c++) typeof a[c] === 'object' && (b[c] = new RegExp(`^(?:${a[c].pattern})$`)); return function (c, d) {
      for (var e, f = '', g = c || {}, h = d || {}, k = h.pretty ? encodeURIComponentPretty : encodeURIComponent, l = 0; l < a.length; l++) {
        if (e = a[l], typeof e === 'string') { f += e; continue; } var i,
          m = g[e.name]; if (m == null) if (e.optional) { e.partial && (f += e.prefix); continue; } else throw new TypeError(`Expected "${e.name}" to be defined`); if (index$1(m)) { if (!e.repeat) throw new TypeError(`Expected "${e.name}" to not repeat, but received \`${JSON.stringify(m)}\``); if (m.length === 0) if (e.optional) continue; else throw new TypeError(`Expected "${e.name}" to not be empty`); for (let n = 0; n < m.length; n++) { if (i = k(m[n]), !b[l].test(i)) throw new TypeError(`Expected all "${e.name}" to match "${e.pattern}", but received \`${JSON.stringify(i)}\``); f += (n === 0 ? e.prefix : e.delimiter) + i; } continue; } if (i = e.asterisk ? encodeAsterisk(m) : k(m), !b[l].test(i)) throw new TypeError(`Expected "${e.name}" to match "${e.pattern}", but received "${i}"`); f += e.prefix + i;
      } return f;
    };
  } function escapeString(a) { return a.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1'); } function escapeGroup(a) { return a.replace(/([=!:$\/()])/g, '\\$1'); } function attachKeys(a, b) { return a.keys = b, a; } function flags(a) { return a.sensitive ? '' : 'i'; } function regexpToRegexp(a, b) { const c = a.source.match(/\((?!\?)/g); if (c) for (let d = 0; d < c.length; d++)b.push({ name: d, prefix: null, delimiter: null, optional: !1, repeat: !1, partial: !1, asterisk: !1, pattern: null }); return attachKeys(a, b); } function arrayToRegexp(a, b, c) { for (var d = [], e = 0; e < a.length; e++)d.push(pathToRegexp(a[e], b, c).source); const f = new RegExp(`(?:${d.join('|')})`, flags(c)); return attachKeys(f, b); } function stringToRegexp(a, b, c) { return tokensToRegExp(parse(a, c), b, c); } function tokensToRegExp(a, b, c) {
    index$1(b) || (c = b || c, b = []), c = c || {}; for (var d, e = c.strict, f = !1 !== c.end, g = '', h = 0; h < a.length; h++) {
      if (d = a[h], typeof d === 'string')g += escapeString(d); else {
        let i = escapeString(d.prefix),
          j = `(?:${d.pattern})`; b.push(d), d.repeat && (j += `(?:${i}${j})*`), j = d.optional ? d.partial ? `${i}(${j})?` : `(?:${i}(${j}))?` : `${i}(${j})`, g += j;
      }
    } let k = escapeString(c.delimiter || '/'),
      l = g.slice(-k.length) === k; return e || (g = `${l ? g.slice(0, -k.length) : g}(?:${k}(?=$))?`), g += f ? '$' : e && l ? '' : `(?=${k}|$)`, attachKeys(new RegExp(`^${g}`, flags(c)), b);
  } function pathToRegexp(a, b, c) { return index$1(b) || (c = b || c, b = []), c = c || {}, a instanceof RegExp ? regexpToRegexp(a, b) : index$1(a) ? arrayToRegexp(a, b, c) : stringToRegexp(a, b, c); }index.parse = parse_1, index.compile = compile_1, index.tokensToFunction = tokensToFunction_1, index.tokensToRegExp = tokensToRegExp_1;

  class ExpressRoute extends Route {
    constructor({ path: a, handler: b, method: c }) {
      if (!(a.startsWith('/') || a.startsWith('http'))) throw ErrorFactory$3.createError('express-route-invalid-path'); const d = []; const e = index(a, d); super({ match: ({ url: b }) => {
        if (a.startsWith('/') && b.origin !== location.origin) return null; const c = a.startsWith('/') ? b.pathname : b.href,
          f = c.match(e); if (!f) return null; const g = {}; return d.forEach((a, b) => { g[a.name] = f[b + 1]; }), g;
      },
      handler: b,
      method: c });
    }
  }

  class LogGroup {constructor() { this._logs = [], this._childGroups = [], this._isFallbackMode = !1; const a = /Firefox\/(\d*)\.\d*/.exec(navigator.userAgent); if (a) try { const b = parseInt(a[1], 10); b < 55 && (this._isFallbackMode = !0); } catch (a) { this._isFallbackMode = !0; }/Edge\/\d*\.\d*/.exec(navigator.userAgent) && (this._isFallbackMode = !0); }addPrimaryLog(a) { this._primaryLog = a; }addLog(a) { this._logs.push(a); }addChildGroup(a) { a._logs.length === 0 || this._childGroups.push(a); }print() { return this._logs.length === 0 && this._childGroups.length === 0 ? void this._printLogDetails(this._primaryLog) : void (this._primaryLog && (this._isFallbackMode ? this._printLogDetails(this._primaryLog) : console.groupCollapsed(...this._getLogContent(this._primaryLog))), this._logs.forEach((a) => { this._printLogDetails(a); }), this._childGroups.forEach((a) => { a.print(); }), this._primaryLog && !this._isFallbackMode && console.groupEnd()); }_printLogDetails(a) { const b = a.logFunc ? a.logFunc : console.log; b(...this._getLogContent(a)); }_getLogContent(a) { let b = a.message; this._isFallbackMode && typeof b === 'string' && (b = b.replace(/%c/g, '')); let c = [b]; return !this._isFallbackMode && a.colors && (c = c.concat(a.colors)), a.args && (c = c.concat(a.args)), c; }}

  function isServiceWorkerGlobalScope() { return 'ServiceWorkerGlobalScope' in self && self instanceof ServiceWorkerGlobalScope; } function isDevBuild() { return 'dev' === 'prod'; } function isLocalhost() { return !!(location.hostname === 'localhost' || location.hostname === '[::1]' || location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)); }

  self.workbox = self.workbox || {}, self.workbox.LOG_LEVEL = self.workbox.LOG_LEVEL || { none: -1, verbose: 0, debug: 1, warn: 2, error: 3 }; const LIGHT_GREY = '#bdc3c7'; const DARK_GREY = '#7f8c8d'; const LIGHT_GREEN = '#2ecc71'; const LIGHT_YELLOW = '#f1c40f'; const LIGHT_RED = '#e74c3c'; const LIGHT_BLUE = '#3498db'; class LogHelper {
    constructor() { this._defaultLogLevel = isDevBuild() ? self.workbox.LOG_LEVEL.debug : self.workbox.LOG_LEVEL.warn; }log(a) { this._printMessage(self.workbox.LOG_LEVEL.verbose, a); }debug(a) { this._printMessage(self.workbox.LOG_LEVEL.debug, a); }warn(a) { this._printMessage(self.workbox.LOG_LEVEL.warn, a); }error(a) { this._printMessage(self.workbox.LOG_LEVEL.error, a); }_printMessage(a, b) { if (this._shouldLogMessage(a, b)) { const c = this._getAllLogGroups(a, b); c.print(); } }_getAllLogGroups(a, b) {
      const c = new LogGroup(),
        d = this._getPrimaryMessageDetails(a, b); if (c.addPrimaryLog(d), b.error) { const a = { message: b.error, logFunc: console.error }; c.addLog(a); } const e = new LogGroup(); if (b.that && b.that.constructor && b.that.constructor.name) { const a = b.that.constructor.name; e.addLog(this._getKeyValueDetails('class', a)); } return b.data && (typeof b.data !== 'object' || b.data instanceof Array ? e.addLog(this._getKeyValueDetails('additionalData', b.data)) : Object.keys(b.data).forEach((a) => { e.addLog(this._getKeyValueDetails(a, b.data[a])); })), c.addChildGroup(e), c;
    }_getKeyValueDetails(a, b) { return { message: `%c${a}: `, colors: [`color: ${LIGHT_BLUE}`], args: b }; }_getPrimaryMessageDetails(a, b) {
      let c,
        d; a === self.workbox.LOG_LEVEL.verbose ? (c = 'Info', d = LIGHT_GREY) : a === self.workbox.LOG_LEVEL.debug ? (c = 'Debug', d = LIGHT_GREEN) : a === self.workbox.LOG_LEVEL.warn ? (c = 'Warn', d = LIGHT_YELLOW) : a === self.workbox.LOG_LEVEL.error ? (c = 'Error', d = LIGHT_RED) : void 0; let e = `%c🔧 %c[${c}]`; const f = [`color: ${LIGHT_GREY}`, `color: ${d}`]; let g; return typeof b === 'string' ? g = b : b.message && (g = b.message), g && (g = g.replace(/\s+/g, ' '), e += `%c ${g}`, f.push(`color: ${DARK_GREY}; font-weight: normal`)), { message: e, colors: f };
    }_shouldLogMessage(a, b) { if (!b) return !1; let c = this._defaultLogLevel; return self && self.workbox && typeof self.workbox.logLevel === 'number' && (c = self.workbox.logLevel), c === self.workbox.LOG_LEVEL.none || a < c ? !1 : !0; }
  } const logHelper = new LogHelper();

  class NavigationRoute extends Route {
    constructor({ whitelist: a, blacklist: b, handler: c } = {}) {
      isArrayOfClass({ whitelist: a }, RegExp), b ? isArrayOfClass({ blacklist: b }, RegExp) : b = []; super({ match: ({ event: d, url: e }) => {
        let f,
          g = !1; if (d.request.mode === 'navigate') { const d = e.pathname + e.search; a.some(a => a.test(d)) ? b.some(a => a.test(d)) ? f = 'The navigation route is not being used, since the ' + 'request URL matches both the whitelist and blacklist.' : (f = 'The navigation route is being used.', g = !0) : f = 'The navigation route is not being used, since the ' + 'URL being navigated to doesn\'t match the whitelist.', logHelper.debug({ that: this, message: f, data: { 'request-url': e.href, whitelist: a, blacklist: b, handler: c } }); } return g;
      },
      handler: c,
      method: 'GET' });
    }
  }

  class RegExpRoute extends Route {constructor({ regExp: a, handler: b, method: c }) { isInstance({ regExp: a }, RegExp); super({ match: ({ url: b }) => { const c = a.exec(b.href); return c ? b.origin !== location.origin && c.index !== 0 ? (logHelper.debug({ that: this, message: 'Skipping route, because the RegExp match didn\'t occur ' + 'at the start of the URL.', data: { url: b.href, regExp: a } }), null) : c.slice(1) : null; }, handler: b, method: c }); }}

  class Router$2 {
    constructor() { this._routes = new Map(), this._isListenerRegistered = !1; }addFetchListener() { return this._isListenerRegistered ? (logHelper.warn({ that: this, message: 'addFetchListener() has already been called for this Router.' }), !1) : (this._isListenerRegistered = !0, self.addEventListener('fetch', (a) => { const b = this.handleRequest({ event: a }); b && a.respondWith(b); }), !0); }handleRequest({ event: a }) { isInstance({ event: a }, FetchEvent); const b = new URL(a.request.url); if (!b.protocol.startsWith('http')) return void logHelper.log({ that: this, message: 'The URL does not start with HTTP, so it can\'t be handled.', data: { request: a.request } }); let { handler: c, params: d } = this._findHandlerAndParams({ event: a, url: b }); if (!c && this.defaultHandler && (c = this.defaultHandler), c) { let e = c.handle({ url: b, event: a, params: d }); return this.catchHandler && (e = e.catch(c => this.catchHandler.handle({ url: b, event: a, error: c }))), e; } }_findHandlerAndParams({ event: a, url: b }) { const c = this._routes.get(a.request.method) || []; for (const d of c) { let c = d.match({ url: b, event: a }); if (c) return logHelper.log({ that: this, message: 'The router found a matching route.', data: { route: d, request: a.request } }), Array.isArray(c) && c.length === 0 ? c = void 0 : c.constructor === Object && Object.keys(c).length === 0 && (c = void 0), { params: c, handler: d.handler }; } return { handler: void 0, params: void 0 }; }setDefaultHandler({ handler: a } = {}) { this.defaultHandler = normalizeHandler(a); }setCatchHandler({ handler: a } = {}) { this.catchHandler = normalizeHandler(a); }registerRoutes({ routes: a } = {}) { isArrayOfClass({ routes: a }, Route); for (const b of a) this._routes.has(b.method) || this._routes.set(b.method, []), this._routes.get(b.method).unshift(b); }registerRoute({ route: a } = {}) { isInstance({ route: a }, Route), this.registerRoutes({ routes: [a] }); }unregisterRoutes({ routes: a } = {}) {
      isArrayOfClass({ routes: a }, Route); for (const b of a) {
        this._routes.has(b.method) || logHelper.error({ that: this,
          message: `Can't unregister route; there are no ${b.method}
            routes registered.`,
          data: { route: b } }); const a = this._routes.get(b.method).indexOf(b); a > -1 ? this._routes.get(b.method).splice(a, 1) : logHelper.error({ that: this,
          message: `Can't unregister route; the route wasn't previously
            registered.`,
          data: { route: b } });
      }
    }unregisterRoute({ route: a } = {}) { isInstance({ route: a }, Route), this.unregisterRoutes({ routes: [a] }); }
  }

  class Router$$1 extends Router$2 {constructor(a, b) { super({ handleFetch: b }), this._revisionedCacheName = a; }registerRoute(a, b, c = 'GET') { typeof b === 'function' && (b = { handle: b }); let d; if (typeof a === 'string') { if (a.length === 0) throw ErrorFactory.createError('empty-express-string'); d = new ExpressRoute({ path: a, handler: b, method: c }); } else if (a instanceof RegExp)d = new RegExpRoute({ regExp: a, handler: b, method: c }); else if (typeof a === 'function')d = new Route({ match: a, handler: b, method: c }); else throw ErrorFactory.createError('unsupported-route-type'); return super.registerRoute({ route: d }), d; }registerNavigationRoute(a, b = {}) { if (typeof a !== 'string') throw ErrorFactory.createError('navigation-route-url-string'); const c = 'cacheName' in b ? b.cacheName : this._revisionedCacheName; super.registerRoute({ route: new NavigationRoute({ handler: () => caches.match(a, { cacheName: c }), whitelist: b.whitelist || [/./], blacklist: b.blacklist || [] }) }); }}

  const errors$2 = { 'multiple-cache-will-update-plugins': 'You cannot register more than one plugin that implements cacheWillUpdate.', 'multiple-cached-response-will-be-used-plugins': 'You cannot register more than one plugin that implements cachedResponseWillBeUsed.', 'invalid-response-for-caching': 'The fetched response could not be cached due to an invalid response code.', 'no-response-received': 'No response received; falling back to cache.', 'bad-cache-id': 'The \'cacheId\' parameter must be a string with at least ' + 'one character.' }; const ErrorFactory$4 = new ErrorFactory$1(errors$2);

  class CacheableResponse {
    constructor({ statuses: a, headers: b } = {}) { atLeastOne({ statuses: a, headers: b }), a !== void 0 && isArrayOfType({ statuses: a }, 'number'), b !== void 0 && isType({ headers: b }, 'object'), this.statuses = a, this.headers = b; }isResponseCacheable({ request: a, response: b } = {}) {
      isInstance({ response: b }, Response); let c = !0; if (this.statuses && (c = this.statuses.includes(b.status)), this.headers && c && (c = Object.keys(this.headers).some(a => b.headers.get(a) === this.headers[a])), !c) {
        const c = { response: b }; this.statuses && (c['valid-status-codes'] = JSON.stringify(this.statuses)), this.headers && (c['valid-headers'] = JSON.stringify(this.headers)), a && (c.request = a), logHelper.debug({ message: `The response does not meet the criteria for being added to the
          cache.`,
          data: c });
      } return c;
    }
  }

  class CacheableResponsePlugin extends CacheableResponse {cacheWillUpdate({ request: a, response: b } = {}) { return this.isResponseCacheable({ request: a, response: b }); }}

  const getDefaultCacheName = ({ cacheId: a } = {}) => { let b = 'workbox-runtime-caching'; return a && (b = `${a}-${b}`), self && self.registration && (b += `-${self.registration.scope}`), b; };
  const pluginCallbacks = ['cacheDidUpdate', 'cachedResponseWillBeUsed', 'cacheWillUpdate', 'fetchDidFail', 'requestWillFetch'];

  const cleanResponseCopy = (({ response: a }) => {
    isInstance({ response: a }, Response); const b = a.clone(),
      c = 'body' in b ? Promise.resolve(b.body) : b.blob(); return c.then(a => new Response(a, { headers: b.headers, status: b.status, statusText: b.statusText }));
  });

  const asyncToGenerator = function (fn) {
    return function () {
      const gen = fn.apply(this, arguments);
      return new Promise(((resolve, reject) => {
        function step(key, arg) {
          try {
            var info = gen[key](arg);
            var value = info.value;
          } catch (error) {
            reject(error);
            return;
          }

          if (info.done) {
            resolve(value);
          } else {
            return Promise.resolve(value).then((value) => {
              step('next', value);
            }, (err) => {
              step('throw', err);
            });
          }
        }

        return step('next');
      }));
    };
  };

  class RequestWrapper {
    constructor({ cacheName: a, cacheId: b, plugins: c, fetchOptions: d, matchOptions: e } = {}) { if (b && (typeof b !== 'string' || b.length === 0)) throw ErrorFactory$4.createError('bad-cache-id'); a ? (isType({ cacheName: a }, 'string'), this.cacheName = a, b && (this.cacheName = `${b}-${this.cacheName}`)) : this.cacheName = getDefaultCacheName({ cacheId: b }), d && (isType({ fetchOptions: d }, 'object'), this.fetchOptions = d), e && (isType({ matchOptions: e }, 'object'), this.matchOptions = e), this.plugins = new Map(), c && (isArrayOfType({ plugins: c }, 'object'), c.forEach((a) => { for (const b of pluginCallbacks) if (typeof a[b] === 'function') { if (!this.plugins.has(b)) this.plugins.set(b, []); else if (b === 'cacheWillUpdate') throw ErrorFactory$4.createError('multiple-cache-will-update-plugins'); else if (b === 'cachedResponseWillBeUsed') throw ErrorFactory$4.createError('multiple-cached-response-will-be-used-plugins'); this.plugins.get(b).push(a); } })), this.plugins.has('cacheWillUpdate') && (this._userSpecifiedCachableResponsePlugin = this.plugins.get('cacheWillUpdate')[0]); }getDefaultCacheableResponsePlugin() { return this._defaultCacheableResponsePlugin || (this._defaultCacheableResponsePlugin = new CacheableResponsePlugin({ statuses: [200] })), this._defaultCacheableResponsePlugin; }getCache() { const a = this; return asyncToGenerator(function* () { return a._cache || (a._cache = yield caches.open(a.cacheName)), a._cache; })(); }match({ request: a }) { const b = this; return asyncToGenerator(function* () { atLeastOne({ request: a }); const c = yield b.getCache(); let d = yield c.match(a, b.matchOptions); if (b.plugins.has('cachedResponseWillBeUsed')) { const e = b.plugins.get('cachedResponseWillBeUsed')[0]; d = yield e.cachedResponseWillBeUsed({ request: a, cache: c, cachedResponse: d, matchOptions: b.matchOptions, cacheName: b.cacheName }); } return d; })(); }fetch({ request: a }) { const b = this; return asyncToGenerator(function* () { typeof a === 'string' ? a = new Request(a) : isInstance({ request: a }, Request); const c = b.plugins.has('fetchDidFail') ? a.clone() : null; if (b.plugins.has('requestWillFetch')) for (const c of b.plugins.get('requestWillFetch')) { const b = yield c.requestWillFetch({ request: a }); isInstance({ returnedRequest: b }, Request), a = b; } try { return yield fetch(a, b.fetchOptions); } catch (a) { if (b.plugins.has('fetchDidFail')) for (const a of b.plugins.get('fetchDidFail')) yield a.fetchDidFail({ request: c.clone() }); throw a; } })(); }fetchAndCache({ request: a, waitOnCache: b, cacheKey: c, cacheResponsePlugin: d, cleanRedirects: e }) {
      const f = this; return asyncToGenerator(function* () {
        atLeastOne({ request: a }); let g; const h = yield f.fetch({ request: a }),
          i = f._userSpecifiedCachableResponsePlugin || d || f.getDefaultCacheableResponsePlugin(),
          j = yield i.cacheWillUpdate({ request: a, response: h }); if (j) { const b = e && h.redirected ? yield cleanResponseCopy({ response: h }) : h.clone(); g = f.getCache().then((() => { const d = asyncToGenerator(function* (d) { let e; const g = c || a; if (h.type !== 'opaque' && f.plugins.has('cacheDidUpdate') && (e = yield f.match({ request: g })), yield d.put(g, b), f.plugins.has('cacheDidUpdate')) for (const a of f.plugins.get('cacheDidUpdate')) yield a.cacheDidUpdate({ cacheName: f.cacheName, oldResponse: e, newResponse: b, url: 'url' in g ? g.url : g }); }); return function () { return d.apply(this, arguments); }; })()); } else if (!j && b) throw ErrorFactory$4.createError('invalid-response-for-caching'); return b && g && (yield g), h;
      })();
    }
  }

  class Handler {constructor({ requestWrapper: a, waitOnCache: b } = {}) { this.requestWrapper = a || new RequestWrapper(), this.waitOnCache = !!b; }handle({ event: a, params: b } = {}) { throw Error('This abstract method must be implemented in a subclass.'); }}

  class CacheFirst extends Handler {handle({ event: a } = {}) { const b = this; return asyncToGenerator(function* () { isInstance({ event: a }, FetchEvent); const c = yield b.requestWrapper.match({ request: a.request }); return c || (yield b.requestWrapper.fetchAndCache({ request: a.request, waitOnCache: b.waitOnCache })); })(); }}

  class CacheOnly extends Handler {handle({ event: a } = {}) { const b = this; return asyncToGenerator(function* () { return isInstance({ event: a }, FetchEvent), yield b.requestWrapper.match({ request: a.request }); })(); }}

  class NetworkFirst extends Handler {constructor(a = {}) { super(a), this._cacheablePlugin = new CacheableResponsePlugin({ statuses: [0, 200] }); const { networkTimeoutSeconds: b } = a; b && (isType({ networkTimeoutSeconds: b }, 'number'), this.networkTimeoutSeconds = b); }handle({ event: a } = {}) { const b = this; return asyncToGenerator(function* () { isInstance({ event: a }, FetchEvent); const c = []; let d; b.networkTimeoutSeconds && c.push(new Promise(((c) => { d = setTimeout(() => { c(b.requestWrapper.match({ request: a.request })); }, 1e3 * b.networkTimeoutSeconds); }))); const e = b.requestWrapper.fetchAndCache({ request: a.request, waitOnCache: b.waitOnCache, cacheResponsePlugin: b._cacheablePlugin }).then(a => d && clearTimeout(d), a || Promise.reject(ErrorFactory$4.createError('no-response-received'))).catch(() => b.requestWrapper.match({ request: a.request })); return c.push(e), Promise.race(c); })(); }}

  class NetworkOnly extends Handler {handle({ event: a } = {}) { const b = this; return asyncToGenerator(function* () { return isInstance({ event: a }, FetchEvent), yield b.requestWrapper.fetch({ request: a.request }); })(); }}

  class StaleWhileRevalidate extends Handler {
    constructor(a = {}) { super(a), this._cacheablePlugin = new CacheableResponsePlugin({ statuses: [0, 200] }); }handle({ event: a } = {}) {
      const b = this; return asyncToGenerator(function* () {
        isInstance({ event: a }, FetchEvent); const c = b.requestWrapper.fetchAndCache({ request: a.request, waitOnCache: b.waitOnCache, cacheResponsePlugin: b._cacheablePlugin }).catch(() => Response.error()),
          d = yield b.requestWrapper.match({ request: a.request }); return d || (yield c);
      })();
    }
  }

  let tmpIdbName = 'workbox-cache-expiration'; self && self.registration && (tmpIdbName += `-${self.registration.scope}`); const idbName = tmpIdbName; const idbVersion = 1; const urlPropertyName = 'url'; const timestampPropertyName = 'timestamp';

  function createCommonjsModule(fn, module) {
    return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  const idb = createCommonjsModule((a) => {
    (function () {
      function b(a) { return Array.prototype.slice.call(a); } function c(a) { return new Promise(((b, c) => { a.onsuccess = function () { b(a.result); }, a.onerror = function () { c(a.error); }; })); } function d(a, b, d) {
        let e,
          f = new Promise(((f, g) => { e = a[b](...d), c(e).then(f, g); })); return f.request = e, f;
      } function e(a, b, c) { const e = d(a, b, c); return e.then(a => (a ? new k(a, e.request) : void 0)); } function f(a, b, c) { c.forEach((c) => { Object.defineProperty(a.prototype, c, { get() { return this[b][c]; }, set(a) { this[b][c] = a; } }); }); } function g(a, b, c, e) { e.forEach((e) => { e in c.prototype && (a.prototype[e] = function () { return d(this[b], e, arguments); }); }); } function h(a, b, c, d) { d.forEach((d) => { d in c.prototype && (a.prototype[d] = function () { return this[b][d].apply(this[b], arguments); }); }); } function i(a, b, c, d) { d.forEach((d) => { d in c.prototype && (a.prototype[d] = function () { return e(this[b], d, arguments); }); }); } function j(a) { this._index = a; } function k(a, b) { this._cursor = a, this._request = b; } function l(a) { this._store = a; } function m(a) { this._tx = a, this.complete = new Promise(((b, c) => { a.oncomplete = function () { b(); }, a.onerror = function () { c(a.error); }, a.onabort = function () { c(a.error); }; })); } function n(a, b, c) { this._db = a, this.oldVersion = b, this.transaction = new m(c); } function o(a) { this._db = a; }f(j, '_index', ['name', 'keyPath', 'multiEntry', 'unique']), g(j, '_index', IDBIndex, ['get', 'getKey', 'getAll', 'getAllKeys', 'count']), i(j, '_index', IDBIndex, ['openCursor', 'openKeyCursor']), f(k, '_cursor', ['direction', 'key', 'primaryKey', 'value']), g(k, '_cursor', IDBCursor, ['update', 'delete']), ['advance', 'continue', 'continuePrimaryKey'].forEach((a) => {
        a in IDBCursor.prototype && (k.prototype[a] = function () {
          let b = this,
            d = arguments; return Promise.resolve().then(() => b._cursor[a].apply(b._cursor, d), c(b._request).then(a => (a ? new k(a, b._request) : void 0)));
        });
      }), l.prototype.createIndex = function () { return new j(this._store.createIndex.apply(this._store, arguments)); }, l.prototype.index = function () { return new j(this._store.index.apply(this._store, arguments)); }, f(l, '_store', ['name', 'keyPath', 'indexNames', 'autoIncrement']), g(l, '_store', IDBObjectStore, ['put', 'add', 'delete', 'clear', 'get', 'getAll', 'getKey', 'getAllKeys', 'count']), i(l, '_store', IDBObjectStore, ['openCursor', 'openKeyCursor']), h(l, '_store', IDBObjectStore, ['deleteIndex']), m.prototype.objectStore = function () { return new l(this._tx.objectStore.apply(this._tx, arguments)); }, f(m, '_tx', ['objectStoreNames', 'mode']), h(m, '_tx', IDBTransaction, ['abort']), n.prototype.createObjectStore = function () { return new l(this._db.createObjectStore.apply(this._db, arguments)); }, f(n, '_db', ['name', 'version', 'objectStoreNames']), h(n, '_db', IDBDatabase, ['deleteObjectStore', 'close']), o.prototype.transaction = function () { return new m(this._db.transaction.apply(this._db, arguments)); }, f(o, '_db', ['name', 'version', 'objectStoreNames']), h(o, '_db', IDBDatabase, ['close']), ['openCursor', 'openKeyCursor'].forEach((a) => {
        [l, j].forEach((c) => {
          c.prototype[a.replace('open', 'iterate')] = function () {
            let c = b(arguments),
              d = c[c.length - 1],
              e = this._store || this._index,
              f = e[a](...c.slice(0, -1)); f.onsuccess = function () { d(f.result); };
          };
        });
      }), [j, l].forEach((a) => {
        a.prototype.getAll || (a.prototype.getAll = function (a, b) {
          let c = this,
            d = []; return new Promise(((e) => { c.iterateCursor(a, a => (a ? (d.push(a.value), void 0 !== b && d.length == b ? void e(d) : void a.continue()) : void e(d))); }));
        });
      }); const p = { open(a, b, c) {
        let e = d(indexedDB, 'open', [a, b]),
          f = e.request; return f.onupgradeneeded = function (a) { c && c(new n(f.result, a.oldVersion, f.transaction)); }, e.then(a => new o(a));
      },
      delete(a) { return d(indexedDB, 'deleteDatabase', [a]); } }; a.exports = p, a.exports.default = a.exports;
    }());
  });

  const errors$3 = { 'max-entries-or-age-required': `Either the maxEntries or maxAgeSeconds
    parameters (or both) are required when constructing Plugin.`,
    'max-entries-must-be-number': `The maxEntries parameter to the Plugin
    constructor must either be a number or undefined.`,
    'max-age-seconds-must-be-number': `The maxAgeSeconds parameter to the Plugin
    constructor must either be a number or undefined.` }; const ErrorFactory$5 = new ErrorFactory$1(errors$3);

  class CacheExpiration {
    constructor({ maxEntries: a, maxAgeSeconds: b } = {}) { if (!(a || b)) throw ErrorFactory$5.createError('max-entries-or-age-required'); if (a && typeof a !== 'number') throw ErrorFactory$5.createError('max-entries-must-be-number'); if (b && typeof b !== 'number') throw ErrorFactory$5.createError('max-age-seconds-must-be-number'); this.maxEntries = a, this.maxAgeSeconds = b, this._dbs = new Map(), this._caches = new Map(), this._expirationMutex = !1, this._timestampForNextRun = null; }getDB({ cacheName: a } = {}) { const b = this; return asyncToGenerator(function* () { isType({ cacheName: a }, 'string'); const c = `${idbName}-${a}`; if (!b._dbs.has(c)) { const d = yield idb.open(c, idbVersion, (b) => { const c = b.createObjectStore(a, { keyPath: urlPropertyName }); c.createIndex(timestampPropertyName, timestampPropertyName, { unique: !1 }); }); b._dbs.set(c, d); } return b._dbs.get(c); })(); }getCache({ cacheName: a } = {}) { const b = this; return asyncToGenerator(function* () { if (isType({ cacheName: a }, 'string'), !b._caches.has(a)) { const c = yield caches.open(a); b._caches.set(a, c); } return b._caches.get(a); })(); }isResponseFresh({ cacheName: a, cachedResponse: b, now: c } = {}) {
      if (b && this.maxAgeSeconds) {
        isInstance({ cachedResponse: b }, Response); const d = b.headers.get('date'); if (d) {
          typeof c === 'undefined' && (c = Date.now()); const a = new Date(d),
            b = a.getTime(); return !!isNaN(b) || b + 1e3 * this.maxAgeSeconds > c;
        } return this.expireEntries({ cacheName: a, now: c }), !0;
      } return !0;
    }updateTimestamp({ cacheName: a, url: b, now: c } = {}) {
      const d = this; return asyncToGenerator(function* () {
        isType({ url: b }, 'string'), isType({ cacheName: a }, 'string'); const e = new URL(b, location); e.hash = '', typeof c === 'undefined' && (c = Date.now()); const f = yield d.getDB({ cacheName: a }),
          g = f.transaction(a, 'readwrite'); g.objectStore(a).put({ [timestampPropertyName]: c, [urlPropertyName]: e.href }), yield g.complete;
      })();
    }expireEntries({ cacheName: a, now: b } = {}) {
      const c = this; return asyncToGenerator(function* () {
        if (c._expirationMutex) return void (c._timestampForNextRun = b); c._expirationMutex = !0, isType({ cacheName: a }, 'string'), typeof b === 'undefined' && (b = Date.now()); const d = c.maxAgeSeconds ? yield c.findOldEntries({ cacheName: a, now: b }) : [],
          e = c.maxEntries ? yield c.findExtraEntries({ cacheName: a }) : [],
          f = [...new Set(d.concat(e))]; if (yield c.deleteFromCacheAndIDB({ cacheName: a, urls: f }), f.length > 0 && logHelper.debug({ that: c, message: 'Expired entries have been removed from the cache.', data: { cacheName: a, urls: f } }), c._expirationMutex = !1, c._timestampForNextRun) { const b = c._timestampForNextRun; return c._timestampForNextRun = null, c.expireEntries({ cacheName: a, now: b }); }
      })();
    }findOldEntries({ cacheName: a, now: b } = {}) {
      const c = this; return asyncToGenerator(function* () {
        isType({ cacheName: a }, 'string'), isType({ now: b }, 'number'); const d = b - 1e3 * c.maxAgeSeconds,
          e = [],
          f = yield c.getDB({ cacheName: a }),
          g = f.transaction(a, 'readonly'),
          h = g.objectStore(a),
          i = h.index(timestampPropertyName); return i.iterateCursor((a) => { a && (a.value[timestampPropertyName] < d && e.push(a.value[urlPropertyName]), a.continue()); }), yield g.complete, e;
      })();
    }findExtraEntries({ cacheName: a } = {}) {
      const b = this; return asyncToGenerator(function* () {
        isType({ cacheName: a }, 'string'); const c = [],
          d = yield b.getDB({ cacheName: a }); let e = d.transaction(a, 'readonly'),
          f = e.objectStore(a),
          g = f.index(timestampPropertyName); const h = yield g.count(); return h > b.maxEntries && (e = d.transaction(a, 'readonly'), f = e.objectStore(a), g = f.index(timestampPropertyName), g.iterateCursor((a) => { a && (c.push(a.value[urlPropertyName]), h - c.length > b.maxEntries && a.continue()); })), yield e.complete, c;
      })();
    }deleteFromCacheAndIDB({ cacheName: a, urls: b } = {}) {
      const c = this; return asyncToGenerator(function* () {
        if (isType({ cacheName: a }, 'string'), isArrayOfType({ urls: b }, 'string'), b.length > 0) {
          const d = yield c.getCache({ cacheName: a }),
            e = yield c.getDB({ cacheName: a }); for (const c of b) {
            yield d.delete(c); const b = e.transaction(a, 'readwrite'),
              f = b.objectStore(a); f.delete(c), yield b.complete;
          }
        }
      })();
    }
  }

  class CacheExpirationPlugin extends CacheExpiration {cachedResponseWillBeUsed({ cacheName: a, cachedResponse: b, now: c } = {}) { return this.isResponseFresh({ cacheName: a, cachedResponse: b, now: c }) ? b : null; }cacheDidUpdate({ cacheName: a, newResponse: b, url: c, now: d } = {}) { const e = this; return asyncToGenerator(function* () { isType({ cacheName: a }, 'string'), isInstance({ newResponse: b }, Response), typeof d === 'undefined' && (d = Date.now()), yield e.updateTimestamp({ cacheName: a, url: c, now: d }), yield e.expireEntries({ cacheName: a, now: d }); })(); }}

  const errors$4 = { 'channel-name-required': `The channelName parameter is required when
    constructing a new BroadcastCacheUpdate instance.`,
    'responses-are-same-parameters-required': `The first, second, and
    headersToCheck parameters must be valid when calling responsesAreSame()` }; const ErrorFactory$6 = new ErrorFactory$1(errors$4);

  const cacheUpdatedMessageType = 'CACHE_UPDATED';
  const defaultHeadersToCheck = ['content-length', 'etag', 'last-modified'];
  const defaultSource = 'workbox-broadcast-cache-update';

  function broadcastUpdate({ channel: a, cacheName: b, url: c, source: d } = {}) { isInstance({ channel: a }, BroadcastChannel), isType({ cacheName: b }, 'string'), isType({ source: d }, 'string'), isType({ url: c }, 'string'), a.postMessage({ type: cacheUpdatedMessageType, meta: d, payload: { cacheName: b, updatedUrl: c } }); }

  function responsesAreSame({ first: a, second: b, headersToCheck: c } = {}) {
    if (!(a instanceof Response && b instanceof Response && c instanceof Array)) throw ErrorFactory$6.createError('responses-are-same-parameters-required'); const d = c.some(c => a.headers.has(c) && b.headers.has(c)); return d ? c.every(c => a.headers.has(c) === b.headers.has(c) && a.headers.get(c) === b.headers.get(c)) : (logHelper.log({ message: `Unable to determine whether the response has been updated
        because none of the headers that would be checked are present.`,
      data: { 'First Response': a, 'Second Response': b, 'Headers To Check': JSON.stringify(c) } }), !0);
  }

  class BroadcastCacheUpdate {constructor({ channelName: a, headersToCheck: b, source: c } = {}) { if (typeof a !== 'string' || a.length === 0) throw ErrorFactory$6.createError('channel-name-required'); this.channelName = a, this.headersToCheck = b || defaultHeadersToCheck, this.source = c || defaultSource; } get channel() { return this._channel || (this._channel = new BroadcastChannel(this.channelName)), this._channel; }notifyIfUpdated({ first: a, second: b, cacheName: c, url: d }) { isType({ cacheName: c }, 'string'), responsesAreSame({ first: a, second: b, headersToCheck: this.headersToCheck }) || broadcastUpdate({ cacheName: c, url: d, channel: this.channel, source: this.source }); }}

  class BroadcastCacheUpdatePlugin extends BroadcastCacheUpdate {cacheDidUpdate({ cacheName: a, oldResponse: b, newResponse: c, url: d }) { isType({ cacheName: a }, 'string'), isInstance({ newResponse: c }, Response), b && this.notifyIfUpdated({ cacheName: a, first: b, second: c, url: d }); }}

  class Strategies {
    constructor({ cacheId: a } = {}) { this._cacheId = a; }cacheFirst(a) { return this._getCachingMechanism(CacheFirst, a); }cacheOnly(a) { return this._getCachingMechanism(CacheOnly, a); }networkFirst(a) { return this._getCachingMechanism(NetworkFirst, a); }networkOnly(a) { return this._getCachingMechanism(NetworkOnly, a); }staleWhileRevalidate(a) { return this._getCachingMechanism(StaleWhileRevalidate, a); }_getCachingMechanism(a, b = {}) {
      const c = { cacheExpiration: CacheExpirationPlugin, broadcastCacheUpdate: BroadcastCacheUpdatePlugin, cacheableResponse: CacheableResponsePlugin },
        d = { plugins: [] }; b.excludeCacheId || (d.cacheId = this._cacheId), b.cacheName && (d.cacheName = b.cacheName); const e = Object.keys(c); return e.forEach((a) => {
        if (b[a]) {
          const e = c[a],
            f = b[a]; d.plugins.push(new e(f));
        }
      }), b.plugins && b.plugins.forEach((a) => { d.plugins.push(a); }), b.requestWrapper = new RequestWrapper(d), new a(b);
    }
  }

  const errorMessageFactory = (a, b) => { let c = 'An error was thrown by workbox with error code: ' + `;'${a}'`; return b && (c += ` with extras: '${JSON.stringify(b)}'`), c; };

  class WorkboxError extends Error {constructor(a, b) { super(), this.name = a, this.message = errorMessageFactory(a, b), b && (this.extras = b); }}

  class BaseCacheManager {
    constructor({ cacheName: a, cacheId: b, plugins: c } = {}) { if (b && (typeof b !== 'string' || b.length === 0)) throw new WorkboxError('bad-cache-id', { cacheId: b }); this._entriesToCache = new Map(), this._requestWrapper = new RequestWrapper({ cacheName: a, cacheId: b, plugins: c, fetchOptions: { credentials: 'same-origin' } }); }_addEntries(a) { this._parsedCacheUrls = null, a.forEach((a) => { this._addEntryToInstallList(this._parseEntry(a)); }); }getCacheName() { return this._requestWrapper.cacheName; }getCachedUrls() { return this._parsedCacheUrls || (this._parsedCacheUrls = Array.from(this._entriesToCache.keys()).map(a => new URL(a, location).href)), this._parsedCacheUrls; }_addEntryToInstallList(a) {
      const b = a.entryID,
        c = this._entriesToCache.get(a.entryID); return c ? void this._onDuplicateInstallEntryFound(a, c) : void this._entriesToCache.set(b, a);
    }install() { const a = this; return asyncToGenerator(function* () { if (a._entriesToCache.size === 0) return []; const b = []; return a._entriesToCache.forEach((c) => { b.push(a._cacheEntry(c)); }), Promise.all(b); })(); }_cacheEntry(a) {
      const b = this; return asyncToGenerator(function* () {
        const c = yield b._isAlreadyCached(a),
          d = { url: a.request.url, revision: a.revision, wasUpdated: !c }; if (c) return d; try { return yield b._requestWrapper.fetchAndCache({ request: a.getNetworkRequest(), waitOnCache: !0, cacheKey: a.request, cleanRedirects: !0 }), yield b._onEntryCached(a), d; } catch (b) { throw new WorkboxError('request-not-cached', { url: a.request.url, error: b }); }
      })();
    }cleanup() {
      const a = this; return asyncToGenerator(function* () {
        if (!(yield caches.has(a.getCacheName()))) return; const b = []; a._entriesToCache.forEach((a) => { b.push(a.request.url); }); const c = yield a._getCache(),
          d = yield c.keys(),
          e = d.filter(a => !b.includes(a.url)); return Promise.all(e.map((() => { const b = asyncToGenerator(function* (b) { yield c.delete(b), yield a._onEntryDeleted(b.url); }); return function () { return b.apply(this, arguments); }; })()));
      })();
    }_getCache() { const a = this; return asyncToGenerator(function* () { return a._cache || (a._cache = yield caches.open(a.getCacheName())), a._cache; })(); }_parseEntry() { throw new WorkboxError('requires-overriding'); }_onDuplicateEntryFound() { throw new WorkboxError('requires-overriding'); }_isAlreadyCached() { throw new WorkboxError('requires-overriding'); }_onEntryCached() { throw new WorkboxError('requires-overriding'); }_onEntryDeleted() { throw new WorkboxError('requires-overriding'); }
  }

  class IDBHelper {
    constructor(a, b, c) { if (a == void 0 || b == void 0 || c == void 0) throw Error('name, version, storeName must be passed to the constructor.'); this._name = a, this._version = b, this._storeName = c; }_getDb() { return this._dbPromise ? this._dbPromise : (this._dbPromise = idb.open(this._name, this._version, (a) => { a.createObjectStore(this._storeName); }).then(a => a), this._dbPromise); }close() { return this._dbPromise ? this._dbPromise.then((a) => { a.close(), this._dbPromise = null; }) : void 0; }put(a, b) {
      return this._getDb().then((c) => {
        const d = c.transaction(this._storeName, 'readwrite'),
          e = d.objectStore(this._storeName); return e.put(b, a), d.complete;
      });
    }delete(a) {
      return this._getDb().then((b) => {
        const c = b.transaction(this._storeName, 'readwrite'),
          d = c.objectStore(this._storeName); return d.delete(a), c.complete;
      });
    }get(a) { return this._getDb().then(b => b.transaction(this._storeName).objectStore(this._storeName).get(a)); }getAllValues() { return this._getDb().then(a => a.transaction(this._storeName).objectStore(this._storeName).getAll()); }getAllKeys() { return this._getDb().then(a => a.transaction(this._storeName).objectStore(this._storeName).getAllKeys()); }
  }

  const cacheBustParamName = '_workbox-precaching'; const version = 'v1'; const dbName = 'workbox-precaching'; const dbVersion = '1'; const dbStorename = 'asset-revisions'; let tmpRevisionedCacheName = `workbox-precaching-revisioned-${version}`; self && self.registration && (tmpRevisionedCacheName += `-${self.registration.scope}`); const defaultRevisionedCacheName = tmpRevisionedCacheName;

  class RevisionDetailsModel {constructor() { this._idbHelper = new IDBHelper(dbName, dbVersion, dbStorename); }get(a) { return this._idbHelper.get(a); }put(a, b) { return this._idbHelper.put(a, b); }delete(a) { return this._idbHelper.delete(a); }_close() { this._idbHelper.close(); }}

  class BaseCacheEntry {constructor({ entryID: a, revision: b, request: c, cacheBust: d }) { this.entryID = a, this.revision = b, this.request = c, this.cacheBust = d; }getNetworkRequest() { if (!0 !== this.cacheBust) return this.request; let a = this.request.url; const b = {}; if (!0 === this.cacheBust) if ('cache' in Request.prototype)b.cache = 'reload'; else { const b = new URL(a, location); b.search += `${(b.search ? '&' : '') + encodeURIComponent(cacheBustParamName)}=${encodeURIComponent(this.revision)}`, a = b.toString(); } return new Request(a, b); }}

  class StringCacheEntry extends BaseCacheEntry {constructor(a) { if (isType({ url: a }, 'string'), a.length === 0) throw new WorkboxError('invalid-string-entry', { url: a }); super({ entryID: a, revision: a, request: new Request(a), cacheBust: !1 }); }}

  class ObjectCacheEntry extends BaseCacheEntry {constructor({ entryID: a, revision: b, url: c, cacheBust: d }) { if (typeof b !== 'undefined' && (isType({ revision: b }, 'string'), b.length === 0)) throw new WorkboxError('invalid-object-entry', { problemParam: 'revision', problemValue: b }); if (typeof d === 'undefined' && (d = !!b), isType({ cacheBust: d }, 'boolean'), isType({ url: c }, 'string'), c.length === 0) throw new WorkboxError('invalid-object-entry', { problemParam: 'url', problemValue: c }); if (typeof a === 'undefined')a = new URL(c, location).toString(); else if (a.length === 0) throw new WorkboxError('invalid-object-entry', { problemParam: 'entryID', problemValue: a }); super({ entryID: a, revision: b || c, request: new Request(c), cacheBust: d }); }}

  class RevisionedCacheManager extends BaseCacheManager {
    constructor(a = {}) { a.cacheName = a.cacheName || defaultRevisionedCacheName, super(a), this._revisionDetailsModel = new RevisionDetailsModel(); }addToCacheList({ revisionedFiles: a } = {}) {
      isInstance({ revisionedFiles: a }, Array), super._addEntries(a); const b = a.filter(a => typeof a === 'string' || !a.revision); b.length > 0 && logHelper.debug({ that: this,
        message: `Some precache entries are URLs without separate revision
          fields. If the URLs themselves do not contain revisioning info,
          like a hash or a version number, your users won't receive updates.`,
        data: { 'URLs without revision fields': JSON.stringify(b), 'Examples of safe, versioned URLs': '\'/path/file.abcd1234.css\' or \'/v1.0.0/file.js\'', 'Examples of dangerous, unversioned URLs': '\'index.html\' or \'/path/file.css\' or \'/latest/file.js\'' } });
    }_parseEntry(a) { if (a === null) throw new WorkboxError('unexpected-precache-entry', { input: a }); let b; switch (typeof a) { case 'string':b = new StringCacheEntry(a); break; case 'object':b = new ObjectCacheEntry(a); break; default:throw new WorkboxError('unexpected-precache-entry', { input: a }); } return b; }_onDuplicateInstallEntryFound(a, b) { if (b.revision !== a.revision) throw new WorkboxError('duplicate-entry-diff-revisions', { firstEntry: { url: b.request.url, revision: b.revision }, secondEntry: { url: a.request.url, revision: a.revision } }); }_isAlreadyCached(a) {
      const b = this; return asyncToGenerator(function* () {
        const c = yield b._revisionDetailsModel.get(a.entryID); if (c !== a.revision) return !1; const d = yield b._getCache(),
          e = yield d.match(a.request); return !!e;
      })();
    }_onEntryCached(a) { const b = this; return asyncToGenerator(function* () { yield b._revisionDetailsModel.put(a.entryID, a.revision); })(); }_onEntryDeleted(a) { const b = this; return asyncToGenerator(function* () { yield b._revisionDetailsModel.delete(a); })(); }_close() { this._revisionDetailsModel._close(); }cleanup() { return super.cleanup().then(() => this._close()); }_createLogFriendlyString(a) { let b = '\n'; return a.forEach((a) => { b += `    URL: '${a.url}' Revision: ` + `'${a.revision}'\n`; }), b; }install() {
      return super.install().then((a) => {
        const b = [],
          c = []; a.forEach((a) => { a.wasUpdated ? b.push({ url: a.url, revision: a.revision }) : c.push({ url: a.url, revision: a.revision }); }); const d = {}; return b.length > 0 && (d['New / Updated Precache URL\'s'] = this._createLogFriendlyString(b)), c.length > 0 && (d['Up-to-date Precache URL\'s'] = this._createLogFriendlyString(c)), logHelper.log({ message: `Precache Details: ${b.length} requests ` + 'were added or updated and ' + `${c.length} request are already ` + 'cached and up-to-date.', data: d }), a;
      });
    }
  }

  if (!isServiceWorkerGlobalScope()) throw new WorkboxError('not-in-sw');

  class WorkboxSW$1 {
    constructor({ cacheId: a, skipWaiting: b, clientsClaim: c, handleFetch: d = !0, directoryIndex: e = 'index.html', precacheChannelName: f = 'precache-updates', ignoreUrlParametersMatching: g = [/^utm_/] } = {}) {
      if (!isServiceWorkerGlobalScope()) throw ErrorFactory.createError('not-in-sw'); if (isDevBuild() && (isLocalhost() ? logHelper.debug({ message: 'Welcome to Workbox!', data: { '📖': 'Read the guides and documentation\nhttps://workboxjs.org/', '❓': 'Use the [workbox] tag on StackOverflow to ask questions\nhttps://stackoverflow.com/questions/ask?tags=workbox', '🐛': 'Found a bug? Report it on GitHub\nhttps://github.com/GoogleChrome/workbox/issues/new' } }) : logHelper.warn(`This appears to be a production server. Please switch
          to the smaller, optimized production build of Workbox.`)), a && (typeof a !== 'string' || a.length === 0)) throw ErrorFactory.createError('bad-cache-id'); if (b && typeof b !== 'boolean') throw ErrorFactory.createError('bad-skip-waiting'); if (c && typeof c !== 'boolean') throw ErrorFactory.createError('bad-clients-claim'); if (typeof e !== 'undefined') if (!1 === e || e === null)e = !1; else if (typeof e !== 'string' || e.length === 0) throw ErrorFactory.createError('bad-directory-index'); const h = []; f && h.push(new BroadcastCacheUpdatePlugin({ channelName: f, source: registration && registration.scope ? registration.scope : location })), this._runtimeCacheName = getDefaultCacheName({ cacheId: a }), this._revisionedCacheManager = new RevisionedCacheManager({ cacheId: a, plugins: h }), this._strategies = new Strategies({ cacheId: a }), this._precacheRouter = new Router$$1(this._revisionedCacheManager.getCacheName()), this._router = new Router$$1(this._revisionedCacheManager.getCacheName()), d && (this._precacheRouter.addFetchListener(), this._router.addFetchListener()), this._registerInstallActivateEvents(b, c), this._registerDefaultRoutes(g, e);
    }precache(a) { if (!Array.isArray(a)) throw ErrorFactory.createError('bad-revisioned-cache-list'); this._revisionedCacheManager.addToCacheList({ revisionedFiles: a }); } get router() { return this._router; } get strategies() { return this._strategies; } get runtimeCacheName() { return this._runtimeCacheName; }_registerInstallActivateEvents(a, b) {
      self.addEventListener('install', (b) => {
        const c = this._revisionedCacheManager.getCachedUrls(); c.length > 0 && logHelper.debug({ that: this,
          message: `The precached URLs will automatically be served using a
            cache-first strategy.`,
          data: { 'Precached URLs': JSON.stringify(c) } }), b.waitUntil(this._revisionedCacheManager.install().then(() => { if (a) return self.skipWaiting(); }));
      }), self.addEventListener('activate', (a) => { a.waitUntil(this._revisionedCacheManager.cleanup().then(() => { if (b) return self.clients.claim(); })); });
    }_registerDefaultRoutes(a, b) { const c = []; (a || b) && c.push(this._getCacheMatchPlugin(a, b)); const d = this.strategies.cacheFirst({ cacheName: this._revisionedCacheManager.getCacheName(), plugins: c, excludeCacheId: !0 }); this._precacheRouter.registerRoute(({ url: c }) => { c.hash = ''; const d = this._revisionedCacheManager.getCachedUrls(); if (d.indexOf(c.href) !== -1) return !0; const e = this._removeIgnoreUrlParams(c.href, a); return d.indexOf(e.href) !== -1 || b && e.pathname.endsWith('/') && (e.pathname += b, d.indexOf(e.href) !== -1); }, d); }_getCacheMatchPlugin(a, b) { const c = this; const d = (() => { const d = asyncToGenerator(function* ({ request: d, cache: e, cachedResponse: f, matchOptions: g }) { if (f) return f; const h = c._removeIgnoreUrlParams(d.url, a); return e.match(h.toString(), g).then(a => (!a && h.pathname.endsWith('/') ? (h.pathname += b, e.match(h.toString(), g)) : a)); }); return function () { return d.apply(this, arguments); }; })(); return { cachedResponseWillBeUsed: d }; }_removeIgnoreUrlParams(a, b) {
      const c = new URL(a),
        d = c.search.slice(1),
        e = d.split('&'),
        f = e.map(a => a.split('=')),
        g = f.filter(a => b.every(b => !b.test(a[0]))),
        h = g.map(a => a.join('=')); return c.search = h.join('&'), c;
    }
  }

  return WorkboxSW$1;
}());
// # sourceMappingURL=workbox-sw.prod.v2.1.1.js.map

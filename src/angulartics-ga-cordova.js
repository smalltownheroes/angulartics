/**
 * @license Angulartics v0.15.20
 * (c) 2013 Luis Farzati http://luisfarzati.github.io/angulartics
 * License: MIT
 */
(function(angular) {
'use strict';

/**
 * @ngdoc overview
 * @name angulartics.google.analytics.cordova
 * Enables analytics support for Google Analytics (http://google.com/analytics)
 */
angular.module('angulartics.google.analytics.cordova', ['angulartics'])

.provider('googleAnalyticsCordova', function () {
  var GoogleAnalyticsCordova = [
  '$q', '$log', 'ready', 'debug', 'trackingId', 'period',
  function ($q, $log, ready, debug, trackingId, period) {
    var deferred = $q.defer();
    var deviceReady = false;

    window.addEventListener('deviceReady', function () {
      deviceReady = true;
      deferred.resolve();
    });

    setTimeout(function () {
      if (!deviceReady) {
        deferred.resolve();
      }
    }, 3000);

    function success() {
      if (debug) {
        $log.info(arguments);
      }
    }

    function failure(err) {
      if (debug) {
        $log.error(err);
      }
    }

    // There are two popular cordova Google Analytics plugins
    // - gaPlugin : https://github.com/phonegap-build/GAPlugin
    function isGaPlugin() {
      var plugins = window.plugins;
      if (plugins) {
        if (window.plugins.gaPlugin) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    // There are two popular cordova Google Analytics plugins
    // - UniversalAnalyticsPlugin : https://github.com/danwilson/google-analytics-plugin
    function isUaPlugin() {
      var plugins = window.plugins;
      if (plugins) {
        if (window.plugins.UniversalAnalyticsPlugin) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    function findAnalytics() {

      if (isUaPlugin()) {
        console.log('found gaPlugin');
        return window.plugins.gaPlugin;
      }
      if (isGaPlugin()) {
        console.log('found uaPlugin');
        return window.plugins.UniversalAnalyticsPlugin;
      }

      return null;
    }

    this.init = function () {
      return deferred.promise.then(function () {
        var analytics = findAnalytics();
        if (analytics) {
          analytics.init(function onInit() {
            ready(analytics, success, failure);
          }, failure, trackingId, period || 10);
        } else if (debug) {
          $log.error('Google Analytics for Cordova is not available');
        }
      });
    };
  }];

  return {
    $get: ['$injector', function ($injector) {
      return $injector.instantiate(GoogleAnalyticsCordova, {
        ready: this._ready || angular.noop,
        debug: this.debug,
        trackingId: this.trackingId,
        period: this.period
      });
    }],
    ready: function (fn) {
      this._ready = fn;
    }
  };
})

.config(['$analyticsProvider', 'googleAnalyticsCordovaProvider', function ($analyticsProvider, googleAnalyticsCordovaProvider) {
  googleAnalyticsCordovaProvider.ready(function (analytics, success, failure) {
    $analyticsProvider.registerPageTrack(function (path) {

      console.log(path);
      // GAPlugin.prototype.trackPage = function(success, fail, pageURL) {
      if (isGaPlugin()) {
        analytics.trackPage(success, failure, path);
      }

      // UniversalAnalyticsPlugin.prototype.trackView = function(screen, success, error) {
      if (isUaPlugin()) {
        analytics.trackView(path, success, failure);
      }
    });

    $analyticsProvider.registerEventTrack(function (action, properties) {

      console.log(properties);
      //  GAPlugin.prototype.trackEvent = function(success, fail, category, eventAction, eventLabel, eventValue) {
      if (isGaPlugin()) {
        analytics.trackEvent(success, failure, properties.category, action, properties.label, properties.value);
      }

      // UniversalAnalyticsPlugin.prototype.trackEvent = function(category, action, label, value, success, error) {
      if (isUaPlugin()) {
        analytics.trackEvent(properties.category, action, properties.label, properties.value,success, failure);
      }
    });
  });
}])

.run(['googleAnalyticsCordova', function (googleAnalyticsCordova) {
  googleAnalyticsCordova.init();
}]);

})(angular);

/**
 * Samurai - unit tests for configuration module
 * Copyright (c)2011, by FeeFighters <samurai@feefighters.com>
 * Licensed under MIT license (see LICENSE)
 */

var config = require('../lib/config');
var helpers = require('./helpers');
var assert = require('assert');
var should = require('should');
var test = exports;

// Set up fixtures
var testKeyBases = ['key1', 'key2', 'key3'];
var testKeys = [];
var badKeys = ['bogus', 'foo', '123'];

// Generate some dummy keys
testKeyBases.forEach(function(base) {
  testKeys.push(helpers.generateKey(base));
});

// START TESTING

test['Initial state'] = function(done) {
  config.should.respondTo('option');
  config.option('merchantKey').should.equal('');
  config.option('merchantPassword').should.equal('');
  config.option('processorToken').should.equal('');
  config.option('currency').should.equal('USD');
  config.option('enabled').should.equal(true);
  config.option('debug').should.equal(false);
  config.option('sandbox').should.equal(false);
  config.option('allowedCurrencies').should.not.be.empty;
  config.option('allowedCurrencies').should.contain('USD');
  config.option('allowMultipleSetOption').should.equal(false);
  done();
};

test['Configuration requires all three keys'] = function(done) {
  assert.throws(function() {
    config.configure({});
  });

  assert.throws(function() {
    config.configure({
      merchantPassword: testKeys[1],
      processorToken: testKeys[2]
    });
  });
  
  assert.throws(function() {
    config.configure({
      merchantKey: testKeys[0],
      processorToken: testKeys[2]
    });
  });

  assert.throws(function() {
    config.configure({
      merchantKey: testKeys[0],
      merchantPassword: testKeys[1]
    });
  });
  done();
};

test['Configuration fails with invalid-looking keys'] = function(done) {
  assert.throws(function() {
    config.configure({
      merchantKey: testKeys[0],
      merchantPassword: testKeys[1],
      processorToken: badKeys[0]
    });
  });

  assert.throws(function() {
    config.configure({
      merchantKey: testKeys[0],
      merchantPassword: badKeys[0],
      processorToken: testKeys[1]
    });
  });
  
  assert.throws(function() {
    config.configure({
      merchantKey: badKeys[0],
      merchantPassword: testKeys[0],
      processorToken: testKeys[1]
    });
  });
  done();
};

test['Proper configuration modifies settings correctly'] = function(done) {
  config.configure({
    merchantKey: testKeys[0],
    merchantPassword: testKeys[1],
    processorToken: testKeys[2],
    allowMultipleSetOption: true // to prevent locking up settings
  });
  config.option('merchantKey').should.equal(testKeys[0]);
  config.option('merchantPassword').should.equal(testKeys[1]);
  config.option('processorToken').should.equal(testKeys[2]);
  done();
};

test['Setting individual configuration options'] = function(done) {
  config.option('merchantKey', testKeys[0]);
  config.option('merchantKey').should.equal(testKeys[0]);

  config.option('merchantPassword', testKeys[1]);
  config.option('merchantPassword').should.equal(testKeys[1]);

  config.option('processorToken', testKeys[2]);
  config.option('processorToken').should.equal(testKeys[2]);

  config.option('enabled', false);
  config.option('enabled', true);
  config.option('enabled').should.equal(true);

  config.option('enabled', false);
  config.option('enabled', 2); // truthy
  config.option('enabled').should.equal(true);

  config.option('debug', false);
  config.option('debug', true);
  config.option('debug').should.equal(true);

  config.option('debug', false);
  config.option('debug', 'yes'); // truthy
  config.option('debug').should.equal(true);
  config.option('debug', false);

  config.option('currency', 'USD');
  config.option('currency', 'JPY');
  config.option('currency').should.equal('JPY');

  config.option('sandbox', false);
  config.option('sandbox', 'yes'); // truthy
  config.option('sandbox').should.equal(true);

  config.option('allowedCurrencies', ['GBP']);
  config.option('allowedCurrencies').should.contain('GBP');
  config.option('allowedCurrencies').should.contain('JPY'); // includes default

  config.option('allowedCurrencies', []);
  config.option('allowedCurrencies').should.not.be.empty;
  config.option('allowedCurrencies').should.contain('JPY');

  assert.throws(function() {
    config.option('merchantKey', badKeys[0]);
  }, 'Not valid merchantKey');

  assert.throws(function() {
    config.option('merchantPassword', badKeys[0]);
  }, 'Not valid merchantPassword');

  assert.throws(function() {
    config.option('processorToken', badKeys[0]);
  }, 'Not valid processorToken');
  done();
};

/**
 * Samurai - unit tests for check module
 * Copyright (c)2011, by FeeFighters <samurai@feefighters.com>
 * Licensed under MIT license (see LICENSE)
 *
 * Cred card numbers used as fixtures come from these URI:
 * https://www.paypalobjects.com/en_US/vhelp/paypalmanager_help/credit_card_numbers.htm
 *
 * All card numbers are test numbers, and cannot be used to make real-life 
 * purchases. They are only useful for testing.
 */

var assert = require('assert');
var should = require('should');
var check = require('../lib/check');

var validCardNos = {
  '378282246310005': 'American Express',
  '371449635398431': 'American Express',
  '378734493671000': 'American Express',
  '5610591081018250': 'Unknown', // Australian Bank
  '30569309025904': 'Diners Club',
  '38520000023237': 'Diners Club',
  '6011111111111117': 'Discover',
  '6011000990139424': 'Discover',
  '3530111333300000': 'JCB',
  '3566002020360505': 'JCB',
  '5555555555554444': 'MasterCard',
  '5105105105105100': 'MasterCard',
  '4111111111111111': 'Visa',
  '4012888888881881': 'Visa',
  '4222222222222': 'Visa'
};

var tests = {};

tests.issuerCheck = function(test) {
  test.expect(10);
  Object.keys(validCardNos).forEach(function(card) {
    assert.equal(check.getIssuer(card), validCardNos[card]);
  });
  test.done();
};

tests.issuerCheckWithFullDetails = function(test) {
  Object.keys(validCardNos).forEach(function(card) {
    var issuerDetails = check.getIssuer(card, true);
    issuerDetails[0] = validCardNos[card];
    issuerDetails[1].should.be.instanceof(RegExp);
    issuerDetails[2].should.be.instanceof(RegExp);
  });
  test.done();
};

tests.mod10test = function(test) {
  // All test cards should pass (they are all valid numbers)
  Object.keys(validCardNos).forEach(function(card) {
    check.mod10check(card).should.equal(card);
  });
  test.done();
};

tests.cscCheckUsingAmexAndNonAmexCard = function(test) {
  // MasterCard
  check.cscCheck('5555555555554444', '111').should.be.ok;
  check.cscCheck('5555555555554444', '11').should.not.be.ok;
  check.cscCheck('5555555555554444', '1111').should.not.be.ok;
  check.cscCheck('5555555555554444', 'foo').should.not.be.ok;

  // Amex
  check.cscCheck('378282246310005', '111').should.not.be.ok;
  check.cscCheck('378282246310005', '1111').should.be.ok;
  check.cscCheck('378282246310005', '11111').should.not.be.ok;
  check.cscCheck('378282246310005', 'foo').should.not.be.ok;

  test.done();
};

exports.check = tests;

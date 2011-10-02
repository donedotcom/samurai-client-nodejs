/**
 * Samurai - unit tests for the main Samurai module
 * Copyright (c)2011, by FeeFighters.
 * Licensed under MIT license (see LICENSE)
 */

var assert = require('assert');
var should = require('should');
var getAdjustedDateparts = require('./helpers').getAdjustedDateparts;
var samurai = require('../index.js');
var messages = require('../lib/messages');
var test = exports;

var testNonExpiredDate = getAdjustedDateparts(12); // One year in future
var testExpiredDate = getAdjustedDateparts(-12); // One year ago
var testSettings = require('./config');

// Enable sandbox, and debug
// samurai.option('sandbox', true);
// samurai.option('debug', true);
samurai.option('sandbox', false);
samurai.option('debug', false);
samurai.option('currency', 'USD');
samurai.option('allowedCurrencies', ['USD']);

var testCard = {
  number: '5555555555554444', // MasterCard
  csc: '111',
  year: testNonExpiredDate[0].toString(),
  month: testNonExpiredDate[1].toString(),
  firstName: 'Foo',
  lastName: 'Bar',
  address1: '221 Foo st',
  address2: '', // blank
  city: '', // blank
  state: '', // blank
  zip: '99561'
};

var sandboxValidCard = {
  number: '4111-1111-1111-1111',
  csc: '123',
  year: testNonExpiredDate[0].toString(),
  month: testNonExpiredDate[1].toString()
  // No other extra data, this is only for testing transactions
};

var sandboxDeclinedCard = {
  number: '4242-4242-4242-4242',
  csc: '123',
  year: testNonExpiredDate[0].toString(),
  month: testNonExpiredDate[1].toString()
  // No other extra data, this is only for testing transactions
};

var bogusCard = {
  number: '2420318231',
  csc: '14111',
  year: testExpiredDate[0].toString(),
  month: testExpiredDate[1].toString()
};

test['Configure and lock configuration'] = function(done) {
  testSettings.allowMultipleSetOption = false;
  samurai.configure(testSettings);
  assert.throws(function() {
    samurai.configure(testSettings);
  });
  assert.throws(function() {
    samurai.option('debug', false);
  });
  done();
};

test['samurai module has Card constructor'] = function(done) {
  var Card;
  var card;

  samurai.should.have.property('Card');
  samurai.Card.should.be.a('function');
  Card = samurai.Card;
  done();
};

test['Creating a new card'] = function(done) {
  var Card = samurai.Card;

  card = new Card(testCard);

  card.should.have.property('number');
  card.number.should.equal(testCard.number);

  card.should.have.property('issuer');
  card.issuer.should.equal('MasterCard');

  card.should.have.property('year');
  card.year.should.equal(testNonExpiredDate[0]);

  card.should.have.property('month');
  card.month.should.equal(testNonExpiredDate[1]);

  card.should.have.property('firstName');
  card.firstName.should.equal('Foo');

  card.should.have.property('lastName');
  card.lastName.should.equal('Bar');

  card.should.have.property('address1');
  card.address1.should.equal('221 Foo st');

  card.should.have.property('address2');
  card.address2.should.equal('');

  card.should.have.property('city');
  card.city.should.equal('');

  card.should.have.property('state');
  card.state.should.equal('');

  card.should.have.property('zip');
  card.zip.should.equal('99561');
  done();
};

test['Creating a bogus card'] = function(done) {
  var Card = samurai.Card;

  card = new Card(bogusCard);

  card.should.have.property('number');
  card.number.should.equal(bogusCard.number);

  card.should.have.property('issuer');
  card.issuer.should.equal('Unknown');

  card.should.have.property('csc');
  card.csc.should.equal('14111');
  done();
};

// GH: #1
test['Card number should be stripped of non-digit elements'] = function(done) {
  card = new samurai.Card({
    number: '4111-1111-1111-1111',
    csc: '123'
  });
  card.number.should.equal('4111111111111111');
  done();
};

test['Creating card without card number or CSC throws'] = function(done) {
  var Card = samurai.Card;

  assert.throws(function() {
    card = new Card({});
  }, 'Card number is required');

  assert.throws(function() {
    card = new Card({
      number: testCard.number
    });
  }, 'CSC is required');

  assert.throws(function() {
    card = new Card({
      csc: testCard.csc
    });
  }, 'Card number is required');

  done();
};

test['2-digit or 1-digit year converts to 4-digits'] = function(done) {
  var Card = samurai.Card;

  var card = new Card({
    number: testCard.number,
    csc: testCard.csc,
    year: '2' // Should convert to 2nd year of this decade
  });
  card.year.should.equal((Math.floor(new Date().getFullYear() / 10) * 10) + 2);

  card = new Card({
    number: testCard.number,
    csc: testCard.csc,
    year: '15' // Should convert to year 15 of current century
  });

  card.year.should.equal((Math.floor(new Date().getFullYear() / 100) * 100) + 15);
  done();
};

test['Year is normalized with setting year property'] = function(done) {
  var Card = samurai.Card;
  
  var card = new Card(testCard);
  card.year = '3';
  card.year.should.equal((Math.floor(new Date().getFullYear() / 10) * 10) + 3);
  done();
};

test['Cannot set invalid month'] = function(done) {
  var Card = samurai.Card;

  var card = new Card({
    number: testCard.number,
    csc: testCard.csc,
    month: '123'
  });
  should.not.exist(card.month);

  card.month = 'foo';
  should.not.exist(card.month);

  card.month = '13';
  should.not.exist(card.month);
  done();
};

test['Card validation'] = function(done) {
  var Card = samurai.Card;

  var card = new Card(testCard);

  card.should.respondTo('isValid');
  card.isValid().should.be.ok;

  card = new Card(bogusCard);
  card.isValid().should.not.be.ok;
  done();
};

test['Card expiration check'] = function(done) {
  var Card = samurai.Card;

  card = new Card(testCard);
  card.should.respondTo('isExpired');
  card.isExpired().should.not.be.ok;

  card = new Card(bogusCard);
  card.isExpired().should.be.ok;
  done();
};

test['Create method sets a token'] = function(done) {
  var Card = samurai.Card;
  var card = new Card(testCard);
  
  card.should.respondTo('create');

  card.create(function(err) {
    should.not.exist(err);
    card.token.should.match(/^[0-9a-f]{24}$/);
    done();
  });
};

test['Created card can load payment method data'] = function(done) {
  var Card = samurai.Card;
  var card = new Card(testCard);
  var card1;
  var token;
 
  card.custom = {test: 'custom'};

  card.should.respondTo('load');
  assert.throws(function() {
    card.load();
  }, 'Cannot load payment method without token');
  card.create(function(err) {
    token = card.token;
    card1 = new Card({token: token});
    card1.load(function(err) {
      should.not.exist(err);
      card1.should.have.property('method');
      card1.method.should.have.property('createdAt');
      card1.method.createdAt.should.be.instanceof(Date);
      card1.method.should.have.property('updatedAt');
      card1.method.updatedAt.should.be.instanceof(Date);
      card1.method.should.have.property('retained');
      card1.method.retained.should.equal(false);
      card1.method.should.have.property('redacted');
      card1.method.redacted.should.equal(false);
      card1.should.have.property('custom');
      card1.firstName.should.equal(testCard.firstName);
      card1.lastName.should.equal(testCard.lastName);
      card1.address1.should.equal(testCard.address1);
      card1.should.have.property('custom');
      card1.custom.should.have.property('test');
      card1.custom.test.should.equal('custom');
      done();
    });
  });
};

test['Create a bad payment method'] = function(done) {
  var card = new samurai.Card(bogusCard);

  function onLoad(err) {
    card.should.have.property('messages');
    card.messages.should.have.property('errors');
    card.messages.errors.should.have.property('number');
    card.messages.errors.number.should.contain(messages.str.en_US.INVALID_NUMBER);
    card.messages.errors.should.have.property('csc');
    card.messages.errors.csc.should.contain(messages.str.en_US.INVALID_CSC);
    done();
  }

  card.create(function(err) {
    card.load(onLoad);
  });
};

test['Card has _dirty property which lists changed fields'] = function(done) {
  // Initially, all fields are dirty
  var Card = samurai.Card;
  var card = new Card(testCard);
  var token;

  card.should.have.property('_dirty');
  card._dirty.should.not.be.empty;
  card._dirty.should.contain('number');
  card._dirty.should.contain('csc');
  card._dirty.should.contain('year');
  card._dirty.should.contain('month');
  card._dirty.should.contain('firstName');
  card._dirty.should.contain('lastName');
  card._dirty.should.contain('address1');
  card._dirty.should.contain('zip');

  card.create(function(err) {
    should.not.exist(err);
    card._dirty.should.be.empty;
    card.load(function(err) {
      should.not.exist(err);
      card._dirty.should.be.empty;
      card.year = card.year + 1;
      card._dirty.should.contain('year');
      card.month = (card.month + 1) % 12;
      card._dirty.should.contain('month');
      card.firstName = 'Foom';
      card._dirty.should.contain('firstName');
      done();
    });
  });
};

test['Updating a modified card'] = function(done) {
  var Card = samurai.Card;
  var card;

  function onUpdate() {
    }

  card = new Card(testCard);
  card.create(function() {
    card.city.should.not.equal('Smallville');
    card.city = 'Smallville';
    card.month = '12';
    card._dirty.should.contain('city');
    card._dirty.should.contain('month');
    card.update(function(err) {
      card._dirty.should.be.empty;
      card.city.should.equal('Smallville');
      card.month.should.equal(12);
      card.should.have.property('method');
      card.method.should.have.property('createdAt');
      card.method.createdAt.should.be.instanceof(Date);
      card.method.should.have.property('updatedAt');
      card.method.updatedAt.should.be.instanceof(Date);
      card.method.should.have.property('retained');
      card.method.retained.should.equal(false);
      card.method.should.have.property('redacted');
      card.method.redacted.should.equal(false);
      card.firstName.should.equal(testCard.firstName);
      card.lastName.should.equal(testCard.lastName);
      card.address1.should.equal(testCard.address1);
      done();
    });
  });
};

test['Retain card'] = function(done) {
  var card = new samurai.Card(testCard);

  card.create(function(err) {
    card.retain(function(err) {
      card.should.have.property('method');
      card.method.should.have.property('createdAt');
      card.method.createdAt.should.be.instanceof(Date);
      card.method.should.have.property('updatedAt');
      card.method.updatedAt.should.be.instanceof(Date);
      card.method.should.have.property('retained');
      card.method.retained.should.equal(true);
      card.method.should.have.property('redacted');
      card.method.redacted.should.equal(false);
      card.firstName.should.equal(testCard.firstName);
      card.lastName.should.equal(testCard.lastName);
      card.address1.should.equal(testCard.address1);
      done();
    });
  });

};

test['Redact card'] = function(done) {
  var card = new samurai.Card(testCard);

  card.create(function(err) {
    card.retain(function(err) {
      card.method.retained.should.equal(true);
      card.method.redacted.should.equal(false);
      card.redact(function(err) {
        card.method.retained.should.equal(true);
        card.method.redacted.should.equal(true);
        done();
      });
    });
  });

};

test['Creating new transaction object throws if no type'] = function(done) {
  var transaction;

  assert.throws(function() {
    transaction = new samurai.Transaction({
      type: null, 
      data: {amount: 10}
    });
  });
  done();
};

test['Creating new transaction throws with missing data'] = function(done) {
  var transaction;

  assert.throws(function() {
    transaction = new samurai.Transaction({
      type: 'purchase',
      data: null
    });
  });
  done();
};

test['New transaction has a few extra properties'] = function(done) {
  var transaction = new samurai.Transaction({
    type: 'purchase',
    data: {amount: 10}
  });

  transaction.should.have.property('type');
  transaction.type.should.equal('purchase');
  transaction.should.have.property('data');
  transaction.data.should.have.keys(['amount', 'type', 'currency']);
  transaction.data.type.should.equal('purchase');
  transaction.data.currency.should.equal(samurai.option('currency'));
  transaction.should.have.property('path');
  done();
};

test['Simple transactions do not set type and currency'] = function(done) {
  var transaction = new samurai.Transaction({
    type: 'void',
    transactionId: '111111111111111111111111',
    data: {}
  });

  transaction.data.should.not.have.property('currency');
  transaction.data.should.not.have.property('type');
  done();
};

test['Execute transaction'] = function(done) {
  var transaction;

  function callback(err) {
    should.not.exist(err);
    transaction.should.have.property('receipt');
    transaction.receipt.should.have.property('success');
    transaction.receipt.success.should.equal(true);
    transaction.receipt.should.have.property('custom');
    transaction.receipt.custom.should.have.property('test');
    transaction.receipt.custom.test.should.equal('custom');
    transaction.should.have.property('messages');
    transaction.messages.should.have.property('info');
    transaction.messages.info.should.have.property('transaction'); transaction.messages.info.transaction.should.contain('Success');
    done();
  }
  
  transaction = new samurai.Transaction({
    type: 'purchase',
    data: {
      billingReference: '123',
      customerReference: '123',
      amount: 10,
      custom: {test: 'custom'}
    }
  });

  // First we need a card
  var card = new samurai.Card(sandboxValidCard);

  card.create(function(err) {
    // We have the token now.
    card.should.have.property('token');
    transaction.process(card, callback);
  });

};

test['Execute transaction with bad card'] = function(done) {
  var transaction;

  function callback(err) {
    should.not.exist(err); // Failed transaction is not an error
    transaction.should.have.property('receipt');
    transaction.receipt.should.have.property('success');
    transaction.receipt.success.should.equal(false);
    transaction.should.have.property('messages');
    transaction.messages.should.have.property('errors');
    transaction.messages.errors.should.have.property('transaction');
    transaction.messages.errors.transaction.should.contain('Declined');
    done();
  }

  transaction = new samurai.Transaction({
    type: 'purchase',
    data: {
      billingReference: '123',
      customerReference: '123',
      amount: 10  // Declined amount code
    }
  });
  
  var card = new samurai.Card(sandboxDeclinedCard);

  card.create(function(err) {
    // We have the token now.
    card.should.have.property('token');
    transaction.process(card, callback);
  });

};

test['Using transactions with wrong currency'] = function(done) {
  var transaction;

  function callback(err) {
    should.exist(err);
    err.should.have.property('category');
    err.category.should.equal('system');
    err.should.have.property('message');
    err.message.should.equal('Currency not allowed');
    err.should.have.property('details');
    err.details.should.equal('GBP');
    transaction.should.not.have.property('receipt');
    done();
  }

  transaction = new samurai.Transaction({
    type: 'purchase',
    data: {
      amount: 10,
      currency: 'GBP'
    }
  });

  // First we need a card
  var card = new samurai.Card(sandboxValidCard);

  card.create(function(err) {
    // We have the token now.
    card.should.have.property('token');
    transaction.process(card, callback);
  });

};

test['Card with no token cannot be used for transaction'] = function(done) {
  var transaction;

  function callback(err) {
    should.exist(err);
    err.should.have.property('category');
    err.category.should.equal('system');
    err.should.have.property('message');
    err.message.should.equal('Card has no token');
    transaction.should.not.have.property('receipt');
    done();
  }

  transaction = new samurai.Transaction({
    type: 'purchase',
    data: {
      amount: 10,
      currency: 'USD'
    }
  });

  var card = new samurai.Card(sandboxValidCard);
  transaction.process(card, callback);
};

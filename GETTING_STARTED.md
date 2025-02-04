## Getting started

Fee Figters' [Samurai](https://samurai,feefighters.com) payment gateway is
currently in beta. Before joining the beta program and getting an account, it
is highly recommended that you get your merchant account first. After signing
up with Samurai, you will receive three HEX tokens:

 + Merchant key - used to identify your account on Samurai
 + API password - password for you Samurai account
 + Processor ID - the ID of the gateway that you will use for transactions

Initially, you will receive a sandbox processor ID. The sandbox is used for
testing, and you cannot actually process transactions using the sandbox. Keep
in mind that you should only run unit tests that come with samurai-client-nodejs using the
sandbox processor ID.

### Overview

When using the Samurai payment gateway, you basically deal with two separate
concepts: payment methods (cards) and transactions (making/loosing money).
samurai-client-nodejs's API reflects this dualism. It provides two main constructors that you
will use most of the time: `Card` and `Transaction`.

Once created the card objects have the following methods:

 + `card.create()`: cretes a new payment methods
 + `card.load()`: fetches payment method data from the Samurai vault
 + `card.update()`: updates the payment method details
 + `card.retain()`: instructs Samurai to permanently save the payment method
 + `card.redact()`: instructs Samurai to remove the payment method from vault

(See notes about PCI compliance before you start using some of these methods.)

The transaction object is constructed using the `Transaction` constructor. The
transaction object only has one method:

 + `transaction.process()`

This method takes a card object as its argument, and runs a transaction against
the payment method associated with the card.

### Notes on PCI compliance

There are two ways you can use the Samurai gateway with samurai-client-nodejs in terms of
payment methods management. One is server-to-server, where you handle the 
cardholder data, and pass them on to the gateway. Another method is transparent
redirect, where you set up a web form that submits directly to the gateway, and
you only receive a _payment method token_ that is associated with whatever data
the user submitted. 

While the server-to-server method is useful in cases a web form required for
transparent redirect method cannot be set up (for example, for single-page AJAX
apps, where cross-site request restrictions apply), you have to be aware that
full PCI compliance for class C merchants is still required. Class C PCI
compliance may involve on-site audits and/or audits of any 3rd party
infrastructure you might be using, and many other steps. You can read more
about PCI compliance at
[www.pcisecuritystandards.org](https://www.pcisecuritystandards.org/).

Also note that samurai-client-nodejs itself has _not_ been atested or tested for PCI
compliance, so use of samurai-client-nodejs in your environment may negatively affect your
capacity to achieve PCI compliance. While samurai-client-nodejs's author sincerely believes
that samurai-client-nodejs is reasonably safe (or, rather, will be when a full release is
made), we do not, and cannot make any guarantees to that effect, either
explicit or implied, as noted in the
[LICENSE](https://github.com/FeeFighters/samurai-client-nodejs/blob/master/LICENSE). samurai-client-nodejs is
provided to you as is, with no implied and/or explicit warranties of any sort.
In other words, you are on your own using samurai-client-nodejs if you are looking for PCI
compliance. Good news is, source code is availabe, so you can make any
necessary adjustments. (Don't forget to send us a pull request if you do so.)

### Ashigaru and single-page AJAX apps

If you have an AJAX-intesive website that cannot make regular POST requests
using web forms, you might want to try using the Ashigaru jQuery plugin. The
plugin is included in the samurai-client-nodejs project directory under `/support`
subdirectory. For more information on how to set up your server for use with
Ashigaru, and basic usage of this plugin, take a look at Ashigaru's
documentation. You can also find a 
[functional demo](http://herdhound.github.com/samurai-client-nodejs/example/ashigaru/) online.

Ashigaru has been tested only on the latest browsers. Browsers that are
currently supported by Ashigaru are:

 + Firefox 5.0+ (probably works on 4.0 and older as well)
 + Internet Explorer 8.0+ (probably works on older, but IE6 is probably broken)
 + Opera 11.0+ (not sure it would work in older releases)
 + Chrome 13.0+ (should work in most version of Chrome)

Basically, ashigaru is a very simple plugin which uses technology that has been
available for quite some time, so there is no reason to believe it wouldn't
work on older browsers. If you bump into problems with older browsers, however,
please file a bug report.

### Configuration

Before you use any of the samurai-client-nodejs's functions, you should configure samurai-client-nodejs.

    var samurai = require('samurai');

    samurai.configure({
      merchantKey: 'xxxxxxxxxxxxxxxxxxxxxxxx',
      merchantPassword: 'xxxxxxxxxxxxxxxxxxxxxxxx',
      processorToken: 'xxxxxxxxxxxxxxxxxxxxxxxx'
    });

Samurai gatway uses transparent redirect method to process credit card
information. The way it works is, user submits the card and billing data
directly to Samurai, and it redirects the user back to your site attaching a
payment method token to the request. You have to access to credit card data in
any part of the work flow. samurai-client-nodejs provides a `create` method, which allows you
to create a payment method without using the transparent redirect. You may use
this method if you really cannot use the transparent redirect, and you find
Ashigaru to be broken or otherwise unusable for you. You should keep in mind,
though, that you have to ensure that sensitive data passing through your site
is properly secured.  Use SSL for every connection that passes sensitive data,
and do not use GET requests for such requests. Also make sure that no sensitive
data is logged or stored in any part of your application.

One of the configuration options is `debug`, which enables logging of _all_ 
data that passes through samurai-client-nodejs. While it is disabled by default, you should
take utmost care to ensure it remains disabled in production. Double-check
you app's configuration.

### Configuration locking

Note that samurai-client-nodejs performs configuration-locking after you call
`samurai.configure()` for the first time (and if that's successful). This
means that you will not be able to call `samurai.configure()` multiple times
to set different options. You need to set all options beforehand. 

This is a security feature that prevents accidental/malicious resetting of
critical options. 

Calling `samurai.option()` will also fail after configuration has been locked.
You can use multiple calls to `samurai.options()` to set an option
multiple times and it won't lead to locking if the configuration has not been
locked already.

Althoug using `samurai.option()` may sound more convenient, you should set all
critical core options (including `debug`, `enabled`, and `sandbox`) using the
`samurai.configure()` method for security reasons.

Future version of samurai-client-nodejs may simply lock any option that has been set once
without errors using either `samurai.configure()` or `samurai.option()`, so you
should not rely on the behavior of `samurai.option()` to circumvent
configuration locking.

Currently, the only exception to configuration locking is the `currency`
parameter, which can be set any number of times. Future version of samurai-client-nodejs may
include more such non-critical options.

See the ``config`` module documentation for more information.

### Card object

If you chose to use the server-to-server method of creating payment methods,
you can create a new payment method using the `create` method. Suppse you have
received billing and creadit card data from your user. You can now create a new
Card object use that data.

    var card = new samurai.Card({
      number: data.cardNumber,
      csc: data.csc,
      firstName: data.firstName,
      lastName: data.lastName,
      year: data.expirationYear,
      month: data.expirationMonth,
      ....
    });

The card object has following fields:

 + _number_: card number
 + _csc_: card security code (called CCV, CVC, CVV, and various other names)
 + _year_: expiration year (if any)
 + _month_: expiration month
 + _firstName_: card holder's first name
 + _lastName_: card holder's last name
 + _address1_: billing address line 1
 + _address2_: billing address line 2
 + _city_: billing address city
 + _state_: billing address state/region
 + _zip_: billing address zip/postal code
 + _custom_: JSON-serializable object containing arbitrary data you may want to
   store with your payment method (e.g., user ID)

You cannot create a card object unless you supply it a payment token, or credit 
card number and CSC. If you supply it a token, all other fields are ignored. 
Otherwise, card number and CSC are required, and you will get an error if you
do not specify them. If you create a card object with credit card and billing
details, you will get one more field:

 + _issuer_: name of the credit card's issuer

The issuer is detected from the card number, and you should not set the field
manually (or allow the user to set it).

Here is an example of initializing a new card object:

    var card = new samurai.Card({
      number: '4111-1111-1111-1111',
      csc: '123',
      year: 2012,
      month: 11,
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Payment St',
      custom: {
        email: 'jdoe@example.com',
        timestamp: new Date();
      }
    });

    // The card now also has an issuer property:
    console.log(card.issuer); // This logs 'Visa'

### Basic validation

Before you call the `create` method, you can perform basic validation to
increase the likelyhood of successful transaction.

    card.isValid(); // returns true if card is valid
    card.isExpired(); // returns true if expired

In addition to these two methods, you should generally ensure that user
supplies correct address and zip code (or postal number), and that expiration
date is in future. Note that you are allowed to forward the expiration date 
into future, as banks do not usually check if it's correct as long as it's in
future. Generally, the more data you supply, your liability will be lower, so 
it's a good idea to supply as much data as possible to the gateway if you
cannot trust your users 100%.

### Creating the payment method server-side

The card, when initilized, is still not a valid _payment method_. You have to
actually create in on Samurai gateway in order to make purchases. You can do 
that like so:

    card.create(function(err) {
      // Handle errors
      // Card now has a payment method token associated with it
      console.log(card.token);
    });

If there are any errors during the creation process, they will be passed to the 
callback function. The error object will have following properties:

 + _category_: Category of the error ('system' in most cases)
 + _message_: Error message
 + _details_: Any data that give you more details about the error

Common error messages may include:

 + 'Error making create payment method request': samurai-client-nodejs is not properly
   configured (e.g., missing Samurai gateway credentials), or the request
   failed for some reason and the response was unreadable (e.g., Samurai was
   offline)
 + 'Gateway responded with non-302 status': This is rare, but means that
   Samurai received malformed data. If this happens, please report it as a bug.
 + 'Gateway failed to send the location header': This is a Samurai bug, but
   report it to us anyway.

In any case, you should consider receiving an error object with 'system'
category a critical failure, and act accordingly. Depending on the nature of
the error, you may want to retry, too.

It is important to note that error related to the actual card information will
_not_ be passed in error object. These will be available once you load the card
from the gateway, or when you make a transaction.

### Loading the payment method

Now that the card object has a token associated with it, you can either save
the token, or perform transactions with it. So, let's say you have stored the 
payment token, either when doing the transparent redirect, or after you created
the payment method using the `create` method. You can now use the `load` method
to fetch payment method details from Samurai server.

    var myToken = 'xxxxxxxxxxxxxxxxxxxxxxxx';
    var card = new samurai.Card({token: myToken});
    card.load(function(err) {
      // Handle error
    });

The card object has all the fields populated. There are also two new fields:

 + messages: contains any Samurai gateway messages about the card
 + method: contains meta-information about the payment method

See the API documentation for details on what these fields contain. The error
object passed to the callback has the same format as the error object passed to
the `create` method. All methods except `create` also have two more possible
error messages:

 + 'Cannot ACTION payment method without token': (where ACTION is the action
   you were trying to perform), this means that no token was provided and
   action requires a valid payment method token.
 + 'Loaded token does not equal the token that was requested': Gateway
   responded with a token that does not match our token. This indicates a high
   likelyhood of MITM attack, and you should immediately take the site offline
   and perform security checks and forensic analysis to ensure no sensitive
   data has been leaked. (Note that you will not be able to easily uncover a
   _successful_ MITM attack.)

In addition, the following error is different from the `create` method:

 + 'Gateway responded with non-200 status': This means that the request was
   malformed, and it is most likely due to a samurai-client-nodejs bug. Please report full
   error details along with your bug report.

### Updating the payment method

If you want to update the card details, you can do so using the `update` 
method:

    card.firstName = 'Foo';
    card.lastName = 'Bar';
    card.address1 = '241 Bar St.';
    card.city = 'Fooville';
    card.update(function(err) {
      // Handle errors here
    });

Error messages are the same ones expected in `load` method callback.

### Retention and redaction

Samurai has a built-in vault that can safely store your payment methods. Well,
they aren't yours, but... you know what I mean. :) Usage of this vault is
pretty much automatic. As soon as you create a new card, it is stored in the
vault.

By default, the stored payment methods will be deleted after 48 hours. If you
wish to keep the payment methods stored for longer periods, you can use the
`retain()` method. Let's say you have a newly created card. To retain it,
simply instruct the Samurai to do so:

    card.retain(function(err) {
      // Error handling here
      // The card now has a method property, 
      // which contains metadata about
      // the payment method. It has a `retained`
      // property which is now set to true:
      console.log(card.method.retained); // => true
    });

When your user supplies you a new card, or simply wants you to remove their 
records, use the `redact()` method to have the card removed from the Samurai
vault.

    card.redact(function(err) {
       // The card.method.retained is still true, but
       // card.method.redacted is now also true.
    });

Generally, you should not keep using a redacted payment method, so make sure
you check if the `card.method.redacted` is `true`. Updating the card data is
usually more efficient using the `update()` method. While it _is_ more
effiicient, if you are using the transparent redirect method, you should 
redact the old card, and let the user enter a new one. Only use `update()` if 
you are using the server-to-server method.

Again, error messages are the same as ones for the `load` and `update`
methods.

### Making transactions

Transactions are made using the `samurai.Transaction` constructor and resulting
transaction objects.

There are currenly 5 transaction types supported by Samurai: 

 + _purchase_: make immediate authorization and capture of the funds
   (immediately debit the user's credit card)
 + _authorize_: instruct the bank to put a hold on specified amount (the funds
   are reserved, but you do not get the money until you capture)
 + _capture_: capture the funds that have been authorized
 + _void_: void a previously authorized transaction (this releases the hold on
   the funds)
 + _credit_: reverse the capture (return funds to the user's card in the amount
   that has been captured via _capture_ or _purchase_).

The transaction object constructor takes an object with transaction options, 
and the `type` option selects one of the transaction types. Depending on the
transaction type, other options may differ.

Transaction-specific data are specified in `data` property of the constructor
options object. The data to be passed via this parameter depends on the
transaction type, and they are discussed further below. The layout of the
options object looks like this:

    var transaction = new samurai.Transaction({
      type: 'purchase',
      data: {
        amount: 123.45,
        currency: 'USD',
        billingReference: 'AX-0002-13',
        customerReference: 'ab551f23',
        descriptor: 'Spiffy bike',
        custom: {originalDate: new Date('2011-06-12 UTC')}
      }
    });

#### Purchase and Authorize transactions

For purchase and authorize transactions, options other than `type` are the
following:

 + _amount_: The transaction amount
 + _currency_: Optional (defaults to the one set in your initial configuration)
 + _billingReference_
 + _customerReference_
 + _descriptor_: description of transaction that will appear in the user's bank
   statement (if supported by the bank)
 + _custom_: JSON-serializable object containing any data you want to attack to
   a transaction

#### Capture, Void, and Credit transactions

These transactions require none of the extra options required by the purchase
and authorize transactions. Instead they require a transaction ID (returned by
successful purchase/authorize transactions, see details further below).

 + _transactionId_

In addition, capture and credit take an `amount` option.

#### Transaction data locking

Transaction data cannot be modified after the transaction object is
initialized. This is done to prevent tampering by malicious code.

#### Processing transactions

Transaction constructor will not check if you have specified the appropriate
options depending on the type of tranasaction. You are expected to be mindful
about what options are passed.

Once you have created the transaction object, you will also need a card object
with a `token` (card has a token after creation, or after load). Card object is
not required for _credit_ and _void_ transactions. You may pass `null` instead
of the card object, or omit the first argument for those transactions.

Given a transaction object, you can now:

   transaction.process(card, function(err) {
     // Success!
   });

Once the transaction is completed, and there are no errors, the transaction
object will gain a `receipt` property which should contain data about the
transaction, including `transactionId`, and `success` property. The latter
tells you if the transaction was successful.

In addition, transaction object will contain a `messages` property, which will
contain more details about the transaction if it failed.

#### AVS status messages

AVS (Address Verification System) can return as many as 26 different messages.
If you simply want to know if the address was verified or not, you can check if
`transaction.messages.errors` object contains an `address` key:

    transaction.process(card, function(err) {
      if (transaction.messages.error && transaction.messages.error.address) {
        console.error('AVS check failed!');
      }
    });

In some cases, AVS will fail despite the card being valid. This is a common
case with non-US cards, or when the issuing bank doesn't support AVS. You can
test these conditions by checking the first character of the avs message:

    transaction.process(card, function(err) {
      var inf = transaction.messages.info || {};
      if (inf && inf.avs && ['G','E','S','U'].indexOf(inf.avs[0][0] > -1) {
        // Try updating the card by removing the address
        // (but not postal code!)
      } else if (inf && inf.avs) {
        // Transaction failed because of AVS
      }
    });

For more information on AVS, check the 
[Wikipedia aticle](http://en.wikipedia.org/wiki/Address_Verification_System).

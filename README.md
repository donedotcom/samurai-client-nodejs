# Samurai Node.js Integration Library

## Overview

samurai-client-nodejs is a client library for the 
[Samurai payment gateway](https://samurai.feefighters.com) from
[FeeFighters](http://feefighters.com/). By the time 1.0 release is made,
samurai-client-nodejs will support all of Samurai's API, but the current immediate goal is to
support the sale transactions and provide robust error reporting facilities.


## Installation

Easiest way to install samurai-client-nodejs is by using npm:

    npm install samurai-client-nodejs

That will install the latest release that we have made. Not that releases prior
to 0.1 are not considered production-ready. See the _Status_ section of this 
file to find out more about the current progress.

Since samurai-client-nodejs is currently still very beta, if you wish to get a newer version
with more features (please don't do this in production, though), you can add it
as a dependency to your packages.json like this:

    dependencies: {
       ....
      ,"samurai-client-nodejs": "https://github.com/FeeFighters/samurai-client-nodejs/tarball/master"
       ....
    }

Using the above method, it is also possible to address individual commits. Go
to GitHub, switch to a commit you want to depend on, click the download link,
and right-click the tarball button, copy URL, and paste it into your dependency
list like above.

Finally, you can clone the samurai-client-nodejs repository using git and install from the
cloned repository:
    
    git clone https://github.com/FeeFighters/samurai-client-nodejs.git
    cd /your/project/dir
    npm install /path/to/samurai-client-nodejs/clone

## Basic usage

    var samurai = require('samurai');

    // Configure samurai-client-nodejs
    samurai.configure({
      merchantKey: 'xxxxxxxxxxxxxxxxxxxxxxxx',
      processorToken: 'xxxxxxxxxxxxxxxxxxxxxxxx',
      merchantPassword: 'xxxxxxxxxxxxxxxxxxxxxxxx',
      currency: 'USD', // default
      debug: false, // default, should stay off in production at all costs
      enabled: true, // default
      sandbox: false // default
    });

    // Using transparent redirect with Express
    app.get('/redirect_target', function(req, res, next) {
        var token = req.param('payment_method_token');
        var card = samurai.Card({token: token});

        // Create a new transaction
        var transactionData = {
            amount: 100,
            billingReference: 'my billing ref #',
            customerReference: "user's customer ref #',
            type: 'purchase'
        }

        // Process the transaction using the card object
        transaction.process(card, function(err) {

           if (err) {
             // Handle error and return error page
             res.render('sorry', {});
             return;
           }

           if (!transaction.messages.info || 
               transaction.messages.info[0] === 'success') {
             // The transaction was not successful
             res.render('sorry, {messages: transaction.messages});
             return;
           }

           // Ah, finally! All ur moneys are belong to us!
           res.render('kthxbye', {});

           // Don't forget to Email receipt!
           emailReceipt({
             issuer: card.issuer,
             cardNo: '****-****-****-' + card.last4, 
             date: transaction.receipt.createdAt,
             amount: transaction.receipt.amount
           });
        });
    });

## Using the ``check`` as AMD module in browsers

The `lib/check.js`` module contains generic functions for performing various
checks on credit cards. It performs Luhn Mod-10 check to ensure that the card
number is valid (although the card itself may not be valid), get the name of
the issuer, or make sure that the CSC (also called CVV, CVC, or CCV) has the
right number of digits, etc. It is always a good idea to perform this check
browser-side to ensure that obviously invalid cards do not make it to the
system, or that any typing errors are caught early on.

This module can be used in browsers with minimal modifications. For
convenience, the ``checkamd`` target is provided in the makefile, which builds
an AMD module compatible with loaders like [RequireJS](http://requirejs.org/).

To build the AMD version of check, simply type:

    make checkamd

This will result in creation of a new file called ``check.js`` in the project
directory. The file is not minified. If you want to minify it, you can use
tools such as [UglifyJS](https://github.com/mishoo/UglifyJS).

To use it, simply require it from your module as usual:

    // mymodule.js
    define(['jquery', 'check'], function($, check) {
        var cardNumber = $('input[name=card]).val();
        var csc = $('input[name=csc]').val();
        
        var isVaild = check.mod10check(cardNumber) ? true : false;
        var isValid = isValid && check.cscCheck(cardNumber, csc) ? true : false
        
        var issuer = check.getIssuer(cardNumber);
        alert('Your card was issued by ' + issuer);
    });

You can find more details on this module in the 
[API documentation](https://samurai.feefighters.com/developers/api-nodejs/).

## API documentation

The API documentation can be found at 
[samurai.feefighters.com/developers/api-nodejs/](https://samurai.feefighters.com/developers/api-nodejs/). 
You can generate the documentation for offline use using the provided makefile.
See _Offline documentation_ section for instructions.

## Offline documentation

You can generate offline documentation for samurai-client-nodejs using the
[dox](https://github.com/visionmedia/dox/) utility from Visionmedia. Install
dox by typing:

    sudo npm install dox -g

Now you can simpy type ``make docs`` in the project directory. The
documentation will be generated in a newly created ``docs`` directory. To
remove the documentation, just type ``make clean``.

## Running unit tests

To run unit tests you need [Expresso](https://github.com/visionmedia/expresso),
and [should.js](https://github.com/visionmedia/should.js). You also need to
create a file called `test/config.js`, and add your keys there:

    exports.merchantKey = 'xxxxxxxxxxxxxxxxxxxxxxxx';
    exports.merchantPassword = 'xxxxxxxxxxxxxxxxxxxxxxxx';
    exports.processorToken = 'xxxxxxxxxxxxxxxxxxxxxxxx';

The tests are run simply by simply typing `make` in the project directory.
Alternatively, you can type:

    node_modules/.bin/expresso test/*.tests.js

Do not run tests with your live processor. Make sure you are running in a
sandbox.

## Reporting bugs

You may use the [issue tracker](https://github.com/FeeFighters/samurai-client-nodejs/issues) to
report samurai-client-nodejs bugs you find.

Originally created at [Herd Hound](http://www.herdhound.com/) by Branko Vukelic <branko@herdhound.com>.
Copyright (c)2011, by FeeFighters <samurai@feefighters.com>.

Licensed under MIT license (see
[LICENSE](https://github.com/FeeFighters/samurai-client-nodejs/blob/master/LICENSE))

/**
 * # messages
 *
 * Copyright (c)2011, by FeeFighters <samurai@feefighters.com>
 *
 * Translation of various gateway error messages to human-readable format.
 *
 * All error messages generated by Samurai gateway are translated using the
 * `messages.translateAll` and `messages.translate` methods. The former 
 * translates all messages returned by `authpost.makeRequest` method, and the
 * latter translates individual messages.
 *
 * In either case, what we end up with is a mapping between fields and 
 * messages. Depending on what you are trying to do, the fields can be card
 * data fields, transaction details fields, or virtual fields such as 
 * 'gateway', or 'bank'.
 *
 * @author FeeFighters <samurai@feefighters.com>
 * @license MIT (see LICENSE)
 */

var msg = exports;

/**
 * #messages.str
 * *Individual localized strings*
 * @private
 */
msg.str = {};
msg.str.en_US = {
  SYSTEM_ERROR: 'There was a system error',
  INVALID_NUMBER: 'Card number is invalid',
  INVALID_CSC: 'Card security code is invalid',
  INVALID_ADDRESS: 'Cardholder address is invalid',

  // AVS CODES
  // (see http://en.wikipedia.org/wiki/Address_Verification_System)
  //
  // The error messages for different codes have been merged for convenience 
  // in cases where it makes sense. See comments next to each message for
  // codes that message applies to in Samurai.
  //
  BADZIP: 'Zip/postal code is invalid', // A, B
  BADADRZIP: 'Address and zip/postal code are invalid', // C, K, N
  GOOD: 'Address is valid', // D, M, J, Q, V, X, Y
  BADMEMBER: "Card member's name is invalid", // F, H, T
  NOAVS: 'AVS is not supported or bad AVS data', // E, G, S, U
  BADADR: 'Address is invalid', // L, W, Z
  NOSYS: 'System unavailable', // R

  SUCCESS: 'Success',
  DECLINED: 'Declined',
  NOTSETTLED: 'Could not credit unsettled transaction.'
};

/**
 * #getStr(key)
 * *Returns a function that yields the localized string for given key*
 *
 * @param {String} key
 * @param {String} prefix
 * @returns {Function} Returns a translation function that accepts lang argument
 * @private
 */
function getStr(key, prefix) {
  prefix = prefix && prefix + ': ' || '';
  return function(lang) {
    return prefix + msg.str[lang][key];
  };
}

/**
 * #messages.mappings
 * *Maps Samurai error messages to human-readable strings*
 *
 * This mapping maps class, context, and key to an object that contains the 
 * Daimyp field name, and translation function which returns the human-readable 
 * string given a language code.
 *
 * @private
 */
msg.mappings = {
  error: {
    'system.general': {
      'default': ['system', getStr('SYSTEM_ERROR')]
    },
    'input.card_number': {
      too_short: ['number', getStr('INVALID_NUMBER')],
      too_long: ['number', getStr('INVALID_NUMBER')],
      failed_checksum: ['number', getStr('INVALID_NUMBER')]
    },
    'input.cvv': {
      too_long: ['csc', getStr('INVALID_CSC')],
      too_short: ['csc', getStr('INVALID_CSC')]
    },
    'input.address': {
      invalid: ['address', getStr('INVALID_ADDRESS')]
    },
    'processor.transaction': {
      declined: ['transaction', getStr('DECLINED')]
    }
  },
  info: {
    'processor.transaction': {
      'success': ['transaction', getStr('SUCCESS')],
      'credit_criteria_invalid': ['transaction', getStr('NOTSETTLED')]
    },
    'processor.avs_result_code': {
      A: ['avs', getStr('BADZIP', 'A')],
      B: ['avs', getStr('BADZIP', 'B')],
      C: ['avs', getStr('BADADRZIP', 'C')],
      D: ['avs', getStr('GOOD', 'D')],
      E: ['avs', getStr('NOAVS', 'E')],
      F: ['avs', getStr('BADMEMBER', 'F')],
      G: ['avs', getStr('NOAVS', 'G')],
      H: ['avs', getStr('BADMEMBER', 'H')],
      I: ['avs', getStr('BADZIP', 'I')],
      J: ['avs', getStr('GOOD', 'J')],
      K: ['avs', getStr('BADADRZIP', 'K')],
      L: ['avs', getStr('BADADR', 'L')],
      M: ['avs', getStr('GOOD', 'M')],
      N: ['avs', getStr('BADADRZIP', 'N')],
      O: ['avs', getStr('BADZIP', 'O')],
      P: ['avs', getStr('BADADR', 'P')],
      Q: ['avs', getStr('GOOD', 'Q')],
      R: ['avs', getStr('NOSYS', 'R')],
      S: ['avs', getStr('NOAVS', 'S')],
      T: ['avs', getStr('BADMEMBER', 'T')],
      U: ['avs', getStr('NOAVS', 'U')],
      V: ['avs', getStr('GOOD', 'V')],
      W: ['avs', getStr('BADADR', 'W')],
      X: ['avs', getStr('GOOD', 'X')],
      Y: ['avs', getStr('GOOD', 'Y')],
      Z: ['avs', getStr('BADADR', 'Z')]
    }
  }
};

/**
 * #messages.translate(message, lang)
 * *Returns a human readable string in given language*
 *
 * The return value is an object that maps a Samurai field name to 
 * human-readable translation. The field name can be a virtual field like 
 * 'system' or 'gateway', which indicates the error pretains to components of 
 * payment processing workflow, rather than a field.
 *
 * @param {Object} message Message object to be translated
 * @param {String} [lang] Optional language code (defaults to `en_US`)
 * @returns {Object} Object containing the field name, and human readable string
 */
msg.translate = function(message, lang) {
  try {
    var mapping = msg.mappings[message.cls][message.context][message.key];
    lang = lang || 'en_US';
    return {
      field: mapping[0],
      message: mapping[1](lang)
    };
  } catch(e) {
    // We have an unknown message
    return {
      field: 'unknown',
      message: message.cls + ':' + message.context + ':' + message.key
    };
  }
};

/**
 * #messages.translateAll(messages, lang)
 * *Translate multiple messages, and return a single field-message mapping*
 *
 * @param {Array} messages Array of message objects
 * @param {String} [lang] Optional language code (defaults to `en_US`);
 * @returns {Object} Object containing the field names, and human readable strings
 */
msg.translateAll = function(messages, lang) {
  var errors = messages.filter(function(item) {
    return item.cls === 'error';
  });
  var info = messages.filter(function(item) {
    return item.cls === 'info';
  });
  function build(msgs) {
    var translations = {};
    msgs.forEach(function(message) {
      translation = msg.translate(message, lang);
      if (translations.hasOwnProperty(translation.field) && 
          translations[translation.field].indexOf(translation.message) < 0) {
        translations[translation.field].push(translation.message);
      } else {
        translations[translation.field] = [translation.message];
      }
    });
    return translations;
  }
  return {
    errors: build(errors),
    info: build(info)
  };
};

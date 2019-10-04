import Ember from 'ember';
import Transform from './base';
import moment from "moment";
// Date.prototype.toISOString shim
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
var toISOString = Date.prototype.toISOString || function() {
  function pad(number) {
    if ( number < 10 ) {
      return '0' + number;
    }
    return number;
  }

  return this.getUTCFullYear() +
    '-' + pad( this.getUTCMonth() + 1 ) +
    '-' + pad( this.getUTCDate() ) +
    'T' + pad( this.getUTCHours() ) +
    ':' + pad( this.getUTCMinutes() ) +
    ':' + pad( this.getUTCSeconds() ) +
    '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
    'Z';
};

if (Ember.SHIM_ES5) {
  if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = toISOString;
  }
}

export default Transform.extend({
  deserialize: function(serialized) {
    var type = typeof serialized;
    if (type === 'string' || type === 'number') {
        return moment(serialized);
    } else if (serialized === null || serialized === undefined) {
      // if the value is not present in the data,
      // return undefined, not null.
      return serialized;
    } else {
      return null;
    }
  },

  serialize: function(date) {
    if (date instanceof moment) {
      return date.format();
    } else {
      return null;
    }
  }
});

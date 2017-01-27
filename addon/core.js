/**
  @module ember-restless
*/
import Ember from 'ember';
var libraries = Ember.libraries;
var VERSION = '@@version';

/**
  @class RESTless
  @static
*/
var RESTless = Ember.Namespace.create({
  VERSION: VERSION
});

if (libraries) { 
  libraries.register('Ember RESTless', VERSION);
}

export default RESTless;
import Ember from 'ember';
import RESTAdapter from 'ember-restless/adapters/rest-adapter';
/**
 The Client is the top level store, housing the default adapter and configurations.
 The client will be automatically detected and set from your App namespace.
 Setting a client is optional and will automatically use a base client.

 @class Client
 @namespace RESTless
 @extends Ember.Object
 */
var Client = Ember.Object.extend({
  /**
   The default adapter for all models.
   @property adapter
   @type RESTless.Adapter
   */
  adapter: RESTAdapter.create()
});

export default Client;

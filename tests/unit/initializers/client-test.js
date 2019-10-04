import Ember from 'ember';
import RESTless from 'ember-restless/core';
import Client from 'ember-restless/ext/client';
import {initialize} from 'dummy/initializers/client';
import {module, test} from 'qunit';
import destroyApp from '../../helpers/destroy-app';

module('Unit | Initializer | client', {
  beforeEach() {
    Ember.run(() => {
      this.application = Ember.Application.create();
      this.application.deferReadiness();
    });
    initialize(this.application.registry, this.application);
  },
  afterEach() {
    destroyApp(this.application);
  }
});

test('creating a client is optional', function (assert) {
  assert.ok(Ember.get(RESTless, 'client'), 'falls back to base client');
});

test('a client can be created', function (assert) {
  var client = Client.create();
  assert.ok(client, 'a client exists');
});

test('defining a custom client becomes the default client', function (assert) {
  var client = Client.create();
  RESTless.set('client', client);
  assert.equal(Ember.get(RESTless, 'client'), client, 'custom client becomes default');
});

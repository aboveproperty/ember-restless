import {moduleFor, test} from 'ember-qunit';
import Ember from 'ember';
import Adapter from 'ember-restless/adapters/adapter';
import RESTless from 'ember-restless/core';
import Model from 'ember-restless/model/model';
import { initialize } from 'dummy/initializers/client';
import {attr} from 'ember-restless/model/attribute';


let application, registry;
var Post;
var get = Ember.get, run = Ember.run;
import destroyApp from '../../helpers/destroy-app';

moduleFor('adapter:adapter', 'Unit | Adapter | adapter', {
  beforeEach(){
    run(function () {
      application = Ember.Application.create();
      registry = application.registry;
      application.deferReadiness();

      Post = Model.extend({
        //klassName: 'post',
        slug: attr('string'),
        title: attr('string'),
        body: attr('string'),
        createdAt: attr('date')
      }).reopenClass({
        resourceName: 'post'
      });
    });
    initialize(registry, application);
  },
  afterEach() {
    destroyApp(application);
  }

});


test('an adapter can be created', function (assert) {
  var adapter = Adapter.create();
  assert.ok(adapter, 'an adapter exists');
});

test('an adapter is optional with a custom client', function (assert) {
  var client = RESTless.Client.create();
  assert.ok(client.get('adapter'), 'falls back to base adapter');
  assert.ok(get(RESTless, 'client.adapter'), 'default client has base adapter');
});

test('can change primary key for model property', function (assert) {
  RESTless.get('client.adapter').map('post', {
    primaryKey: 'slug'
  });

  assert.equal(get(RESTless, 'client.adapter.configurations.models').get('post').primaryKey, 'slug', 'primary key was changed');
  assert.equal(get(Post, 'adapter.configurations.models').get('post').primaryKey, 'slug', 'primary key was changed');
  assert.equal(get(Post, 'primaryKey'), 'slug', 'primaryKey property updated');
});

test('can set custom model property key', function (assert) {
  RESTless.get('client.adapter').map('post', {
    body: {key: 'bodyHtml'}
  });
  assert.equal(get(Post, 'adapter.configurations.models').get('post').propertyKeys.bodyHtml, 'body', 'model property key was changed');
});

test('can set multiple configurations at once and can overwrite configurations', function (assert) {
  RESTless.get('client.adapter').map('post', {
    primaryKey: 'title',
    body: {key: 'bodyContent'}
  });
  assert.equal(get(Post, 'adapter.configurations.models').get('post').primaryKey, 'title', 'primary key was changed');
  assert.equal(get(Post, 'adapter.configurations.models').get('post').propertyKeys.bodyContent, 'body', 'model property key was changed');
});

test('support deprecated map using global namespace', function (assert) {
  RESTless.get('client.adapter').map('Post', {
    primaryKey: 'slug'
  });
  assert.equal(get(Post, 'adapter.configurations.models').get('post').primaryKey, 'slug', 'primary key was changed');
  assert.equal(get(Post, 'primaryKey'), 'slug', 'primaryKey property updated');
});

test('can set custom plurals', function (assert) {
  RESTless.get('client.adapter').configure('plurals', {
    person: 'people'
  });
  RESTless.get('client.adapter').configure('plurals', {
    nothing: 'something',
    another: 'to_test'
  });
  assert.equal(get(RESTless, 'client.adapter.configurations.plurals').person, 'people', 'plural set and not overwritten');
});

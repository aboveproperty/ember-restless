import Ember from 'ember';
import RESTless from 'ember-restless';
import RESTAdapter from 'ember-restless/adapters/rest-adapter';
import Model from 'ember-restless/model/model';
import {attr, hasMany, belongsTo} from 'ember-restless/model/attribute';
import {moduleFor, test} from 'ember-qunit';

let application, registry;
var Post, PostGroup, Person, Comment, Like;
var get = Ember.get;

moduleFor('adapter:rest-adapter', 'Unit | Adapter | rest adapter', {
  beforeEach(){
    Ember.run(function () {
      application = Ember.Application.create();
      registry = application.registry;
      application.deferReadiness();

      PostGroup = Model.extend({}).reopenClass({
        resourceName: 'postGroup'
      });

      Post = Model.extend({
        //klassName: 'post',
        slug: attr('string'),
        title: attr('string'),
        body: attr('string'),
        createdAt: attr('date')
      }).reopenClass({
        resourceName: 'post'
      });

      Person = Model.extend({
        slug: attr('string'),
        name: attr('string'),
        role: attr('number')
      }).reopenClass({
        resourceName: 'person'
      });

      Comment = Model.extend({
        text: attr('string'),
        post: belongsTo(Post),
        author: belongsTo(Person),
        likes: hasMany(Like)
      }).reopenClass({
        resourceName: 'comment'
      });
    });
  }
});


test('can set a host', function (assert) {
  var adapter = RESTAdapter.create({
    host: 'http://api.com'
  });
  assert.ok(adapter.get('rootPath').length, 'host applied to root path');
  assert.equal(adapter.get('rootPath'), 'http://api.com', 'root path is valid');
});

test('can set a namespace', function (assert) {
  var adapter = RESTAdapter.create({
    namespace: 'v1'
  });
  assert.ok(adapter.get('rootPath').length, 'namespace applied to root path');
});

test('can set a namespace with host', function (assert) {
  var adapter = RESTAdapter.create({
    host: 'http://api.com/',
    namespace: '/v1'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com/v1', 'root path is valid');
});

test('various combinations of setting a namespace and/or host is resilient', function (assert) {
  var adapter = RESTAdapter.create();
  assert.equal(adapter.get('rootPath'), '', 'default path is blank');

  adapter = RESTAdapter.create({
    host: '/'
  });
  assert.equal(adapter.get('rootPath'), '', 'slash host converted to blank. (slash is added when building full urls)');

  adapter = RESTAdapter.create({
    namespace: 'v1/'
  });
  assert.equal(adapter.get('rootPath'), '/v1', 'works with just a namespace and transforms to correct format');

  adapter = RESTAdapter.create({
    host: 'http://api.com/'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com', 'removes trailing slash');

  adapter = RESTAdapter.create({
    host: 'http://api.com'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com', 'stays intact');

  adapter = RESTAdapter.create({
    host: 'http://api.com',
    namespace: 'v1'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com/v1', 'joins namespace with single slash');

  adapter = RESTAdapter.create({
    host: 'http://api.com/',
    namespace: 'v1'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com/v1', 'joins namespace with single slash');

  adapter = RESTAdapter.create({
    host: 'http://api.com',
    namespace: '/v1'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com/v1', 'joins namespace with single slash');

  adapter = RESTAdapter.create({
    host: 'http://api.com/',
    namespace: '/v1'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com/v1', 'joins namespace with single slash');

  adapter = RESTAdapter.create({
    host: 'http://api.com/',
    namespace: '/v1/'
  });
  assert.equal(adapter.get('rootPath'), 'http://api.com/v1', 'removes trailing slash with namespace');
});

test('creates valid path for multi-word model classes', function (assert) {
  var adapter = RESTAdapter.create(),
    resourceName = get(PostGroup, 'resourceName');
  assert.equal(adapter.resourcePath(resourceName), 'post_groups', 'resource path is valid');
});

test('can optionally add query params to a findByKey request', function (assert) {
  var oldJQueryAjax = Ember.$.ajax, ajaxHash;
  Ember.$.ajax = function (hash) {
    ajaxHash = hash;
  };

  Comment.find({id: 1, some_param: 'test'});
  assert.equal(ajaxHash.url, '/comments/1', 'findByKey with parameters requests expected url');
  assert.equal(JSON.stringify(ajaxHash.data), JSON.stringify({some_param: 'test'}), 'findByKey with parameters requests expected query params');

  Ember.$.ajax = oldJQueryAjax;
});

test('allows using content type extension', function (assert) {
  var oldJQueryAjax = Ember.$.ajax, ajaxHash;
  Ember.$.ajax = function (hash) {
    ajaxHash = hash;
  };

  var adapter = RESTAdapter.create({
    useContentTypeExtension: true
  });

  RESTless.set('client.adapter', adapter);

  Post.find();
  assert.equal(ajaxHash.url, '/posts.json', 'extension added');

  Post.find(5);
  assert.equal(ajaxHash.url, '/posts/5.json', 'extension added to key');

  Ember.$.ajax = oldJQueryAjax;
});

test('can optionally add headers to ajax requests', function (assert) {
  var oldJQueryAjax = Ember.$.ajax, ajaxHash;
  Ember.$.ajax = function (hash) {
    ajaxHash = hash;
  };

  var adapter = RESTAdapter.create({
    headers: {'X-API-KEY': 'abc1234'}
  });

  RESTless.set('client.adapter', adapter);


  Person.find();
  assert.equal(ajaxHash.headers['X-API-KEY'], 'abc1234', 'headers added correctly');

  Ember.$.ajax = oldJQueryAjax;
});

test('can optionally add default parameters to ajax requests', function (assert) {
  var oldJQueryAjax = Ember.$.ajax, ajaxHash;
  Ember.$.ajax = function (hash) {
    ajaxHash = hash;
  };

  var defaultData = {api_key: 'abc1234'}, mergedData;
  var adapter = RESTAdapter.create({
    defaultData: defaultData
  });

  RESTless.set('client.adapter', adapter);

  Person.find(1);
  assert.equal(JSON.stringify(ajaxHash.data), JSON.stringify(defaultData), 'default data added');

  Person.find({id: 1, some_param: 'test'});
  mergedData = $.extend({}, defaultData, {some_param: 'test'});
  assert.equal(JSON.stringify(ajaxHash.data), JSON.stringify(mergedData), 'default data merges with other params');

  adapter.defaultData = defaultData = {api_key: 'abc1234', some_param: 'foo'};

  Person.find(1);
  assert.equal(JSON.stringify(ajaxHash.data), JSON.stringify(defaultData), 'supports multiple default data properties');

  Person.find({id: 1, some_param: 'test'});
  assert.equal(JSON.stringify(ajaxHash.data), JSON.stringify({
    api_key: 'abc1234',
    some_param: 'test'
  }), 'query data has precedence over defaultData');

  Person.find(1);
  assert.equal(JSON.stringify(ajaxHash.data), JSON.stringify(defaultData), 'default data should not be modified by prior queries');

  Ember.$.ajax = oldJQueryAjax;
});


import Ember from 'ember';
import RESTless from 'ember-restless';
import Model from 'ember-restless/model/model';
import JSONSerializer from 'ember-restless/serializers/json-serializer';
import {initialize} from 'ember-restless/initializers/client';
import {attr, hasMany, belongsTo} from 'ember-restless/model/attribute';
import {module, test} from 'qunit';

import destroyApp from '../../helpers/destroy-app';

var Post, PostGroup, Tag, Person, Comment;

module('Unit | Serializers | json serializer', {
  beforeEach(){
    Ember.run(()=> {
      this.application = Ember.Application.create();
      this.application.deferReadiness();

      Tag = Model.extend({
        name: attr('string')
      }).reopenClass({
        resourceName: 'tag'
      });
      Post = Model.extend({
        slug: attr('string'),
        title: attr('string'),
        body: attr('string'),
        // tags: hasMany(Tag),
        createdAt: attr('date')
      }).reopenClass({
        resourceName: 'post'
      });
      PostGroup = Model.extend({
        featured: hasMany(Post),
        popular: hasMany(Post, {readOnly: true})
      }).reopenClass({
        resourceName: 'post_group'
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
        // likes: hasMany(Like)
      }).reopenClass({
        resourceName: 'comment'
      });
    });
    this.application.register('model:post', Post);
    this.application.register('model:post_group', PostGroup);
    this.application.register('model:tag', Tag);
    initialize(this.application.registry, this.application);
  },
  afterEach() {
    destroyApp(this.application);
  }

});


test('a json serialzer can be created', function (assert) {
  var serialzer = JSONSerializer.create();
  assert.ok(serialzer, 'an serialzer exists');
});

test('creates valid property names for multi-word model classes', function (assert) {
  var postGroup = PostGroup.create(),
    testJson = {post_group: {popular: [{title: 'Test post'}]}};

  postGroup.deserialize(testJson);
  assert.equal(1, postGroup.get('popular.length'), 'data deserialized');
});

test('resource key lookups', function (assert) {
  var serialzer = JSONSerializer.create(),
    post = Post.create(),
    postGroup = PostGroup.create();

  RESTless.get('client.adapter').configure("plurals", {
    client_address: "client_addresses"
  });

  assert.equal(serialzer.keyForResourceName('Post'), 'post', 'key correct');
  assert.equal(serialzer.keyForResourceName('PostGroup'), 'post_group', 'key correct');

  assert.equal(serialzer._keyForResource(post), 'post', 'key correct');
  assert.equal(serialzer._keyForResource(postGroup), 'post_group', 'key correct');

  assert.equal(serialzer._keyForResourceType('Post'), 'post', 'key correct');
  assert.equal(serialzer._keyForResourceType('PostGroup'), 'post_group', 'key correct');

  assert.equal(serialzer._keyPluralForResourceType('Post'), 'posts', 'key correct');
  assert.equal(serialzer._keyPluralForResourceType('PostGroup'), 'post_groups', 'key correct');

  assert.equal(serialzer.keyForAttributeName('profile'), 'profile', 'key correct');
  assert.equal(serialzer.keyForAttributeName('createdAt'), 'created_at', 'key correct');

  assert.equal(serialzer.attributeNameForKey(post, 'title'), 'title', 'key correct');
  assert.equal(serialzer.attributeNameForKey(post, 'created_at'), 'createdAt', 'key correct');
});

test('null belongsTo relationship values do not create empty models', function (assert) {
  var comment = Comment.create(),
    testJson = {comment: {id: 1, text: 'hello', post: null}};

  comment.deserialize(testJson);

  assert.equal('hello', comment.get('text'));
  assert.equal(null, comment.get('post'));
  assert.equal(null, comment.get('author'));
});

test('deserializing into an existing record array triggers isLoaded observer', function (assert) {
  var serializer = JSONSerializer.create(),
    testJson = [{name: 'tag1'}, {name: 'tag2'}],
    arr = Tag.loadMany(testJson);

  serializer.deserializeMany(arr, 'Tag', testJson);
  arr.forEach(function (item) {
    assert.equal(item.get('isLoaded'), true);
  });
});

test('deserializing resets state', function (assert) {
  var data = {
    id: 1,
    featured: [{id: 1, title: 'hello'}]
  };

  var postGroup = PostGroup.load(data);

  // dirty a relationship
  postGroup.get('featured').objectAt(0).set('title', 'goodbye');
  assert.ok(postGroup.get('featured.isDirty'), 'relationship was dirtied');
  assert.ok(postGroup.get('isDirty'), 'parent was dirtied');

  postGroup.deserialize(data);
  assert.ok(!postGroup.get('featured.isDirty'), 'relationship is clean after deserialize');
  assert.ok(!postGroup.get('isDirty'), 'is clean after deserialize');
});

test('can optionally include belongsTo properties when serializing', function (assert) {
  var model = Comment.load({author: {name: 'Garth'}}),
    serialized = model.serialize({includeRelationships: true});

  assert.equal(serialized.comment.author.name, 'Garth', 'belongsTo property serialized');
});

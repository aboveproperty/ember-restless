import Ember from 'ember';
import RESTless from 'ember-restless';
import RESTAdapter from 'ember-restless/adapters/rest-adapter';
import Model from 'ember-restless/model/model';
import {initialize} from 'ember-restless/initializers/client';
import {attr, hasMany, belongsTo} from 'ember-restless/model/attribute';
import {module, test} from 'qunit';
import destroyApp from '../../helpers/destroy-app';
let application, registry;
var run = Ember.run;
var Post, Tag, PostGroup, Person, Comment, Like, ClientAddress, Product;

module('Unit | Model | model', {
  beforeEach(){
    run(function () {

      application = Ember.Application.create();
      registry = application.registry;
      application.deferReadiness();

      Tag = Model.extend({
        name: attr('string')
      }).reopenClass({
        resourceName: 'tag'
      });

      Post = Model.extend({
        slug: attr('string'),
        title: attr('string'),
        body: attr('string'),
        tags: hasMany(Tag),
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
        likes: hasMany(Like)
      }).reopenClass({
        resourceName: 'comment'
      });

      Like = Model.extend({
        username: attr('string')
      }).reopenClass({
        resourceName: 'like'
      });

      ClientAddress = Model.extend({
      }).reopenClass({
        resourceName: 'client_address'
      });

      Product = Model.extend({
        name: attr(),
        rating: attr(),
        available: attr(),
        createdAt: attr(),
        seller: belongsTo(Person)
      }).reopenClass({
        resourceName: 'product'
      });

      Person.FIXTURES = [
        {id: 1, name: 'Garth', role: 3},
        {id: 2, name: 'Tyler', role: 3},
        {id: 3, name: 'Beth', role: 1}
      ];

    });

    initialize(registry, application);
    RESTless.get('client.adapter').map('post', {
      primaryKey: 'id'
    });
  },
  afterEach() {
    destroyApp(application);
  }

});

test('attribute type is optional', function(assert) {
  var json = {
    id: 1,
    name: 'Spoon',
    rating: 5,
    available: false,
    createdAt: '2013-06-11T00:42:17+00:00'
  };
  var product = Product.load(json);
  assert.equal( product.get('name'), json.name );
  assert.equal( product.get('rating'), json.rating );
  assert.equal( product.get('available'), json.available );
  assert.equal( product.get('createdAt'), json.createdAt );
});

test('relationship attributes can be defined by string or object reference', function(assert) {
  var name = 'Garth';
  // see setup.js where the attributes are defined by string or reference for these types
  var comment = Comment.load({ author: { name: name } });
  var product = Product.load({ seller: { name: name } });
  assert.equal ( comment.get('author.name'), name, 'looked up by string' );
  assert.equal ( product.get('seller.name'), name, 'looked up by reference' );
});

test('no longer new once a primary key is assigned', function(assert) {
  var _postX = Post.create();

  assert.ok( _postX.get('isNew'), 'new models are new' );
  _postX.set('id', 1);
  assert.ok( !_postX.get('isNew'), 'models with a primary key are not new' );
});

test('not new when creating with a primary id', function(assert) {
  var _post = Post.create({
    id: 1
  });
  assert.ok( !_post.get('isNew'), 'models with a primary key are not new' );

  var post2 = Post.load({
    id: 1
  });
  assert.ok( !post2.get('isNew'), 'models with a primary key are not new' );
});

test('new models are not dirty', function(assert) {
  var post = Post.create();
  assert.ok( !post.get('isDirty'), 'new models are not dirty' );

  var post2 = Post.create({ title: 'Title' });
  assert.ok( !post2.get('isDirty'), 'new models with properties are not dirty' );
});

test('becomes dirty when changing a value', function(assert) {
  var post = Post.create();

  assert.ok( !post.get('isDirty'), 'new models are not dirty' );
  post.set('title', 'Hello ember!');
  assert.ok( post.get('isDirty'), 'changed models are dirty' );
});

test('use load to set data doesn\'t make it dirty', function(assert) {
  var post = Post.load({
    title: 'Title'
  });
  assert.ok( !post.get('isDirty'), 'model is not dirty' );
});

test('becomes dirty when a relationship becomes dirty', function(assert) {
  var postGroup = PostGroup.load({
    id: 1,
    featured: [ { id: 1, title: 'hello' } ]
  });

  assert.ok( !postGroup.get('isDirty'), 'freshly loaded model is not dirty' );

  postGroup.get('featured').objectAt(0).set('title', 'world');

  assert.ok( postGroup.get('isDirty'), 'dirtying a relationship dirties the parent' );
});

test('becomes dirty when a nested relationship becomes dirty', function(assert) {
  var postGroup = PostGroup.load({
    id: 2,
    featured: [ { id: 1, title: 'hello', tags: [ { name: 'tag1' }, { name: 'tag2' } ] } ]
  });

  assert.ok( !postGroup.get('isDirty'), 'freshly loaded model is not dirty' );

  postGroup.get('featured').objectAt(0).get('tags').objectAt(0).set('name', 'tagA');

  assert.ok( postGroup.get('isDirty'), 'dirtying a nested relationship dirties the root object' );
});

test('does not become dirty when a readOnly nested relationship becomes dirty', function(assert) {
  var postGroup = PostGroup.load({
    id: 3,
    popular: [ { id: 2, title: 'world', tags: [ { name: 'tag1' }, { name: 'tag2' } ] } ]
  });

  assert.ok( !postGroup.get('isDirty'), 'freshly loaded model is not dirty' );

  postGroup.get('popular.firstObject').get('tags.firstObject').set('name', 'tagB');

  assert.ok( !postGroup.get('isDirty'), 'dirtying a readOnly nested relationship did not dirty parent' );
});

test('attributes can have default values', function(assert) {
  var model = Model.extend({
    role: attr('string', { defaultValue: 'user' }),
    position: attr('number', { defaultValue: 1 })
  });
  var record = model.create({ position: 2 });

  assert.equal( record.get('role'), 'user', 'defaultValue was applied when no value' );
  assert.equal( record.get('position'), 2, 'defaultValue was not set when value exists' );
});


test('attributes can have a default value functions', function(assert) {
  var valueFunction = function() { return new Date(); };
  var _Model = Model.extend({
    createdAt: attr('date', { defaultValue: valueFunction })
  });
  var record = _Model.create();
  var createdAt = record.get('createdAt');
  assert.ok( createdAt, 'defaultValue function used when no value');
  assert.equal( record.get('createdAt'), createdAt, 'repeated calls return same value');
});


test('attributes with default value functions have correct context', function(assert) {
  var klass = Model.extend({
    postCount: attr('number', { defaultValue: function() { return this.get('posts.length'); } })
  });

  var record = klass.create({
    posts: [1, 2, 3]
  });

  var postCount = record.get('postCount');

  assert.equal( postCount, 3, "defaultValue context is correct" );
});


test('attributes and relationships provided on create are not overwritten', function(assert) {
  var post = Post.create({ title: 'A title' }),
    comment = Comment.create({ post: post, text: 'Some comment' });

  assert.equal( comment.get('post'), post, 'relationship provided on init is same object' );
  assert.equal( comment.get('post.title'), 'A title', 'related object not changed on init' );
});


test('loading raw representation', function(assert) {
  var comment = Comment.load({
    id: 1,
    text: 'This looks awesome!',
    post: {
      id: 10,
      title: 'A new data library'
    },
    likes: [
      { id: 122, username: 'gdub22' },
      { id: 123, username: 'nixme'  }
    ]
  });

  assert.equal( comment.get('id'), 1, 'loads model data' );
  assert.equal( comment.get('post.id'), 10, 'belongsTo data' );
  assert.equal( comment.get('likes.firstObject.id'), 122, 'hasMany data' );

  assert.ok( comment.get('isLoaded'),       'model is loaded' );
  assert.ok( !comment.get('isNew'),         'model is not new' );
  assert.ok( comment.get('likes.isLoaded'), 'hasMany child is loaded' );
  assert.ok( comment.get('post.isLoaded'),  'belongsTo is loaded' );
});


test('can set a different adapter per model', function(assert) {
  assert.equal( Ember.get(Comment, 'adapter'), Ember.get(RESTless, 'client.adapter'), 'defaults to client adapter' );

  var testAdapter = RESTAdapter.create({
    someProp: 'hi'
  });

  Comment.reopenClass({
    adapter: Ember.computed(function() {
      return testAdapter;
    }).property()
  });

  assert.equal( Ember.get(Comment, 'adapter'), testAdapter, 'adapter for model class changed' );
});


test('event hooks', function(assert) {
  assert.expect(6);
  Comment.reopen({
    didCreate: function () {
      assert.ok( 1, 'create event hook was invoked' );
    },
    didUpdate: function () {
      assert.ok( 1, 'update event hook was invoked' );
    },
    didLoad: function () {
      assert.ok( 1, 'load event hook was invoked by onSaved 2x and onLoaded' );
    },
    becameError: function () {
      assert.ok( 1, 'error event hook was invoked' );
    }
  });

  var comment = Comment.create();
  comment.onSaved(true);
  comment.onSaved(false);
  comment.onLoaded();
  comment.onError();
});


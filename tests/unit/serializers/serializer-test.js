import Ember from 'ember';
import Model from 'ember-restless/model/model';
import Serializer from 'ember-restless/serializers/serializer';
import {initialize} from 'ember-restless/initializers/client';
import {attr, hasMany, belongsTo} from 'ember-restless/model/attribute';
import {module, test} from 'qunit';

import destroyApp from '../../helpers/destroy-app';

var Post, PostGroup, Tag, Person, Comment;

module('Unit | Serializers | serializer', {
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
    this.application.register('model:person', Person);
    this.application.register('model:post_group', PostGroup);
    this.application.register('model:tag', Tag);
    initialize(this.application.registry, this.application);
  },
  afterEach() {
    destroyApp(this.application);
  }

});


test('a serialzer can be created', function(assert) {
  var serialzer = Serializer.create();
  assert.ok( serialzer, 'an serialzer exists' );
});

test('modelFor resolves various string and class references', function(assert) {
  var serializer = Serializer.create();

  var PersonModel = Person;
  assert.equal( serializer.modelFor('Person'), PersonModel, 'looks up global strings');
  assert.equal( serializer.modelFor(Person), PersonModel, 'direct references pass through');
  assert.equal( serializer.modelFor('person'), PersonModel, 'looks up container strings');
  //
  var PostGroupModel = PostGroup;
  assert.equal( serializer.modelFor('post-group'), PostGroupModel, 'container looks up dashed names');
  assert.equal( serializer.modelFor('postGroup'), PostGroupModel, 'container looks up camelized names');
});


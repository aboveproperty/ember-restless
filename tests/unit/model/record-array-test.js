import Ember from 'ember';
import Model from 'ember-restless/model/model';
import RecordArray from 'ember-restless/model/record-array';
import {initialize} from 'ember-restless/initializers/client';
import {attr} from 'ember-restless/model/attribute';
import {module, test} from 'qunit';

import destroyApp from '../../helpers/destroy-app';

var Tag;

module('Unit | Model | Record array', {
  beforeEach(){
    Ember.run(()=> {
      this.application = Ember.Application.create();
      this.application.deferReadiness();
      Tag = Model.extend({
        name: attr('string')
      }).reopenClass({
        resourceName: 'tag'
      });

    });
    this.application.register('model:tag', Tag);
    initialize(this.application.registry, this.application);
  },
  afterEach() {
    destroyApp(this.application);
  }
});


test('new record arrays are not dirty', function (assert) {
  var arr = RecordArray.create();
  assert.ok(!arr.get('isDirty'), 'new record arrays are not dirty');

  var arr2 = RecordArray.createWithContent();
  assert.ok(!arr2.get('isDirty'), 'new record arrays created with content are not dirty');

  var arr3 = RecordArray.createWithContent([1, 2, 3]);
  assert.ok(!arr3.get('isDirty'), 'new record arrays created with content are not dirty');

  var arr4 = Tag.loadMany([{name: 'tag1'}, {name: 'tag2'}]);
  assert.ok(!arr4.get('isDirty'), 'new record arrays created with loadMany are not dirty');
});

test('loadMany', function (assert) {
  var arr = Tag.loadMany([{name: 'tag1'}, {name: 'tag2'}]);
  assert.equal(arr.get('length'), 2, 'loadMany models');
});

test('serializeMany', function (assert) {
  var data = [{id: 1}, {id: 2}];
  var recordArr = Tag.loadMany(data);
  var serialized = recordArr.serializeMany('Tag');
  assert.deepEqual(data, serialized, 'RecordArray serialized. provided type');

  recordArr = Tag.loadMany(data);
  serialized = recordArr.serializeMany();
  assert.deepEqual(data, serialized, 'RecordArray serialized. auto type');

  // recordArr = Model.loadMany(data);
  // serialized = recordArr.serializeMany();
  // assert.deepEqual(data, serialized, 'RecordArray serialized. no type');

  data = [];
  recordArr = Tag.loadMany(data);
  serialized = recordArr.serializeMany();
  assert.deepEqual(data, serialized, 'RecordArray serialized. no data');
});

test('deserializeMany', function (assert) {
  function commontTest(msg) {
    assert.equal(recordArr.get('length'), 2, 'correct length: ' + msg);
    assert.equal(recordArr.objectAt(0).constructor, Tag, 'correct type: ' + msg);
    assert.equal(recordArr.objectAt(0).get('name'), 'tag1', 'correct content: ' + msg);
  }

  var data = [{name: 'tag1'}, {name: 'tag2'}];
  var recordArr = RecordArray.createWithContent();
  recordArr.deserializeMany('Tag', data);
  commontTest('createWithContent');

  recordArr = RecordArray.create();
  recordArr.deserializeMany('Tag', data);
  commontTest('create');
});

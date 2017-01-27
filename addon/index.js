import RESTless from 'ember-restless/core';
import Client from 'ember-restless/client';
import Model from 'ember-restless/model/model';
import { attr, belongsTo, hasMany } from 'ember-restless/model/attribute';
import ReadOnlyModel from 'ember-restless/model/read-only-model';
import RecordArray from 'ember-restless/model/record-array';
import Adapter from 'ember-restless/adapters/adapter';
import RESTAdapter from 'ember-restless/adapters/rest-adapter';
import Serializer from 'ember-restless/serializers/serializer';
import JSONSerializer from 'ember-restless/serializers/json-serializer';
import Transform from 'ember-restless/transforms/base';
import BooleanTransform from 'ember-restless/transforms/boolean';
import NumberTransform from 'ember-restless/transforms/number';
import StringTransform from 'ember-restless/transforms/string';
import DateTransform from 'ember-restless/transforms/date';
import JSONTransforms from 'ember-restless/transforms/json';
import './ext/date';


/*
  Export public modules to namespace
*/
RESTless.Client = Client;
RESTless.Adapter = Adapter;
RESTless.RESTAdapter = RESTAdapter;
RESTless.attr = attr;
RESTless.belongsTo = belongsTo;
RESTless.hasMany = hasMany;
RESTless.Model = Model;
RESTless.ReadOnlyModel = ReadOnlyModel;
RESTless.RecordArray = RecordArray;
RESTless.Serializer = Serializer;
RESTless.JSONSerializer = JSONSerializer;
RESTless.Transform = Transform;
RESTless.BooleanTransform = BooleanTransform;
RESTless.NumberTransform = NumberTransform;
RESTless.StringTransform = StringTransform;
RESTless.DateTransform = DateTransform;
RESTless.JSONTransforms = JSONTransforms;
/*
  Expose to global namespace
  and create shortcut alias `RL`
 */
export default RESTless;

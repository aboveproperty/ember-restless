import Ember from 'ember';
import RESTless from 'ember-restless/core';
import ModelStateMixin from 'ember-restless/model/state';
import RecordArray from 'ember-restless/model/record-array';
import {attr} from 'ember-restless/model/attribute';

var computed = Ember.computed;
var get = Ember.get;

/**
 The base model class for all RESTless objects.

 @class Model
 @namespace RESTless
 @extends Ember.Object
 @uses Ember.Copyable
 */
var Model = Ember.Object.extend(ModelStateMixin, Ember.Copyable, {
    klassName: computed(function () {
        return this.constructor.resourceName;
    }),
    /**
     A unique id number for the record. `id` is the default primary key.
     @property id
     */
    id: attr('number'),

    /**
     Stores raw model data. Don't use directly; use declared model attributes.
     @private
     */
    __data: null,
    _data: computed(function () {
        if (!this.__data) {
            this.__data = {};
        }
        return this.__data;
    }),

    /**
     Hook to add observers for each attribute/relationship for 'isDirty' functionality
     @protected
     */
    didDefineProperty: function (proto, key, value) {
        if (value instanceof Ember.ComputedProperty) {
            var meta = value.meta();
            if (meta.isRelationship && !meta.readOnly) {
                // If a relationship's property becomes dirty, need to mark owner as dirty.
                Ember.addObserver(proto, key + '.isDirty', null, '_onRelationshipChange');
            }
        }
    },

    /**
     * Set didValidated property for all child relationship model
     *
     *
     * */
    setValidated: function () {
        let fields = Ember.get(this.constructor, 'fields');
        var field, fieldMeta;
        for (field in fields) {
            fieldMeta = fields[field];
            if (fieldMeta.hasMany) {
                this.get(field).forEach((subEl)=> {
                    subEl.setValidated();
                });
            }
        }

        this.set('didValidate', true);
    },
    /**
     _onPropertyChange: called when any property of the model changes
     If the model has been loaded, or is new, isDirty flag is set to true.
     @private
     */
    _onPropertyChange: function (key) {
        var isNew = this.get('isNew');

        // No longer a new record once a primary key is assigned.
        if (isNew && get(this.constructor, 'primaryKey') === key) {
            this.set('isNew', false);
            isNew = false;
        }

        if (this.get('_isReady') && (isNew || this.get('isLoaded'))) {
            this.set('isDirty', true);
        }
    },
    /**
     Called when a relationship property's isDirty state changes.
     Forwards a _onPropertyChange event for the parent object.
     @private
     */
    _onRelationshipChange: function (sender, key) {
        if (sender.get(key)) { // if isDirty
            this._onPropertyChange(key);
        }
    },

    /**
     Creates a clone of the model. Implements Ember.Copyable protocol
     <http://emberjs.com/api/classes/Ember.Copyable.html#method_copy>
     @method copy
     @return {Object} copy of receiver
     */
    copy: function () {
        var clone = this.constructor.create();
        var fields = get(this.constructor, 'fields');
        var field, value;

        Ember.beginPropertyChanges(this);
        for (field in fields) {
            if (fields.hasOwnProperty(field)) {
                value = this.get(field);
                if (value !== null) {
                    clone.set(field, value);
                }
            }
        }
        Ember.endPropertyChanges(this);

        return clone;
    },

    /**
     Creates a clone copy of the model along with it's current State.
     @method copyWithState
     @return {Object} copy of receiver
     */
    copyWithState: function () {
        return this.copyState(this.copy());
    },

    /**
     Saves the record using the model's adapter.
     @method saveRecord
     @chainable
     */
    saveRecord: function () {
        return get(this.constructor, 'adapter').saveRecord(this);
    },
    /**
     Deletes the record using the model's adapter.
     @method deleteRecord
     @chainable
     */
    deleteRecord: function () {
        return get(this.constructor, 'adapter').deleteRecord(this);
    },
    /**
     Reloads the record using the model's adapter.
     @method reloadRecord
     @chainable
     */
    reloadRecord: function () {
        return get(this.constructor, 'adapter').reloadRecord(this);
    },

    /**
     Serializes the record into its data representaion.
     @method serialize
     @param {Object} options hash of serialization options
     @chainable
     */
    serialize: function (options) {
        return get(this.constructor, 'adapter.serializer').serialize(this, options);
    },
    /**
     Deserializes raw data into Model properties
     @method deserialize
     @param {Object} data raw data to deserialize
     @chainable
     */
    deserialize: function (data, hasMany) {
        return get(this.constructor, 'adapter.serializer').deserialize(this, data, hasMany);
    },
    /**
     Serializes a Model property into its data representaion.
     @method serializeProperty
     @param {String} prop property key
     @chainable
     */
    serializeProperty: function (prop) {
        return get(this.constructor, 'adapter.serializer').serializeProperty(this, prop);
    },
    /**
     Deserializes raw data property into Model property
     @method deserializeProperty
     @param {String} prop property key
     @param value property value
     @chainable
     */
    deserializeProperty: function (prop, value) {
        return get(this.constructor, 'adapter.serializer').deserializeProperty(this, prop, value);
    }
});

/**
 Static properties and methods for the Model Class.

 @class Model
 @namespace RESTless
 */
Model.reopenClass({
    /**
     Extends super class `create` and marks _isReady state.
     @method create
     @return RESTless.Model
     */
    create: function () {
        var genericOwner = get(RESTless, 'client.genericOwner'),
            instance;
        if (genericOwner) {
            var args = [].slice.call(arguments);
            args.push(genericOwner.ownerInjection());
            instance = this._super.apply(this, args);
        } else {
            instance = this._super.apply(this, arguments);
        }
        instance.set('_isReady', true);
        return instance;
    },

    /**
     The adapter for the Model. Provides a hook for overriding.
     @property adapter
     @type RESTless.Adapter
     */
    adapter: computed('RESTless.client.adapter', function () {
        return get(RESTless, 'client.adapter');
    }),

    /**
     The property name for the primary key
     @property primaryKey
     @type String
     @default 'id'
     */
    primaryKey: computed('adapter', function () {
        var modelConfig = get(this, 'adapter.configurations.models');
        var configForKey = modelConfig && modelConfig.get(get(this, '_configKey'));
        var primaryKey = configForKey && configForKey.primaryKey;
        return primaryKey || 'id';
    }),

    /**
     The name of the resource, derived from the class name.
     App.Post => 'Post', App.PostGroup => 'PostGroup', App.AnotherNamespace.Post => 'Post'
     Note: when using ES6 modules, resourceName needs to be explicitly defined.

     @property resourceName
     @type String
     */
    resourceName: computed(function () {
        var classNameParts = this.toString().split('.');
        return classNameParts[classNameParts.length - 1];
    }),
    /**
     The plural name of the resource, derived from the class name.
     App.Post => 'posts', App.PostGroup => 'post_groups'

     @property resourceNamePlural
     @type String
     */
    resourceNamePlural: computed(function () {
        var resourceName = get(this, 'resourceName');
        var adapter = get(this, 'adapter');
        return adapter.pluralize(Ember.String.decamelize(resourceName));
    }),

    /**
     @property _configKey
     @type String
     @private
     */
    _configKey: computed('resourceName', function () {
        return Ember.String.camelize(get(this, 'resourceName'));
    }),

    /**
     Meta information for all attributes and relationships
     @property fields
     @type Ember.Map
     */
    fields: computed(function () {
        var fields = {};
        this.eachComputedProperty(function (name, meta) {
            if (meta.isAttribute || meta.isRelationship) {
                fields[name] = meta;
            }
        });
        return fields;
    }),

    /**
     Find resources using the adapter.
     This method can handle all find types: `findAll`, `findQuery`, `findByKey`
     @method find
     @param {Object} params
     @return Object
     */
    find: function (params) {
        return get(this, 'adapter').find(this, params);
    },
    /**
     Finds resources using the adapter, and returns a promise.
     @method fetch
     @param {Object} params hash of query params
     @return Ember.RSVP.Promise
     */
    fetch: function (params) {
        return get(this, 'adapter').fetch(this, params);
    },
    /**
     Finds all resources of this type using the adapter.
     @method findAll
     @return Object
     */
    findAll: function () {
        return get(this, 'adapter').findAll(this);
    },
    /**
     Find resources with query using the adapter.
     @method findQuery
     @param {Object} params hash of query params
     @return Object
     */
    findQuery: function (params) {
        return get(this, 'adapter').findQuery(this, params);
    },
    /**
     Find resource with specified primary key using the adapter.
     @method findByKey
     @param {Number|String} key
     @param {Object} params any additional params
     @return Object
     */
    findByKey: function (key, params) {
        return get(this, 'adapter').findByKey(this, key, params);
    },

    /**
     Create model directly from data representation.
     @method load
     @param {Object} data raw data to load
     @return RESTless.Model
     */
    load: function (data) {
        var model = this.create();
        model.set('_isReady', false);
        model.deserialize(data);
        model.set('_isReady', true);
        model.onLoaded();
        return model;
    },
    /**
     Create collection of records directly from data representation..
     @method loadMany
     @param {Object} data raw data to load
     @return RESTless.RecordArray
     */
    loadMany: function (data) {
        var array = RecordArray.createWithContent().deserializeMany(this, data);
        array.onLoaded();
        return array;
    }
});

export default Model;

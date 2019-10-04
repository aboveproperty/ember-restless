import RESTless from 'ember-restless/core';
import Client from 'ember-restless/ext/client';

export function initialize(/* application */) {
  var application = arguments[1] || arguments[0]; // See: http://emberjs.com/deprecations/v2.x/#toc_deprecations-added-in-2-1
  var applicationClient = application.Client;
  RESTless.set('client', applicationClient ? applicationClient : Client.create({application: application}));
  application.addObserver('Client', application, function () {
    RESTless.set('client', this.Client);
  });


  RESTless.lookupFactory = function (factory) {
    return application.resolveRegistration(factory);//container.lookupFactory.apply(container, arguments);
  };
}

export default {
  name: 'RESTless.Client',
  initialize
};

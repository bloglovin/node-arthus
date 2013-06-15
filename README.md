# Arthus
--------

A solid framework for building webapps.

## Goals

* All pieces should be separated and decoupled. Everything should be easily
  testable. That means no globals or anything.
* A common pattern for controllers and helpers.
* Framework should be separated from the actual app.
* A great view layer.
* Utilize streams where possible.
* Fast, of course.
* Include client-side framework.
* Great support for rich JavaScript client applications.
* Easy to profile and benchmark.
* Centralized logging.
* Follow Node patterns.
* Great for developement.

## Implementation

How to reach each of the goals.

### Decoupled and separated parts

Different parts of the application will always require some kind of
configuration. Instead of putting the configuration in a global location,
each part gets the configuration passed on instantiation.

This can be done automatically by mapping the configuration section to the
name of the object that needs variables.

### Common pattern for object

By defining strict rules for how object constructors may look this can be
generalized.

### Framework separation

By writing the framework itself as a separate project we can further force
ourselves to separate app logic from framework logic.

### Great view layer

Each controller should return a view object. The view object is an object
that defines how a page should be rendered. The framework will then inspect
this object and render it and pass it to the browser.

During AJAX requests this view object can be serialized to JSON and sent to
the browser for rendering on the client.

### Utilize streams

The view layer could possibly be abstracted to work with streams in some way.

### Client side framework

On the client side there should be a router layer that correctly invokes the
controller for the current page.

The view objects from the server should be made to work on the client.

View objects defines a target for how it should be rendered. For incremental
requests (like endless scrolling) they can set a selector and wether the
result should be prepended or appended to the target.

The client side should support single page applications where supported by the
browser. Pages should be stored in the DOM to make jumping back and forth a
breeze.

### Easy to profile

I believe this is achieved by writing clear, separated logic. Hooks and events
will have to be provided for this kind of functionality to sit outside the app.

### Centralized logging

The application should provide a simple way of doing logging. Runtime
configurations can then be made to decide where the log messages are sent.

### Follow Node patterns

Callbacks should all do error first. All that good jazz.

### Great for dev

Keep convention over configuration for stuff like folder structure etc.
Provide scaffolding methods for creating models, helpers, controllers etc.


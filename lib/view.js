//
// # View
//
// Data structure to represent views.
//
// * **name**, the name of the view - should match a jade file.
// * **includeAJAX**, (optional) set to false to exclude from JSON responses.
// * **data**, data to pass to the view when rendering.
//

var View = function (name, includeAJAX, data) {
  if (typeof includeAJAX === 'object' && !data) {
    data = includeAJAX;
    includeAJAX = true;
  }

  this.name = name;
  this.includeAJAX = includeAJAX;
  this.data = data;

  // This is how we tell this object from plain objects.
  this.type = 'view';
};

module.exports = View;


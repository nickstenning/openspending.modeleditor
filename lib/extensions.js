var __slice = Array.prototype.slice;
$.plugin = function(name, object) {
  return jQuery.fn[name] = function(options) {
    var args;
    args = Array.prototype.slice.call(arguments, 1);
    return this.each(function() {
      var instance;
      instance = $.data(this, name);
      if (instance) {
        return options && instance[options].apply(instance, args);
      } else {
        instance = new object(this, options);
        return $.data(this, name, instance);
      }
    });
  };
};
$.a2o = function(ary) {
  var obj, walk;
  obj = {};
  walk = function(o, path, value) {
    var key;
    key = path[0];
    if (path.length === 2 && path[1] === '') {
      if ($.type(o[key]) !== 'array') {
        o[key] = [];
      }
      return o[key].push(value);
    } else if (path.length === 1) {
      return o[key] = value;
    } else {
      if ($.type(o[key]) !== 'object') {
        o[key] = {};
      }
      return walk(o[key], path.slice(1), value);
    }
  };
  $.each(ary, function() {
    var p, path;
    path = this.name.split('[');
    path = [path[0]].concat(__slice.call((function() {
        var _i, _len, _ref, _results;
        _ref = path.slice(1);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          _results.push(p.slice(0, -1));
        }
        return _results;
      })()));
    return walk(obj, path, this.value);
  });
  return obj;
};
$.fn.serializeObject = function() {
  var ary;
  ary = this.serializeArray();
  return $.a2o(ary);
};
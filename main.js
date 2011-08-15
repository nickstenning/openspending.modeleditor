(function() {
  var DEFAULT_MODEL, DIMENSION_META, Delegator, DimensionWidget, DimensionsWidget, FIELDS_META, ModelEditor, UniqueKeyWidget, Widget, util;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
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
  Delegator = (function() {
    Delegator.prototype.events = {};
    Delegator.prototype.options = {};
    Delegator.prototype.element = null;
    function Delegator(element, options) {
      this.options = $.extend(true, {}, this.options, options);
      this.element = $(element);
      this.on = this.subscribe;
      this.addEvents();
    }
    Delegator.prototype.addEvents = function() {
      var event, functionName, sel, selector, _i, _ref, _ref2, _results;
      _ref = this.events;
      _results = [];
      for (sel in _ref) {
        functionName = _ref[sel];
        _ref2 = sel.split(' '), selector = 2 <= _ref2.length ? __slice.call(_ref2, 0, _i = _ref2.length - 1) : (_i = 0, []), event = _ref2[_i++];
        _results.push(this.addEvent(selector.join(' '), event, functionName));
      }
      return _results;
    };
    Delegator.prototype.addEvent = function(bindTo, event, functionName) {
      var closure, isBlankSelector;
      closure = __bind(function() {
        return this[functionName].apply(this, arguments);
      }, this);
      isBlankSelector = typeof bindTo === 'string' && bindTo.replace(/\s+/g, '') === '';
      if (isBlankSelector) {
        bindTo = this.element;
      }
      if (typeof bindTo === 'string') {
        this.element.delegate(bindTo, event, closure);
      } else {
        if (this.isCustomEvent(event)) {
          this.subscribe(event, closure);
        } else {
          $(bindTo).bind(event, closure);
        }
      }
      return this;
    };
    Delegator.prototype.isCustomEvent = function(event) {
      var natives;
      natives = "blur focus focusin focusout load resize scroll unload click dblclick\nmousedown mouseup mousemove mouseover mouseout mouseenter mouseleave\nchange select submit keydown keypress keyup error".split(/[^a-z]+/);
      event = event.split('.')[0];
      return $.inArray(event, natives) === -1;
    };
    Delegator.prototype.publish = function() {
      this.element.triggerHandler.apply(this.element, arguments);
      return this;
    };
    Delegator.prototype.subscribe = function(event, callback) {
      var closure;
      closure = function() {
        return callback.apply(this, [].slice.call(arguments, 1));
      };
      closure.guid = callback.guid = ($.guid += 1);
      this.element.bind(event, closure);
      return this;
    };
    Delegator.prototype.unsubscribe = function() {
      this.element.unbind.apply(this.element, arguments);
      return this;
    };
    return Delegator;
  })();
  DEFAULT_MODEL = {
    dataset: {},
    mapping: {
      amount: {
        type: 'value',
        datatype: 'float',
        label: 'Amount'
      },
      time: {
        type: 'value',
        datatype: 'date',
        label: 'Time'
      },
      from: {
        type: 'entity',
        label: 'Spender'
      },
      to: {
        type: 'entity',
        label: 'Recipient'
      }
    },
    views: []
  };
  DIMENSION_META = {
    time: {
      fixedDataType: true,
      helpText: 'The time dimension represents the time or period over which the\nspending occurred. Please choose the column of your dataset which\ncontains an ISO8601 formatted date (YYYY, YYYY-MM, YYYY-MM-DD, etc.).'
    },
    amount: {
      fixedDataType: true,
      helpText: 'The most important field in the dataset. Please choose which of\nthe columns in your dataset represents the value of the spending,\nand how you\'d like it to be displayed.'
    }
  };
  FIELDS_META = {
    label: {
      required: true
    }
  };
  util = {
    flattenObject: function(obj) {
      var flat, pathStr, walk;
      flat = {};
      pathStr = function(path) {
        var ary, p;
        ary = [path[0]];
        ary = ary.concat((function() {
          var _i, _len, _ref, _results;
          _ref = path.slice(1);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            p = _ref[_i];
            _results.push("[" + p + "]");
          }
          return _results;
        })());
        return ary.join('');
      };
      walk = function(path, o) {
        var key, newpath, value, _results;
        _results = [];
        for (key in o) {
          value = o[key];
          newpath = $.extend([], path);
          newpath.push(key);
          _results.push($.type(value) === 'object' ? walk(newpath, value) : ($.type(value) === 'array' ? newpath.push('') : void 0, flat[pathStr(newpath)] = value));
        }
        return _results;
      };
      walk([], obj);
      return flat;
    }
  };
  Widget = (function() {
    __extends(Widget, Delegator);
    function Widget() {
      Widget.__super__.constructor.apply(this, arguments);
    }
    Widget.prototype.deserialize = function(data) {};
    return Widget;
  })();
  UniqueKeyWidget = (function() {
    __extends(UniqueKeyWidget, Widget);
    function UniqueKeyWidget() {
      UniqueKeyWidget.__super__.constructor.apply(this, arguments);
    }
    UniqueKeyWidget.prototype.events = {
      'span click': 'onKeyClick'
    };
    UniqueKeyWidget.prototype.deserialize = function(data) {
      var availableKeys, fk, fv, k, uniq, v, _ref, _ref2, _ref3;
      uniq = ((_ref = data['dataset']) != null ? _ref['unique_keys'] : void 0) || [];
      availableKeys = [];
      _ref2 = data['mapping'];
      for (k in _ref2) {
        v = _ref2[k];
        if (v['type'] !== 'value') {
          _ref3 = v['fields'];
          for (fk in _ref3) {
            fv = _ref3[fk];
            availableKeys.push("" + k + "." + fk);
          }
        } else {
          availableKeys.push(k);
        }
      }
      this.keys = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = availableKeys.length; _i < _len; _i++) {
          k = availableKeys[_i];
          _results.push({
            'name': k,
            'used': __indexOf.call(uniq, k) >= 0
          });
        }
        return _results;
      })();
      return this.render();
    };
    UniqueKeyWidget.prototype.render = function() {
      return this.element.html($.tmpl('tpl_unique_keys', {
        'keys': this.keys
      }));
    };
    UniqueKeyWidget.prototype.onKeyClick = function(e) {
      var idx;
      idx = this.element.find('span').index(e.currentTarget);
      this.keys[idx]['used'] = !this.keys[idx]['used'];
      this.render();
      return this.element.parents('form').first().change();
    };
    return UniqueKeyWidget;
  })();
  DimensionWidget = (function() {
    __extends(DimensionWidget, Widget);
    DimensionWidget.prototype.events = {
      '.add_field click': 'onAddFieldClick',
      '.field_switch_constant click': 'onFieldSwitchConstantClick',
      '.field_switch_column click': 'onFieldSwitchColumnClick',
      '.field_rm click': 'onFieldRemoveClick'
    };
    function DimensionWidget(name, container, options) {
      this.formFieldRequired = __bind(this.formFieldRequired, this);
      this.formFieldPrefix = __bind(this.formFieldPrefix, this);
      var el;
      this.name = name;
      el = $("<fieldset class='dimension' data-dimension-name='" + this.name + "'>            </fieldset>").appendTo(container);
      DimensionWidget.__super__.constructor.call(this, el, options);
      this.id = "" + (this.element.parents('.modeleditor').attr('id')) + "_dim_" + this.name;
      this.element.attr('id', this.id);
      this.meta = DIMENSION_META[this.name] || {};
    }
    DimensionWidget.prototype.deserialize = function(data) {
      var formObj, k, v, _ref, _ref2, _results;
      this.data = ((_ref = data['mapping']) != null ? _ref[this.name] : void 0) || {};
      if (this.data.type !== 'value' && !('fields' in this.data)) {
        this.data.fields = {
          'label': {
            'datatype': 'string'
          }
        };
      }
      this.element.html($.tmpl('tpl_dimension', this));
      this.element.trigger('fillColumnsRequest', [this.element.find('select.column')]);
      formObj = {
        'mapping': {}
      };
      formObj['mapping'][this.name] = this.data;
      _ref2 = util.flattenObject(formObj);
      _results = [];
      for (k in _ref2) {
        v = _ref2[k];
        _results.push(this.element.find("[name=\"" + k + "\"]").val(v));
      }
      return _results;
    };
    DimensionWidget.prototype.formFieldPrefix = function(fieldName) {
      return "mapping[" + this.name + "][fields][" + fieldName + "]";
    };
    DimensionWidget.prototype.formFieldRequired = function(fieldName) {
      var _ref;
      return ((_ref = FIELDS_META[fieldName]) != null ? _ref['required'] : void 0) || false;
    };
    DimensionWidget.prototype.onAddFieldClick = function(e) {
      var name, row;
      name = prompt("Field name:").trim();
      row = this._makeFieldRow(name);
      row.appendTo(this.element.find('tbody'));
      this.element.trigger('fillColumnsRequest', [row.find('select.column')]);
      return false;
    };
    DimensionWidget.prototype.onFieldRemoveClick = function(e) {
      $(e.currentTarget).parents('tr').first().remove();
      this.element.parents('form').first().change();
      return false;
    };
    DimensionWidget.prototype.onFieldSwitchConstantClick = function(e) {
      var curRow, row;
      curRow = $(e.currentTarget).parents('tr').first();
      row = this._makeFieldRow(curRow.data('field-name'), true);
      curRow.replaceWith(row);
      this.element.parents('form').first().change();
      return false;
    };
    DimensionWidget.prototype.onFieldSwitchColumnClick = function(e) {
      var curRow, row;
      curRow = $(e.currentTarget).parents('tr').first();
      row = this._makeFieldRow(curRow.data('field-name'), false);
      curRow.replaceWith(row);
      this.element.trigger('fillColumnsRequest', [row.find('select.column')]);
      this.element.parents('form').first().change();
      return false;
    };
    DimensionWidget.prototype._makeFieldRow = function(name, constant) {
      var required, tplName;
      if (constant == null) {
        constant = false;
      }
      tplName = constant ? 'tpl_dimension_field_const' : 'tpl_dimension_field';
      return required = $.tmpl(tplName, {
        'fieldName': name,
        'prefix': this.formFieldPrefix,
        'required': this.formFieldRequired
      });
    };
    return DimensionWidget;
  })();
  DimensionsWidget = (function() {
    __extends(DimensionsWidget, Delegator);
    DimensionsWidget.prototype.events = {
      '.add_value_dimension click': 'onAddValueDimensionClick',
      '.add_classifier_dimension click': 'onAddClassifierDimensionClick'
    };
    function DimensionsWidget(element, options) {
      DimensionsWidget.__super__.constructor.apply(this, arguments);
      this.widgets = [];
      this.dimsEl = this.element.find('.dimensions').get(0);
    }
    DimensionsWidget.prototype.addDimension = function(name) {
      var w;
      w = new DimensionWidget(name, this.dimsEl);
      this.widgets.push(w);
      return w;
    };
    DimensionsWidget.prototype.removeDimension = function(name) {
      var idx, w, _i, _len, _ref;
      idx = null;
      _ref = this.widgets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        w = _ref[_i];
        if (w.name === name) {
          idx = this.widgets.indexOf(w);
          break;
        }
      }
      if (idx !== null) {
        return this.widgets.splice(idx, 1)[0].element.remove();
      }
    };
    DimensionsWidget.prototype.deserialize = function(data) {
      var dims, name, obj, toRemove, widget, _i, _j, _len, _len2, _ref, _results;
      if (this.ignoreParent) {
        return;
      }
      dims = data['mapping'] || {};
      toRemove = [];
      _ref = this.widgets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        widget = _ref[_i];
        if (widget.name in dims) {
          widget.deserialize(data);
          delete dims[widget.name];
        } else {
          toRemove.push(widget.name);
        }
      }
      for (_j = 0, _len2 = toRemove.length; _j < _len2; _j++) {
        name = toRemove[_j];
        this.removeDimension(name);
      }
      _results = [];
      for (name in dims) {
        obj = dims[name];
        _results.push(this.addDimension(name).deserialize(data));
      }
      return _results;
    };
    DimensionsWidget.prototype.promptAddDimension = function(props) {
      var data, name;
      name = prompt("Dimension name:");
      if (!name) {
        return false;
      }
      data = {
        'mapping': {}
      };
      data['mapping'][name] = props;
      return this.addDimension(name.trim()).deserialize(data);
    };
    DimensionsWidget.prototype.onAddValueDimensionClick = function(e) {
      this.promptAddDimension({
        'type': 'value'
      });
      return false;
    };
    DimensionsWidget.prototype.onAddClassifierDimensionClick = function(e) {
      this.promptAddDimension({
        'type': 'classifier'
      });
      return false;
    };
    return DimensionsWidget;
  })();
  ModelEditor = (function() {
    __extends(ModelEditor, Delegator);
    ModelEditor.prototype.widgetTypes = {
      '.unique_keys_widget': UniqueKeyWidget,
      '.dimensions_widget': DimensionsWidget
    };
    ModelEditor.prototype.events = {
      'modelChange': 'onModelChange',
      'fillColumnsRequest': 'onFillColumnsRequest',
      '.steps > ul > li click': 'onStepClick',
      '.steps > ul > li > ul > li click': 'onStepDimensionClick',
      '.forms form submit': 'onFormSubmit',
      '.forms form change': 'onFormChange'
    };
    function ModelEditor(element, options) {
      var ctor, e, selector, _i, _len, _ref, _ref2;
      ModelEditor.__super__.constructor.apply(this, arguments);
      this.data = $.extend(true, {}, DEFAULT_MODEL);
      this.widgets = [];
      this.form = $(element).find('.forms form').eq(0);
      this.id = this.element.attr('id');
      if (!(this.id != null)) {
        this.id = Math.floor(Math.random() * 0xffffffff).toString(16);
        this.element.attr('id', this.id);
      }
      this.element.find('script[type="text/x-jquery-tmpl"]').each(function() {
        return $(this).template($(this).attr('id'));
      });
      this.options.columns.unshift('');
      this.element.find('select.column').each(function() {
        return $(this).trigger('fillColumnsRequest', [this]);
      });
      _ref = this.widgetTypes;
      for (selector in _ref) {
        ctor = _ref[selector];
        _ref2 = this.element.find(selector).get();
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          e = _ref2[_i];
          this.widgets.push(new ctor(e));
        }
      }
      this.element.trigger('modelChange');
      this.setStep(0);
    }
    ModelEditor.prototype.setStep = function(s) {
      $(this.element).find('.steps > ul > li').removeClass('active').eq(s).addClass('active');
      return $(this.element).find('.forms div.formpart').hide().eq(s).show();
    };
    ModelEditor.prototype.onStepClick = function(e) {
      var idx;
      idx = this.element.find('.steps > ul > li').index(e.currentTarget);
      this.setStep(idx);
      return false;
    };
    ModelEditor.prototype.onStepDimensionClick = function(e) {
      return e.stopPropagation();
    };
    ModelEditor.prototype.onFormChange = function(e) {
      if (this.ignoreFormChange) {
        return;
      }
      this.data = this.form.serializeObject();
      this.ignoreFormChange = true;
      this.element.trigger('modelChange');
      return this.ignoreFormChange = false;
    };
    ModelEditor.prototype.onFormSubmit = function(e) {
      return false;
    };
    ModelEditor.prototype.onModelChange = function() {
      var dimNames, k, n, v, w, _i, _len, _ref, _ref2;
      _ref = util.flattenObject(this.data);
      for (k in _ref) {
        v = _ref[k];
        this.form.find("[name=\"" + k + "\"]").val(v);
      }
      _ref2 = this.widgets;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        w = _ref2[_i];
        w.deserialize($.extend(true, {}, this.data));
      }
      dimNames = (function() {
        var _ref3, _results;
        _ref3 = this.data['mapping'];
        _results = [];
        for (k in _ref3) {
          v = _ref3[k];
          _results.push(k);
        }
        return _results;
      }).call(this);
      this.element.find('.steps ul.steps_dimensions').html(((function() {
        var _j, _len2, _results;
        _results = [];
        for (_j = 0, _len2 = dimNames.length; _j < _len2; _j++) {
          n = dimNames[_j];
          _results.push('<li><a href="#' + ("" + this.id + "_dim_" + n) + '">' + ("" + n + "</a>"));
        }
        return _results;
      }).call(this)).join('\n'));
      return $('#debug').text(JSON.stringify(this.data, null, 2));
    };
    ModelEditor.prototype.onFillColumnsRequest = function(elem) {
      var x;
      return $(elem).html(((function() {
        var _i, _len, _ref, _results;
        _ref = this.options.columns;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push("<option name='" + x + "'>" + x + "</option>");
        }
        return _results;
      }).call(this)).join('\n'));
    };
    return ModelEditor;
  })();
  $.plugin('modelEditor', ModelEditor);
  this.ModelEditor = ModelEditor;
}).call(this);

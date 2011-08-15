DEFAULT_MODEL =
  dataset: {}
  mapping:
    amount:
      type: 'value'
      datatype: 'float'
      label: 'Amount'
    time:
      type: 'value'
      datatype: 'date'
      label: 'Time'    
    from:
      type: 'entity'
      label: 'Spender'
    to:
      type: 'entity'
      label: 'Recipient'
  views: []

DIMENSION_META =
  time:
    fixedDataType: true
    helpText: '''
              The time dimension represents the time or period over which the
              spending occurred. Please choose the column of your dataset which
              contains an ISO8601 formatted date (YYYY, YYYY-MM, YYYY-MM-DD, etc.).
              '''
  amount:
    fixedDataType: true
    helpText: '''
              The most important field in the dataset. Please choose which of
              the columns in your dataset represents the value of the spending,
              and how you'd like it to be displayed.
              '''

FIELDS_META =
  label:
    required: true


util =
  # Turns a nested object into a flat mapping with PHP-like query string
  # parameters as keys.
  #
  # Examples
  #
  #   # Flatten a nested object structure
  #   flattenObject({'one': {'two': 'foo'}})
  #   # => Returns {'one[two]': 'foo'}
  #
  #   # Flatten an object containing arrays
  #   flattenObject({'list': [1,2,3]})
  #   # => Returns {'list[]': [1,2,3]}
  #
  # Returns the flattened object
  flattenObject: (obj) ->
    flat = {}

    pathStr = (path) ->
      ary = [path[0]]
      ary = ary.concat("[#{p}]" for p in path[1..-1])
      ary.join ''

    walk = (path, o) ->
      for key, value of o
        newpath = $.extend([], path)
        newpath.push(key)

        if $.type(value) is 'object'
          walk newpath, value
        else
          if $.type(value) is 'array'
            newpath.push ''

          flat[pathStr(newpath)] = value

    walk([], obj)
    flat

class Widget extends Delegator
  deserialize: (data) ->

class UniqueKeyWidget extends Widget
  events:
    'span click': 'onKeyClick'

  deserialize: (data) ->
    uniq = (data['dataset']?['unique_keys'] or [])

    availableKeys = []
    for k, v of data['mapping']
      if v['type'] isnt 'value'
        for fk, fv of v['fields']
          availableKeys.push("#{k}.#{fk}")
      else
        availableKeys.push(k)

    @keys = ({'name': k, 'used': k in uniq} for k in availableKeys)
    this.render()

  render: ->
    @element.html($.tmpl('tpl_unique_keys', {'keys': @keys}))

  onKeyClick: (e) ->
    idx = @element.find('span').index(e.currentTarget)
    @keys[idx]['used'] = not @keys[idx]['used']
    this.render()

    # Futzing with the DOM and adding form fields does not trigger form change
    # events, so we have to trigger them manually.
    @element.parents('form').first().change()

class DimensionWidget extends Widget
  events:
    '.add_field click': 'onAddFieldClick'
    '.field_switch_constant click': 'onFieldSwitchConstantClick'
    '.field_switch_column click': 'onFieldSwitchColumnClick'
    '.field_rm click': 'onFieldRemoveClick'

  constructor: (name, container, options) ->
    @name = name
    el = $("<fieldset class='dimension' data-dimension-name='#{@name}'>
            </fieldset>").appendTo(container)

    super el, options

    @meta = DIMENSION_META[@name] or {}

  deserialize: (data) ->
    @data = data['mapping']?[@name] or {}

    # Prepopulate field-less non-value dimensions with a label field
    if @data.type isnt 'value' and 'fields' not of @data
      @data.fields = {'label': {'datatype': 'string'}}

    @element.html($.tmpl('tpl_dimension', this))
    @element.trigger('fillColumnsRequest', [@element.find('select.column')])

    formObj = {'mapping': {}}
    formObj['mapping'][@name] = @data

    for k, v of util.flattenObject(formObj)
      @element.find("[name=\"#{k}\"]").val(v)

  formFieldPrefix: (fieldName) =>
    "mapping[#{@name}][fields][#{fieldName}]"

  formFieldRequired: (fieldName) =>
    FIELDS_META[fieldName]?['required'] or false

  onAddFieldClick: (e) ->
    name = prompt("Field name:").trim()
    row = this._makeFieldRow(name)
    row.appendTo(@element.find('tbody'))

    @element.trigger('fillColumnsRequest', [row.find('select.column')])
    return false

  onFieldRemoveClick: (e) ->
    $(e.currentTarget).parents('tr').first().remove()
    @element.parents('form').first().change()
    return false

  onFieldSwitchConstantClick: (e) ->
    curRow = $(e.currentTarget).parents('tr').first()
    row = this._makeFieldRow(curRow.data('field-name'), true)
    curRow.replaceWith(row)
    @element.parents('form').first().change()
    return false

  onFieldSwitchColumnClick: (e) ->
    curRow = $(e.currentTarget).parents('tr').first()
    row = this._makeFieldRow(curRow.data('field-name'), false)
    curRow.replaceWith(row)
    @element.trigger('fillColumnsRequest', [row.find('select.column')])
    @element.parents('form').first().change()
    return false

  _makeFieldRow: (name, constant=false) ->
    tplName = if constant then 'tpl_dimension_field_const' else 'tpl_dimension_field'
    required =
    $.tmpl tplName,
      'fieldName': name
      'prefix': this.formFieldPrefix
      'required': this.formFieldRequired

class DimensionsWidget extends Delegator
  events:
    '.add_value_dimension click': 'onAddValueDimensionClick'
    '.add_classifier_dimension click': 'onAddClassifierDimensionClick'

  constructor: (element, options) ->
    super

    @widgets = []
    @dimsEl = @element.find('.dimensions').get(0)

  addDimension: (name) ->
    @widgets.push(new DimensionWidget(name, @dimsEl))
    @widgets[@widgets.length - 1]

  removeDimension: (name) ->
    idx = null

    for w in @widgets
      if w.name is name
        idx = @widgets.indexOf(w)
        break

    if idx isnt null
      @widgets.splice(idx, 1)[0].element.remove()

  deserialize: (data) ->
    return if @ignoreParent

    dims = data['mapping'] or {}
    toRemove = []

    for widget in @widgets
      if widget.name of dims
        widget.deserialize(data)
        delete dims[widget.name]
      else
        toRemove.push(widget.name)

    # Remove any widgets not in dims
    for name in toRemove
      this.removeDimension(name)

    # Any keys left in dims need to be added
    for name, obj of dims
      this.addDimension(name).deserialize(data)

  promptAddDimension: (props) ->
    name = prompt("Dimension name:")
    return false unless name
    data = {'mapping': {}}
    data['mapping'][name] = props
    this.addDimension(name.trim()).deserialize(data)

  onAddValueDimensionClick: (e) ->
    this.promptAddDimension({'type': 'value'})
    return false

  onAddClassifierDimensionClick: (e) ->
    this.promptAddDimension({'type': 'classifier'})
    return false

class ModelEditor extends Delegator
  widgetTypes:
    '.unique_keys_widget': UniqueKeyWidget
    '.dimensions_widget': DimensionsWidget

  events:
    'modelChange': 'onModelChange'
    'fillColumnsRequest': 'onFillColumnsRequest'
    '.steps ul > li click': 'onStepClick'
    '.forms form submit': 'onFormSubmit'
    '.forms form change': 'onFormChange'

  constructor: (element, options) ->
    super
    @data = $.extend(true, {}, DEFAULT_MODEL)
    @widgets = []

    @form = $(element).find('.forms form').eq(0)

    # Precompile templates
    @element.find('script[type="text/x-jquery-tmpl"]').each  ->
      $(this).template($(this).attr('id'))

    # Initialize column select boxes
    @options.columns.unshift('')
    @element.find('select.column').each ->
      $(this).trigger('fillColumnsRequest', [this])

    # Initialize widgets
    for selector, ctor of @widgetTypes
      @widgets.push(new ctor(e)) for e in @element.find(selector).get()

    @element.trigger 'modelChange'

    this.setStep 0

  setStep: (s) ->
    $(@element).find('.steps li')
      .removeClass('active')
      .eq(s).addClass('active')

    $(@element).find('.forms div.formpart').hide().eq(s).show()

  onStepClick: (e) ->
    idx = @element.find('.steps li').index(e.currentTarget)
    this.setStep idx
    return false

  onFormChange: (e) ->
    return if @ignoreFormChange

    @data = @form.serializeObject()

    @ignoreFormChange = true
    @element.trigger 'modelChange'
    @ignoreFormChange = false

  onFormSubmit: (e) ->
    return false

  onModelChange: () ->
    # Populate straightforward bits
    for k, v of util.flattenObject(@data)
      # FIXME? this may not deal with complex form elements such as radio
      # buttons or <select multiple>.
      @form.find("[name=\"#{k}\"]").val(v)

    # Send updated model copy to each subcomponent, as more complex
    # components may not have been correctly filled out by the above.
    for w in @widgets
      w.deserialize($.extend(true, {}, @data))

    $('#debug').text(JSON.stringify(@data, null, 2))

  onFillColumnsRequest: (elem) ->
    $(elem).html(
      ("<option name='#{x}'>#{x}</option>" for x in @options.columns).join('\n')
    )

$.plugin 'modelEditor', ModelEditor

this.ModelEditor = ModelEditor
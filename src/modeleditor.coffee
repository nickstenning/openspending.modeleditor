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
    keys = ({'name': k, 'used': k in uniq} for k, v of data['mapping'])

    if @ignoreParent
      return
    else
      @keys = keys
      this.render()

  render: ->
    @element.find('.uk_content').html(
      @element.find('.uk_template').tmpl({'keys': @keys})
    )

  onKeyClick: (e) ->
    idx = @element.find('.uk_content span').index(e.currentTarget)
    @keys[idx]['used'] = not @keys[idx]['used']
    this.render()

    # Futzing with the DOM and adding form fields does not trigger form change
    # events, so we have to trigger them manually.
    @ignoreParent = true
    @element.parents('form').eq(0).change()
    @ignoreParent = false

class ModelEditor extends Delegator
  widgetTypes:
    '.unique_keys': UniqueKeyWidget

  events:
    'modelChange': 'onModelChange'
    '.steps ul > li click': 'onStepClick'
    '.forms form submit': 'onFormSubmit'
    '.forms form change': 'onFormChange'

  constructor: (element, options) ->
    super
    @data = {}
    @widgets = []

    @form = $(element).find('.forms form').eq(0)

    # Initialize column select boxes
    @options.columns.unshift('')
    @element.find('select.column').html(
      ("<option name='#{x}'>#{x}</option>" for x in @options.columns).join('\n')
    )

    # Initialize widgets
    for selector, ctor of @widgetTypes
      @widgets.push(new ctor(e)) for e in @element.find(selector).get()

    @element.trigger('modelChange')
    this.setStep(0)

  setStep: (s) ->
    $(@element).find('.steps li')
      .removeClass('active')
      .eq(s).addClass('active')

    $(@element).find('.forms div.formpart').hide().eq(s).show()

  onStepClick: (e) ->
    idx = @element.find('.steps li').index(e.currentTarget)
    this.setStep(idx)
    return false

  onFormChange: (e) ->
    $.extend @data, @form.serializeObject()
    @element.trigger 'modelChange'

  onFormSubmit: (e) ->
    false

  onModelChange: () ->
    $('#debug').text(JSON.stringify(@data, null, 2))

    # Populate straightforward bits
    for k, v of util.flattenObject(@data)
      # FIXME? this may not deal with complex form elements such as radio
      # buttons or <select multiple>.
      @form.find("[name=\"#{k}\"]").val(v)

    # Send updated model to each subcomponent, as more complex
    # components may not have been correctly filled out by the above.
    for w in @widgets
      w.deserialize($.extend({}, @data))

$.plugin 'modelEditor', ModelEditor

this.ModelEditor = ModelEditor
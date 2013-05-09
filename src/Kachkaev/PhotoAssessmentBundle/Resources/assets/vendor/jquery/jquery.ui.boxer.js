// Boxer plugin
// http://jsfiddle.net/7bJak/2/ (modified)
$.widget("ui.boxer", $.ui.mouse, {

  _init: function() {
    this.element.addClass("ui-boxer");

    this.dragged = false;

    this._mouseInit();

    this.helper = $(document.createElement('div'))
      .css({border:'1px dotted black', background: 'rgba(255,255,255, .2)'})
      .addClass("ui-boxer-helper");
    
    if (!this.options.appendTo) {
        this.options.appendTo = this.element;
    }
  },

  destroy: function() {
    this.element
      .removeClass("ui-boxer ui-boxer-disabled")
      .removeData("boxer")
      .unbind(".boxer");
    this._mouseDestroy();

    return this;
  },

  _mouseStart: function(event) {
    var self = this;

    var $target = $(event.target);
    
    this.opos = [event.offsetX, event.offsetY];
    this.oposabs = [event.pageX, event.pageY];

    while ($target.get(0) != this.element[0] && $target.parent().length) {
        this.opos = [this.opos[0] + $target.offset().top, this.opos[1] + $target.offset().top];
        $target = $target.parent();
    }

    if (this.options.disabled)
      return;

    var options = this.options;

    this._trigger("start", event);

    $(options.appendTo).append(this.helper);

    this.helper.css({
      "z-index": 1000,
      "position": "absolute",
      "left": event.offsetX,
      "top": event.offsetY,
      "width": 0,
      "height": 0
    });
  },

  _mouseDrag: function(event) {
    var self = this;
    this.dragged = true;

    if (this.options.disabled)
      return;

    var options = this.options;

    var x1 = this.opos[0], y1 = this.opos[1], w = event.pageX - this.oposabs[0], h = event.pageY - this.oposabs[1];
    if (w < 0) { x1 += w; w = -w; };
    if (h < 0) { y1 += h; h = -h; };
    this.helper.css({left: x1, top: y1, width: w, height: h});
    
    this._trigger("drag", event);

    return false;
  },

  _mouseStop: function(event) {
    var self = this;

    this.dragged = false;

    var options = this.options;

//    var clone = this.helper.clone()
//      .removeClass('ui-boxer-helper').appendTo(this.element);

    this._trigger("stop", event, { box: {
        left: this.helper.position().left,
        top: this.helper.position().top,
        width: this.helper.width(),
        height: this.helper.height()
        }});
    
    this.helper.detach();

    return false;
  }

});
//
//$.extend($.ui.boxer, {
//  defaults: $.extend({}, $.ui.mouse.defaults, {
//    appendTo: 'body',
//    distance: 0
//  })
//});

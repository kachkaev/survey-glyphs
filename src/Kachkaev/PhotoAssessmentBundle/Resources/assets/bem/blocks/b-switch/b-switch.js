/**
 * Switch is UI element accessible as a jQuery UI widget
 * 
 * Set Value: $element.bswitch('option', 'value', value);
 * Get Value: value = $element.bswitch('option', 'value');
 * Focus:     $element.bswitch('focus');
 * 
 * Events:
 *     valuechange - when value is change by a slider or is set
 * 
 */
$.widget('ui.bswitch', {

	options: {
		value: null,
	},

	_init: function() {
		// Wrapping the element with div
		this.element.wrapInner('<ul class="b-switch__options" />');
		this.element.get(0).tagName = 'div';
		
		var w = {
				_self: this,
				element: this.element,
			};
		
		this.w = w; 
		
		// Saving reference to options (list items)
		w.lis = this.element.find('li');
		
		var nAnswers = w.lis.size();

		// FIXME Picking default value
		w.lis.each(function(i) {
			if ($(this).hasClass('default'))
				currentAnswer = i + 1;
		});

		w.ui = this.element.prepend('<div class="b-switch__uiwrapright" /><div class="b-switch__ui" /><div class="b-switch__uiwrapleft" />').children().eq(1);
		w.ui.width((nAnswers-1)*15); 
		
		w.ui.slider({
			value : currentAnswer,
			min : 1,
			max : nAnswers,
			step : 1,
			slide : function(event, ui) {
				$("#amount").val("$" + ui.value);
			}
		});
		w.uiHandle = w.ui.find('.ui-slider-handle');
		
		// Making "ears" clickable
		w.ui.prev().click(function(){
			if (w._self.options.disabled)
				return;
			w.ui.slider('value', w.ui.slider("option", "max"));
			w.uiHandle.focus();
		});
		w.ui.next().click(function(){
			if (w._self.options.disabled)
				return;
			w.ui.slider('value', w.ui.slider("option", "min"));
			w.uiHandle.focus();
		});
		
		
		// Making values clickable
		w.lis.each(function(i){
			$(this).click(function(){
				if (w._self.options.disabled)
					return;
				w.ui.slider('value', i+1);
				w.uiHandle.focus();
			});
		});
		
		// Slider colouring according to value
		w.ui.bind( "slidechange", function(event, ui) {
			var value = ui.value;
			var $valueLI = w.lis.eq(value - 1);
			w._self.options.value = $valueLI.data('v');
			w._self.stopBlink();
			w._self._trigger("changevalue");

			w._self._updateColor();
		});
		
		// Disabling standard keydown method and replacing it with left-right actions only
		// Default values are skipped when pressing left/right
		w.uiHandle.unbind('keydown');
		w.uiHandle.bind('keydown', function(event) {
			if (w._self.options.disabled)
				return;
			var delta = 0;
			if (event.keyCode == KEY_LEFT) {
				delta = -1;
			} else if (event.keyCode == KEY_RIGHT) {
				delta = 1;
			} else {
				return;
			}
			var newValue = w.ui.slider('value') + delta;
			if (w.lis.eq(newValue - 1).hasClass('default'))
				newValue += delta;
			w.ui.slider('value', newValue);
		});
	},

	_setOption: function (key, value) {
		switch (key) {
			case 'value':
				if (this.options.value == value)
					return;
				var w = this.w;
				this.w.lis.each(function(i) {
					if ($(this).data('v') === value) {
						w.ui.slider('value', i + 1);
						w._self.stopBlink();
						w._self._trigger("changevalue");
						return false;
					}
				});
				break;
			case 'disabled':
				this.w.ui.slider('option', 'disabled', value);
				break;
			default:
				return;
		}
		$.Widget.prototype._setOption.apply( this, arguments );
	},
	
	setAnswerColor: function(answer, color) {
		//var value = this.ui.value;
		var $valueLI = this.w.lis.filter(function() {
			return $(this).data('v') == answer;
		});
		$valueLI[0].className = $valueLI[0].className.replace(/\bcolor_.*?\b/g, '');
		$valueLI.addClass("color_"+color);
		this._updateColor();
		return;
	},
	
	focus: function() {
		this.w.uiHandle.focus();		
	},
	
	blink: function() {
		var className = 'blinking';
		var w = this.w;
		var elem = this.w.uiHandle;
		elem.removeClass(className);
		
		var concurrentToken = Math.random();
		w.concurrentToken = concurrentToken;
		$(document.body).everyTime(100, function() {
			if (concurrentToken != w.concurrentToken) {
				return;
			}
			elem.toggleClass(className);
		}, 4);
	},
	
	stopBlink: function () {
		this.w.concurrentToken = Math.random();
		this.w.uiHandle.removeClass('blinking');
	},
	
	_updateColor: function() {
		var value = this.w.ui.slider("option", "value");
		var $valueLI = this.w.lis.eq(value - 1);
		// Removing all classes starting with 'color_'
		this.w.element[0].className = this.w.element[0].className.replace(/\bcolor_.*?\b/g, '');
		this.w.element.addClass($valueLI.attr('class'));
	}
});
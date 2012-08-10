/**
 * Switch is UI element accessible as a jQuery UI widget
 * 
 * Set Value: $element.bswitch('option', 'value', value);
 * Get Value: value = $element.bswitch('option', 'value');
 * Focus:     $element.bswitch('focus');
 * 
 * 
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
			if (w._self.options.disabled)
				return;
			$(this).click(function(){
				w.ui.slider('value', i+1);
				w.uiHandle.focus();
			});
		});
		
		// Slider colouring according to value
		w.ui.bind( "slidechange", function(event, ui) {
			var value = ui.value;
			var $valueLI = w.lis.eq(value - 1);
			// Removing all classes starting with 'color_'
			w.element[0].className = w.element[0].className.replace(/\bcolor_.*?\b/g, '');
			w.element.addClass($valueLI.attr('class'));
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
				if (key == 'value') {
					var w = this.w;
					this.w.lis.each(function(i) {
						if ($(this).data('v') === value) {
							w.ui.slider('value', i + 1);
							return false;
						}
					});
				};
				break;
			
			default:
				return;
		}
		$.Widget.prototype._setOption.apply( this, arguments );
	},
	
	focus: function() {
		this.w.uiHandle.focus();		
	}
});
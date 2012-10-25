/**
 * Switch is UI element accessible as a jQuery UI widget
 * 
 * Set Value: $element.bswitch('option', 'value', value);
 * Get Value: value = $element.bswitch('option', 'value');
 * Focus:     $element.bswitch('focus');
 * 
 * Events:
 *     valuechange - when value is change by a slider or is set
 *     focus - when bswitch is focused
 * 
 */
$.widget('ui.bswitch', {

	options: {
		value: null
	},
	
	_init: function() {
		// Wrapping the element with div
		this.element.wrapInner('<ul class="b-switch__options" />');
		this.element.get(0).tagName = 'div';
		
		var w = {
				_self: this,
				element: this.element,
				gapSize: 3,
				lis: null,
				ui: null,
				uiHandle: null,
				uiBackground: null,
				hasHardToSay: this.element.hasClass("b-switch_with-hard-to-say"),
				sliderValueToSwitchValue: null,
				switchValueToSliderValue: null
			};
		
		this.w = w; 
		
		w.sliderValueToSwitchValue = function(value) {
			var $valueLI = w.lis.eq(value - 1);
			if ($valueLI.size())
				return $valueLI.data('v');
			else
				return -1;
		};

		w.switchValueToSliderValue = function(value) {
			if (value == -1 && w.hasHardToSay)
				return w.ui.slider('option', 'max');
			
			var result = null;
			w.lis.each(function(i) {
				if ($(this).data('v') === value) {
					result = i + 1;
					return false;
				}
			});
			return result;
		};

		
		// Saving reference to options (list items)
		w.lis = this.element.find('li');
		
		var nAnswers = w.lis.size() + (w.hasHardToSay? w.gapSize + 1 : 0);
		
		// FIXME Picking default value
		w.lis.each(function(i) {
			if ($(this).hasClass('default'))
				currentAnswer = i + 1;
		});

		w.ui = this.element.prepend('<div class="b-switch__ear-right"><div class="b-switch__circle-rh b-switch__uiwrapright" /></div><div class="b-switch__ui" /><div class="b-switch__ear-left"><div class="b-switch__circle-lh b-switch__uiwrapleft" /><div class="b-switch_ear_left">').children().eq(1);
		if (w.hasHardToSay) {
			w.ui.prev().addClass('b-switch__ear-right_hts');
			var hardToSayCircle = $('<div class="b-switch__hts"><div class="b-switch__circle-lh" /><div class="b-switch__circle-rh" /><div class="b-switch__hts-text">' + lang.str['answer.hts'] + '</div></div>');
			var hardToSayGap = $('<div class="b-switch__hts-gap" />');
			
			hardToSayCircle.click(function() {
				if (w._self.options.disabled)
					return;
				w.ui.slider('value', w.ui.slider("option", "max"));
				w._self.focus();
			});
			w.ui.prev().append(hardToSayCircle).append(hardToSayGap);
		}
		
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
		w.uiBackground = $('<div class="ui-slider-background" />').appendTo(w.ui);
		
		// Making "ears" clickable
		w.ui.prev().find(".b-switch__uiwrapright").click(function(){
			if (w._self.options.disabled)
				return;
			w.ui.slider('value', w.ui.slider("option", "max") - (hasHardToSay ? w.gapSize - 1 : 0));
			w._self.focus();
		});
		w.ui.next().find(".b-switch__uiwrapleft").click(function(){
			if (w._self.options.disabled)
				return;
			w.ui.slider('value', w.ui.slider("option", "min"));
			w._self.focus();
		});
				
		// Making values clickable
		w.lis.each(function(i){
			$(this).click(function(){
				if (w._self.options.disabled)
					return;
				w.ui.slider('value', i+1);
				w._self.focus();
			});
		});
		
		// Slider colouring according to value
		w.ui.bind( "slidechange", function(event, ui) {
			w._self.options.value = w.sliderValueToSwitchValue(ui.value);
			w._self.stopBlink();
			w._self._trigger("changevalue");

			w._self._updateColor();
		});
		
		w.ui.bind( "slide", function(event, ui) {
			if (!w.hasHardToSay)
				return;
			
			var value = ui.value;
			var max = w.ui.slider("option", "max");
			if (value > max - w.gapSize - 1) {
				if (value != max) {
					return false;
				};
			};
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
			if (w.hasHardToSay) {
				var max = w.ui.slider("option", "max");
				if (newValue > max - w.gapSize - 1 && newValue != max) {
					if (delta > 0)
						newValue = max;
					else
						newValue = max - w.gapSize - 1;
				}
			}
			w.ui.slider('value', newValue);
		});
	},

	_setOption: function (key, value) {
		switch (key) {
			case 'value':
				if (this.options.value == value)
					return;
				this.w.ui.slider('value', this.w.switchValueToSliderValue(value));
				this.w._self.stopBlink();
				this.w._self._trigger("changevalue");
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
		this._trigger('focus');
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
		if (this.w.hasHardToSay && value == this.w.ui.slider("option", "max"))
			this.w.element.addClass('color_yellow');
		else
			this.w.element.addClass($valueLI.attr('class'));
	}
});
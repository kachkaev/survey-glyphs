$(function() {

	
	// Sets value
	var setValue = function(value) {
		$switchWrap = $(this).parent();
		$switchWrap.find('li').each(function(i) {
			if ($(this).data('v') === value) {
				$switchWrap.find('.b-switch__ui').slider('value', i + 1);
				return false;
			};
		});
	};

	// Gets value
	var getValue = function() {
		var $switchWrap = $(this).parent();
		var i = $switchWrap.find('.b-switch__ui').slider('value');
		return $(this).find('li').eq(i - 1).data('v');
	};
	
	// Focuses the switch
	var focus = function() {
		var $switchUIHandle = $(this).parent().find('.ui-slider-handle');
		$switchUIHandle.focus();
	};

	
	$('.b-switch').each(function() {

		var $switch = $(this);
		var $switchWrap = $switch.wrap('<div class="b-switch__wrap" />').parent();
		var $switchLIs = $switch.find('li');
		var nAnswers = $switchLIs.size();
		var currentAnswer = 2;
		
		// Picking default value
		$switchLIs.each(function(i) {
			if ($(this).hasClass('default'))
				currentAnswer = i + 1;
		});

		// Generating switch UI (jQuery UI slider)
		var $switchUI = $switch.before('<div class="b-switch__uiwrapright" /><div class="b-switch__ui" /><div class="b-switch__uiwrapleft" />').prev().prev();
		$switchUI.width((nAnswers-1)*15);
		$switchUI.slider({
			value : currentAnswer,
			min : 1,
			max : nAnswers,
			step : 1,
			slide : function(event, ui) {
				$("#amount").val("$" + ui.value);
			}
		});
		var $switchUIHandle = $switchUI.find('.ui-slider-handle');
		
		// "Enabled state" checker
		var switchIsDisabled = function() {
			return $switch.parent().hasClass("disabled");
		};
		
		// Making "ears" of the slider clickable
		$switchUI.prev().click(function(){
			if (switchIsDisabled())
				return;
			$switchUI.slider('value', $switchUI.slider("option", "max"));
			$switchUIHandle.focus();
		});
		$switchUI.next().click(function(){
			if (switchIsDisabled())
				return;
			$switchUI.slider('value', $switchUI.slider("option", "min"));
			$switchUIHandle.focus();
		});
		
		// Making values clickable
		$switchLIs.each(function(i){
			if (switchIsDisabled())
				return;
			$(this).click(function(){
				$switchUI.slider('value', i+1);
				$switchUIHandle.focus();
			});
		});
		
		// Slider colouring according to value
		$switchUI.bind( "slidechange", function(event, ui) {
			var value = ui.value;
			var $valueLI = $switchLIs.eq(value - 1);
			// Removing all classes starting with 'color_'
			$switchWrap[0].className = $switchWrap[0].className.replace(/\bcolor_.*?\b/g, '');
			$switchWrap.addClass($valueLI.attr('class'));
		});
		
		// Disabling standard keydown method and replacing it with left-right actions only
		// Default values are skipped when pressing left/right
		$switchUIHandle.unbind('keydown');
		$switchUIHandle.bind('keydown', function(event) {
			if (switchIsDisabled())
				return;
			var delta = 0;
			if (event.keyCode == KEY_LEFT) {
				delta = -1;
			} else if (event.keyCode == KEY_RIGHT) {
				delta = 1;
			} else {
				return;
			}
			var newValue = $switchUI.slider('value') + delta;
			if ($switchLIs.eq(newValue - 1).hasClass('default'))
				newValue += delta;
			$switchUI.slider('value', newValue);
		});
		
		// Applying custom methods
		this.setValue = setValue;
		this.getValue = getValue;
		this.focus = focus;
	});
});
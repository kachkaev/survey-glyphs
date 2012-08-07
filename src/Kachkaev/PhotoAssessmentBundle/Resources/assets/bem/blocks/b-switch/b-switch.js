$(function() {

	$('.b-switch').each(function() {

		var $switch = $(this);
		var nAnswers = $switch.find('li').size();
		var currentAnswer = 2;
		console.log(nAnswers);

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
	});
});
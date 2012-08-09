$(function() {

	$iDone = $('.i-button-done');
	$bQuestionnaire = $('.b-survey-questionnaire');

	var loadData = function(answer) {

		// Applying answers
		$('.b-switch').each(function() {
			var $switch = $(this);
			var $question = $(this).parent().parent();
			$switch.get(0).setValue(answer[$question.data('q')]);
		});
		
		// Enabling / disabling questions
		$('.b-survey-questionnaire__question').addClass('b-survey-questionnaire__question_enabled');
	}
	
	var disableDependentQuestions = {
			qIsRealPhoto: {
				"false": ["qIsOutdoors", "qDuringEvent", "qTimeOfDay", "qSubjectPerson", "qSubjectMovingObject", "qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
			},
			qIsOutdoors: {
				"true": ["qDuringEvent", "qTimeOfDay", "qSubjectMovingObject", "qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
			},
			qSubjectPerson: {
				"true": ["qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
			},
			qSubjectMovingObject: {
				"true": ["qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
			},
	};

	/* ===================================
	 * Navigation between survey questions with up/down
	 */
	$('body').bind('keypress', function(event) {
		var delta;
		if (event.keyCode == KEY_UP)
			delta = -1;
		else if (event.keyCode == KEY_DOWN)
			delta = +1;
		else
			return;
		
		// Finding focused element
		var $focusedElem = $(document.activeElement);
		//// Transposing switch handle to b-switch
		if ($focusedElem.hasClass('ui-slider-handle')) {
			$focusedElem = $focusedElem.parent().parent().find('.b-switch');
		};
		var focusedElem = $focusedElem.get(0);

		// Getting all elements that can be focused in a loop
		//// Switches
		var elems = $('.b-survey-questionnaire__question_enabled .b-switch').get();
		//// 'Done' button
		elems.push($iDone.get(0));
		
		var focusedElemIndex = -1;
		$.each(elems, function(i, elem) {
			if (focusedElem == elem) {
				focusedElemIndex = i;
			}
		});
		
		// Picking up index of a new element
		var newElemIndex = 0;
		if (focusedElemIndex != -1) {
			newElemIndex = focusedElemIndex + delta;
			if (newElemIndex < 0)
				newElemIndex = elems.length - 1;
			if (newElemIndex >= elems.length)
				newElemIndex = 0;
		}
		var $newElem = $(elems[newElemIndex]);
		if ($newElem.hasClass('.b-switch'))
			$newElem.get(0).focus();
		$newElem.focus();
		return false;
	});
	
	
	/* ===================================
	 * Navigation between photos with enter / backspace
	 */
	
	$bQuestionnaire.get(0).loadData = loadData;
});

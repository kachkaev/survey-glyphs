/**
 * Questionnaire is UI element accessible as a jQuery UI widget
 * 
 * Set answers: $bquestionnaire('option', 'answers', value);
 * Get answers: value = $element.bswitch('option', 'answers');
 * 
 */
$.widget('ui.bsurveyquestionnaire', {

	options: {
		answers: {},
	},

	_init: function() {
		
		var w = {
				_self: this,
				element: this.element,
			};
		this.w = w;
		
		// Initializing switches
		w.switches = this.element.find('.b-switch');
		w.switches.bswitch();
		w.switches.eq(0).bswitch('focus');
		
		
		// Initializing google map
		w.map = this.element.find('.b-survey-map');
		w.map.bsurveymap();
		w.map.bsurveymap('option','given_pos',[-0.096867,51.513128]);
		
		// Getting list of question answers
		w.answers = this.element.find('.b-survey-questionnaire__questionanswer');
		w.answersMap = {};
		$.each(w.answers, function(i, answer) {
			var $answer = $(answer);
			w.answersMap[$answer.data('q')] = $answer;
		});
		
		// List of question answers disability dependencies
		var disableDependentQuestions = {
				qIsRealPhoto: {
					"false": ["qIsOutdoors", "qDuringEvent", "qTimeOfDay", "qSubjectPerson", "qSubjectMovingObject", "qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
				},
				qIsOutdoors: {
					"false": ["qDuringEvent", "qTimeOfDay", "qSubjectMovingObject", "qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
				},
				qSubjectPerson: {
					"true": ["qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
				},
				qSubjectMovingObject: {
					"true": ["qIsLocationCorrect", "qDescribesSpace", "qSpaceAttractive"],
				},
		};

		
		w.updateQuestionsDisability = function() {
			w.switches.bswitch('enable');
			$.each(disableDependentQuestions, function(key, value) {
				var a = w.answers.filter(function() { 
					  return $(this).data("q") == key;
				  });
				if (a.size() != 1)
					return;
				
				$.each(value, function(answer, dependentDisabledQuestions) {
					//console.log(a.children(":first").bswitch('option','value'), answer);
					if (String(a.children(":first").bswitch('option','value')) == answer) {
						$.each(dependentDisabledQuestions, function(i, q) {
							w.answersMap[q].children(":first").bswitch('disable');
						});
					};
				});
				
			});
		};
		
		$('body').everyTime(500, w.updateQuestionsDisability);
		
		// Up/down keypress to go to prev/next question
		$(document.body).bind('keypress', function(event) {
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
				$focusedElem = $focusedElem.parent().parent();
			} else {
				console.log('focused switch not found');
				return;
			}
			var focusedElem = $focusedElem.get(0);
			
			// Getting all elements that can be focused in a loop
			//// Switches
			//// TODO filter by disabled state
			var elems = w.switches.filter(function() {
				return !$(this).bswitch('option', 'disabled');
			}).get();
			//// 'Done' button
			//elems.push($iDone.get(0));
			
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
			if ($newElem.hasClass('b-switch'))
				$newElem.bswitch('focus');
			else
				$newElem.focus();
			return false;
		});
	},

	_setOption: function (key, value) {
		switch (key) {
			case 'answers':
				console.log("answers set");
				break;
			case 'disabled':
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

// TODO Shift - right - set all to green
$(function() {

	return;
	/* ===================================
	 * Navigation between survey questions with up/down
	 */
	
	/* ===================================
	 * Navigation between photos with enter / backspace
	 */
});

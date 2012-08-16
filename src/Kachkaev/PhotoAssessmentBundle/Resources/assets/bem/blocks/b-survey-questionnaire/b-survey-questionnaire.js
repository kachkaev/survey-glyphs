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
		//w.map.bsurveymap('option','altered_pos',[-0.096867,51.513128]);
		
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
					if (String(a.children(":first").bswitch('option','value')) == answer) {
						$.each(dependentDisabledQuestions, function(i, q) {
							w.answersMap[q].children(":first").bswitch('disable');
						});
					};
				});
				
			});
		};
		
		// Change of the value in a switch toggles other switches' enabled state
		w.switches.bind("bswitchchangevalue", function(event) {
			w.updateQuestionsDisability();
			}
		);
		// When clicked on a disabled switch, the switch that blocks it is highlighted
		w.switches.bind("click", function(event) {
			var $currentSwitch = $(this);
			var currentQuestion= $currentSwitch.parent('.b-survey-questionnaire__questionanswer').data("q");
			
			if (!$currentSwitch.bswitch("option", "disabled"))
				return;
			
			// Getting the cause of blocking
			var qCause = null;
			$.each(disableDependentQuestions, function(key, value) {
				if (qCause != null)
					return false;
				$.each(value, function(answer, dependentDisabledQuestions) {
					$.each(dependentDisabledQuestions, function(i, q) {
						if (q == currentQuestion && String(w.answersMap[key].children(":first").bswitch('option', 'value')) == answer) {
							qCause = key;
							return false;
						};
					});
				});
			});
			
			// Highlighting the cause switch
			var $bSwitchCause = w.answersMap[qCause].children(":first");
			$bSwitchCause.bswitch('focus');
			$bSwitchCause.bswitch('blink');
		});

		// Binding map switch with map
		var mapbswitch = w.answers.filter(function() { 
			  return $(this).data("q") == "qIsLocationCorrect"; 
		}).children(1);
		
		
		//// Modifide coords are saved to restore them after a user moved the switch to "yes" and then back to "no"
		w.savedAlteredPos = null;
		
		//// When switch value is changed, map coords are updated
		mapbswitch.bind("bswitchchangevalue", function(event) {
				var v = mapbswitch.bswitch("option", "value");
				var initialGivenPos = w.map.bsurveymap("option", "given_pos");
				
				if (v == null) {
				} else if (v == false) {
					w.map.bsurveymap("option", "altered_pos", w.savedAlteredPos);
					
				} else {
					w.map.bsurveymap("option", "altered_pos", initialGivenPos);
				}
			});
		// When pointer is dragged, switch is updated
		w.map.bind("bsurveymapchangealtered_pos", function(event) {
				if (!w.map.bsurveymap("posIsAccurate")) {
					w.savedAlteredPos = w.map.bsurveymap("option", "altered_pos");
					mapbswitch.bswitch("setAnswerColor", false, w.savedAlteredPos == null ? "red" : "yellow");
				}
				
				mapbswitch.bswitch("option", "value", w.map.bsurveymap("posIsAccurate"));
			}
		);

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
				// DONT FORGET TO RESET ALTERED POS
				//w.savedAlteredPos = null;
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

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
		
		// Getting list of question answers
		w.answers = this.element.find('.b-survey-questionnaire__questionanswer');
		w.answersMap = {};
		$.each(w.answers, function(i, answer) {
			var $answer = $(answer);
			w.answersMap[$answer.data('q')] = $answer;
		});
		
		// List of question answers disability dependencies
		w.disableDependentQuestions = {
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
		
		// Change of the value in a switch toggles other switches' enabled state
		w.switches.bind("bswitchchangevalue", function(event) {
			w._self._updateQuestionsDisability();
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
			$.each(w.disableDependentQuestions, function(key, value) {
				if (qCause != null)
					return false;
				$.each(value, function(answer, dependentDisabledQuestions) {
					$.each(dependentDisabledQuestions, function(i, q) {
						if (q == currentQuestion && String(w._self._getBswitchByAnswer(key).bswitch('option', 'value')) == answer) {
							qCause = key;
							return false;
						};
					});
				});
			});
			
			// Highlighting the cause switch
			var $bSwitchCause = w._self._getBswitchByAnswer(qCause);
			$bSwitchCause.bswitch('focus');
			$bSwitchCause.bswitch('blink');
		});

		// Binding map switch with map
		w.mapbwitch = w.answers.filter(function() { 
			  return $(this).data("q") == "qIsLocationCorrect"; 
		}).children(1);
		
		
		//// Modifide coords are saved to restore them after a user moved the switch to "yes" and then back to "no"
		w.savedAlteredPos = null;
		w.savedGivenPos = null;
		
		//// When switch value is changed, map coords are updated
		w.mapbwitch.bind("bswitchchangevalue", function(event) {
				var v = w.mapbwitch.bswitch("option", "value");
				
				if (w.updateQuestionsDisabilityIsTerminated)
					return;
				
				if (v == null) {
				} else if (v == false) {
					w.map.bsurveymap('setGivenAndAlteredPos', w.savedGivenPos, w.savedAlteredPos);
				} else {
					w.map.bsurveymap('setGivenAndAlteredPos', w.savedGivenPos, w.savedGivenPos);
				}
			});
		// When pointer is dragged, switch is updated
		w.map.bind("bsurveymapchangealtered_pos", function(event) {
			if (w.map.bsurveymap("option", "given_pos") == null)
				return;
			
			if (!w.map.bsurveymap("posIsAccurate")) {
				w.savedAlteredPos = w.map.bsurveymap("option", "altered_pos");
				w.mapbwitch.bswitch("setAnswerColor", false, w.savedAlteredPos == null ? "red" : "yellow");
			}
			w.mapbwitch.bswitch('focus');
			w.mapbwitch.bswitch("option", "value", w.map.bsurveymap("posIsAccurate"));
		});
		w.map.bind('click', function() {
			w.mapbwitch.bswitch('focus');
		});

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
		
		// Loading default answers
		//this._setAnswers(this.options.answers);
	},

	_setOption: function (key, value) {
		switch (key) {
			case 'disabled':
				break;
			default:
				return;
		}
		$.Widget.prototype._setOption.apply( this, arguments );
	},
	
	setAnswers: function(answers) {
		answers = $.extend({
			givenLon: null,
			givenLat: null,
			alteredLon: null,
			alteredLat: null
		}, answers);
		
		console.log('new answers', answers);
		var w = this.w;
		
		w.updateQuestionsDisabilityIsTerminated = true;
		
		// Parsing coords
		var givenPos = answers['givenLon'] ? [answers['givenLon'], answers['givenLat']] : null;
		var alteredPos = answers['alteredLon'] ? [answers['alteredLon'], answers['givenLat']] : null;
		w.savedGivenPos = givenPos;
		w.savedAlteredPos = alteredPos;

		
		// Switches
		w.switches.bswitch('option', 'value', null);
		$.each(answers, function(k, v) {
			w._self._getBswitchByAnswer(k).bswitch('option', 'value', v);
		});
		w.updateQuestionsDisabilityIsTerminated = false;

		// Map
		w.map.bsurveymap('setGivenAndAlteredPos', givenPos, answers['qIsLocationCorrect'] ? givenPos : alteredPos);
		w._self._updateQuestionsDisability();
		
		// Focusing on a first enabled switch with value = null
		var $bswitchToFocus = null;
		$.each(w.switches, function() {
			var $this = $(this);
			if (!$this.bswitch('option', 'disabled') && $this.bswitch('option', 'value') === null) {
				$bswitchToFocus = $this;
				return false;
			}
		});
		if (!$bswitchToFocus)
			$bswitchToFocus = w.switches.eq(0);
		$bswitchToFocus.bswitch('focus');
	},

	getAnswers: function(answers) {
		var w = this.w;
		var answers = {};
		
		// Switches
		$.each(w.answersMap, function(q) {
			answers[q] = w.answersMap[q].children(":first").bswitch('option', 'value');
		});
		
		// Map
		var givenPos = w.map.bsurveymap('option', 'given_pos');
		if (!givenPos) {
			answers['givenLon'] = null;
			answers['givenLat'] = null;
		} else {
			answers['givenLon'] = givenPos[0];
			answers['givenLat'] = givenPos[1];
		}
		var alteredPos = w.map.bsurveymap('option', 'altered_pos');
		if (!alteredPos) {
			answers['alteredLon'] = null;
			answers['alteredLat'] = null;
		} else {
			answers['alteredLon'] = alteredPos[0];
			answers['alteredLat'] = alteredPos[1];
		}
		
		return answers;
	},
	
	focus: function() {
		this.w.uiHandle.focus();		
	},
	
	_getBswitchByAnswer: function(answerId) {
		var $answer = this.w.answersMap[answerId];
		if ($answer)
			return $answer.children(":first");
		else
			return $();
	},
	
	_updateQuestionsDisability: function() {
		var w = this.w;
		if (w.updateQuestionsDisabilityIsTerminated)
			return;
		
		// Updating switches
		w.switches.bswitch('enable');
		$.each(w.disableDependentQuestions, function(key, value) {
			var a = w.answers.filter(function() { 
				  return $(this).data("q") == key;
			  });
			if (a.size() != 1)
				return;
			
			$.each(value, function(answer, dependentDisabledQuestions) {
				if (String(a.children(":first").bswitch('option','value')) == answer) {
					$.each(dependentDisabledQuestions, function(i, q) {
						w._self._getBswitchByAnswer(q).bswitch('disable');
					});
				};
			});
			
		}); 
		
		// Updating the map
		w.mapbwitch.bswitch('option', 'disabled', w.savedGivenPos == null);
		w.map.bsurveymap('option', 'disabled', w.mapbwitch.bswitch('option', 'disabled'));
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

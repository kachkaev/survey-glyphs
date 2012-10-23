/**
 * Questionnaire is UI element accessible as a jQuery UI widget
 * 
 * Set answers: $bsurveyquestionnaire('option', 'answers', value);
 * Get answers: value = $bsurveyquestionnaire('option', 'answers');
 * 
 * Is complete: var isComplete = $bsurveyquestionnaire('isComplete');
 * Blink first missing answer $bsurveyquestionnaire('blinkFirstMissingAnswer');
 * 
 */
$.widget('ui.bsurveyquestionnaire', {

//	options: {
//		answers: {},
//		disabled: true
//	},

	_init: function() {
		
		var w = {
				_self: this,
				element: this.element,
			};
		this.w = w;
		
		this.element.show();
		
		w.defaultAnswers = {
//				'qIsRealPhoto': true
				disabled: true
		};
		
		// Initializing switches
		w.switches = this.element.find('.b-switch');
		w.switches.bswitch();
		w.switches.eq(0).bswitch('focus');
		
		
		// Initializing google map
		w.map = this.element.find('.b-survey-map');
		w.map.bsurveymap();
		
		// Getting the list of questions
		w.questions = this.element.find('.b-survey-questionnaire__question');
		w.questions.each(function() {
			var $this = $(this);
			$this.data('answer', $this.find('.b-survey-questionnaire__questionanswer'));
			$this.data('q', $this.data('answer').data('q'));
			$this.data('switch', $this.find('.b-switch'));
		});
		
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
					"0": ["qIsOutdoors", "qTimeOfDay", "qTimeOfYear", "qSubjectTemporal", "qSubjectPeople", "qIsLocationCorrect", "qIsByPedestrian", "qIsSpaceAttractive"],
				},
				qIsOutdoors: {
					"0": ["qDuringEvent", "qTimeOfDay", "qTimeOfYear", "qSubjectTemporal", "qIsLocationCorrect", "qIsByPedestrian", "qIsSpaceAttractive"],
				},
				qIsLocationCorrect: {
					//"0": ["qIsByPedestrian", "qIsSpaceAttractive"],
				},
				qSubjectTemporal: {
					//"null": ["qSubjectPeople"],
					//"0": ["qSubjectPeople"],
					//"1": ["qIsByPedestrian", "qIsSpaceAttractive"],
				},
				qSubjectPeople: {
					//"1": ["qIsByPedestrian", "qIsSpaceAttractive"],
				},
		};
		
		// Change of the value in a switch toggles other switches' enabled state
		w.switches.bind("bswitchchangevalue", function(event) {
			w._self._updateQuestionsDisability();
		});
		
		// Applying tooltips to questions
		w.questions.find('.b-survey-questionnaire__questiontext').tooltip({
			items: "div",
			position: {
				my: "left-10px top",
				at: "left bottom",
			},
			tooltipClass: "b-survey-questionnaire__questionhint_active",
			content: function() {
				var $obj = $(this);
				return $obj.next().html();
			}
		});
		
		// Saving reference to last focused switch
		w.lastFocusedSwitch = null;
		w.switches.bind("bswitchfocus", function(event) {
			w.lastFocusedSwitch = $(this);
			w._self._updateQuestionsDisability();
		});
		
		// Focuses switch that is blocking given blocked question
		var focusSwitchBlocking = function(blockedQuestion) {
			// Getting the cause of blocking
			var qCause = null;
			$.each(w.disableDependentQuestions, function(key, value) {
				if (qCause != null)
					return false;
				$.each(value, function(answer, dependentDisabledQuestions) {
					$.each(dependentDisabledQuestions, function(i, q) {
						if (q == blockedQuestion && String(w._self._getBswitchByAnswer(key).bswitch('option', 'value')) == answer) {
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
		};

		// When clicked on a disabled switch, the switch that blocks it is highlighted
		w.switches.bind("click", function(event) {
			var $currentSwitch = $(this);
			
			if (!$currentSwitch.bswitch("option", "disabled"))
				return;
			
			focusSwitchBlocking($currentSwitch.parent().data("q"));
		});

		// Binding map switch with map
		w.mapbwitch = w.answers.filter(function() { 
			  return $(this).data("q") == "qIsLocationCorrect"; 
		}).children(1);
		
		
		//// Modified coords are saved to restore them after a user moved the switch to "yes" and then back to "no"
		w.savedAlteredPos = null;
		w.savedGivenPos = null;
		
		//// When switch value is changed, map coords are updated
		w.mapbwitch.bind("bswitchchangevalue", function(event) {
				var v = w.mapbwitch.bswitch("option", "value");
				
				if (w.updateQuestionsDisabilityIsTerminated)
					return;
				
				if (v === null || v === -1) {
//					w.map.bsurveymap('setGivenAndAlteredPos', w.savedGivenPos, null);
				} else if (v === 0) {
					w.map.bsurveymap('setGivenAndAlteredPos', w.savedGivenPos, w.savedAlteredPos);
				} else if (v === 1) {
					w.map.bsurveymap('setGivenAndAlteredPos', w.savedGivenPos, w.savedGivenPos);
				}
			});
		// When pointer is dragged, switch is updated
		w.map.bind("bsurveymapchangealtered_pos", function(event) {
			if (w.ignoreChangeMapPos)
				return;
			
			if (w.map.bsurveymap("option", "given_pos") === null)
				return;
			
			if (!w.map.bsurveymap("posIsAccurate")) {
				w.savedAlteredPos = w.map.bsurveymap("option", "altered_pos");
				//w.mapbwitch.bswitch("setAnswerColor", 0, w.savedAlteredPos === null ? "red" : "yellow");
			}
			w.mapbwitch.bswitch('focus');
			w.mapbwitch.bswitch("option", "value", w.map.bsurveymap("posIsAccurate"));
		});

		w.map.bind('click', function(event) {
			if (!w.mapbwitch.bswitch('option', 'disabled')) {
				$(document).oneTime(200, function() {w.mapbwitch.bswitch('focus');});
			} else {
				focusSwitchBlocking(w.mapbwitch.parent().data('q'));
			};
			event.stopPropagation();
		});
		
		w.questions.bind('click', function(event) {
			var $this = $(this);
			if (!$this.data('switch').bswitch('option', 'disabled')) {
				$this.data('switch').bswitch('focus');
			} else {
				focusSwitchBlocking($this.data('q'));
			};
			event.stopPropagation();
		});

		$(document).bind("click", function () {
			if (!$(document.activeElement).hasClass('ui-slider-handle'))
				w.lastFocusedSwitch.bswitch('focus');
		});
		

		// Up/down keydown to go to prev/next question
		$(document).bind('keydown', function(event) {
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
		this.setAnswers(w.defaultAnswers);
	},

	_setOption: function (key, value) {
		switch (key) {
			case 'disabled':
				if (value) {
					this._resetQuestionsDisability();
				} else {
					this._updateQuestionsDisability();
				}
				break;
			default:
				return;
		}
		$.Widget.prototype._setOption.apply( this, arguments );
	},
	
	setAnswers: function(answers) {
		if (!answers)
			answers = this.w.defaultAnswers;
		
		answers = $.extend({
			qIsLocationCorrect: null,
			givenLon: null,
			givenLat: null,
			alteredLon: null,
			alteredLat: null
		}, answers);
		
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
		w.ignoreChangeMapPos = true;
		w.map.bsurveymap('setGivenAndAlteredPos', givenPos, answers['qIsLocationCorrect'] !== false ? givenPos : alteredPos);
		w.ignoreChangeMapPos = false;
		
		if (this.options.disabled)
			return;
		
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
		if (!alteredPos || answers["qIsLocationCorrect"] != "0") {
			answers['alteredLon'] = null;
			answers['alteredLat'] = null;
		} else {
			answers['alteredLon'] = alteredPos[0];
			answers['alteredLat'] = alteredPos[1];
		}
		
		return answers;
	},
	
	focus: function() {
		var q = this._getFirstMissingAnswer();
		if (!q)
			this.w.switches.eq(0).bswitch('focus');
		else
			this.w.answersMap[q].children(":first").bswitch('focus');
	},
	
	isComplete: function() {
		return this._getFirstMissingAnswer() === null;
	},

	isUnanswered: function() {
		var answers = this.getAnswers();
		var result = true;
		$.each(answers, function(k, v) {
			if (v !== null)
				result = false;
			return false;
		});
		return result;
	},
	
	blinkFirstMissingAnswer: function() {
		var q = this._getFirstMissingAnswer();
		if (!q)
			return;
		this.w.answersMap[q].children(":first").bswitch('focus').bswitch('blink');
	},
	
	zoomMapIn: function() {
		this.w.map.bsurveymap("option", "zoom_level", this.w.map.bsurveymap("option", "zoom_level") + 1);
	},
	zoomMapOut: function() {
		this.w.map.bsurveymap("option", "zoom_level", this.w.map.bsurveymap("option", "zoom_level") - 1);
	},
	
	_getFirstMissingAnswer: function() {
		var w = this.w;
		var result = null;
		
		$.each(w.answersMap, function(q) {
			var $switch =  w.answersMap[q].children(":first");
			if ($switch.bswitch('option', 'disabled'))
				return;
			if ($switch.bswitch('option', 'value') === null) {
				result = q;
				return false;
			}
		});
		return result;
	},
	
	_getBswitchByAnswer: function(answerId) {
		var $answer = this.w.answersMap[answerId];
		if ($answer)
			return $answer.children(":first");
		else
			return $();
	},
	
	_resetQuestionsDisability: function() {
		var w = this.w;
		w.switches.each(function() {
			var $bSwitch = $(this);
			$bSwitch.bswitch('option', 'disabled', true);
			var $text = $(this).parent().prev();
			$text.addClass('b-survey-questionnaire__questiontext_disabled');
		});
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
		if (!w.savedGivenPos)
			w.mapbwitch.bswitch('option', 'disabled', true);
		w.map.bsurveymap('option', 'disabled', w.mapbwitch.bswitch('option', 'disabled'));
		
		// Updating question text (fading it or not)
		w.switches.each(function() {
			var $bSwitch = $(this);
			var $text = $(this).parent().prev();
			$text.toggleClass('b-survey-questionnaire__questiontext_disabled', $bSwitch.bswitch('option', 'disabled'));
		});
	}
});
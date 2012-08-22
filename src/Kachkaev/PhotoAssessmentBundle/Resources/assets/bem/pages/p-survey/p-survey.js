$(function(){

	var answers = [
	   {
		   "qIsRealPhoto": true,
	   },
	   {
			"qIsRealPhoto": true,
			"qIsOutdoors": null,
			"qDuringEvent": null,
			"qTimeOfDay": 2,
			"qSubjectPerson" : true,
			"qSubjectMovingObject" : false,
			"qIsLocationCorrect" : true,
			"givenLon": -0.044867,
			"givenLat": 51.5174128,
			"qDescribesSpace": true,
			"qSpaceAttractive" : false,
	   },
	   {
			"qIsRealPhoto": false,
			"qIsOutdoors": null,
			"qDuringEvent": null,
			"qTimeOfDay": 2,
			"qSubjectPerson" : true,
			"qSubjectMovingObject" : false,
			"qIsLocationCorrect" : false,
			"givenLon": -0.094867,
			"givenLat": 51.5172128,
			"qDescribesSpace": true,
			"qSpaceAttractive" : false,
	  },
	  {
			"qIsRealPhoto": true,
			"qIsOutdoors": true,
			"qDuringEvent": false,
			"qTimeOfDay": 0,
			"qSubjectPerson" : false,
			"qSubjectMovingObject" : false,
			"qIsLocationCorrect" : false,
			"givenLon": -0.096867,
			"givenLat": 51.513128,
			"alteredLon": -0.094867,
			"alteredLat": 51.519128,
			"qDescribesSpace": true,
			"qSpaceAttractive" : true,
	
	 }
	];
	    		
	var apiURL = "/api/";
	
	var $bQuestionnaire = $('.b-survey-questionnaire');
	var $iButtonNext = $('.i-button-next');
	
	var $questionnaireHint = $('.b-survey-controls__hint');
	$questionnaireHint.css('marginRight', $('.b-survey-controls__buttons').width());
	
	/* ===================================
	 * Loading photo queue
	 */
	var loadQueue = function(source) {
		// It is assumed that the user is logged in and has his own queue of photos to answer questions about
		
		// Requesting all photos of the queue
		
		// Sorting the queue
		
		// Displaying the queue
		
		// Taking the first photograph
		var id = 0;
		loadphoto(source, id);
	};

	$bQuestionnaire.bsurveyquestionnaire();
	/* ===================================
	 * Loading photo data
	 */
	var loadPhoto = function(source, id) {
		//Loading photo metadata
		
		// Loading existing answers
		//var url = "photo_survey/";
		
		$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers[0]);
	};
	loadPhoto('flickr', 123);

	/* ===================================
	 * Saves answers
	 */
	var saveAnswers = function() {
		console.log($bQuestionnaire.bsurveyquestionnaire('getAnswers'));
	};
	
	var submitQuestionnaireIfCompleteOrForced = function(event) {
		if (event.shiftKey || $bQuestionnaire.bsurveyquestionnaire('isComplete'))
			submitQuestionnaire();
		else {
			str = "Questinnaire is incomplete. Hold shift pressed to force submitting it. Some very long text";
			$questionnaireHint.stop(true, true).text(str).fadeIn(0).delay(2000).fadeOut(2000);
			//, function(){console.log("!");});});
			//.text('str')
			//	.show().fadeTo(1000, 1).fadeTo(2000, 0, function(){console.log("!");});
			$bQuestionnaire.bsurveyquestionnaire('blinkFirstMissingAnswer');
		}
	};
	
	var submitQuestionnaire = function() {
		saveAnswers();
		//loadPhoto();
		$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers[Math.floor(Math.random()*4)]);
	};

	
	// "Next" button press
	$iButtonNext.bind('click', function(event) {
		submitQuestionnaireIfCompleteOrForced(event);
		return false;
	});
	
	// Global keys
	$(document.body).bind("keydown", function(event) {
		var key = event.keyCode || event.which;
		switch (key) {
		case KEY_ENTER:
			submitQuestionnaireIfCompleteOrForced(event);
			break;
		case 49:
		case 50:
		case 51:
		case 52:
			$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers[key - 49]);
			break;
		}
	});
});
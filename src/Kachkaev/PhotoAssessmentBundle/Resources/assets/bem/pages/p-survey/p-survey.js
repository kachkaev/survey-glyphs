$(function(){
	var answers = {
	   '7672854730': {
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
	  '7672852814': {
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
	   '7672850642': {
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
	};
	
	var keys = ['7672854730', '7672852814', '7672850642'];
	    		
	var apiURL = "/api/";
	
	var $bQuestionnaire = $('.b-survey-questionnaire').bsurveyquestionnaire();
	var $bPhoto = $('.b-survey-photo').bsurveyphoto();
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

	/* ===================================
	 * Loading photo data
	 */
	var loadPhoto = function(source, id) {
		//Loading photo metadata
		
		// Loading existing answers
		//var url = "photo_survey/";
		
		$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers[id]);
		$bPhoto.bsurveyphoto('show','flickr', id);
	};
	loadPhoto('flickr', keys[1]);

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
			str = "Questinnaire is incomplete. Hold shift pressed to force submitting it.";
			$questionnaireHint.stop(true, true).text(str).fadeIn(0).delay(2000).fadeOut(2000);
			//, function(){console.log("!");});});
			//.text('str')
			//	.show().fadeTo(1000, 1).fadeTo(2000, 0, function(){console.log("!");});
			$bQuestionnaire.bsurveyquestionnaire('blinkFirstMissingAnswer');
		}
	};
	
	var submitQuestionnaire = function() {
		saveAnswers();
		loadPhoto('flickr', keys[Math.floor(Math.random()*3)]);
		//$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers[);
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
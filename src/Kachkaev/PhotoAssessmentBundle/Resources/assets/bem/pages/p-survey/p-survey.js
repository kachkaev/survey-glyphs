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
		
		$bQuestionnaire.bsurveyquestionnaire();
		$bQuestionnaire.bsurveyquestionnaire('setAnswers', answers[0]);
	};
	loadPhoto('flickr', 123);
	
	$(document.body).bind("keypress", function(event) {
		var key = event.keyCode || event.which;
		switch (key) {
		case KEY_ENTER:
			console.log($bQuestionnaire.bsurveyquestionnaire('getAnswers'));
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
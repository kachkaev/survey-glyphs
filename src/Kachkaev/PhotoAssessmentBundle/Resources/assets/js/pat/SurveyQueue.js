/*

fetchQueue(callback)
//extendQueue(callback)

getQueue()

[ {
	id: photoResponseId 
	status: PhotoResponseSstatus.XXX
	qA
	qB
	qC
	...
	photo: {
		id:
		source:
		photoId:
		userId:
		status:
	}
} ... ]

getCurrentId()
setCurrentId(id)

getNextId()
getNextIncompleteId()

get(id)
set(id, answers)

getUnansweredCount()
getIncompleteCount()
getCount()


Events (signals):
updated (queue)
updatedWithError
changedCurrentId


*/


namespace('pat');

var apiBaseURL = "/app_dev.php/api/";

pat.SurveyQueue = function() {
	this._queue = {};
	this._currentId = null;
	this._queueMap = {}; // {index: x, photoResponse: {x}}
	
	this.updated = new signals.Signal();
	this.updatedWithError = new signals.Signal();
	this.changedCurrentId = new signals.Signal();
};

pat.SurveyQueue._apiURLs = {
		get_queue: apiBaseURL+"get_queue",
		submit_response: apiBaseURL+"submit_response",
};

pat.SurveyQueue.prototype.fetchQueue = function() {
	var obj = this;
	
	var parseQueue = function(data) {
		var oldQueue = null;
		var newQueue = null;
		try {
			oldQueue = obj._queue;
			newQueue = data.response;
		} catch (e) {
			obj.updatedWithError.dispatch();
		};
		if (!_.isEqual(oldQueue, newQueue)) {
			obj._queue = newQueue;
			obj._queueMap = {};
			$.each(obj._queue, function (k, v) {
				obj._queueMap[v.id] = {index: k, photoResponse: v};
			});
			obj.updated.dispatch(newQueue);
		};
	};
	
	$.ajax({
		url: pat.SurveyQueue._apiURLs['get_queue'],
		type: "POST",
		success: function(data) {
			parseQueue(data);
		},
		error: function() {
			obj.updatedWithError.dispatch();
		},
	});
};

pat.SurveyQueue.prototype.getQueue = function() {
	return this._queue;
};

pat.SurveyQueue.prototype.getCurrentId = function() {
	return this._currentId;
};

pat.SurveyQueue.prototype.setCurrentId = function(newId) {
	if (this._currentId == newId || !this._queueMap[newId])
		return false;
	
	this._currentId = newId;
	this.changedCurrentId.dispatch(newId);
};

pat.SurveyQueue.prototype.getNextId = function() {
	return this.getNextIdWithStatuses();
};

pat.SurveyQueue.prototype.getNextIdWithStatuses = function(statuses) {
	var _currentId = this._currentId;
	if (!this._queueMap[this._currentId]) {
		_currentId = this._queue[this._queue.length - 1].id;
	};
	
	var i = this._queueMap[_currentId].index + 1;
	var startingI = i;
	while (true) {
		// last → first
		if (i == this._queue.length)
			i = 0;
		var pr = this._queue[i];
		if (!statuses || _.indexOf(statuses, pr.status) != -1)	
			return pr.id;
		
		++i;
		if (startingI == i)
			return null;
	};
};

pat.SurveyQueue.prototype.getNextIncompleteId = function() {
	var result;
	result = this.getNextIdWithStatuses([pat.PhotoResponseStatus.UNANSWERED, pat.PhotoResponseStatus.INCOMPLETE]);
	//if (!result)
	//	result = this.getNextIdWithStatuses([pat.PhotoResponseStatus.INCOMPLETE]);
	if (!result)
		result = this.getNextIdWithStatuses([pat.PhotoResponseStatus.PHOTO_PROBLEM]);
	return result;
};

pat.SurveyQueue.prototype.get = function (id) {
	return this._queueMap[id].photoResponse;
};

pat.SurveyQueue.prototype.setAnswersFor = function (photoResponseId) {
	
};
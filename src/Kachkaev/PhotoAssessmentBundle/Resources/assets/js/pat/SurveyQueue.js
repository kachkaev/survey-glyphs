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

extendQueue()

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
extended
updatedWithError
changedCurrentId


*/


namespace('pat');

pat.SurveyQueue = function() {
	this._queue = [];
	this._currentId = null;
	this._queueMap = {}; // {index: x, photoResponse: {x}}
	this._timeIdChanged = 0;
	this._timeWindowBlured = null;
	
	this.updated = new signals.Signal();
	this.extended = new signals.Signal();
	this.updatedWithError = new signals.Signal();
	this.changedCurrentId = new signals.Signal();
	
	var obj = this;
	$(window).blur(function() {
		obj._timeWindowBlured = Math.round(new Date().getTime() / 1000);
	});
	$(window).focus(function() {
		if (!obj._timeWindowBlured)
			return;
		obj._timeIdChanged += Math.round(new Date().getTime() / 1000) - obj._timeWindowBlured;
	});
};

pat.SurveyQueue._apiURLs = {
		get_queue: pat.config.apiBaseURL+"get_queue",
		extend_queue: pat.config.apiBaseURL+"extend_queue",
		submit_response: pat.config.apiBaseURL+"submit_response"
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
		}
	});
};

pat.SurveyQueue.prototype.getQueue = function() {
	return this._queue;
};

pat.SurveyQueue.prototype.extendQueue = function() {
	var o = this;
	$.ajax({
		url: pat.SurveyQueue._apiURLs['extend_queue'],
		type: "POST",
		success: function(data) {
			var count = data.count;
			o.updated.addOnce(function() {
				o.extended.dispatch(count);
			});
			o.fetchQueue();
		},
		error: function() {
			obj.updatedWithError.dispatch();
		}
	});
};

pat.SurveyQueue.prototype.getUnansweredCount = function() {
	var s = pat.PhotoResponseStatus.UNANSWERED;
	var result = 0;
	for (var i = this._queue.length - 1; i >=0; --i) {
		if (this._queue[i].status == s) {
			++result;
		}
	}
	return result;
};

pat.SurveyQueue.prototype.getUnansweredOrIncompleteCount = function() {
	var result = 0;
	for (var i = this._queue.length - 1; i >=0; --i) {
		if (this._queue[i].status == pat.PhotoResponseStatus.UNANSWERED || this._queue[i].status == pat.PhotoResponseStatus.INCOMPLETE) {
			++result;
		}
	}
	return result;
};

pat.SurveyQueue.prototype.getCurrentId = function() {
	return this._currentId;
};

pat.SurveyQueue.prototype.setCurrentId = function(newId) {
	if (this._currentId == newId || !this._queueMap[newId])
		return false;
	
	this._timeIdChanged = Math.round(new Date().getTime() / 1000); 
	this._timeWindowBlured = null;
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

pat.SurveyQueue.prototype.getFirstIdWithStatuses = function(statuses, exceptCurrent) {
	var _currentId = this._queue[0].id;
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
		if (!statuses || _.indexOf(statuses, pr.status) != -1 && (exceptCurrent && this._currentId != pr.id))	
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

pat.SurveyQueue.prototype.getFirstIncompleteId = function(exceptCurrent) {
	var result;
	result = this.getFirstIdWithStatuses([pat.PhotoResponseStatus.UNANSWERED, pat.PhotoResponseStatus.INCOMPLETE], exceptCurrent);
	//if (!result)
	//	result = this.getNextIdWithStatuses([pat.PhotoResponseStatus.INCOMPLETE]);
	if (!result)
		result = this.getFirstIdWithStatuses([pat.PhotoResponseStatus.PHOTO_PROBLEM], exceptCurrent);
	return result;
};

pat.SurveyQueue.prototype.get = function (id) {
	return this._queueMap[id].photoResponse;
};

pat.SurveyQueue.prototype.setPhotoResponseFor = function (photoResponseId, newPhotoResponse) {
	var obj = this;
	var existingPhotoResponse = this._queueMap[photoResponseId].photoResponse;
	if (!existingPhotoResponse)
		throw new Error("Wrong id given in SurveyQueue::setPhotoResponseFor " + photoResponseId);
	
	//console.log("was", $.extend({}, existingPhotoResponse), newPhotoResponse);
	newPhotoResponse.id = photoResponseId;
	newPhotoResponse.photo = existingPhotoResponse.photo;
	//var t = -1;
	//newPhotoResponse.duration = (existingPhotoResponse.duration ? existingPhotoResponse.duration + t : t);
	
	//console.log("comparing",newPhotoResponse, existingPhotoResponse, _.difference(newPhotoResponse, existingPhotoResponse), _.difference(existingPhotoResponse, newPhotoResponse));
	if (_.isEqual(newPhotoResponse, existingPhotoResponse))
		return false;
	
	var changed = false;
	$.each(newPhotoResponse, function(k, v) {
		if (_.isFunction(v) || v === existingPhotoResponse[k] || k.substr(0, 5) == "given")
			return;
		existingPhotoResponse[k] = v;
		if (!(_.isNull(v) && _.isUndefined(existingPhotoResponse[k])))
				changed = true;
	});
	//console.log("changed", changed);
	//console.log("now", newPhotoResponse);
	if (!changed)
		return;
	
	newPhotoResponse.duration = (Math.round(new Date().getTime() / 1000)) - this._timeIdChanged;
	//$.extend(existingPhotoResponse, newPhotoResponse);
	//;
	
	$.ajax({
		url: pat.SurveyQueue._apiURLs['submit_response'],
		data: {response: newPhotoResponse},
		type: "POST",
		success: function(data) {
			obj.updated.dispatch(obj._queue, [photoResponseId]);
		},
		error: function() {
			obj.updatedWithError.dispatch();
		}
	});
	// 
	
	
	// TODO do this after saving previous photo
	//var c = this.getUnansweredCount();
	//if (c > 0 && c < 5) {
	//	this.fetchQueue();
	//};
};
namespace('pat.photoInfoProvider');

pat.photoInfoProvider.AbstractPhotoInfoProvider = function() {
	this._cache = {};
	this._cacheIdChain = [];
	this._cacheSize = 42;
};
pat.photoInfoProvider.AbstractPhotoInfoProvider.prototype.load = function(id, callback) {
	var obj = this;
	if (!this._cache[id]) {
	    this._doLoad(id, function(info) {
	    	// Saving info into cache and cleaning cache if max size is exceeded
	    	obj._cache[id] = info;
	    	obj._cacheIdChain.push(id);
	    	if (obj._cacheIdChain.length > obj._cacheSize) {
	    		delete obj._cache[obj._cacheIdChain[0]];
	    		obj._cacheIdChain.shift();
	    	}
		    if (_.isFunction(callback))
				callback.call(obj, obj._cache[id]);
	    });
	} else {
	    if (_.isFunction(callback))
			callback.call(this, this._cache[id]);
	}
};
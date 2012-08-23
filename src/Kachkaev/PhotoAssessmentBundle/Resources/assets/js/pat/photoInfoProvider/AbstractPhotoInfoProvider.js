namespace('pat.photoInfoProvider');

pat.photoInfoProvider.AbstractPhotoInfoProvider = function() {
	this._cache = {};
	this._cacheIdChain = [];
	this._cacheSize = 42;
};
pat.photoInfoProvider.AbstractPhotoInfoProvider.prototype.getInfo = function(id) {
    if (this._cache[id]) {
    	return this._cache[id];
    }
    
    var info = this._doGetInfo(id);

    // Saving info into cache and cleaning cache if max size is exceeded
    this._cache[id] = info;
    this._cacheIdChain.push(id);
    if (this._cacheIdChain.length > this._cacheSize) {
    	delete this._cache[this._cacheIdChain[0]];
    	this._cacheIdChain.shift();
	}
    return info;
};
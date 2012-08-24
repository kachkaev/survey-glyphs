namespace('pat.photoInfoProvider');

pat.photoInfoProvider.PanoramioPhotoInfoProvider = function() {
	var apiKey = "cdb83b3afb639b56eb447ec7e23c20a3";
	this._apiURL = "http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key="
			+ apiKey
			+ "&format=json&nojsoncallback=1"
			+ "&photo_id=";
	
	this._widget = new panoramio.PhotoWidget($('<div/>').get(0));
	
};

pat.photoInfoProvider.PanoramioPhotoInfoProvider.prototype = new pat.photoInfoProvider.AbstractPhotoInfoProvider();

pat.photoInfoProvider.PanoramioPhotoInfoProvider.prototype._doLoad = function(params, callback) {
	var obj = this;
	var photoLoaded = function() {
		var photo = obj._widget.getPhoto();
		var info = {};
		
		panoramio.events.unlisten(obj._widget, panoramio.events.EventType.PHOTO_CHANGED, photoLoaded);

		if (photo) {
			info.permalink = photo.getPhotoUrl();
			info.title = photo.getPhotoTitle();
			info.user = photo.getOwnerName();
			info.status = 0;
			var pos = photo.getPosition();
			if (pos) {
				info.lon = pos.lon;
				info.lat = pos.lat;
			}
			info.imgSrc = "http://static.panoramio.com/photos/large/"+photo.getPhotoId()+".jpg";
		} else {
			info.status = 1;
		}
		callback.call(this, info);
	};
	
	var myRequest = new panoramio.PhotoRequest({
		  ids: [{'userId': params.userId, photoId: params.id}]
		});
	this._widget.setRequest(myRequest);
	this._widget.setPosition(0);
	panoramio.events.listen(this._widget, panoramio.events.EventType.PHOTO_CHANGED, photoLoaded);
};
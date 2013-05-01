namespace('pat.photoInfoProvider');

pat.photoInfoProvider.PanoramioPhotoInfoProvider = function() {
	var apiKey = "cdb83b3afb639b56eb447ec7e23c20a3";
	this._apiURL = "http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key="
			+ apiKey
			+ "&format=json&nojsoncallback=1"
			+ "&photo_id=";
	
	this._widgets = [];
	this._currentWidgetId = 0;
	for(var i=0; i<pat.photoInfoProvider.PanoramioPhotoInfoProvider.widgetCount; i++) {
		this._widgets[i] = new panoramio.PhotoWidget($('<div/>').get(0));
	}
	
	
};

pat.photoInfoProvider.PanoramioPhotoInfoProvider.widgetCount = 5;

pat.photoInfoProvider.PanoramioPhotoInfoProvider.prototype = new pat.photoInfoProvider.AbstractPhotoInfoProvider();

pat.photoInfoProvider.PanoramioPhotoInfoProvider.prototype._doLoad = function(params, callback) {
	var currentWidget = this._widgets[this._currentWidgetId];
	this._currentWidgetId = (this._currentWidgetId + 1) % pat.photoInfoProvider.PanoramioPhotoInfoProvider.widgetCount;
	
	var obj = this;
	var photoLoaded = null;
	photoLoaded = function() {
		var photo = currentWidget.getPhoto();
		var info = {
				source: "panoramio"
		};
		
		panoramio.events.unlisten(currentWidget, panoramio.events.EventType.PHOTO_CHANGED, photoLoaded);

		if (photo) {
			info.permalink = photo.getPhotoUrl();
			info.title = photo.getPhotoTitle();
			info.user = photo.getOwnerName();
	        info.faces500 = params.faces500;
			info.status = 0;
			var pos = photo.getPosition();
			if (pos) {
				info.lon = pos.lng;
				info.lat = pos.lat;
			}
			// Panoramio widget internals change, so we don't know for sure which parameter contains url
			try {
			    // Suppose that it's Ha (2012-01-28)
			    info.imgSrc = photo.Ia[0].url;
			} catch (e) {
			    // If not, looping through all array keys to find one
			    _.some(photo, function(v, k) {
			        try {
			            info.imgSrc = v[0].url;
			            return false;
			        } catch (e) {
			        }
			    });
			}
//			info.imgSrc = "http://static.panoramio.com/photos/large/"+photo.getPhotoId()+".jpg";
		} else {
			info.photoId = params.photoId;
			info.userId = params.userId;
			info.status = 1;
		}
		if (_.isFunction(callback))
			callback.call(obj, info);
	};
	
	var myRequest = new panoramio.PhotoRequest({
		  ids: [{'userId': params.userId, photoId: params.photoId}]
		});
	currentWidget.setRequest(myRequest);
	currentWidget.setPosition(0);
	panoramio.events.listen(currentWidget, panoramio.events.EventType.PHOTO_CHANGED, photoLoaded);
};
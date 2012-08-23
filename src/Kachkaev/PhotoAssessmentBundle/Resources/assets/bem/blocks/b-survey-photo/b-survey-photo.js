/**
 * Questionnaire is UI element accessible as a jQuery UI widget
 * 
 * Show info: $elem.bsurveyphoto('show', source, id, ready = function(status));
 * Preload info: value = $elem.bsurveyphoto('preload', source, id);
 * 
 * Event errorloading
 * 
 */
$.widget('ui.bsurveyphoto', {

	_init: function() {
		
		var w = {
				_self: this,
				element: this.element,
			};
		this.w = w;
		
		w.photo = w.element.find(".b-survey-photo__photo");
		w.title = w.element.find(".b-survey-photo__title");
		w.timestamp = w.element.find(".b-survey-photo__timestamp");
		w.user = w.element.find(".b-survey-photo__user");
		
		w.photoInfoProviders = {
			flickr: new pat.photoInfoProvider.FlickrPhotoInfoProvider(),
			panoramio: new pat.photoInfoProvider.PanoramioPhotoInfoProvider()
		};
	},

	preload: function(source, id) {
		this.w.photoInfoProviders[source].load(id, function(info) {
			if (info.status == 0)
				$([info.imgSrc]).preload();
		});
	},
	
	show: function(source, id) {
		var w = this.w;
		w.photoInfoProviders[source].load(id, function(info) {
			if (info.status == 0) {
				w.photo.attr('src', info.imgSrc);
				w.title.text('').text(info.title);
				w.user.text('').text(info.user);
				w.timestamp.text('').text(info.timestamp);
				w.element.attr('href', info.permalink);
			} else {
				console.log('photo deleted ', id);
			}
		});
	}
});
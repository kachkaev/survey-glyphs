/**
 * Takes photo info and displays it
 * 
 * Show photo: $elem.bsurveyphoto('showPhotoInfo', info);
 * Show loading: $elem.bsurveyphoto('showLoading');
 * Show loading: $elem.bsurveyphoto('showNothing');
 */
$.widget('ui.bsurveyphoto', {

    options: {
        facesAttributeName: null,
        editableFacesGroupIndex: null
    },
    
	_init: function() {
		var preloaderImg = '/static/i/b-survey-photo__loader.gif';
		var defaultHeight = 400;
		
		var w = {
				_self: this,
				$element: this.element,
				options: this.options
			};
		this.w = w;
		
		w.lastInfoHeight = defaultHeight;
		
		w.faceAlgorithmNames = _.keys(pat.config.faceAlgorithms);
		w.faceAlgorithmOptions = _.values(pat.config.faceAlgorithms);
		
		if (_.isNumber(w.options.editableFacesGroupIndex)) {
		    w.$info = $('<div class="b-survey-photo__info" />');
		} else {
		    w.$info = $('<a class="b-survey-photo__info" target="_blank"/>');
		}
		w.$infoPhoto = $('<img class="b-survey-photo__photo" />').appendTo(w.$info);
		w.$infoLogo = $('<span class="b-survey-photo__logo" />');//.appendTo(w.$info);
		w.$infoFacesWrap = $('<span class="b-survey-photo__faces-wrap" />').appendTo(w.$info);
		w.$infoFaces     = $('<span class="b-survey-photo__faces" />').appendTo(w.$infoFacesWrap);
		w.$infoTitle = $('<span class="b-survey-photo__title" />');//.appendTo(w.$info);

		if (_.isNumber(w.options.editableFacesGroupIndex)) {
		    w.$infoTimestampanduser = $('<span class="b-survey-photo__timestampanduser" />').appendTo(w.$info);
		    w.$infoFaces.addClass('b-survey-photo__faces_editable');
		    w.$infoFaces.boxer({
		        stop: function(event, ui) {
		            w.addFace(ui.box);
		           }
		    });
		} else {
		    w.$infoTimestampanduser = $('<span class="b-survey-photo__timestampanduser" />').appendTo(w.$info);
		}
		 
		w.$loading = $('<div class="b-survey-photo__loading"/>').append($('<img/>', {src: preloaderImg}));
		$.preload([preloaderImg]);
		
		w.$error = $('<div class="b-survey-photo__error"/>').text('Error loading photograph. It seems like it was just deleted or got hidden.');
		
		setInterval(function(){
		        w._self._resizeFacesIfNeeded();
		    }, 100);
		
		
		 w.deleteFace = function(event) {
		        var normalisedFaceCoordinates = $(event.currentTarget).data('coordinates');
		        var allFaces = w.$infoFaces.data('faces');
		        var currentFaces = allFaces[w.options.editableFacesGroupIndex];
		        var photoId = w.$infoFaces.data('photoId');
		        
		        currentFaces = _.without(currentFaces, normalisedFaceCoordinates);
		        
		        w._self._trigger('faceschanged', null, {
		            photoInternalId: w.$infoFaces.data('photoInternalId'),
		            facesAttributeName: w.options.facesAttributeName,
		            group: w.options.editableFacesGroupIndex,
		            faces: currentFaces }
		        );
		    };
		    
		 w.addFace = function(box) {
		     var allFaces = w.$infoFaces.data('faces');
             var currentFaces = allFaces[w.options.editableFacesGroupIndex];
             var photoId = w.$infoFaces.data('photoId');

             var imageWidth = w.$infoFacesWrap.width();
             var imageHeight = w.$infoFacesWrap.height();
             var imageSize = Math.max(imageWidth, imageHeight);
             
             if (box.left < 0) {
                 box.left = 0;
             }
             if (box.top < 0) {
                 box.top = 0;
             }
             if (box.left + box.width > imageWidth) {
                 box.width = imageWidth - box.left;
             }
             if (box.top + box.height > imageHeight) {
                 box.height = imageHeight - box.top;
             }
             
             var centeredBox = [
                    box.left + box.width / 2,
                    box.top + box.height / 2,
                    box.width,
                    box.height
                 ];
             
             var normalisedFaceCoordinates256 = [
                     Math.round(centeredBox[0]/imageSize * 255),
                     Math.round(centeredBox[1]/imageSize * 255),
                     Math.floor(centeredBox[2]/imageSize * 255),
                     Math.floor(centeredBox[3]/imageSize * 255)
                 ];
             var normalisedFaceCoordinates = [
                      normalisedFaceCoordinates256[0]/255,
                      normalisedFaceCoordinates256[1]/255,
                      normalisedFaceCoordinates256[2]/255,
                      normalisedFaceCoordinates256[3]/255
                  ];
             currentFaces.push(normalisedFaceCoordinates);
             w._self._trigger('faceschanged', null, {
                 photoInternalId: w.$infoFaces.data('photoInternalId'),
                 facesAttributeName: w.options.facesAttributeName,
                 group: w.options.editableFacesGroupIndex,
                 faces: currentFaces }
             );
		 };
	},

    _resizeFacesIfNeeded: function() {
        var w = this.w;
        
        var ifwWidth = w.$infoFacesWrap.width();
        var ifwHeight = w.$infoFacesWrap.height();
        var ipWidth = w.$infoPhoto.innerWidth();
        var ipHeight = w.$infoPhoto.innerHeight();
        
        if (ifwWidth == ipHeight && ifwHeight == ipHeight) {
            return;
        }
        
        w.$infoFacesWrap.width(ipWidth);
        w.$infoFacesWrap.height(ipHeight);
        
        var maxDimension = Math.max(ipWidth, ipHeight);
        w.$infoFaces.width(maxDimension);
        w.$infoFaces.height(maxDimension); 
    },

    showNothing: function() {
		this.w.$element.children().detach();
	},

	showLoading: function() {
		var w = this.w;
		
		w.$element.children().detach();
		w.$element.append(w.$loading);
	},
	
	showPhotoInfo: function(info) {
		var w = this.w;
		if (info.status === 0) {
			w.$infoPhoto.attr('src', '');
			w.$infoPhoto.attr('src', info.imgSrc);
			w.$infoTitle.text('').text(info.title);
			w.$infoTimestampanduser.text('').text(/*(info.timestamp ? info.timestamp + " " : "") + */"© " + info.user + ' (' + _.capitalize(info.source) + ')');
			if (_.isNumber(w.options.editableFacesGroupIndex)) {
			    w.$infoTimestampanduser.attr('href', info.permalink);
			} else {
			    w.$info.attr('href', info.permalink);
			}
			w.$infoLogo.removeClass("flickr panoramio geograph picasa").addClass(info.source);
			w.$element.children().detach();
			w.$element.append(w.$info);
			w.lastInfoHeight = w.$info.height();
			if (w.options.facesAttributeName && info[w.options.facesAttributeName] != undefined) {
			    w.$infoFacesWrap.hide();
			    w.$infoFaces.children().detach();
                var faces = info[w.options.facesAttributeName];
                for(var i = 0; faces[i] != undefined; ++i) {
                    var currentAlgorithmFaces = faces[i];
                    for (var j = currentAlgorithmFaces.length - 1; j >= 0; --j) {
                        var currentFaceCoordinate = currentAlgorithmFaces[j];
                        var faceAlgorithmName = w.faceAlgorithmNames[i];
                        if (!w.faceAlgorithmOptions[i].visible) {
                            continue;
                        }
                        w.$infoFaces.append($('<div class="b-survey-photo__face"/>')
                                .on('dblclick', w.deleteFace)
                                .data('coordinates', currentFaceCoordinate)
                                .attr('title', faceAlgorithmName)
                                .css({
                            'border-color': w.faceAlgorithmOptions[i].colorPreview,
                            'left': (currentFaceCoordinate[0] - currentFaceCoordinate[2] / 2) * 100 + '%',
                            'top':  (currentFaceCoordinate[1] - currentFaceCoordinate[3] / 2) * 100 + '%',
                            'width':  currentFaceCoordinate[2] * 100 + '%',
                            'height': currentFaceCoordinate[3] * 100 + '%'
                        }));
                    }
                }
                w.$infoFaces.data('faces', info[w.options.facesAttributeName]);
                w.$infoFaces.data('photoInternalId', info.internalId);
                w.$infoFacesWrap.show();
			} else {
			    w.$infoFacesWrap.hide();
			}
			
		} else {
			w.$element.children().detach();
			w.$element.append(w.$error);
		};
	},
	
	isShowingError: function() {
		return this.w.$error.parent().length != 0;
	}
});
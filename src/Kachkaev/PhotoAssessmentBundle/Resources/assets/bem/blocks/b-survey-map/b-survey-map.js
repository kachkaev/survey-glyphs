/**
 * Survey map is UI element accessible as a jQuery UI widget
 * 
 * Position is null or an array with 2 elements: [lon, lat]
 * 
 * Set given position: $bsurveymap('option', 'given_pos', value);
 * Get given position: $bsurveymap('option', 'given_pos');
 *  
 * Set altered position: $bsurveymap('option', 'altered_pos', value);
 * Get altered position: $bsurveymap('option', 'altered_pos');
 * 
 * Events: marker dragged
 * changealter_pos
 * TODO
 */
$.widget('ui.bsurveymap', {

	options: {
		given_pos: null,
		altered_pos: null,
		zoom_level: 17
	},

	_init: function() {
		var w = {
				_self: this,
				element: this.element,
			};
		this.w = w;
		
	    var myOptions = {
            zoom : this.options.zoom_level,
            center : new google.maps.LatLng(0,0),
            disableDefaultUI: true,
			mapTypeId : google.maps.MapTypeId.SATELLITE,
            keyboardShortcuts: false,	
            zoomControl: true,
            zoomControlOptions: {
              style: google.maps.ZoomControlStyle.SMALL
            },
            styles:
                [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers:
                        [
                            {
                                visibility: "off"
                            }
                        ]
                    }
                ]
        };

	    var map = new google.maps.Map(this.element.get(0),
	            myOptions);
	    w.map = map;
	    
	    // Removing tabstop within the map
	    google.maps.event.addListenerOnce(map, 'idle', function(){
	    	w.element.find('a').attr('tabindex', -1);
	    });
	    
	    // Markers
	    //// Icons
	    var iconMainOKSrc = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|1cb658";
	    var iconMainAlteredSrc = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|fffb70";
	    var iconMainWrongSrc = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|ff7b68";
	    var iconHelperSrc = "/static/i/b-survey-map__circle.png";
	    $.preload([iconMainOKSrc, iconMainAlteredSrc, iconMainWrongSrc, iconHelperSrc, "http://maps.gstatic.com/mapfiles/closedhand_8_8.cur", "http://maps.gstatic.com/mapfiles/drag_cross_67_16.png"]);
	    
	    var iconMainOK = new google.maps.MarkerImage(iconMainOKSrc,
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconMainAltered = new google.maps.MarkerImage(iconMainAlteredSrc,
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconMainWrong = new google.maps.MarkerImage(iconMainWrongSrc,
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconHelper = new google.maps.MarkerImage(iconHelperSrc,
    	        new google.maps.Size(10, 10),
    	        new google.maps.Point(3, 3),
    	        new google.maps.Point(5, 5));
	    //// Main marker points to altered position or given position, if altered is null or the same.
	    var mainMarker = new google.maps.Marker({
	    	icon: iconMainOK,
	    	position: null,
	    	map: map,
	    	draggable: true,
	    	zIndex: 2,
	    });
	    //// Helper marker is only visible when altered position is not equal to given one.
	    var helperMarker = new google.maps.Marker({
	    	icon: iconHelper,
	        position: null,
	        map: map,
	        zIndex: 1,
	      });
	    w.helperMarker = helperMarker;
	    w.mainMarker = mainMarker;
	    
	    // Helper conversion functions
	    var posToLatLon = function(pos) {
	    	if (_.isArray(pos) && pos.length == 2)
	    		return new google.maps.LatLng(pos[1], pos[0]);
    		if (pos == null)
    			return null;
    		else
    			return pos;
	    };
	    var posToArray = function (pos) {
	    	if (pos == null)
	    		return null;
	    	return [pos.lng(), pos.lat()]; 
	    };
	    w.posToLatLon = posToLatLon;
	    w.posToArray = posToArray;
	    	    
	    /**
	     * Moves and shows/hides markers according to options
	     */
    	var updateMarkers = function(needMapCentering) {
    		var pGiven = posToLatLon(w._self.options.given_pos);
    		var pAltered = posToLatLon(w._self.options.altered_pos);
    		var pCenter = null;
    		if (pGiven == null) {
    			mainMarker.setVisible(false);
    			helperMarker.setVisible(false);
    		} else {
    			if (pAltered == null || pGiven.equals(pAltered)) {
    				mainMarker.setVisible(true);
    				mainMarker.setPosition(pGiven);
    				mainMarker.setIcon(pAltered == null ? iconMainWrong : iconMainOK);
    				helperMarker.setVisible(true);
    				helperMarker.setPosition(pGiven);
    				pCenter = pGiven;
    			} else {
    				mainMarker.setVisible(true);
    				mainMarker.setPosition(pAltered);
    				mainMarker.setIcon(iconMainAltered);
    				helperMarker.setVisible(true);
    				helperMarker.setPosition(pGiven);
    				pCenter = pAltered;
    			}
    		}
    		if (needMapCentering && pCenter && (_.isUndefined(map.getBounds()) || !map.getBounds().contains(pCenter))) {
    			map.panTo(pCenter);
    			//w.map.setCenter(pCenter);
    		}
	    };
	    this.w.updateMarkers = updateMarkers;
	    
		//// Adding dragging event listeners
	    google.maps.event.addListener(mainMarker, 'dragstart', function() {
	    	mainMarker.setIcon(iconMainAltered);
	    });
	    
	    google.maps.event.addListener(mainMarker, 'drag', function() {
	    	w._self._setAlteredPos(posToArray(mainMarker.getPosition()), false);
	    });
	    
	    google.maps.event.addListener(mainMarker, 'dragend', function() {
	    	w._self._setAlteredPos(posToArray(mainMarker.getPosition()), false);
	    });
	    
	    // Adding click events
	    google.maps.event.addListener(mainMarker, 'dblclick', function() {
	    	w._self._setAlteredPos(w._self.options.altered_pos == null ? w._self.options.given_pos : null, true);
	    });
	    google.maps.event.addListener(helperMarker, 'dblclick', function() {
	    	w._self._setAlteredPos(w._self.options.altered_pos == null ? w._self.options.given_pos : null, true);
	    });
	    
	    // Listening to zoom change
	    google.maps.event.addListener(map, 'zoom_changed', function() {
	        w._self._setOption("zoom", map.getZoom());
	      });


	},
	
	_setAlteredPos: function (value, needMapCentering) {

		if (_.isEqual(this.options.altered_pos, value)) {
			return;
		}
		$.Widget.prototype._setOption.apply( this, ["altered_pos", value] );
		this._trigger("changealtered_pos");
		this.w.updateMarkers(needMapCentering);
	},
	
	_setOption: function (key, value) {
		switch (key) {
			case 'altered_pos':
				this._setAlteredPos(value, true);
				$.Widget.prototype._setOption.apply( this, arguments );
				return;
			case 'given_pos':
				$.Widget.prototype._setOption.apply( this, arguments );
		    	this.w.updateMarkers(true);
		    	return;
			case 'disabled':
				this.w.map.setOptions({
					disableDoubleClickZoom: value,
					scrollwheel: !value,
					zoomControl: !value,
					draggable: !value,
				});
				this.w.mainMarker.setOptions({draggable: !value, clickable: !value});
				this.w.helperMarker.setOptions({clickable: !value});
				$.Widget.prototype._setOption.apply( this, arguments );
				return;
			case 'zoom_level':
				try {
					this.w.map.setOptions({
						zoom: value
					});
				} catch (e) {
					return;
				}
				if (this.w.map.getZoom() === value)
					$.Widget.prototype._setOption.apply( this, arguments);
				return;
			default:
				return;
			
		}
	},
	
	posIsAccurate: function() {
		return _.isEqual(this.options.altered_pos, this.options.given_pos) && this.options.given_pos != null;
	},
	
	setGivenAndAlteredPos: function(given_pos, altered_pos) {
		this.options.given_pos = given_pos;
		this.options.altered_pos = altered_pos;
		this._trigger("changealtered_pos");
		this.w.updateMarkers(true);
	}

});

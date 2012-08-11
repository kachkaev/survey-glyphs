/**
 * Survey map is UI element accessible as a jQuery UI widget
 * 
 * Position is null or an array with 2 elements: [lon, lat]
 * 
 * Set given position: $bquestionnaire('option', 'given_pos', value);
 * Get given position: $bquestionnaire('option', 'given_pos');
 *  
 * Set altered position: $bquestionnaire('option', 'altered_pos', value);
 * Get altered position: $bquestionnaire('option', 'altered_pos');
 * 
 * Check if position has been altered (returns true/false)
 * $bquestionnaire('isPositionAltered')
 * TODO
 * 
 * Events: marker dragged
 * TODO
 */
$.widget('ui.bsurveymap', {

	options: {
		given_pos: null,
		altered_pos: null
	},

	_init: function() {
		var w = {
				_self: this,
				element: this.element,
			};
		this.w = w;
		
	    var myOptions = {
            zoom : 18,
            center : new google.maps.LatLng(0,0),
            mapTypeId : google.maps.MapTypeId.SATELLITE,
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
	    var iconMainGiven = new google.maps.MarkerImage("http://maps.google.com/mapfiles/marker_green.png",
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconMainAltered = new google.maps.MarkerImage("http://maps.google.com/mapfiles/marker_yellow.png",
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconMainWrong = new google.maps.MarkerImage("http://maps.google.com/mapfiles/marker_red.png",
    	        new google.maps.Size(21, 34),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(10, 34));
	    var iconHelper = new google.maps.MarkerImage("/static/i/b-survey-map__circle.png",
    	        new google.maps.Size(16, 16),
    	        new google.maps.Point(0,0),
    	        new google.maps.Point(8, 8));
	    //// Main marker points to altered position or given position, if altered is null or the same.
	    var mainMarker = new google.maps.Marker({
	    	icon: iconMainGiven,
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
    	var updateMarkers = function(centerMap) {
    		var pGiven = posToLatLon(w._self.options.given_pos);
    		var pAltered = posToLatLon(w._self.options.altered_pos);
    		var pCenter = null;
    		if (pGiven == null) {
    			mainMarker.setVisible(false);
    			helperMarker.setVisible(false);
    		} else if (pAltered == null || pGiven.equals(pAltered)) {
    			mainMarker.setVisible(true);
    			mainMarker.setPosition(pGiven);
    			mainMarker.setIcon(iconMainGiven);
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
    		
    		if (centerMap && pCenter) {
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
	    	w._self.options.altered_pos = posToArray(mainMarker.getPosition());
	    });
	    
	    google.maps.event.addListener(mainMarker, 'dragend', function() {
	    	w._self.options.altered_pos = posToArray(mainMarker.getPosition());
	    	updateMarkers();
	    });
	    
	    // Adding click events
	    google.maps.event.addListener(mainMarker, 'dblclick', function() {
	    	w._self._setOption("altered_pos", null);
	    	w.updateMarkers();
	    });
	    google.maps.event.addListener(helperMarker, 'dblclick', function() {
	    	w._self._setOption("altered_pos", null);
	    	w.updateMarkers();
	    });

	},
	
	_setOption: function (key, value) {
		switch (key) {
			case 'given_pos':
			case 'altered_pos':
				$.Widget.prototype._setOption.apply( this, arguments );
		    	this.w.updateMarkers(true);
		    	return;
			default:
				return;
		}
		$.Widget.prototype._setOption.apply( this, arguments );
	},
	
	isPositionAltered: function () {
		if (this.options.altered_pos == null || this.options.given_pos == null)
			return false;
		if (this.options.given_pos.equals(this.options.altered_pos))
			return false;
		return true;
	}

});

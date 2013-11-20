(function(){

var NODE_SIZE = 2;
var HIGHLIGHTED_NODE_SIZE = 4;
var SELECTED_NODE_SIZE = 4;

var ANIMATION_LENGTH = 0;
var ANIMATION_EASING = 'in-out';

var MOUSE_WINDOW_X = 6;
var MOUSE_WINDOW_Y = 6;

$.widget('ui.bphotomap', {

    options: {
        photos: [],
        selectedItemId: null,
        highlightedItemsIds: [],
        bbox: [-0.21, 51.46, 0.02, 51.56],
        pixelBbox: [6, 180, 213, 35]
    },
    
    _init: function() {
        
        var w = {
                _self: this,
                $element: this.element,
                options: this.options
            };
        this.w = w;


        // =====================================
        // Objects with UI
        // =====================================

        w.$element
            .find('.b-photomap__copyright_visibility_hidden')
            .removeClass('b-photomap__copyright_visibility_hidden');
        
        w.$map = $('<div/>').addClass('b-photomap__map').appendTo(w.$element);
        // Hint
//        w.$hint = $('<div/>').addClass('b-photoresponsepattern__hint').appendTo(w.$element);
        
        // SVG 
        w.d3SvgCanvas = d3.select(w.$element.get(0))
            .append('svg:svg')
            .attr('class', 'b-photomap__points-container')
            .attr('width', w.$element.width())
            .attr('height', w.$element.height());
        // groups
        w.d3SvgCanvas.append('g')
            .attr('class', 'points');

        w.$svgCanvas = w.$element.find('svg');
        
        
        w.$mouseHandler = $('<div/>').addClass('b-photomap__mouse-handler').appendTo(w.$element);
        //w.$mouseHandler
//            .attr('width', w.$element.width())
//            .attr('height', w.$element.height());

        var x2lon = d3.scale.linear()
            .domain([w.options.pixelBbox[0], w.options.pixelBbox[2]])
            .range([w.options.bbox[0], w.options.bbox[2]]);

        // y - domain depends on time scaling
        var y2lat = d3.scale.linear()
                .domain([w.options.pixelBbox[1], w.options.pixelBbox[3]])
                .range([w.options.bbox[1], w.options.bbox[3]]);

        w.$mouseHandler.on('mouseenter mousemove', function(e) {
            var x = e.offsetX;
            var y = e.offsetY;
            var minLon = x2lon(x - MOUSE_WINDOW_X / 2);
            var maxLon = x2lon(x + MOUSE_WINDOW_X / 2);
            var minLat = y2lat(y + MOUSE_WINDOW_Y / 2);
            var maxLat = y2lat(y - MOUSE_WINDOW_Y / 2);
            
            var newHighlighted = [];
            _.each(w.options.photos, function(photo) {
                if (photo.lon >= minLon && photo.lon <= maxLon && photo.lat >= minLat && photo.lat <= maxLat) {
                    newHighlighted.push(parseInt(photo.id));
                };
            });
            //console.log(newHighlighted, minLon, minLat, maxLon, maxLat, x, y);
            w._self._setOption('highlightedItemsIds', newHighlighted);
        });

        w.$mouseHandler.on('click', function(e) {
            var currentSelectedItemId = w.options.selectedItemId;
            var currentHighlightedItemIds = w.options.highlightedItemsIds;
            currentHighlightedItemIds = currentHighlightedItemIds.sort();
            if (!currentHighlightedItemIds || !currentHighlightedItemIds.length) {
                w._self._setOption('selectedItemId', null);
            } else {
                var index = _.indexOf(currentHighlightedItemIds, currentSelectedItemId);
                if (index == -1 || index == currentHighlightedItemIds.length - 1) {
                    index = 0;
                } else {
                    index += 1;
                }
                w._self._setOption('selectedItemId', currentHighlightedItemIds[index]);
            }
        });
        
        w.$mouseHandler.on('mouseleave', function(e) {
            w._self._setOption('highlightedItemsIds', null);
        });

        // =====================================
        // Event handling
        // =====================================
        w._self._redraw();
    },
    
    _redraw: function() {
        var w = this.w;
        
        var d3points = w.d3SvgCanvas.select('g.points');
       
        d3points.attr('width', function()  { return w.d3SvgCanvas.attr('width');});
        d3points.attr('height', function() { return w.d3SvgCanvas.attr('height');});

        // Scaling
        // x - always the same
        //console.log(photoResponses.size(), photoResponses);
        
        var x = d3.scale.linear()
                .range([w.options.pixelBbox[0], w.options.pixelBbox[2]])
                .domain([w.options.bbox[0], w.options.bbox[2]]);
        
        // y - domain depends on time scaling
        var y = d3.scale.linear()
                .range([w.options.pixelBbox[1], w.options.pixelBbox[3]])
                .domain([w.options.bbox[1], w.options.bbox[3]]);
        
        // SVG Line generator
//        var line = d3.svg.rect()
//            .x(function(d){return x(d[0]);})
//            .y(function(d){return y(d[1]);})
//            .interpolate('linear'); 

        //console.log(w.options.photos,d3points,d3points.selectAll('rect'), w.options.highlightedItemsIds);
        var dataToShow = [];
        _.each(w.options.photos, function(photoInfo) {
            //console.log(w.options.highlightedItemsIds, photoInfo.id, _.indexOf(w.options.highlightedItemsIds, photoInfo.id));
            dataToShow.push([
                    photoInfo.id,  // 0
                    photoInfo.lon, // 1
                    photoInfo.lat, // 2
                    _.isArray(w.options.highlightedItemsIds)  && _.indexOf(w.options.highlightedItemsIds, parseInt(photoInfo.id, 10)) !== -1,
                    w.options.selectedItemId == photoInfo.id // 4
                ]);
        });
        //console.log(w.options.highlightedItemsIds, dataToShow);
        var d3point = d3points.selectAll('rect').data(_.toArray(dataToShow), function(d) {
            return JSON.stringify(d);
        });

        
        d3point.enter()
            .append('rect')
         .each(function(d) {

//             console.log(d);
             var s = d3.select(this);
             //s.transition().duration(0).ease(ANIMATION_EASING);
             var currentClass = '';
             
             var nodeSize = NODE_SIZE   ;
             if (d[4]) {
                 currentClass = 'selected';
                 nodeSize = SELECTED_NODE_SIZE;
             } else if (d[3]) {
                 currentClass = 'highlighted';
                 nodeSize = HIGHLIGHTED_NODE_SIZE;
             };
             
             s.attr({
                 'x': x(d[1]) - nodeSize/2,
                 'y': y(d[2]) - nodeSize/2,
                 'width': nodeSize,
                 'height': nodeSize,
                 'class': currentClass
             });
         });
         
         // Exit
        d3point.exit()
            ///.transition().duration(ANIMATION_LENGTH).ease(ANIMATION_EASING)
            .style('opacity',0)
            .remove();
    },
    
    _setOption: function (key, value) {
        var w = this.w;

        // Check if value matches what it was, do nothing if yes
        if (value === w.options[key] || (_.isArray(value) && _.isEqual(value, w.options[key]))) {
            return;
        }

        var prev = w.options[key];
        $.Widget.prototype._setOption.apply( this, arguments );

        switch (key) {
            case 'photos':
            case 'selectedItemId':
            case 'highlightedItemsIds':
                this._redraw();
        }
        w._self._trigger("change" + key.toLowerCase(), null, {newValue: value, prevValue: prev});
    }
});
}());
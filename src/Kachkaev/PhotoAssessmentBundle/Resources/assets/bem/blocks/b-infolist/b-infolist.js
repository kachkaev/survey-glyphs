(function() {

var PHOTO_RESPONSE_ALL = -42; // used as key for all response counts
var PHOTO_RESPONSE_UNANSWERED = 0;
var PHOTO_RESPONSE_INCOMPLETE = 1;
var PHOTO_RESPONSE_COMPLETE = 2;
var PHOTO_RESPONSE_PHOTO_PROBLEM = 0x10;

var useQuicksand = false;

$.widget('ui.bInfoList', {

	_init: function() {
	    // Options are being extended with defaults (except for items that should not be cloned)
	    var items = this.options.items || [];
	    this.options.items = null;
        this.options = _.extend({
            sortMode: 'id',
            items: [],
            dblclickAction: null,
            customizeItem: null,
            mouseHoverDelay: 50,
            currentId: null,
            highlightedIds: null,
            sortModes: ['id', 'completed', 'problems']
        }, this.options);
        this.options.items = items;
        var defaultCurrentId = this.options.currentId;
        var defaultHighlightedIds = this.options.highlightedIds;
        
        var w = {
				_self: this,
				$element: this.element,
				options: this.options
			};
		this.w = w;

        w.$percentage = $('<div/>').addClass('b-infolist__percentage');
		w.$sorters = $('<ul/>').addClass("b-infolist__sorters").disableSelection();
		_.each(w.options.sortModes, function(sortMode) {
		    w.$sorters.append($('<li/>').addClass('b-infolist__sorter').attr('data-mode', sortMode).append($('<i/>').text(sortMode)));
		});
		w.$items = $('<ul/>').addClass("b-infolist__items");
		w.$resizeBlind = $('<div/>').addClass("b-infolist__resize-blind");
		w.itemsMap = {};
		w.$itemsMap = {};
		w.options.currentId = null;
        w.mouseId = null;
		w.mouseIdChangerHash = null;
		w.$currentItem = null;
		w.$highlightedItems = null;
		
		// Sorters events
		
		w.$sorters.children().click(function() {
		    var $this = $(this);
		    w._self.sortItemsBy($this.data('mode'));
		});

		// Item events
		//// Changes mouse id when hover
		var triggerMouseoveritemWithDelay = function(id) {
		    if (w.mouseId === id)
		        return;
		    var mouseIdChangerHash = Math.random();
		    w.mouseIdChangerHash = mouseIdChangerHash;
		    setTimeout(function() {
		        if (w.mouseIdChangerHash === mouseIdChangerHash) {
		            w._self._trigger("hoveroveritem", null, {id: id, itemData: w.itemsMap[id]});
		            w.mouseId = id;
		        }
		    }, w.options.mouseHoverDelay);

		    // updates percentage
            setTimeout(function() {
                if (w.mouseId === id)
                    return;
                if (id === null) {
                    w.$percentage.text('');
                } else {
                    var itemsTotal = _.size(w.$itemsMap);
                    var currentIndex = w.$itemsMap[id].index();
                    w.$percentage.text(Math.floor((currentIndex + 1)/itemsTotal*100) + '%');
                }
            }, 20);
		};
		
		//// Hover over
		var onItemHoverOver = function() {
            var $this = $(this);
            triggerMouseoveritemWithDelay($this.data('id'));
		};
		
		//// Hover out
		var onItemHoverOut = function() {
            triggerMouseoveritemWithDelay(null);
		};

		// Click
		var onItemClick = function() {
		    var $this = $(this);
		    w._self.setCurrentItemId($this.data('id'));
        };

        // Double click
        var onItemDblClick = function() {
        };

        // Populate items
		_.each(w.options.items, function(itemData) {
		    var id = itemData.id;
		    var $item = $('<li/>').addClass('b-infolist__item');
		    var addItem = true;
		    $item.click(onItemClick);
		    $item.mouseenter(onItemHoverOver);
		    $item.mouseleave(onItemHoverOut);
		    if (_.isFunction(w.options.dblclickAction)) {
		        $item.dblclick(w.options.dblclickAction);
		    }

		    $item.attr('data-id', id);
		    $item.data('data', itemData);
		    if (_.isFunction(w.options.customizeItem)) {
		        if (false === w.options.customizeItem($item, id, itemData)) {
		            addItem = false;
		        }
		    }
		    if (addItem) {
	            $item.tooltip({
	                position: {
	                    my: "left top",
	                    at: "right bottom-1"
	                },
	                tooltipClass: "b-infolist__tooltip",
	            });
		        $item.appendTo(w.$items);
		        w.itemsMap[id] = itemData;
		        w.$itemsMap[id] = $item;
		    }
		});
		
		// sort items
		w._self.sortItemsBy(w.options.sortMode, false, true);
		
		// Make the element resizable with constraints taken from css
		w.$element.resizable({
		    maxHeight: w.$element.css('maxHeight'),
		    maxWidth: w.$element.width(),
		    minHeight: w.$element.css('minHeight'),
		    minWidth: w.$element.width(),
		    handles: 's',
		    start: function() {
		        w.$resizeBlind.appendTo('body');
		    },
		    stop: function() {
		        w.$resizeBlind.detach();
		    }
		});
		
        w._self.setCurrentItemId(defaultCurrentId);
        w._self.setHighlightedItemIds(defaultHighlightedIds);

        w.$element.append(w.$percentage, w.$sorters, w.$items);
	},
	
	sortItemsBy: function(mode, isDescending, forceNoAnimation) {
	    var w = this.w;
	    
	    var currentIsDescending = null;
	    
	    // Check whether sort mode has been changed, update interface if needed and exit otherwise
	    var $currentModeNode = w.$sorters.find('.ascending, .descending');
	    if ($currentModeNode.length) {
	        currentIsDescending = $currentModeNode.hasClass('descending');
	        $currentModeNode.removeClass('ascending descending');
	        if (_.isUndefined(isDescending)) {
	            if ($currentModeNode.data('mode') == mode) {
	                isDescending = !currentIsDescending;
	            } else {
	                isDescending = false;
	            }
	        } else {
	            if ($currentModeNode.data('mode') == mode && $currentModeNode == $currentModeNode) {
	                return;
	            }
	        }
	    }
	    
	    var $newModeNode = w.$sorters.find('[data-mode="' + mode + '"]');
	    $newModeNode.addClass(isDescending ? 'descending' : 'ascending');
	    
        // Get list of new ids, if the sequence matches the old one, exit
	    var oldIds = _.map(w.options.items, function(item) {
	        return item.id;
	    });
	    
	    var newItems = _.sortBy(w.options.items, function(item) {
	       var id = item.id < 0 ? 9999 : parseInt(item.id, 10);
	       switch (mode) {
	       case "completed":
	           return item.photoResponseCounts[PHOTO_RESPONSE_COMPLETE] * 10000 + id;
	           
	       case "problems":
               return item.photoResponseCounts[PHOTO_RESPONSE_PHOTO_PROBLEM] * -10000 + id;

           case "unread":
               return (item.isUnread ? -10000 : 0) + id;

           case "id":
	       default:
	           return id;
	       
	       }
	    });
	    
	    if (isDescending) {
	        newItems.reverse();
	    }
	    
	    var newIds = _.map(newItems, function(item) {
            return item.id;
        });
	    
	    if (_.isEqual(oldIds, newIds))
	        return;
	    
	    // Sort using quicksand
	    if (useQuicksand) {
	        // Generate a list of new ui objects to then pass them to sandbox 
	        var $newItems = $();
	        _.each(newIds, function(id) {
	            if (!w.$itemsMap[id])
	                return;
	            $newItems = $newItems.add($('<li/>').addClass('b-infolist__item-placeholder').attr('data-id', id));
	        });
	        
	        w.$items.quicksand($newItems, {
	            //atomic: true,
	            useScaling: false,
	            adjustHeight: false,
	            adjustWidth: false,
	        });
	        
	    } else {
	        var oldScrollTop = w.$items.scrollTop();
	        //w.$items.empty();
	        w.$items.detach();
	        _.each(newIds, function(id) {
                if (!w.$itemsMap[id])
                    return;
	            w.$items.append(w.$itemsMap[id]);
	        });
	        w.$items.appendTo(w.$element);
	        w.$items.scrollTop(oldScrollTop);
	    }
	    w.options.items = newItems;
	},

	/** Update items
	 */
	updateItems: function(ids) {
		var w = this.w;

		if (!_.isArray(ids)) {
		    ids = _.keys(w.options.items);
		}
		
		w.$items.detach();
        if (_.isFunction(w.options.customizeItem)) {
            _.each(ids, function(id) {
                var $item = w.$itemsMap[id];
                w.options.customizeItem($item, id, w.itemsMap[id]);
            });
        }

        w.$items.appendTo(w.$element);
	},
	
	setCurrentItemId: function(newId) {
		var w = this.w;

		if (newId == w.options.currentId)
			return false;

		if (w.$currentItem) {
			w.$currentItem.removeClass('current');
		}
		
		var $newCurrentItem = w.$itemsMap[newId];
		
		if ($newCurrentItem) {
		    $newCurrentItem.addClass('current');
		    w.options.currentId = newId;
		    w.$currentItem = $newCurrentItem;
		    w.$currentItem.scrollintoview();
		}
		w._self._trigger("changeitem", null, {id: newId, itemData: w.itemsMap[newId]});
	},

    setHighlightedItemIds: function(newIds) {
        var w = this.w;

        if (_.isEqual(newIds, w.options.highlightedIds))
            return false;

        if (w.$highlightedItems) {
            w.$highlightedItems.removeClass('highlighted');
        }
        
        var $newHighlightedItemElements = [];
        _.each(newIds, function(id) {
            $newHighlightedItemElements.push(w.$itemsMap[id][0]);  
        });
        var $newHighlightedItems = $($newHighlightedItemElements);
        $newHighlightedItems.addClass('highlighted');
        w.options.highlightedIds = newIds;
        w.$highlightedItems = $newHighlightedItems;
        w._self._trigger("highlightitems", null, {ids: newIds});
    }

});
}());
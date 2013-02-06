(function() {
$.widget('pat.binfolist', {

    options: {
        sortModes: ['id', 'completed', 'problems'],
        sortMode: 'id',
        sortOrderIsDescending: false,
        items: [],
        selectedItemId: null,
        highlightedItemsIds: [],

        viewModeShowThumbnails: false,
        viewModeShowProblems: false,
        
        disableThumbnails: true,

        customizeItem: null,  // function
        dblclickAction: null, // function
        mouseHoverDelay: 50,
    },
    
    /**
     * @memberOf pat.binfolist
     */
	_create: function() {
	    // Options are being extended with defaults (except for items that should not be cloned)
        var defaultselectedItemId = this.options.selectedItemId;
        var defaulthighlightedItemsIds = this.options.highlightedItemsIds;
        
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
		w.$hint = $('<div/>').addClass('b-infolist__hint');
		w.itemsMap = {};
		w.$itemsMap = {};
		w.options.selectedItemId = null;
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
		    if (w.mouseId === id && id !== null)
		        return;
		    var mouseIdChangerHash = Math.random();
		    w.mouseIdChangerHash = mouseIdChangerHash;
		    setTimeout(function() {
		        if (w.mouseIdChangerHash === mouseIdChangerHash) {
		            w._self._trigger("hoveroveritem", null, {id: id, itemData: w.itemsMap[id]});
		            w.mouseId = id;
		            w._self._updateHintUsingMouseData();
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
		
        w._self.setCurrentItemId(defaultselectedItemId);
        w._self.setHighlightedItemIds(defaulthighlightedItemsIds);
        w._self.setDisableThumbnails(w.options.disableThumbnails, true);

        w.$element.append(w.$percentage, w.$sorters, w.$items, w.$hint);
        
        w._self._updateHintPos();
	},
	
	sortItemsBy: function(mode, isDescending, forceNoAnimation) {
	    var w = this.w;
	    
	    var currentIsDescending = null;
	    
	    var actualIsDescending = isDescending;
	    
	    // Check whether sort mode has been changed, update interface if needed and exit otherwise
	    var $currentModeNode = w.$sorters.find('.ascending, .descending');
	    if ($currentModeNode.length) {
	        currentIsDescending = $currentModeNode.hasClass('descending');
	        $currentModeNode.removeClass('ascending descending');
	        if (_.isUndefined(actualIsDescending)) {
	            if ($currentModeNode.data('mode') == mode) {
	                actualIsDescending = !currentIsDescending;
	            } else {
	                actualIsDescending = false;
	            }
	        } else {
	            if ($currentModeNode.data('mode') == mode && $currentModeNode == $currentModeNode) {
	                return;
	            }
	        }
	    }
	    
	    var $newModeNode = w.$sorters.find('[data-mode="' + mode + '"]');
	    $newModeNode.addClass(actualIsDescending ? 'descending' : 'ascending');
	    
        // Get list of new ids, if the sequence matches the old one, exit
	    var oldIds = _.map(w.options.items, function(item) {
	        return item.id;
	    });
	    
	    var newItems = _.sortBy(w.options.items, function(item) {
	       var id = item.id < 0 ? 9999 : parseInt(item.id, 10);
	       switch (mode) {
	       case "completed":
	           return item.photoResponseCounts[pat.PhotoResponseStatus.COMPLETE] * 10000 + id;
	           
	       case "problems":
               return item.photoResponseCounts[pat.PhotoResponseStatus.PHOTO_PROBLEM] * -10000 + id;

           case "unread":
               return (item.isUnread ? -10000 : 0) + id;

           case "suitability":
               var completeResponsesCount = 0;
               var sums = [];
               for (var i = pat.config.questions.length - 1; i >= 0; --i) {
                   sums.push(0);
               }
               for (var j = item.photoResponses.length - 1, pr = item.photoResponses[j]; j >=0; --j, pr = item.photoResponses[j]) {
                   if (pr.status == pat.PhotoResponseStatus.COMPLETE) {
                       ++completeResponsesCount;
                       for (var i = pat.config.questions.length - 1; i >= 0; --i) {
                           var question = pat.config.questions[i];
                           sums[i] += _.indexOf(pat.getAnswerSeq(question), pr[question]);
                       };
                   }
               }
               if (completeResponsesCount == 0) {
                   return 100500; // photos with no responses are the least suitable (have a big number)
               } else {
                   var result = 0;
                   for (var i = pat.config.questions.length - 1; i >= 0; --i) {
                       result += sums[i] / completeResponsesCount;
                   }
                   return result;
               }

           case "id":
	       default:
	           return id;
	       
	       }
	    });
	    
	    if (actualIsDescending) {
	        newItems.reverse();
	    }
	    
	    var newIds = _.map(newItems, function(item) {
            return item.id;
        });
	    
	    if (_.isEqual(oldIds, newIds))
	        return;
	    
	    // Actual sorting 
        var oldScrollTop = w.$items.scrollTop();
        w.$items.detach();
        _.each(newIds, function(id) {
            if (!w.$itemsMap[id])
                return;
            w.$items.append(w.$itemsMap[id]);
        });
        w.$items.appendTo(w.$element);
        w.$items.scrollTop(oldScrollTop);

	    w.options.items = newItems;
	},

	/** 
	 * Update items
	 */
	updateItems: function(ids) {
		var w = this.w;

		var idsToUpdate = ids;
		if (!_.isArray(idsToUpdate)) {
		    idsToUpdate = _.keys(w.options.items);
		}
		
		w.$items.detach();
        if (_.isFunction(w.options.customizeItem)) {
            _.each(idsToUpdate, function(id) {
                var $item = w.$itemsMap[id];
                w.options.customizeItem($item, id, w.itemsMap[id]);
            });
        }

        w.$items.appendTo(w.$element);
	},
	
	setCurrentItemId: function(newId) {
		var w = this.w;

		if (newId == w.options.selectedItemId)
			return false;

		if (w.$currentItem) {
			w.$currentItem.removeClass('current');
		}
		
		var $newCurrentItem = w.$itemsMap[newId];
		
		w.options.selectedItemId = newId;
		if ($newCurrentItem) {
		    $newCurrentItem.addClass('current');
		    w.$currentItem = $newCurrentItem;
		    w.$currentItem.scrollintoview();
		}
		w._self._trigger("changeitem", null, {id: newId, itemData: w.itemsMap[newId]});
	},

    setHighlightedItemIds: function(newIds) {
        var w = this.w;

        if (_.isEqual(newIds, w.options.highlightedItemsIds))
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
        w.options.highlightedItemsIds = newIds;
        w.$highlightedItems = $newHighlightedItems;
        w._self._trigger("highlightitems", null, {ids: newIds});
    },
	
	setDisableThumbnails: function(disableThumbnails, force) {
        var w = this.w;

        if (!force && w.options.disableThumbnails == disableThumbnails)
            return;
        
	    w.options.disableThumbnails = disableThumbnails;
	    w.$element.toggleClass('b-infolist_thumbnails_enabled', !disableThumbnails);
	    w.$element.toggleClass('b-infolist_thumbnails_disabled', disableThumbnails);
	},
    
    _updateHintUsingMouseData: function() {
        var w = this.w;

        if (!w.mouseId) {
            w.$hint.text('');
        } else {
            w.$hint.text(w.$itemsMap[w.mouseId].data('hint'));
        }
    },

    _updateMouseHint: function() {
        var w = this.w;

        if (!w.mouseId) {
            w.$hint.text('');
        } else {
            w.$hint.text(w.$itemsMap[w.mouseId].data('hint'));
        }
    },
	
    setHeight: function(newHeight) {
        var w = this.w;

        if (w.$element.height() == newHeight) {
            return;
        }
        
        w.$element.height(newHeight);
        w._self._updateHintPos();
    },
    
	_updateHintPos: function() {
        var w = this.w;

	    if (w.$items.get(0).scrollHeight > w.$items.height()) {
	        w.$hint.css('top', w.$items.offset().top - w.$element.offset().top + w.$items.height());
	    } else {
	        var $lastLi = w.$items.children().last();
	        w.$hint.css('top', $lastLi.offset().top + $lastLi.outerHeight() - w.$element.offset().top);
	    }
	}
});
}());
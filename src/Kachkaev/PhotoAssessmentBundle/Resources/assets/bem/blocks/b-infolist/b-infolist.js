(function() {
$.widget('pat.binfolist', {

    options: {
        sortModes: ['id', 'completed', 'problems'],
        sortMode: 'id',
        sortOrderIsReverse: false,
        items: [],
        selectedItemId: null,
        highlightedItemsIds: [],

        viewModeShowThumbnails: false,
        viewModeShowProblems: false,
        height: 200,
        
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
		w.$selectedItem = null;
		w.$highlightedItems = null;
		
		// Sorters events
		w.$sorters.children().click(function() {
		    var $this = $(this);
		    w._self._resortItems($this.data('mode'));
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
		    w._self._setOption('selectedItemId', $this.data('id'));
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
		
		w.$element.append(w.$percentage, w.$sorters, w.$items, w.$hint);

		w._self._applySelectedItemId();
        w._self._applyHighlightedItemsIds();
        w._self._applyHeight();
        w._self._updateViewMode('showThumbnails');
        w._self._updateViewMode('showProblems');
        w._self._resortItems(w.options.sortMode, w.options.sortOrderIsReverse, true);
        w._self._updateHintPos();
	},
	
	_resortItems: function(mode, isReverse, initialUse) {
	    var w = this.w;
	    
	    var currentIsReverse = null;
	    var neededIsReverse = isReverse;
	    
	    // Check whether sort mode has been changed, update interface if needed and exit otherwise
	    var $currentModeNode = w.$sorters.find('.ascending, .descending');
	    if ($currentModeNode.length) {
	        currentIsReverse = $currentModeNode.hasClass('descending');
	        if (_.isUndefined(neededIsReverse)) {
	            if ($currentModeNode.data('mode') == mode) {
	                neededIsReverse = !currentIsReverse;
	            } else {
	                neededIsReverse = false;
	            }
	        } else {
	            if ($currentModeNode.data('mode') == mode && $currentModeNode == $currentModeNode) {
	                return;
	            }
	        }
	    }
	    $currentModeNode.removeClass('ascending descending');
        
	    var $newModeNode = w.$sorters.find('[data-mode="' + mode + '"]');
	    $newModeNode.addClass(neededIsReverse ? 'descending' : 'ascending');
	    
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
               return id;
	       default:
	           throw new Error('Unknown sort mode ' + mode);
	       }
	    });
	    
	    if (neededIsReverse) {
	        newItems.reverse();
	    }
	    
	    var newIds = _.map(newItems, function(item) {
            return item.id;
        });
	    
	    if (_.isEqual(oldIds, newIds))
	        return;
	    
	    // Actual sorting of UI elements
        var oldScrollTop = w.$items.scrollTop();
        w.$items.detach();
        _.each(newIds, function(id) {
            if (!w.$itemsMap[id])
                return;
            w.$items.append(w.$itemsMap[id]);
        });
        w.$items.appendTo(w.$element);
        w.$items.scrollTop(oldScrollTop);

        if (!initialUse) {
            var newOptions = {
                    items: newItems,
                    sortMode: mode,
                    sortOrderIsReverse: neededIsReverse ? true : false
            };
            
            w._self._setOptions(newOptions);
            w._self._trigger('resortitems', this, newOptions);
        }
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
	
	_applyHighlightedItemsIds: function() {
        var w = this.w;

        if (w.$highlightedItems) {
            w.$highlightedItems.removeClass('highlighted');
        }
        
        var $newHighlightedItemElements = [];
        _.each(w.options.highlightedItemsIds, function(id) {
            $newHighlightedItemElements.push(w.$itemsMap[id][0]);  
        });
        var $newHighlightedItems = $($newHighlightedItemElements);
        $newHighlightedItems.addClass('highlighted');
        w.$highlightedItems = $newHighlightedItems;
    },
	
    _applySelectedItemId: function() {
        var w = this.w;

        if (w.$selectedItem) {
            w.$selectedItem.removeClass('current');
        }
        
        var $newSelectedItem = w.$itemsMap[w.options.selectedItemId];
        
        if ($newSelectedItem) {
            $newSelectedItem.addClass('current');
            w.$selectedItem = $newSelectedItem;
            w.$selectedItem.scrollintoview();
        }
    },

    _updateViewMode: function(parameter) {
        var w = this.w;

        if (parameter == 'showThumbnails') {
            w.$element.toggleClass('b-infolist_thumbnails_enabled',   w.options.viewModeShowThumbnails);
            w.$element.toggleClass('b-infolist_thumbnails_disabled', !w.options.viewModeShowThumbnails);
        } else if (parameter == 'showProblems') {
            w.$element.toggleClass('b-infolist_problems_enabled',   w.options.viewModeShowProblems);
            w.$element.toggleClass('b-infolist_problems_disabled', !w.options.viewModeShowProblems);
        }
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
	
    _applyHeight: function() {
        var w = this.w;

        w.$element.height(w.options.height);
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
	},
    
    _setOption: function (key, value) {
        var w = this.w;
        
        // Check if such option exists, throw an error if not
        if (_.isUndefined(w.options[key])) {
            throw "Option " + key + " does not exist";
        }
        
        // Check if value matches what it was, do nothing if yes
        if (value === w.options[key] || (_.isArray(value) && _.isEqual(value, w.options[key]))) {
            return;
        }
        
        // Save old option value
        var prev = w.options[key];
        
        // Apply the option
        this._super(key, value);
        
        // Call corresponding update method depending on the option key
        switch (key) {
        
        case 'height':
            this._applyHeight();
            break;

        case 'selectedItemId':
            this._applySelectedItemId();
            break;
        
        case 'highlightedItemsIds':
            this._applyHighlightedItemsIds();
            break;
            
        case 'sortMode':
        case 'sortOrderIsReverse':
            this._resortItems(w.options.sortMode, w.options.sortOrderIsReverse);
            break;
            
        case 'viewModeShowThumbnails':
            this._updateViewMode('showThumbnails', value);
            break;
        case 'viewModeShowProblems':
            this._updateViewMode('showProblems', value);
            break;
        }
        
        //console.log("event: change" + key.toLowerCase(), {newValue: value, prevValue: prev});
        w._self._trigger("change" + key.toLowerCase(), null, {newValue: value, prevValue: prev});
    }
});
}());
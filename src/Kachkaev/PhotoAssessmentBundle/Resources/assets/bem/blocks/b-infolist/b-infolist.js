(function() {

var patternThumbnailGenerator = new pat.PatternThumbnailGenerator();
    
$.widget('pat.binfolist', {

    options: {
        sortModes: ['id', 'completed', 'problems'],
        sortOrder: 'id',
        items: [],
        selectedItemId: null,
        highlightedItemsIds: [],
        maxSortLevels: 3,

        viewModeShowThumbnails: false,
        viewModeShowProblems: false,
        viewModeShowUnchecked: false,
        viewModeTimeScaling: false,
        viewModeBackgroundVariable: 1,
        height: 200,
        
        customizeItem: null,  // function
        dblclickAction: null, // function
        mouseHoverDelay: 50
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

		w.$indexOutOf = $('<div/>').addClass('b-infolist__index-out-of');
        w.$percentage = $('<div/>').addClass('b-infolist__percentage');
		w.$soPickersContainer = $('<ul/>').addClass("b-infolist__sopickers-container").disableSelection();
		w.$soPickersControls = $('<ul/>').addClass("b-infolist__sopickers-controls").disableSelection();
		w.$soPickersRemover = $('<div/>').addClass("b-infolist__sopickers-remover").appendTo(w.$soPickersControls);
		w.$soPickersAdder = $('<div/>').addClass("b-infolist__sopickers-adder").appendTo(w.$soPickersControls);
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
		//// This function is a listener of a changed value in one of sort order pickers
		w.newSortOrderSelectedInSOPickerFunction = function() {
		    var newSortOrderParts = [];
		    w.$soPickersContainer.children().each(function() {
		        newSortOrderParts.push($(this).binfolistsopicker('option', 'sortOrder'));
		    });
		    
		    w._self._setOption('sortOrder', newSortOrderParts.join(','));
		};
		
		/// Adder adds 'id' to existing sort order
		w.$soPickersAdder.click(function() {
		    w._self._setOption('sortOrder',w.options.sortOrder + ',' + w.options.sortModes[0]);
		});

		w.$soPickersRemover.click(function() {
	        var sortOrderParts = w.options.sortOrder.split(',');
	        sortOrderParts.pop();
            w._self._setOption('sortOrder',sortOrderParts.join(','));
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
                var itemsTotal = _.size(w.$itemsMap);
                if (id === null) {
                    w.$percentage.text('');
                    w.$indexOutOf.text(itemsTotal);
                } else {
                    
                    var currentIndex = w.$itemsMap[id].index();
                    w.$indexOutOf.text((currentIndex + 1) + ' / ' + itemsTotal);
                    w.$percentage.html(Math.floor((currentIndex + 1)/itemsTotal*100) + '&thinsp;%');
                }
            }, 20);
		};
		w.mouseId = -42;
		triggerMouseoveritemWithDelay(null);
		
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
		        if (false === w.options.customizeItem($item, id, itemData, w.options)) {
		            addItem = false;
		        }
		    }
		    if (addItem) {
		        $item.addClass('thumbnail_rendering');
                // Render thumbnails
                patternThumbnailGenerator.prependToQueue(itemData, null, function(img) {
                    $item.data('thumbnail-pattern', img);
                    if (!w.options.viewModeTimeScaling) {
                        $item.css('background-image', 'url(' + img + ')');
                        $item.removeClass('thumbnail_rendering');
                    }
                });
                patternThumbnailGenerator.prependToQueue(itemData, {timeScaling: true}, function(img) {
                    $item.data('thumbnail-pattern-timescaling', img);
                    if (w.options.viewModeTimeScaling) {
                        $item.css('background-image', 'url(' + img + ')');
                        $item.removeClass('thumbnail_rendering');
                    }
                });

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
		
		w.$element.append(w.$indexOutOf, w.$percentage, w.$soPickersContainer, w.$soPickersControls, w.$items, w.$hint);
		
		// Thumbnail rendering queue gets updated when scrolling has stopped
		// (we want to first render the thumbnails that are within the view)  
		var scrollTimer;
		var afterScrollFunction = function() {
		    w._self._resortRenderingQueue();
		};
		w.$items.bind('scroll', function() {
		    clearTimeout(scrollTimer);
		    timer = setTimeout(afterScrollFunction, 500);
		});

		w._self._applySelectedItemId();
        w._self._applyHighlightedItemsIds();
        w._self._applyHeight();
        w._self._applySortOrderOrModes(true);
        w._self._applyViewModeShowThumbnails();
        w._self._applyViewModeShowProblems();
        w._self._applyViewModeShowUnchecked();
        w._self._updateHintPos();
	},
	
	_resortItems: function(sortOrder, initialUse) {
	    var w = this.w;
	    
	    var sortOrderParts = sortOrder.split(',');
	    
	    if (!sortOrderParts.length) {
	        throw new Error('Wrong value for sortOrder' + sortOrder);
	    }
	    
        // Get list of new ids, if the sequence matches the old one, exit
	    var oldIds = _.map(w.options.items, function(item) {
	        return item.id;
	    });
	    
	    var newItems = _.sortBy(w.options.items, function(item) {
	        var measure = 0; 
	        
	        var sortOrderParts = sortOrder.split(',');
	        sortOrderParts.push('id');
	        var responsesWithoutPhotoProblems = _.filter(item.photoResponses, function(photoResponse) {
	                return photoResponse.status == pat.PhotoResponseStatus.COMPLETE;
                });
	        
	        for (var i = 0; i < sortOrderParts.length; ++i) {
	            var currentSortOrder = sortOrderParts[i];
	            var currentSortMode = currentSortOrder[0] == '-' ? currentSortOrder.substr(1) : currentSortOrder;
	            var currentIsDescending = currentSortOrder[0] == '-';
	            var currentMeasure = 0;
	            switch (currentSortMode) {
	            case 'id':
	                var id = parseInt(item.id, 10);
	                currentMeasure = id < 0 ? -id + 0x1000 : id; // any photo with id < 0 is put to the end;
	                break;

	            case 'completed':
	                currentMeasure = item.photoResponseCounts[pat.PhotoResponseStatus.COMPLETE];
	                break;
	                
	            case 'problems':
	                currentMeasure = item.photoResponseCounts[pat.PhotoResponseStatus.PHOTO_PROBLEM];
	                break;

                case 'status':
                    currentMeasure = -item.status;
                    break;
                    
	            case 'unchecked':
	                currentMeasure = item.isUnchecked ? -1 : 0;
	                break;

	            case 'suitability-avg':
	                currentMeasure = 1000*pat.PhotoResponseListMeasurer.getAvgSuitability(responsesWithoutPhotoProblems);
	                break;
	                
	            case 'suitability-med':
	                currentMeasure = 1000*pat.PhotoResponseListMeasurer.getMedSuitability(responsesWithoutPhotoProblems);
	                break;

                case 'suitability-q0-avg':
                case 'suitability-q1-avg':
                case 'suitability-q2-avg':
                case 'suitability-q3-avg':
                case 'suitability-q4-avg':
                case 'suitability-q5-avg':
                case 'suitability-q6-avg':
                    currentMeasure = 1000*pat.PhotoResponseListMeasurer.getAvgSuitability(responsesWithoutPhotoProblems, {questionIndex: parseInt(currentSortMode[13], 10)});
                    break;

                case 'suitability-q0-med':
                case 'suitability-q1-med':
                case 'suitability-q2-med':
                case 'suitability-q3-med':
                case 'suitability-q4-med':
                case 'suitability-q5-med':
                case 'suitability-q6-med':
                    currentMeasure = 1000*pat.PhotoResponseListMeasurer.getMedSuitability(responsesWithoutPhotoProblems, {questionIndex: parseInt(currentSortMode[13], 10)});
                    break;

                case 'agreement':
	                currentMeasure = 1000*pat.PhotoResponseListMeasurer.getAgreement(responsesWithoutPhotoProblems);
	                break;

                case 'entropy':
                    currentMeasure = 1000*pat.PhotoResponseListMeasurer.getWeightedEntropy(responsesWithoutPhotoProblems);
                    break;

                case 'duration-avg':
	                currentMeasure = 1000*pat.PhotoResponseListMeasurer.getAvgDuration(responsesWithoutPhotoProblems);
	                break;
	                
	            case 'duration-med':
	                currentMeasure = 1000*pat.PhotoResponseListMeasurer.getMedDuration(responsesWithoutPhotoProblems);
	                break;
	            
	            case 'source':
	                currentMeasure = item.source.charCodeAt(0);
	                break;

	            case 'luminance':
                    currentMeasure = item.luminance * 100;
                    break;

	            case 'time-of-day':
                    currentMeasure = (item.dateTaken % 86400) / 60;
                    break;

	            case 'time-from-noon':
                    currentMeasure = Math.abs(item.dateTaken % 86400 - 43200) / 60;
                    break;
	                
	            default:
	                throw new Error('Unknown sort mode ' + currentSortMode + ' in sort order ');
	            }
	            
	            currentMeasure = currentMeasure *= 1; // avoid having nulls
	            if (isNaN(currentMeasure)) {
	                currentMeasure = 0; // avoid having NaNs
	            }
	            // Normalising (0, 1-65536)
	            if (currentMeasure > 0x8000) {
//	                if (item.id == 142 || item.id == 396 || item.id == 524) {
//	                    console.log('!!!', item.id, currentMeasure);
//	                }
	                currentMeasure = 0x8000;
	            } else if (currentMeasure < 1 && currentMeasure != 0) {
	                currentMeasure = 1;
	            }
	            
	            // Reversing if needed
                if (currentIsDescending) {
                    currentMeasure *= -1;
                }

	            measure = measure * 0x10000 + currentMeasure;
//	            if (item.id == 142 || item.id == 396 || item.id == 524)
//	                console.log(item.id, currentMeasure, measure);

	            // Once items are sorted by id, all further measuring is skipped as it's pointless
	            if (currentSortMode == 'id')
	                break;
	        };
	        return measure;
	    });
	    
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
                    sortOrder: sortOrder
            };
            
            w._self._setOptions(newOptions);
        } else {
            w.options.items = newItems;
        }
        setTimeout(function() {
            w._self._resortRenderingQueue();
        }, 100);
	},
	
	_resortRenderingQueue: function() {
        var w = this.w;

        if (!patternThumbnailGenerator.queue.length) {
            return;
        }
        
        // find the index of the first item that is within the view
        //// calculate offsets
        var $firstItem = w.$itemsMap[w.options.items[0].id];
        if (!$firstItem || !$firstItem.length) {
            return;
        }
        var minNeededOffset = w.$items.offset().top - $firstItem.outerWidth();
        
        //// do find the index of the item
        var firstSeenItemIndex = 0;
        w.$items.children().each(function(index){
            if ($(this).offset().top >= minNeededOffset) {
                firstSeenItemIndex = index;
                return false;
            };
        });

        
        // update patternThumbnailGenerator queue order
        patternThumbnailGenerator.resortQueue(function(queueElement /*[data, options, fallback]*/, i) {
            // Elements with timeScaling not equal to the current one are put into the end of the queue
            if (w.options.viewModeTimeScaling == !queueElement[1].timeScaling) {
                return 100600;
            }
            var itemIndex = _.indexOf(w.options.items, queueElement[0]);

            // Elements with items from another infolists are put in the end of the queue
            if (itemIndex == -1)
                return 100500;
            else if (itemIndex < firstSeenItemIndex)
                return itemIndex + 10000;
            else 
                return itemIndex;
        });
	},

	/** 
	 * Update items
	 */
	updateItems: function(ids) {
		var w = this.w;

		var idsToUpdate = ids;
		if (!_.isArray(idsToUpdate)) {
		    idsToUpdate = _.map(w.options.items, function(item){return item.id;});
		}
		
        var oldScrollTop = w.$items.scrollTop();
        w.$items.detach();
        if (_.isFunction(w.options.customizeItem)) {
            _.each(idsToUpdate, function(id) {
                var $item = w.$itemsMap[id];
                if (!_.isUndefined($item)) {
                    w.options.customizeItem($item, id, w.itemsMap[id], w.options);
                }
            });
        }
        w.$items.appendTo(w.$element);
        w.$items.scrollTop(oldScrollTop);
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

    _applySortOrderOrModes: function(initialUse) {
        var w = this.w;
        var sortOrderParts = w.options.sortOrder.split(',');

        // Add / amend sopickers according to
        w.$soPickersContainer.children().each(function(index) {
            var $soPicker = $(this);
            if (!sortOrderParts[index]) {
                $soPicker.remove();
                return;
            };
            $soPicker.binfolistsopicker('option', {
                    'sortModes': w.options.sortModes,
                    'sortOrder': sortOrderParts[index]
                });
        });
        
        for (var i = w.$soPickersContainer.children().length; i < sortOrderParts.length; ++i) {
            var $newSOPicker = $('<div/>').binfolistsopicker({
                'sortModes': w.options.sortModes,
                'sortOrder': sortOrderParts[i]
            });
            
            $newSOPicker.on('binfolistsopickerchangesortorder', w.newSortOrderSelectedInSOPickerFunction);
            w.$soPickersContainer.append($newSOPicker);
        };
        
        w._self._updateSOPickersControls();
        w._self._resortItems(w.options.sortOrder);
        if (!initialUse) {
            w._self._trigger('resortitems', this, {sortOrder: w.options.sortOrder});
        }
    },
    
    _applyViewModeShowThumbnails: function() {
        var w = this.w;
        w.$element.toggleClass('b-infolist_thumbnails_enabled',   w.options.viewModeShowThumbnails);
        w.$element.toggleClass('b-infolist_thumbnails_disabled', !w.options.viewModeShowThumbnails);
    },
    
    _applyViewModeShowProblems: function() {
        var w = this.w;
        w.$element.toggleClass('b-infolist_problems_enabled',   w.options.viewModeShowProblems);
        w.$element.toggleClass('b-infolist_problems_disabled', !w.options.viewModeShowProblems);
    },

    _applyViewModeShowUnchecked: function() {
        var w = this.w;
        w.$element.toggleClass('b-infolist_unchecked_enabled',   w.options.viewModeShowUnchecked);
        w.$element.toggleClass('b-infolist_unchecked_disabled', !w.options.viewModeShowUnchecked);
    },

    _applyViewModeTimeScaling: function() {
        var w = this.w;
        w.$items.children().each(function() {
           $this = $(this);
           var imgData = $this.data(w.options.viewModeTimeScaling ? 'thumbnail-pattern-timescaling' : 'thumbnail-pattern');
           $this.css('background-image', imgData ? 'url(' + imgData + ')' : '');
           $this.toggleClass('thumbnail_rendering', !imgData);

        });
        this._resortRenderingQueue();
    },

    _applyViewModeBackgroundVariable: function() {
        this.updateItems();
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
    
    _updateSOPickersControls: function() {
        var w = this.w;
        var sortOrderParts = w.options.sortOrder.split(',');
        
        // Remover
        if (sortOrderParts.length == 1) {
            w.$soPickersRemover.detach();
        } else if (!w.$soPickersRemover.parent().length){
            w.$soPickersRemover.prependTo(w.$soPickersControls);
        }
        
        // Adder
        if (sortOrderParts.length >= w.options.maxSortLevels) {
            w.$soPickersAdder.detach();
        } else if (!w.$soPickersAdder.parent().length){
            w.$soPickersAdder.appendTo(w.$soPickersControls);
        }
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
        if (!w.options.hasOwnProperty(key)) {
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
            
        case 'sortModes':
        case 'sortOrder':
            this._applySortOrderOrModes();
            break;
            
        case 'viewModeShowThumbnails':
            this._applyViewModeShowThumbnails();
            break;
        case 'viewModeShowProblems':
            this._applyViewModeShowProblems();
            break;
        case 'viewModeShowUnchecked':
            this._applyViewModeShowUnchecked();
            break;
        case 'viewModeTimeScaling':
            this._applyViewModeTimeScaling();
            break;
        case 'viewModeBackgroundVariable':
            this._applyViewModeBackgroundVariable();
            break;
        }
        
        // console.log("event: change" + key.toLowerCase(), {newValue: value, prevValue: prev});
        w._self._trigger("change" + key.toLowerCase(), null, {newValue: value, prevValue: prev});
    }
});
}());
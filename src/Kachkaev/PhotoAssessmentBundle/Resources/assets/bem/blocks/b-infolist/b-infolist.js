$.widget('ui.bInfoList', {

	_init: function() {
		var w = {
				_self: this,
				$element: this.element,
				options: this.options
			};
		this.w = w;
		
		w.$items = $('<ul/>').addClass("b-infolist__items");
		w.$resizeBlind = $('<div/>').addClass("b-infolist__resize-blind");
		w.itemsMap = {};
		w.currentId = null;
		w.mouseId = null;
		w.mouseIdChangerHash = null;
		w.$currentItem = null;

		// Item events
		//// Changes mouse id when hover
		var triggerMouseoveritemWithDelay = function(id) {
		    if (w.mouseId === id)
		        return;
		    var mouseIdChangerHash = Math.random();
		    w.mouseIdChangerHash = mouseIdChangerHash;
		    setTimeout(function() {
		        if (w.mouseIdChangerHash === mouseIdChangerHash) {
		            w._self._trigger("hoveroveritem", null, {id: id});
		            w.mouseId = id;
		        }
		    }, 50);
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
		_.each(w.options.items, function(itemData, id) {
		    var $item = $('<li/>').addClass('b-infolist__item');
		    var addItem = true;
		    $item.click(onItemClick);
		    $item.mouseenter(onItemHoverOver);
		    $item.mouseleave(onItemHoverOut);
		    if (_.isFunction(w.options.dblclickAction)) {
		        $item.dblclick(w.options.dblclickAction);
		    }

		    $item.data('id', id);
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
		        w.itemsMap[id] = $item;
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
		
		w.$element.append(w.$items);
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
                var $item = w.itemsMap[id];
                w.options.customizeItem($item, id, w.options.items[id]);
            });
        }

        w.$items.appendTo(w.$element);
	},
	
	setCurrentItemId: function(newId) {
		var w = this.w;

		if (newId == w.currentId)
			return false;

		if (w.$currentItem) {
			w.$currentItem.removeClass('current');
		}
		
		var $newCurrentItem = w.itemsMap[newId];
		
		if ($newCurrentItem) {
		    $newCurrentItem.addClass('current');
		    w.currentId = newId;
		    w.$currentItem = $newCurrentItem;
		    w.$currentItem.scrollintoview();
		}
		w._self._trigger("changeitem", null, {id: newId});
	}
});
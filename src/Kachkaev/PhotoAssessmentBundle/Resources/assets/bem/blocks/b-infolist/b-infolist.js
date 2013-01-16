/**
 * Displays the survey queue and allows selecting different photos
 * 
 * Update queue: $elem.bInfoList('updateItems', ids);
 * 
 * Events:
 * mouseoveritem(id) — when non-current item is clicked
 * changeitem(id) — when an item is hovered over
 */

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
		            w._self._trigger("changeitem", null, {id: id});
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
		var onItemHoverClick = function() {
		    var $this = $(this);
		    w._self.setCurrentItemId($this.data('id'));
        };
        
        // Populate items
		_.each(w.options.items, function(itemData, id) {
		    var $item = $('<li/>').addClass('b-infolist__item');
		    $item.click(onItemHoverClick);
		    $item.mouseenter(onItemHoverOver);
		    $item.mouseleave(onItemHoverOut);
		    $item.data('id', id);
		    $item.data('data', itemData);
		    $item.attr('title', id);
		    if (_.isFunction(w.options.customizeItem)) {
		        w.options.customizeItem($item, id, itemData);
		    }
		    $item.appendTo(w.$items);
		    w.itemsMap[id] = $item;
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
		    ids = _.keys(w.options.data);
		}
		
		w.$items.detach();
        if (_.isFunction(w.options.customizeItem)) {
            _.each(ids, function(id) {
                var $item = w.itemsMap[id];
                w.options.customizeItem($item, id, w.options.data[id]);
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
		
		if (!$newCurrentItem)
			return false;
		
		$newCurrentItem.addClass('current');
		w.currentId = newId;
		w.$currentItem = $newCurrentItem;
		w._self._trigger("changeitem", null, {id: newId});
		w.$currentItem.scrollintoview();
	}
});
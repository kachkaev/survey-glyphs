/**
 * Sort mode picker (used in b-infolist)
 * 
 * if current sort mode starts with "-", it means that sorting is descending
 */
(function() {

/**
 * Removes "descending" mark from the given sort mode and returns a clean sort mode name
 * Example: -id → id
 *          id → id
 *          -duration → duration
 */
var getSortModeName = function(sortMode) {
    return sortMode[0] == '-' ? sortMode.substr(1) : sortMode;
}; 

var getSortModeTitle = function(sortMode) {
    // TODO replace with language
    return getSortModeName(sortMode);
};
    
$.widget('pat.binfolistsopicker', {

    /**
     * @memberOf pat.binfolistsopicker
     */
    options: {
        sortModes: ['id', 'completed', 'problems'],
        sortOrder: 'id',
    },
    
    /**
     * @memberOf pat.binfolistsopicker
     */
	_create: function() {
        
        var w = {
				_self: this,
				$element: this.element,
				options: this.options
			};
		this.w = w;

		w.$current = $('<div/>').addClass('b-infolist-sopicker__current');
		w.$ascDesc = $('<div/>').addClass('b-infolist-sopicker__ascdesc');

		w.$list = $('<ul/>').addClass('b-infolist-sopicker__list');
		w.$blind = $('<div/>').addClass('b-infolist-sopicker__blind');
		
		// $ascDesc events
		//// Toggle "-" in front of sortOrder option on click
		w.$ascDesc.click(function() {
		    if (w.options.sortOrder[0] == '-') {
		        w._self._setOption('sortOrder', getSortModeName(w.options.sortOrder));
		    } else {
		        w._self._setOption('sortOrder', '-' + w.options.sortOrder);
		    };
		});
		
		// $current events
		///// open / close list 
		w.$current.click(function() {
		    w._self._isListOpen() ? w._self._closeList() : w._self._openList();
		});
		
        // $blind events
		//// Click on it closes the list
		w.$blind.click(function() {
		   w._self._closeList(); 
		});
		
		// A function to be binded to each $list element
		w.listItemClickFunction = function() {
		    var $this = $(this);
		    if ($this.hasClass('b-infolist-sopicker__list-item_current'))
		        return;
		    
		    w._self._closeList();
		    
		    w.$list.find('[data-name="'+getSortModeName(w.options.sortOrder)+'"]')
		        .removeClass('b-infolist-sopicker__list-item_current');
		    
		    w._self._setOption('sortOrder', $this.data('name'));
            
		    w.$list.find('[data-name="'+getSortModeName(w.options.sortOrder)+'"]')
                .addClass('b-infolist-sopicker__list-item_current');
		};
		
		w._self._applyAvailableSortModes();
		w._self._applySortOrder();
		
		w.$element
		    .addClass('b-infolist-sopicker')
		    .append(w.$current, w.$ascDesc, w.$list);
	},
	
	_openList: function() {
	    var w = this.w;
	    
	    // Do nothing if the list is already open
        if (w.$list.hasClass('b-infolist-sopicker__list_open')) {
            return;
        };
        
        w.$list.addClass('b-infolist-sopicker__list_open');
        w.$blind.appendTo(w.$element);
	},
	
	_closeList: function() {
        var w = this.w;
	    
        w.$list.removeClass('b-infolist-sopicker__list_open');
        w.$blind.detach();
	},
	
	_isListOpen: function() {
        var w = this.w;
	    
        return w.$list.hasClass('b-infolist-sopicker__list_open');
	},
	
	_applyAvailableSortModes: function() {
        var w = this.w;
        w.$list.detach();
        w.$list.empty();
        
        var sortOrderName = getSortModeName(w.options.sortOrder);
        
        _.each(w.options.sortModes, function(sortModeName) {
            var $listItem = $('<li/>').addClass('b-infolist-sopicker__list-item');
            $listItem.attr('data-name', sortModeName);
            $listItem.text(getSortModeTitle(sortModeName));
            if (sortModeName == sortOrderName) {
                $listItem.addClass('b-infolist-sopicker__list-item_current');
            };
            $listItem.click(w.listItemClickFunction);
            $listItem.appendTo(w.$list);
        });
        
        w.$list.appendTo(w.$element);
	},
	
	_applySortOrder: function() {
        var w = this.w;
        
        w.$current.text(getSortModeTitle(w.options.sortOrder));
        
        w.$ascDesc.toggleClass('b-infolist-sopicker__ascdesc_descending', w.options.sortOrder[0] == '-');
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
        
        case 'sortModes':
            this._applySortModes();
            break;

        case 'sortOrder':
            this._applySortOrder();
            break;
        }
        
        w._self._trigger("change" + key.toLowerCase(), null, {newValue: value, prevValue: prev});
    }
});
}());
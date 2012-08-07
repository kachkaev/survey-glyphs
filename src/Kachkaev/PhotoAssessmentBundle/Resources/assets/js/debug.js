jQuery(function() {

    var cookieName = 'debug_notoolbar'
    var animationSpeed = 200;
    var normalCss = {
            width: '200px'
    };
    var hiddenCss = {
            width: '10px'
    };

    // Removing toolbar container
    var $nativeContainer = jQuery('body').find('div:last');
    if ($nativeContainer.attr('id') && $nativeContainer.attr('id').substr(0, 5) == 'sfwdt') {
        $nativeContainer.addClass('sf-toolbarreset-native-container');
        //$nativeContainer = $nativeContainer.detach();
        //$nativeContainer = jQuery('#'+$nativeContainer.attr('id')).detach();
    } else {
        return;
    }

    //alert($nativeContainer.attr('id'));

    // Running timer until toolbar is not found
    jQuery(document).everyTime(100, "detect_toolbar", function(i) {
        var $toolbar = $nativeContainer.find('.sf-toolbarreset').remove();
        if (!$toolbar.size())
            return;

        jQuery(document).stopTime("detect_toolbar");
        //alert(jQuery.dump($nativeContainer));
        $nativeContainer.hide();
        $toolbar.wrap('<div class="sf-toolbarreset-container" />');
        var $container = $toolbar.parent();

        if (jQuery('.l-standard__title .b-page-block-tabs').size()) {
            $container.addClass('sf-toolbarreset-container_page-with-tabs');
        }

        var defaultHidden = jQuery.cookie(cookieName) == 'true';
        $container.css(defaultHidden ? hiddenCss : normalCss);
        $container.data(
                'status',
                defaultHidden ? 'hidden': 'normal'
            );

        $container.appendTo('body');

        // Toolbar click event
        $toolbar.click(function(){
            if ($container.data('status') == 'animating')
                return;

            var nowHiding = $container.data('status') != 'hidden';

            jQuery.cookie(cookieName, nowHiding, {expires:420000, path: '/'});

            $container.data('status','animating');

            $container.animate(
                    nowHiding ? hiddenCss : normalCss,
                    animationSpeed,
                    function(){
                        $container.data(
                                'status',
                                nowHiding ? 'hidden': 'normal'
                            );
                    }
                );

            return false;
        });

        // Toolbar links click event
        $toolbar.find('a').click(function(e){
            if ($container.data('status') != 'hidden')
                e.stopPropagation();
        });
    });
});
$(function() {
    var $bSurveyMap = $('.b-survey-map');
    //var $bContent = $('.b-content');
    //var $bMapinfo = $('.b-mapinfo');

    if ($bSurveyMap.size() == 0)
        return;

    var myOptions = {
            zoom : 18,
            center : new google.maps.LatLng(51.513128,-0.096867),
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

    var map = new google.maps.Map($bSurveyMap.get(0),
            myOptions);
    // Removing tabfocus within the map
    google.maps.event.addListenerOnce(map, 'idle', function(){
    	$bSurveyMap.find('a').attr('tabindex', -1);
    });

    $('body').oneTime(1000, function() {
    });

    // Object show/hide depending on zoom level
    google.maps.event.addListener(map, 'zoom_changed', function() {
        });
    google.maps.event.trigger(map,"zoom_changed");
});

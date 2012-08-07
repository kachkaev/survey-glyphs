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


    // Object show/hide depending on zoom level
    google.maps.event.addListener(map, 'zoom_changed', function() {
        });
    google.maps.event.trigger(map,"zoom_changed");
});

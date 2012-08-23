/**
 * Src: http://stackoverflow.com/questions/476679/preloading-images-with-jquery
 */
$.preload = function(imgs) {
    $.each(imgs, function(i, img){
        $('<img/>')[0].src = img;
    });
};

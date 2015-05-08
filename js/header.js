(function (window, $) {
    'use strict';

    /**
     * Throttle function taken from Mr. Sampson.
     * @{@link  http://sampsonblog.com/749/simple-throttle-function}
     */
    function throttle (callback, limit) {
        var wait = false;
        return function () {
            if (!wait) {
                callback.call();
                wait = true;
                setTimeout(function () {
                    wait = false;
                }, limit);
            }
        }
    }

    var $window = $(window);
    var $header = $('.site-header');
    var SCROLLED_CLASS = 'is-scrolled';
    function scrollHandler() {
        var scrollTop = $window.scrollTop();
console.log(scrollTop);
        $header.toggleClass(SCROLLED_CLASS, scrollTop > 20);
    };

    $window.on('scroll', throttle(scrollHandler, 120));
})(window, jQuery);

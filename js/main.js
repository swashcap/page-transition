(function ($) {
    'use strict';

    var $app = $('body').eq(0);

    var Transition = {
        _isAnimating: false,
        _isParent: true,
        options: {
            ACTIVE_CLASS: 'is-active',
            ENTERING_CLASS: 'is-entering',
            LEAVING_CLASS: 'is-leaving',
            PARENT_CLASS: 'is-parent',
            ANIMATION_END_EVENTS: 'webkitAnimationEnd oanimationend msAnimationEnd animationend'
        },
        $parentPage: $('.content-page-1'),
        $childPage: $('.content-page-2'),
        _toPage: function ($currentPage, $nextPage) {
            var self = this;
            var options = this.options;
            var isNextDone = false;
            var isCurrentDone = false;

            if (this._isAnimating) {
                return;
            }

            this._isAnimating = true;

            $nextPage
                .addClass(options.ACTIVE_CLASS + ' ' + options.ENTERING_CLASS)
                .one(options.ANIMATION_END_EVENTS, function () {
                    $nextPage.removeClass(options.ENTERING_CLASS);
                    $currentPage.removeClass(options.ACTIVE_CLASS);
                    isNextDone = true;
                    if (isCurrentDone) {
                        self._isAnimating = false;
                    }
                });

            $currentPage
                .addClass(options.LEAVING_CLASS)
                .one(options.ANIMATION_END_EVENTS, function () {
                    $currentPage.removeClass(options.LEAVING_CLASS);
                    isCurrentDone = true;
                    if (isNextDone) {
                        self._isAnimating = false;
                    }
                });
        },
        toChildPage: function () {
            if (this._isParent) {
                this.$parentPage.removeClass(this.options.PARENT_CLASS);
                this.$childPage.removeClass(this.options.PARENT_CLASS);

                this._toPage(this.$parentPage, this.$childPage);
                this._isParent = false;
            }
        },
        toParentPage: function () {
            if (! this.isParent) {
                this.$parentPage.addClass(this.options.PARENT_CLASS);
                this.$childPage.addClass(this.options.PARENT_CLASS);

                this._toPage(this.$childPage, this.$parentPage);
                this._isParent = true;
            }
        }
    };

    var Storage = {
        _cache: [],
        getFromCache: function (url) {
            return this._cache.filter(function (item) {
                return url === item.url;
            });
        },
        putInCache: function (url, text) {
            this._cache.push({
                url: url,
                text: text
            });
        }
    };

    var Router = {
        LOADING_CLASS: 'is-loading',
        setLoading: function () {
            $('body').addClass(this.LOADING_CLASS);
        },
        unsetLoading: function () {
            $('body').removeClass(this.LOADING_CLASS);
        },
        getTextFromURL: function (url) {
            var deferred = $.Deferred();
            var item = Storage.getFromCache(url);

            if (item && 'text' in item) {
                deferred.resolve(item.text);
            } else {
                $.get(url).then(function (data) {
                    var pattern = /<article class="article hentry">([\s\S]*?)<\/article>/gi;
                    var matches = data.match(pattern) || [];
                    var text;

                    if (matches.length) {
                        text = matches.pop();

                        Storage.putInCache(url, text);

                        deferred.resolve(text);
                    } else {
                        deferred.reject('No content');
                    }
                }, function (err) {
                    deferred.reject(err);
                });
            }

            return deferred.promise();
        },
        transitionTo: function (url) {
            var self = this;
            var then = Date.now();
            var deferred = $.Deferred();
            var t;
            var MIN_DURATION = 1000;

            this.setLoading();

            if (url === '/') {
                t = setTimeout(function () {
                    Transition.toParentPage();
                    self.unsetLoading();

                    deferred.resolve(url);
                    $app.trigger('route:change', url);
                    clearTimeout(t);
                }, MIN_DURATION);
            } else {
                self.getTextFromURL(url).then(function (text) {
                    var $target = $('#page-2-content');
                    var now = Date.now();
                    t = setTimeout(function () {
                        $target.html(text);
                        Transition.toChildPage();
                        self.unsetLoading();

                        deferred.resolve(url);
                        $app.trigger('route:change', url);
                        clearTimeout(t);
                    },
                        // Make sure the 'loading' state shows for at least 1 second
                        (now - then > MIN_DURATION ? 0 : MIN_DURATION + now - then)
                    );
                }, function (err) {
                    // Handle error
                    deferred.reject(err);
                    self.unsetLoading();
                });
            }

            return deferred.promise();
        }
    };

    $('.site-header__title, .home a').click(function (e) {
        e.preventDefault();

        Router.transitionTo(this.getAttribute('href'));
    });

    $('.site-header__back').click(function (e) {
        e.preventDefault();

        Router.transitionTo('/');
    });

    $('.site-header__about').click(function (e) {
        e.preventDefault();

        var $target = $(this.getAttribute('href'));
        var scrollToTarget = function () {
            var top = $target.offset().top;

            Transition.$parentPage.animate({
                scrollTop: top
            }, 'fast');
        };

        if ($target.length) {
            if (! Transition._isParent) {
                Router.transitionTo('/').then(scrollToTarget);
            } else {
                scrollToTarget();
            }
        }
    });

    /**
     * Fancy header-ness with Headroom.js
     *
     * @{@link  http://wicky.nillia.ms/headroom.js/}
     */
    var headroom;
    var getHeadroomOptions = function () {
        var scroller = Transition._isParent ?
            Transition.$parentPage.get().pop() :
            Transition.$childPage.get().pop();

        return {
            offset: 15,
            scroller: scroller
        };
    };
    var initHeadroom = function () {
        if (headroom instanceof Headroom) {
            headroom.destroy();
        }

        headroom = new Headroom(
            document.querySelector('.site-header'),
            getHeadroomOptions.call()
        );
        headroom.init();
    };
    initHeadroom();

    /**
     * Toggle class on the header 'back' button when routes change.
     *
     * @todo Refactor this
     */
    $app.on('route:change', function (e, url) {
        var $el = $('.site-header__back');

        $el.toggleClass('is-hidden', (url === '/'));
    });

    /**
     * Change the Headroom scrolling context when the route changes.
     */
    $app.on('route:change', initHeadroom);
})(jQuery);

/*
 * jQueryFileTree Plugin
 *
 * @author - Cory S.N. LaViska - A Beautiful Site (http://abeautifulsite.net/) - 24 March 2008
 * @author - Dave Rogers - (https://github.com/daverogers/)
 * @author - Luc Pharabod - (http://www.shotthemhost.com)
 *    Add font-awesome support
 *    Add refresh node
 *    Add root directory / first node
 *    Add new dom to show selected node
 *    Add initial unfold tree
 *    Enhance use of script by function asynchronous with callback add
 *
 * Usage: $('.fileTreeDemo').fileTree({ options }, callback )
 *        $('.fileTreeDemo').data('fileTree').refreshTree('path/to/folder/to/refresh');
 *
 * TERMS OF USE
 *
 * This plugin is dual-licensed under the GNU General Public License and the MIT License and
 * is copyright 2008 A Beautiful Site, LLC.
 */
var bind = function (fn, me) {
    return function () {
        return fn.apply(me, arguments);
    };
};

(function ($, window) {
    var FileTree;
    FileTree = (function () {
        function FileTree(el, args, callback) {
            this.onEvent = bind(this.onEvent, this);
            var $el, _this, defaults;
            $el = $(el);
            _this = this;
            defaults = {
                folderPictoOpenClass: 'fa-plus-square-o',
                folderPictoClass: 'fa-plus-square',
                folderOpenClass: 'fa-folder-open-o',
                folderClass: 'fa-folder-o',
                //rootClass: 'fa-home',
                root: '/',
                rootName: 'Root',
                script: 'defaultFiletreeConnector',
                folderEvent: 'click',
                expandSpeed: 500,
                collapseSpeed: 500,
                expandEasing: 'swing',
                collapseEasing: 'swing',
                multiFolder: true,
                loadMessage: 'Loading...',
                errorMessage: 'Unable to get file tree information',
                multiSelect: false,
                onlyFolders: false,
                onlyFiles: false,
                viewCallBack: null,
                currentFolderChange: null,
                expandedFolders: [],
                preventLinkAction: false,
                endCallBack: null,
                auth:false
            };
            this.jqft = {
                container: $el
            };
            this.options = $.extend(defaults, args);
            this.callback = callback;
            this.data = {};

            // init tree
            roothtml = '<li class="expanded root">\
		  	  <div class="droppable tree-node-el tree-node-leaf" rel="/" style="padding-left:0"><span class="tree-node-indent">\
				<i class="tree-node-icon fa fa-lg fa-fw fa-2x icon-silver ' + this.options.folderClass + '" rel="/"></i>\
				<a rel="' + this.options.root + '">' + this.options.rootName + '</a>\
			  </span></div>\
              <ul class="jqueryFileTree start"><li class="wait">' + this.options.loadMessage + '<li></ul>\
            </li>';

            $el.html(roothtml);
            $el.delegate("li i.tree-node-icon", this.options.folderEvent, _this.onEvent);
            $el.delegate("li i.folder-picto", this.options.folderEvent, _this.onEvent);
            $el.delegate("li a", this.options.folderEvent, _this.onEvent);

            $el=$el.find('li');
            _this.showTree($el, escape(this.options.root), function () {
                return _this._trigger('filetreeinitiated', {});
            });
        }
        FileTree.prototype.onEvent = function (event) {
            var $ev, _this, callback, jqft, options, ref;
            $ev = $(event.target).parent().find('a'); //$(event.target);
            options = this.options;
            jqft = this.jqft;
            _this = this;
            callback = this.callback;
            _this.data = {};
            _this.data.li = $ev.closest('li');
            _this.justUnfold = (event.target.nodeName=='I') && $(event.target).hasClass('folder-picto') ;
            _this.data.type = (ref = _this.data.li.hasClass('directory')) != null ? ref : {
                'directory': 'file'
            };
            _this.data.value = $ev.text();
            _this.data.rel = $ev.prop('rel');
            _this.data.container = jqft.container;
            if (options.preventLinkAction) {
                event.preventDefault();
            }
            $evli = $ev.closest('li');
            $evdiv = $evli.find('div.tree-node-el:first');
            if ($evli.hasClass('directory')) {
                if ($evli.hasClass('collapsed')) {
                    if (!options.multiFolder) {
                        $evli.find('UL').slideUp({
                            duration: options.collapseSpeed,
                            easing: options.collapseEasing
                        });
                        $evli.closest('li').find('LI.directory').removeClass('expanded').addClass('collapsed');
                        if (!_this.justUnfold) {
                            jqft.container.find('DIV.tree-node-el').removeClass('tree-selected');
                        }
                    }
                    $evli.removeClass('collapsed').addClass('expanded');
                    if (!_this.justUnfold) {
                        $evdiv.addClass('tree-selected');
                    }

                    $evli.find('div span i.tree-node-icon').removeClass(_this.options.folderClass).addClass(_this.options.folderOpenClass);
                    $evli.find('div span i.folder-picto').removeClass(_this.options.folderPictoClass).addClass(_this.options.folderPictoOpenClass);


                    $evli.find('UL').remove();
                    return _this.showTree($evli, $ev.attr('rel'), function () {
                        if (!_this.justUnfold) {
                            _this._trigger('filetreeexpanded', _this.data);
                        }
                        return callback != null;
                    });
                } else {
                    return $evli.find('UL').slideUp({
                        duration: options.collapseSpeed,
                        easing: options.collapseEasing,
                        start: function () {
                            return _this._trigger('filetreecollapse', _this.data);
                        },
                        complete: function () {
                            $evli.removeClass('expanded').addClass('collapsed');
                            $evli.find('i.tree-node-icon').removeClass(_this.options.folderOpenClass).addClass(_this.options.folderClass);
                            $evli.find('i.folder-picto').removeClass(_this.options.folderPictoOpenClass).addClass(_this.options.folderPictoClass);
                            jqft.container.find('div.tree-node-leaf.tree-selected').removeClass('tree-selected');
                            $evdiv.addClass('tree-selected');
                            _this._trigger('filetreecollapsed', _this.data);
                            return callback != null;
                        }
                    });
                }
            } else {
                if (!options.multiSelect) {
                    jqft.container.find('li').removeClass('selected');
                    jqft.container.find('div.tree-node-leaf').removeClass('tree-selected');
                    $evli.addClass('selected');
                    $evdiv.addClass('tree-selected');
                } else {
                    if ($evli.find('input').is(':checked')) {
                        $evli.find('input').prop('checked', false);
                        $evli.removeClass('selected');
                        $evdiv.removeClass('tree-selected');
                    } else {
                        $evli.find('input').prop('checked', true);
                        $evli.addClass('selected');
                        $evdiv.addClass('tree-selected');
                    }
                }
                _this._trigger('filetreeclicked', _this.data);
                return typeof callback === "function" ? callback($ev.attr('rel')) : void 0;
            }
        };
        FileTree.prototype.refreshTree = function (rel, openedFolder = []) {
            _this = this;

            _oldList = this.jqft.container.find('div[rel="' + rel + '"]').parent().find('ul:first');
            _this.options.expandedFolders = openedFolder;

            var li = $('div[rel="' + rel + '"]').parent();
            li.find('UL').remove();
            this.showTree(
                $(li),
                rel,
                rel,
                function(){}
            );
        };

        FileTree.prototype.removeTree = function (rel) {
            // delete one LI from parent UL by rel
            _oldList = this.jqft.container.find('div[rel="' + rel + '"]').parent();
            _oldList.remove();
            return true;
        };

        FileTree.prototype.showTree = function (el, dir, finishCallback) {
            var $el, _this, data, handleFail, handleResult, options, result;
            $el = $(el);
            options = this.options;
            _this = this;
            $el.addClass('wait');
            $(".jqueryFileTree.start").remove();
            data = {
                dir: dir,
                onlyFolders: options.onlyFolders,
                onlyFiles: options.onlyFiles,
                multiSelect: options.multiSelect,
                expandedFolders: options.expandedFolders
            };
            handleResult = function (result) {
                var li;
                $el.find('.start').html('');

                // hook if a view is defined to process html from API result
                if (typeof options.viewCallBack === 'function') {
                    result = options.viewCallBack(result);
                }
                $el.removeClass('wait').append(result);

                $el.find('.directory i.tree-node-icon').addClass(_this.options.folderClass);
                if (options.root === dir) {
                    $el.find('UL:hidden').show(typeof callback !== "undefined" && callback !== null);
                } else {
                    if (jQuery.easing[options.expandEasing] === void 0) {
                        console.log('Easing library not loaded. Include jQueryUI or 3rd party lib.');
                        options.expandEasing = 'swing';
                    }
                    $el.find('UL:hidden').slideDown({
                        duration: options.expandSpeed,
                        easing: options.expandEasing,
                        start: function () {
                            return _this._trigger('filetreeexpand', _this.data);
                        },
                        complete: finishCallback
                    });
                }
                li = $('[rel="' + decodeURIComponent(dir) + '"]').parent();
                if (options.multiSelect && li.children('input').is(':checked')) {
                    li.find('ul li input').each(function () {
                        $(this).prop('checked', true);
                        return $(this).parent().addClass('selected');
                    });
                }
                if (options.expandedFolders != null) {
                    //console.log(options.expandedFolders);
                    $el.find('.directory.collapsed').each(function (i, li) {
                        if ($.inArray($(li).children().attr('rel'), $(options.expandedFolders)) != -1) {
                            $(li).removeClass('collapsed').addClass('expanded');

                            // // hook when a folder is expand
                            // if (typeof options.currentFolderChange === 'function') {
                            //     options.currentFolderChange($(li).children().attr('rel'));
                            // }


                            _this.showTree($(li), escape($(li).children().attr('rel').match(/.*\//)), function () {
                                _this._trigger('filetreeexpanded', $(li).children());
                            });
                        }
                    });
                }
                if (typeof options.endCallBack === 'function') {
                    options.endCallBack(result);
                }

                return false;
            };
            handleFail = function () {
                $el.find('.start').html('');
                $el.removeClass('wait').append("<p>" + options.errorMessage + "</p>");
                return false;
            };
            if (typeof options.script === 'function') {
                options.script(data, handleResult);
            } else {

                return $.ajax({
                    url: options.script,
                    type: 'POST',
                    dataType: 'HTML',
                    data: data,
                    beforeSend : function(xhr) {
                        if (options.auth) {
                            xhr.setRequestHeader("Authorization", options.auth);
                        }
                    }
                }).done(function (result) {
                    return handleResult(result);

                }).fail(function () {
                    return handleFail();
                });
            }
        };

        FileTree.prototype._trigger = function (eventType, data) {
            var $el;
            $el = this.jqft.container;
            return $el.triggerHandler(eventType, data);
        };

        return FileTree;

    })();
    return $.fn.extend({
        fileTree: function (args, callback) {
            return this.each(function () {
                var $this, data;
                $this = $(this);
                data = $this.data('fileTree');
                if (!data) {
                    $this.data('fileTree', (data = new FileTree(this, args, callback)));
                }
                if (typeof args === 'string') {
                    return data[option].apply(data);
                }
            });
        }
    });
})(window.jQuery, window);


var fileTreeScript = 'http://api.optmiz.me/filetree/';
var fileManagerScript = 'http://api.optmiz.me/file/';
var folderScript = 'http://api.optmiz.me/folder';


function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}

/*
 sum file size
 */
function du(files) {
    var sum = 0;
    for (i = 0; i < files.length; i++) {
        sum = sum + files[i]['size'];
    }
    //return Math.floor(sum/1024/1024*100)/100;
    return humanFileSize(sum, true);
}

function duSelected(files) {
    var sum = 0;
    for (i = 0; i < files.length; i++) {
        file = JSON.parse(decodeURI($(files[i]).attr('data-file')));
        sum = sum + file['size'];
    }
    //return Math.floor(sum/1024/1024*100)/100;
    return humanFileSize(sum, true);
}


/*
 *  Attach file uplad to div
 */
function attachUpload() {
    $(".upload").upload({
        maxSize: 1073741824,
        beforeSend: onBeforeSend,
        action: fileManagerScript,  //scriptHandleUpload,
        uploadBeforeSend: onBeforeAuthentication,
        label: ''
    }).on("start.upload", onStart)
        .on("complete.upload", onComplete)
        .on("filestart.upload", onFileStart)
        .on("fileprogress.upload", onFileProgress)
        .on("filecomplete.upload", onFileComplete)
        .on("fileerror.upload", onFileError)
        .on("chunkstart.upload", onChunkStart)
        .on("chunkprogress.upload", onChunkProgress)
        .on("chunkcomplete.upload", onChunkComplete)
        .on("chunkerror.upload", onChunkError)
        .on("filedragenter.upload", onFileDragEnter)
        .on("filedragleave.upload", onFileDragLeave)
        .on("queued.upload", onQueued);

    $(".filelist.queue").on("click", ".cancel", onCancel);
    $(".cancel_all").on("click", onCancelAll);
}




// // repo1 jwt
// var bearer = "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXBvc2l0b3J5IjoicmVwbzEiLCJuYW1lIjoibGt1dWx1IiwiYWRtaW4iOnRydWV9._7whRQ02S8LNOwx0AKRPj9gQRfjjWp1tGKwoGMi7Txo";
// var repository = 'repo1';
// // repo2 jwt
// var bearer = "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXBvc2l0b3J5IjoicmVwbzIiLCJuYW1lIjoibGt1dWx1IiwiYWRtaW4iOnRydWV9.63RSS81AXiH-8Bs0aOqsnVKkmmUDKZVK4lTCGay_5Rs";
// var bearer = "bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZXBvc2l0b3J5IjoicmVwbzIiLCJuYW1lIjoibGt1dWx1IiwiYWRtaW4iOnRydWV9.Cfx0LDycRVlG9B7CJE6Zn8yWAptutYZT6N3SgXrU_Fk";

var bearer = getCookie('Authorization');
var repository = getCookie('Repository');

if (!bearer) {
  window.location.href='http://www.optmiz.me/login';
}

var repoBasePath = repository + '/';
var imageBaseDomain = "http://image.optmiz.me/" + repoBasePath;


var selectedThumbs = [];
var copyThumbs = [];
var currentFolder;
var folderFiles;
var oFile;

function onBeforeAuthentication(xhr) {
    if (bearer) {
        xhr.setRequestHeader("Authorization", bearer);
    }
}

function onUploadBeforeSend(xhr) {
    console.log("Real Before Send OUTSIDE");
    console.log(xhr);
    console.log('bearer', bearer);
    if (bearer) {
        xhr.setRequestHeader("Authorization", bearer);
    }
}


$(document).ready(function () {
    var name = $("#name"),
        tips = $(".validateTips");
    var initCrop = {
        "onChange": showCoords,
        "animationDelay": 5,
        "touchSupport": true,
        "handleSize": 2,
        "maxSise": [0, 0],
        "minSise": [20, 20],
        "boxWidth": 800,
        "boxHeight": 600,
        "canDrag": true,
        "canResize": true
    };
    var currentCropName = 'poi';
    var coords = $('<div> x </div>').addClass('jcrop-coords');

    outerLayout = $('body').layout(layoutSettings_Outer);


    /*
     *  Preview panel functions
     */
    var refreshPreviewFolder = function (folder) {
        $('div.ui-layout-east').empty();
        folder = {
            'path': currentFolder,
            'count': folderFiles.length,
            'size': du(folderFiles),
            'selected': selectedThumbs.length,
            'selectedSize': duSelected(selectedThumbs)
        };
        $('div.ui-layout-east').append(renderPreviewFolder(folder));
    };

    function refreshPreviewImage(image) {
        $('div.ui-layout-east').empty();
        jsonImage = JSON.parse(image);
        $('div.ui-layout-east').append(renderPreviewImage(jsonImage));
    }


    function loadImage(imageFile, fileObject) {
        $.ajax({
            url: fileManagerScript + imageFile, //imageScript,
            type: 'GET', //'POST',
            dataType: 'HTML',
            beforeSend: onBeforeAuthentication,
            //data: {'file':imageFile, 'fileObject':fileObject}
        }).done(function (result) {
            refreshPreviewImage(result);
        }).fail(function () {
            console.log('fail')
        });
    }


    /*
     *  Main panel thumbnail functions
     */
    function addSelected(thumb) {
        var findIt = false;
        for (var i = 0; i < selectedThumbs.length; i++) {
            if ($(thumb).attr('data-rel') == $(selectedThumbs[i]).attr('data-rel')) {
                findIt = true;
            }
        }
        if (!findIt) {
            selectedThumbs.push(thumb);
        }
    }

    function removeSelected(thumb) {
        for (var i = selectedThumbs.length - 1; i >= 0; i--) {
            if ($(thumb).attr('data-rel') == $(selectedThumbs[i]).attr('data-rel')) {
                selectedThumbs.splice(i, 1);
            }
        }
    }

    function removeAll() {
        for (var i = selectedThumbs.length - 1; i >= 0; i--) {
            $(selectedThumbs[i]).removeClass(selectedClass)
            selectedThumbs.splice(i, 1);
        }
    }

    var endSelectedThumbChange;
    var selectedThumbChanging;

    function onSelectedThumbChange() {
        window.clearTimeout(endSelectedThumbChange);
        // in fine
        if (selectedThumbs.length == 1) {
            // single image select, can show detail for this
            loadImage($(selectedThumbs[0]).attr('data-rel'), decodeURI($(selectedThumbs[0]).attr('data-file')));
        } else {
            // no image or multiple selected, show summary
            refreshPreviewFolder(currentFolder);
        }
    }

    function callbackSelectedThumbChange() {
        window.clearTimeout(endSelectedThumbChange);
        endSelectedThumbChange = window.setTimeout(function () {
            onSelectedThumbChange()
        }, 10);
    }

    $.appendThumbFromFile = function (file) {

        // generate html thumbs
        dom = renderThumb(file);
        // put in parent grid.
        $('div.ui-layout-center').append(dom);
    }

    // implement homemade selectable
    var selectedClass = 'ui-selected';


    function cloneSelection() {
        if (selectedThumbs.length > 1) {
            // todo:construct mini clone
            var thumbClone = $(selectedThumbs[0]).clone();
            $("body").prepend(thumbClone);
            for (i=1;i<selectedThumbs.length;i++) {
                thumbClone = thumbClone.add($(selectedThumbs[i]).clone());
            }
            thumbClone = $('<div style="position:absolute">' + selectedThumbs.length + ' image(s)</div>').prepend(thumbClone);
            return $(thumbClone);
            // thumbClone = $(selectedThumbs[0]).clone();
            // thumbClone = $('<div style="position:absolute">' + selectedThumbs.length + ' image(s)</div>').prepend(thumbClone);
            // return $(thumbClone);
        } else if (selectedThumbs.length > 0) {
            return $(selectedThumbs[0]).clone().html();
        } else {
            return $("<div class='ui-widget-header'>Drop</div>");
        }
    }

    function refreshThumbs(files) {
        // remove actual list items
        $('div.ui-layout-center').empty();
        folderFiles = JSON.parse(files);
        // Iterate on files
        for (i = 0; i < folderFiles.length; i++) {
            $.appendThumbFromFile(folderFiles[i]);
        }
        var selected = $([]);



        $(".thumb-draggable").draggable({
            appendTo: "body",
            cursor: "crosshair",
            cursorAt: { top: 10, left: 10 },
            //handle: '.title',
            opacity: 0.7,
            helper: function (event) {
                return cloneSelection();
            },
            start: function (event, ui) {
                if (selectedThumbs.length == 0) {
                    $(event.target).toggleClass(selectedClass)
                    addSelected(event.target);

                    thumbClone = $(selectedThumbs[0]).clone();
                    thumbClone = $('<div style="position:absolute">' + selectedThumbs.length + ' image(s)</div>').prepend(thumbClone);
                    ui.helper.html(thumbClone.prop('outerHTML'));
                }
            },
            revert: "invalid"
        });

        var clickDelay = 600,
            // click time (milliseconds)
            lastClick, diffClick; // timestamps
        $(".ui-layout-center .thumb").bind('mousedown mouseup', function (e) {
            if (e.type == "mousedown") {
                lastClick = e.timeStamp; // get mousedown time
            } else {
                diffClick = e.timeStamp - lastClick;
                if (diffClick < clickDelay) {
                    // add selected class to group draggable objects
                    var thumb = $(this);

                    if (!e.ctrlKey) {
                        removeAll();
                    }

                    thumb.toggleClass(selectedClass);
                    if (thumb.hasClass(selectedClass)) {
                        addSelected(thumb);
                    } else {
                        removeSelected(thumb);
                    }
                    callbackSelectedThumbChange();

                }
            }
        })


        //enter in drag capabilities
        // $( ".thumb-draggable" ).draggable({
        //     appendTo: "body",
        //     cursor: "crosshair",
        //     //cursorAt: { top: -5, left: -5 },
        //     //handle: '.title',
        //     opacity: 0.7,
        //     helper: "clone",
        //     revert: "invalid",
        //     start: function(ev, ui) {
        //         if ($(this).hasClass("ui-selected")){
        //             selected = $(".ui-selected").each(function() {
        //                 var el = $(this);
        //                 el.data("offset", el.offset());
        //             });
        //         }
        //         else {
        //             selected = $([]);
        //             $(".thumb").removeClass("ui-selected");
        //         }
        //         offset = $(this).offset();
        //     },
        //     drag: function(ev, ui) {
        //         var dt = ui.position.top - offset.top, dl = ui.position.left - offset.left;
        //         // take all the elements that are selected expect $("this"), which is the element being dragged and loop through each.
        //         selected.not(this).each(function() {
        //             // create the variable for we don't need to keep calling $("this")
        //             // el = current element we are on
        //             // off = what position was this element at when it was selected, before drag
        //             var el = $(this), off = el.data("offset");
        //             el.css({top: off.top + dt, left: off.left + dl});
        //         });
        //     }
        // });

        return folderFiles;
    }

    function attachThumbsMenu() {
        $.contextMenu({
            selector: '.thumb.ui-selected',
            callback: function (key, options) {
                var m = "clicked: " + key;
                //window.console && console.log(m) || alert(m);
                console.log(key, options);

                // console.log(decodeURI($(options.selector).data('file')));
            },
            items: {
                //"see": {name: "open", icon: "fa-eye", disabled: function(){ return (selectedThumbs.length>1) }},
                //"copy": {name: "copy", icon: "fa-files-o", disabled: function(){ return (selectedThumbs.length>1) }},
                //"rename": {name: "Rename", icon: "fa-pencil-square-o", disabled: function(){ return (selectedThumbs.length>1) }},
                //"cut": {name: "cut", icon: "fa-scissors", disabled: function(){ return (selectedThumbs.length==0) }},
                "delete": {
                    name: "delete", icon: "fa-eraser", disabled: function () {
                        return (selectedThumbs.length == 0)
                    }, callback: deleteFileMenuItemClick
                },
            }
        });
    }

    function deleteFileMenuItemClick(key, options) {
        $(options.selector).each(function () {
            fileObj = decodeURI($(this).data('file'));
            deleteFile(fileObj);
        });
    }

    deleteFile = function (file) {
        //currentFolder=folder;
        oFile = JSON.parse(file);
        $.ajax({
            url: fileManagerScript + oFile.path, //+'?'+$.param({'folder':currentFolder,'file':oFile.path}),
            type: 'DELETE',
            dataType: 'HTML',
            data: {'folder': currentFolder, 'file': oFile.path},
            beforeSend: onBeforeAuthentication
        }).done(function (result) {
            selectedThumbs = [];
            folderFiles = refreshThumbs(result);
            refreshPreviewFolder(folderFiles);
            attachThumbsMenu();
        }).fail(function () {
            console.log('fail')
        });
    }

    $.loadThumbs = function (folder) {
        currentFolder = folder;
        $.ajax({
            url: folderScript + folder, // thumbsScript,
            type: 'GET', //'POST',
            dataType: 'HTML',
            beforeSend: onBeforeAuthentication
        }).done(function (result) {
            //console.log(result);
            selectedThumbs = [];
            folderFiles = refreshThumbs(result);
            refreshPreviewFolder(folderFiles);
            attachThumbsMenu();
        }).fail(function () {
            console.log('fail')
        });
    }

    function onTreeviewEndDraw(treeview) {
        $(".jqueryFileTree li.draggable").draggable({grid: [8, 8], opacity: 0.7, helper: "clone"});

        $(".jqueryFileTree div.droppable").droppable({
            accept: "li.draggable, .thumb-draggable",
            tolerance: "pointer",
            classes: {
                "ui-droppable-hover": "ui-state-hover"
            },
            drop: function (event, ui) {
                if ($(ui.draggable).hasClass('thumb')) {
                    if (selectedThumbs.length > 1) {
                        for (i = 0; i < selectedThumbs.length; i++) {
                            moveFile(selectedThumbs[i], $(this).parent())
                        }
                    } else {
                        moveFile($(ui.draggable), $(this).parent())
                    }
                } else {
                    moveFolder($(ui.draggable), $(this).parent())
                }
            }
        });
    }


    function onFolderChange(folder) {
        currentFolder = folder;
    }

    /*
     *   Left panel filetree functions
     */
    function makeFileTree(foldersOverride = null) {
        $('.jqueryFileTree').fileTree({ //.filetree
            root: '/',
            rootName: 'root',
            expandedFolders: (foldersOverride != null) ? foldersOverride : [],
            folderOpenClass: 'fa-folder-open-o',
            folderClass: 'fa-folder-o',
            rootClass: 'fa-globe',
            script: fileTreeScript,
            auth: bearer,
            multiFolder: false,
            onlyFolders: true,
            expandSpeed: 100,
            collapseSpeed: 100,
            viewCallBack: renderTree,
            currentFolderChange: onFolderChange,
            endCallBack: onTreeviewEndDraw
        }).on('filetreeexpanded filetreecollapsed filetreeclicked', function (e, data) {
            $.loadThumbs($(data).attr('rel'));
        });
    }

    makeFileTree();

    /*
     *   popin form functions
     *   - croping & Jcrop interface
     *   - validator
     *   - save
     */

    var endAnimate;

    function onEndAnimate(newCoord) {
        //console.log(newCoord.poi);
        window.clearTimeout(endAnimate);
        edImage = $.extend(true, edImage, newCoord)
    }

    function callBackEndAnimate(newCoord) {
        window.clearTimeout(endAnimate);
        endAnimate = window.setTimeout(function () {
            onEndAnimate(newCoord)
        }, 100);
    }

    function showCoords(c) {
        // attach coordinate bubble to selection
        $('.jcrop-selection').prepend(coords);
        var extraCoords = extrapolate([c.x, c.y, c.w, c.h], instance.getContainerSize()[0], edImage.size[0]);
        coordHtml = extraCoords[0] + ' &times ' + extraCoords[1] + ((currentCropName != 'poi') ? ' <br \> ' + extraCoords[2] + ' &times ' + extraCoords[3] : '')
        coords.html(coordHtml);

        // save new coordinates in edImage object
        if (currentCropName == 'poi') {
            var newCoord = {
                'poi': {
                    'x': extraCoords[0],
                    'y': extraCoords[1],
                }
            }
        } else {
            var newCoord = {
                'crops': {
                    [currentCropName]: {
                        'x': extraCoords[0],
                        'y': extraCoords[1],
                        'w': extraCoords[2],
                        'h': extraCoords[3],
                    }
                }
            }
        }
        // register to callBack for end moving event
        callBackEndAnimate(newCoord);
    };


    /*
     *   get real coordinates from reduced editform viewport
     */
    function extrapolate(coord, imageWidth, viewportWidth) {
        ratio = 1;

        //ratio = viewportWidth / imageWidth;

        coord[0] = Math.round(coord[0] * ratio);
        coord[1] = Math.round(coord[1] * ratio);
        coord[2] = Math.round(coord[2] * ratio);
        coord[3] = Math.round(coord[3] * ratio);

        return coord;
    }


    /*
     * init Jcrop to the image w correct ratio to setup
     */
    function setJcrop(name, extended, image, imgId) {
        base = $.extend(true, {}, initCrop);
        $.extend(true, base,
            extended);
        if (instance) {
            instance.destroy();
        }
        $('#' + imgId).Jcrop(
            base,
            function () {
                instance = this;
                instance.newSelection();
                if (image['crops'] != null && (typeof image['crops'] != 'undefined') && typeof image['crops'][name] != 'undefined') {
                    c = image['crops'][name];
                    instance.animateTo(extrapolate([c['x'], c['y'], c['w'], c['h']], image['size'][0], instance.getContainerSize()[0]));
                } else if ((image[name] != null) && (typeof image[name] != 'undefined')) {
                    c = image[name];
                    instance.animateTo(extrapolate([c['x'], c['y'], 1, 1], image['size'][0], instance.getContainerSize()[0]));
                } else if (name == 'poi') {
                    // goto image center, in case of poi only
                    instance.animateTo(extrapolate([(image['size'][0] / 2), (image['size'][1] / 2), 1, 1], image['size'][0], instance.getContainerSize()[0]));
                }
            }
        );
    }

    /*
     * Save Image ajax function
     */
    function saveImage(fileObject) {
        $.ajax({
            url: fileManagerScript + fileObject['path'],
            type: 'PATCH',
            dataType: 'HTML',
            data: fileObject,
            beforeSend: onBeforeAuthentication
        }).done(function (result) {
            console.log(result);
            loadImage($(selectedThumbs[0]).attr('data-rel'), decodeURI($(selectedThumbs[0]).attr('data-file')))
            $("#dialog-form").dialog("close");
        }).fail(function () {
            console.log('fail')
        });
    }

    function saveNewImage(fileObject) {
        var fileInput = document.getElementById('filesToUpload');
        var file = fileInput.files[0];
        var formData = new FormData();
        formData.append('file', file);
        formData.append('dist_dir', currentFolder);
        formData.append('fileObject', encodeURI(JSON.stringify(fileObject)));
        //mimeType: "multipart/form-data",
        $.ajax({
            url: fileManagerScript,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            dataType: 'HTML',
            data: formData,
            beforeSend: onBeforeAuthentication
        }).done(function (result) {
            $("#upload-form").dialog("close");
            $.loadThumbs(currentFolder);
        }).fail(function () {
            console.log('fail')
        });
    }

    function createFolder(newFolder) {
        var formData = new FormData();
        formData.append('dir', currentFolder);
        formData.append('newfolder', newFolder);

//        console.log(newFolder, currentFolder);
        $.ajax({
            url: folderScript + '/',
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            dataType: 'HTML',
            beforeSend: onBeforeAuthentication,
            data: formData //{'dir':currentFolder, 'newfolder':newFolder}
        }).done(function (result) {
            $("#upload-form").dialog("close");
            $.loadThumbs(currentFolder);
            // refresh tree
//            console.log(newFolder);
            $('.jqueryFileTree').data('fileTree').refreshTree(currentFolder); //.filetree
        }).fail(function () {
            console.log('fail')
        });
    }

    function removeTreeFolder(folder) {
        $('.jqueryFileTree').data('fileTree').removeTree(folder);
    }

    function refreshTreeFolder(folder) {
        var parts = folder.split('/');
        parts.pop();
        var breadcrumb = '';
        var currentFolder = '/';
        var openedFolder = [];
        for (var i = 1; i < parts.length; i++) {
            breadcrumb += '/' + parts[i];
            openedFolder.push(breadcrumb + '/');
            currentFolder = breadcrumb + '/';
        }

        $('.jqueryFileTree').data('fileTree').refreshTree(currentFolder, openedFolder);

        currentFolder = breadcrumb + '/';
        $.loadThumbs(currentFolder);
    }


    function renameFolder(newFolder, rel) {
        currentFolder = rel;
        $.ajax({
            url: folderScript + '/',
            cache: false,
            contentType: 'application/json',
            type: 'PUT',
            dataType: 'HTML',
            beforeSend: onBeforeAuthentication,
            data: JSON.stringify({'newfolder': newFolder, 'dir': currentFolder}) // formData //
        }).done(function (result) {
            $("#upload-form").dialog("close");

            var parts = currentFolder.split('/');

            parts.pop();
            parts.pop();

            refreshTreeFolder(parts.join('/'))

            parts.push(newFolder);
            parts.push('');

            refreshTreeFolder(parts.join('/'))

        }).fail(function () {
            console.log('fail')
        });
    }

    function moveFile(source, destination) {
        var sourceFile = $(source).attr('data-rel');
        var destinationPath = $(destination).find('div').attr('rel');
        $.ajax({
            url: folderScript + '/' + sourceFile,
            cache: false,
            contentType: 'application/json',
            type: 'PUT',
            dataType: 'HTML',
            data: JSON.stringify({'source': sourceFile, 'destination': destinationPath}),
            beforeSend: onBeforeAuthentication
        }).done(function (result) {
            $.loadThumbs(currentFolder);
        }).fail(function () {
            console.log('fail')
        });
    }

    function moveFolder(source, destination) {
        var sourcePath = $(source).find('div').attr('rel');
        var destinationPath = $(destination).find('div').attr('rel');
        // console.log(sourcePath);
        // console.log(destinationPath);
        //return true;
        $.ajax({
            url: folderScript + sourcePath,
            cache: false,
            contentType: 'application/json',
            type: 'PUT',
            dataType: 'HTML',
            data: JSON.stringify({'source': sourcePath, 'destination': destinationPath}),
            beforeSend: onBeforeAuthentication
        }).done(function (result) {

            // var parts = sourcePath.split('/')
            // parts.pop();
            // var last = parts.pop();
            // parts.push('');
            // sourcePath = parts.join('/');
            removeTreeFolder(sourcePath);
            refreshTreeFolder(destinationPath);
        }).fail(function () {
            console.log('fail')
        });
    }


    function deleteFolder(folder) {
        folders = folder.split('/');
        folders.pop();
        folders.pop();
        currentFolder = folders.join('/') + '/';

        $.ajax({
            url: folderScript + folder,
            cache: false,
            contentType: false,
            processData: false,
            type: 'DELETE',
            dataType: 'HTML',
            data: JSON.stringify({'folder': folder}),
            beforeSend: onBeforeAuthentication
        }).done(function (result) {
            $.loadThumbs(currentFolder);
            // refresh tree
            $('.jqueryFileTree').data('fileTree').refreshTree(currentFolder); //.filetree
        }).fail(function () {
            console.log('fail')
        });
    }


    function updatePoi() {
        var valid = true;
        if (valid) {
            saveImage(edImage);
        }
        return valid;
    }

    function updateUpload() {
        var valid = true;
        if (valid) {
            console.log(edImage);
            saveNewImage(edImage);
        }
        return valid;
    }


    function initForm(popin, image) {
        edImage = image;

        // beark html fragment !
        popin.html("\
       <form id=\"edform\" width=\"600px\" height\"500px\">\
         <fieldset>\
           <label for=\"croppoi\">Edit ratio/poi :</label>\
         	<select id=\"croppoi\" name=\"croppoi\">\
         		 <option value=\"poi\">Point of interest</option>\
         		 <option value=\"portrait\">Portrait (3/4)</option>\
         		 <option value=\"square\">Square (1/1)</option>\
         		 <option value=\"landscape\">Landscape (4/3)</option>\
         		 <option value=\"large\">Large (16/9)</option>\
         		 <option value=\"xlarge\">Extra-large (24/9)</option>\
         	</select>\
           <!-- Allow form submission with keyboard without duplicating the dialog button -->\
           <input type=\"submit\" tabindex=\"-1\" style=\"position:absolute; top:-1000px\">\
           <br \>\
           <img id=\"target\" src=\"" + imageBaseDomain + image['path'] + "/original\"><br>\
         </fieldset>\
       </form>");
        //<img id=\"target\" src=\""+image['path']+"/w600/original\"><br>\

        $('#croppoi').change(function () {
            currentCropName = $('#croppoi option:selected').val();
            console.log(edImage);
            setJcrop($('#croppoi option:selected').val(), params[$('#croppoi option:selected').val()], edImage, 'target');
        });

        currentCropName = 'poi';
        setJcrop(currentCropName, params['poi'], edImage, 'target');
    }

    var formFileToUpload = {};

    function initUploadForm(popin) { //, image) {
        //edImage = image;

        // beark html fragment !
        popin.html("\
       <form id=\"eduploadform\" width=\"600px\" height\"500px\">\
         <fieldset>\
         <div class=\"row\">\
           <label for=\"croppoi\">Edit ratio/poi :</label>\
         	<select id=\"uploadcroppoi\" name=\"croppoi\">\
         		 <option value=\"poi\">Point of interest</option>\
         		 <option value=\"portrait\">Portrait (3/4)</option>\
         		 <option value=\"square\">Square (1/1)</option>\
         		 <option value=\"landscape\">Landscape (4/3)</option>\
         		 <option value=\"large\">Large (16/9)</option>\
         		 <option value=\"xlarge\">Extra-large (24/9)</option>\
         	</select><br>\
          Select Files to Upload <input type=\"file\" name=\"filesToUpload[]\" id=\"filesToUpload\" multiple=\"multiple\" />\
         	</div>\
         	<div id=\"progressbar\" style=\"display:none\"></div>\
           <!-- Allow form submission with keyboard without duplicating the dialog button -->\
           <input type=\"submit\" tabindex=\"-1\" style=\"position:absolute; top:-1000px\">\
           <br \>\
           <div id=\"uploaded-image\"></div><br>\
         </fieldset>\
       </form>");

        $('#filesToUpload').change(function (evt) {
            edImage = {
                'crops': null,
                'file': {
                    'basename': null,
                    'dirname': null,
                    'filename': null,
                    'path': null,
                    'timestamp': null,
                    'size': null
                },
                'path': null,
                'poi': null,
                'crops': null,
                'size': []
            };
            evt.stopPropagation();
            evt.preventDefault();

            // show progressbar
            $("#progressbar").progressbar({value: 0});
            $('#progressbar').show();

            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var files = evt.target.files || evt.dataTransfer.files;
                var result = '';
                var file;
                for (var i = 0; file = files[i]; i++) {
                    // if the file is not an image, continue
                    if (!file.type.match('image.*')) {
                        continue;
                    }
                    // create a fileReader to intercept file as dataUrl


                    reader = new FileReader();
                    reader.onprogress = function (data) {
                        if (data.lengthComputable) {
                            var progress = parseInt(((data.loaded / data.total) * 100), 10);
                            $("#progressbar").progressbar({
                                value: progress
                            });

                        }
                    };
                    reader.onload = (function (tFile) {
                        edImage.file.basename = tFile.name;
                        edImage.file.filename = tFile.name;
                        edImage.file.path = currentFolder + tFile.name;
                        edImage.file.size = tFile.size;
                        edImage.file.timestamp = Math.floor(tFile.lastModified / 1000);
                        edImage.path = '/files' + currentFolder + tFile.name;
                        return function (evt) {

                            $('#progressbar').hide();
                            // create a new img
                            var img = new Image;
                            img.onload = function () {
                                // when image is loaded, get width and instanciate a div with the image outer html
                                img.id = 'uploadtarget';

                                edImage.size[0] = img.width;
                                edImage.size[1] = img.height;
                                console.log(edImage);

                                width = img.width;
                                img.width = '300px';

                                $('#uploaded-image').html(img.outerHTML);

                                $('#uploadcroppoi').change(function () {
                                    currentCropName = $('#uploadcroppoi option:selected').val();
                                    setJcrop($('#uploadcroppoi option:selected').val(), params[$('#uploadcroppoi option:selected').val()], edImage, 'uploadtarget');
                                });

                                currentCropName = 'poi';
                                setJcrop(currentCropName, params['poi'], edImage, 'uploadtarget');
                                $('#uploadtarget').width(300);
                            }

                            // init source with target result
                            img.src = evt.target.result;
                            formFileToUpload = {'filename': edImage.file.basename, 'data': evt.target.result};

                        };
                    }(file));
                    reader.readAsDataURL(file);
                }
            } else {
                alert('The File APIs are not fully supported in this browser.');
            }
        });

    }


    /*
     *  main init
     */
// Attach open dialog action on updatePoi click (on right panel)
    $("#update-poi").click(function (e) {
        $("#dialog-form").dialog("open");
        e.preventDefault();
    });

    /*
     $("#upload-image").click(function(e){
     $("#upload-form").dialog("open");
     e.preventDefault();
     });
     */

// define the dialog form
    dialog = $("#dialog-form").dialog({
        modal: true,
        autoOpen: false,
        resize: true,
        height: 'auto',
        width: 'auto',
        open: function (event, ui) {
            //console.log($(this).data('img'));
            initForm($(this), JSON.parse(decodeURI($(this).data('img'))));
        },
        buttons: {
            "Save": updatePoi,
            Cancel: function () {
                $(this).dialog("close");
            }
        },
    });

// define the dialog form
    upload = $("#upload-form").dialog({
        modal: true,
        autoOpen: false,
        resize: true,
        height: 'auto',
        width: 'auto',
        open: function (event, ui) {
            //console.log($(this).data('img'));
            initUploadForm($(this)); //, JSON.parse( decodeURI($(this).data('img'))) );
        },
        buttons: {
            "Save": updateUpload,
            Cancel: function () {
                $(this).dialog("close");
            }
        },
    });

    function attachMainMenu() {
        $.contextMenu({
            selector: '.ui-layout-center',
            callback: function (key, options) {
                var m = "clicked: " + key;
                window.console && console.log(m) || alert(m);
            },
            items: {
                //"paste": {name: "Paste", icon: "fa-clipboard", disabled: function(){ return (copyThumbs.length>0) }},
                "createfolder": {name: "Create folder", icon: "fa-folder-open-o", callback: createFolderMenuItemClick},
                "newimage": {
                    name: "New image", icon: "fa-file-image-o", callback: function (key, option) {
                        $("#upload-form").dialog("open");
                    }
                }
            }
        });
    }

    function attachFileMenu() {
        $.contextMenu({
            selector: 'UL.jqueryFileTree LI.directory :first-of-type',
            callback: function (key, options) {
                var m = "clicked: " + key;
                window.console && console.log(m) || alert(m);
            },
            items: {
                "createfolder": {name: "Create folder", icon: "fa-folder-open-o", callback: createFolderMenuItemClick},
                "renamefolder": {name: "Rename folder", icon: "fa-folder-o", callback: renameFolderMenuItemClick},
                "deletefolder": {name: "Delete folder", icon: "fa-trash-o", callback: deleteFolderNameMenuItemClick}
            }
        });
    }

    function attachRootMenu() {
        $.contextMenu({
            selector: '.root',
            callback: function (key, options) {
                var m = "clicked: " + key;
                window.console && console.log(m) || alert(m);
            },
            items: {
                "createfolder": {name: "Create folder", icon: "fa-folder-open-o", callback: createFolderMenuItemClick}
            }
        });
    }


    function deleteFolderNameMenuItemClick(key, option) {
        deleteFolder(option.$trigger.context.rel);
    }

    function renameFolderMenuItemClick(key, option) {
        // console.log(key);
        // console.log(option.$trigger);
        $.confirm({
            icon: 'fa fa-folder-o',
            title: 'rename folder',
            columnClass: 'col-md-4',
            boxWidth: '300px',
            useBootstrap: true,
            content: 'Enter name' +
            '<div class="input"><input type="text" id="foldername"></div>',
            buttons: {
                Create: function () {
                    var $input = this.$content.find('#foldername');
                    renameFolder($($input).val(), option.$trigger[0].rel);

                },
                close: function () {
                }
            }
        });
    }


    function createFolderMenuItemClick(key, option) {
        $.confirm({
            icon: 'fa fa-folder-open-o',
            title: 'Create folder',
            columnClass: 'col-md-4',
            boxWidth: '300px',
            useBootstrap: false,
            escapeKey: true,
            backgroundDismiss: true,
            content: 'Enter name' +
            '<div class="input"><input type="text" id="foldername"></div>',
            onContentReady: function () {
                $('.jconfirm-box-container input').focus();
            },
            buttons: {
                okay: {
                    keys: ['enter'],
                    action: function () {
                        var $input = this.$content.find('#foldername');
                        createFolder($($input).val());
                    }
                },
                cancel: function () {
                }
            }
        });
    }


    $.loadThumbs('/');

    attachUpload();

// selectable
    $(".ui-layout-center").selectable({
        filter: "div.thumb",
        selecting: function (event, ui) {
            addSelected(ui.selecting);
            callbackSelectedThumbChange();
        },
        unselecting: function (event, ui) {
            removeSelected(ui.unselecting);
            callbackSelectedThumbChange();
        },
    });


    // attach main menu on center layout
    attachMainMenu();
    attachFileMenu();
    attachRootMenu();


});

function onCancel(e) {
    var index = $(this).parents("li").data("index");
    $(this).parents("form").find(".upload").upload("abort", parseInt(index, 10));
}

function onCancelAll(e) {
    $(this).parents("form").find(".upload").upload("abort");
}


function onBeforeSend(formData, file) {
    formData.append("dist_dir", currentFolder);
    // return (file.name.indexOf(".jpg") < -1) ? false : formData; // cancel all jpgs
    return formData;
}

function onQueued(e, files) {
    var html = '';
    for (var i = 0; i < files.length; i++) {
        html += '<li data-index="' + files[i].index + '"><span class="content"><span class="file">' + files[i].name + '</span><span class="cancel">Cancel</span><span class="progress">Queued</span></span><span class="bar"></span></li>';
    }

    $(this).parents("form").find(".filelist.queue")
        .append(html);
}

function onStart(e, files) {
    uploadingFiles = [];
    $(this).parents("form").find(".filelist.queue")
        .find("li")
        .find(".progress").text("Waiting");
}

function onComplete(e) {
    $.loadThumbs(currentFolder);
    // refresh directory

}

function onFileStart(e, file) {
    $(this).parents("form").find(".filelist.queue")
        .find("li[data-index=" + file.index + "]")
        .find(".progress").text("0%");
}

function onFileProgress(e, file, percent) {
    var $file = $(this).parents("form").find(".filelist.queue").find("li[data-index=" + file.index + "]");

    $file.find(".progress").text(percent + "%")
    $file.find(".bar").css("width", percent + "%");
}

function onFileComplete(e, file, response) {
    $(this).removeClass('dragging');
    if (response.trim() === "" || response.toLowerCase().indexOf("error") > -1) {
        $(this).parents("form").find(".filelist.queue")
            .find("li[data-index=" + file.index + "]").addClass("error")
            .find(".progress").text(response.trim());
    } else {
        // append new file to thumbs panel
        $.appendThumbFromFile(JSON.parse(response));
        /*
         var $target = $(this).parents("form").find(".filelist.queue").find("li[data-index=" + file.index + "]");
         $target.find(".file").text(file.name);
         $target.find(".progress").remove();
         $target.find(".cancel").remove();
         $target.appendTo( $(this).parents("form").find(".filelist.complete") );
         */
    }
}

function onFileError(e, file, error) {
    $(this).parents("form").find(".filelist.queue")
        .find("li[data-index=" + file.index + "]").addClass("error")
        .find(".progress").text("Error: " + error);
}

function onChunkStart(e, file) {
}

function onChunkProgress(e, file, percent) {
}

function onChunkComplete(e, file, response) {
}

function onChunkError(e, file, error) {
}
function onFileDragEnter(e, file, error) {
    $(this).addClass('dragging');
}
function onFileDragLeave(e, file, error) {
    $(this).removeClass('dragging');
}


// $(function () {
//     var store = store || {};
//
//     /*
//      * Sets the jwt to the store object
//      */
//     store.setJWT = function (data) {
//         this.JWT = data;
//     }
//
//     /*
//      * Submit the login form via ajax
//      */
//     $("#frmLogin").submit(function (e) {
//         e.preventDefault();
//         $.post('auth/token', $("#frmLogin").serialize(), function (data) {
//             store.setJWT(data.JWT);
//         }).fail(function () {
//             alert('error');
//         });
//     });
// });


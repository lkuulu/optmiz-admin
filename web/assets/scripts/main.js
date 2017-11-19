/*
 sum file size
 */
function du(files) {
    let sum = 0;
    for (let i = 0; i < files.length; i++) {
        sum = sum + files[i]['size'];
    }
    //return Math.floor(sum/1024/1024*100)/100;
    return humanFileSize(sum, true);
}

function duSelected(files) {
    let sum = 0;
    for (let i = 0; i < files.length; i++) {
        let file = JSON.parse(decodeURI($(files[i]).attr('data-file')));
        sum = sum + file['size'];
    }
    //return Math.floor(sum/1024/1024*100)/100;
    return humanFileSize(sum, true);
}

rtrim = (value, s) => {
    return value.replace(new RegExp(s + "*$"), '');
};

const LEFT_CLICK = 1;

let repository;
let repoBasePath;
let imageBaseDomain;
let editMode;
const emEdit = 0;
const emNew = 1;

let selectedClass = 'ui-selected';
let endAnimate;
let newCoord;

let name = $("#name"),
    tips = $(".validateTips");

let initCrop = {
    "onChange": showCoords,
    "animationDelay": 5,
    "touchSupport": true,
    "handleSize": 2,
    "maxSize": [0, 0],
    "boxWidth": editorImageWidth, //800,
    "minSize": [20, 20],
    "boxHeight": 600,
    "canDrag": true,
    "canResize": true //(editorImageWidth/4*3) //true
};

let currentCropName = 'poi';
let coords = $('<div> x </div>').addClass('jcrop-coords');

let endSelectedThumbChange;
let selectedThumbs = [];
let currentFolder;
let folderFiles;
let oFile;

let edImage, dialog, form;
let instance;
let base;

let sizes = [50, 100, 200, 320, 480, 720, 900, 1024, 1200];
/*
 Trigger when OPTMIZ init is done
 SDK is ready to use
 */
onEndLoad = () => {
    console.log('Optmiz is ready!');
};

logout = () => {
    OPTMIZ.USER().logout();
    location.reload(false);
};

onErrorLogin = (jsonMessage, responseCode, request) => {
    $("#error").fadeIn(1000, function () {
        $("#error").html('<div class="alert alert-danger"> <span class="glyphicon glyphicon-info-sign"></span> &nbsp; ' + jsonMessage.message + ' !</div>');
        $("#btn-login").html('<span class="glyphicon glyphicon-log-in"></span> &nbsp; Sign In');
    });
};

/*
 Trigger when user is seems to be logged in
 after a OPTMIZ.init() and a OPTMIZ.USER().login({username: <username>, password: <password>}, onAfterLogin);
 */
onAfterLogin = (user, resultCode) => {
    // some verifications
    if (OPTMIZ.USER().connected) {
        $('#userinfo').html(renderUser(OPTMIZ.USER().toJson()));

        // show loading
        $("#btn-login").html('<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> &nbsp; Loading...');
        $("#login-form").fadeOut(1000);

        // use USER() to display personal messages
        console.log('Welcome ' + OPTMIZ.USER().username);

        // demonstrate how to make changes in user profile (the one who is connected)
        OPTMIZ.USER().company = 'TEST THEM HOST';
        OPTMIZ.USER().repository.updateRatio('landscape', '16', '9');
        OPTMIZ.USER().update();

        // demonstrate how to create a folder
        OPTMIZ.API().file.create('/', '/tatatat');

        // get repository path from User to continue displaying user interface
        imageBaseDomain = OPTMIZ.USER().imageBaseDomain();

        OPTMIZ.USER().repository.ratios.forEach(function (ratio) {
            params = Object.assign(params, {[ratio.name]: {"aspectRatio": (ratio.lenghts.width / ratio.lenghts.height)}});
        });

        makeFileTree();

        $.loadThumbs('/');
        attachUpload(OPTMIZ.API().image.entryPoint, OPTMIZ.API().onBeforeSend);

        $("body>.ui-layout-center").selectable({
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
    }
};


function onSelectedThumbChange() {
    window.clearTimeout(endSelectedThumbChange);
    // in fine
    if (selectedThumbs.length === 1) {
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
    let dom = renderThumb(file);
    // put in parent grid.
    $('body>div.ui-layout-center').append(dom);
};

function onTreeviewEndDraw() {
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
                    for (let i = 0; i < selectedThumbs.length; i++) {
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

/**
 * Generic confirm message
 * @param title
 * @param objectName
 * @param callback
 */
function confirm(title, objectName, callback) {
    $.confirm({
        title: title,
        content: 'Do you want to delete ' + objectName + '<br>',
        icon: 'fa fa-question-circle',
        animation: 'scale',
        closeAnimation: 'scale',
        opacity: 0.5,
        type: 'blue',
        escapeKey: 'cancel',
        backgroundDismiss: true,
        buttons: {
            'confirm': {
                text: 'Confirm',
                btnClass: 'btn-blue',
                action: callback
            },
            cancel: function () {
            },
        }
    });
}

/**
 * Rename file
 * @param sourceFile
 * @param destinationFile
 */
function renameFile(sourceFile, destinationFile) {
    console.log(sourceFile, destinationFile);
    OPTMIZ.API().file.move(sourceFile, destinationFile, function (result) {
        $.loadThumbs(currentFolder);
    });
}


function renameFileMenuItemClick(key, options) {
    $(options.selector).each(function () {
        let fileObj = decodeURI($(this).data('file'));
        let file = JSON.parse(fileObj);
        $.confirm({
            icon: 'fa fa-file-o',
            title: 'rename file',
            columnClass: 'col-md-4',
            boxWidth: '300px',
            useBootstrap: false,
            escapeKey: 'close',
            backgroundDismiss: true,
            type: 'blue',
            content: 'Enter name' +
            '<div class="input"><input type="text" id="filename" style="width:266px;"></div>',
            onContentReady: function () {
                console.log(file);
                $('.jconfirm-box-container input').val(file.basename);
                $('.jconfirm-box-container input').focus();
            },
            buttons: {
                rename: {
                    text: 'Rename',
                    btnClass: 'btn-blue',
                    keys: [
                        'enter'
                    ],
                    action: function () {
                        let $input = this.$content.find('#filename');
                        console.log(file);
                        renameFile('/'+file.path, '/'+file.dirname+((file.dirname!=='')?'/':'')+$($input).val());
                    }
                },
                close: function () {
                }
            }
        });
    });
}

function deleteFileMenuItemClick(key, options) {
    $(options.selector).each(function () {
        let fileObj = decodeURI($(this).data('file'));
        let file = JSON.parse(fileObj);
        confirm('Delete file', file["path"], function () {
            deleteFile(fileObj);
        });
    });
}

function editFileMenuItemClick(key, options) {
    $(options.selector).each(function () {
        let file = JSON.parse(decodeURI($(this).data('file')));
        OPTMIZ.API().image.load(file['path'], file, function (result) {
            $('#dialog-form').data('img', result);
            dialog.dialog('open');
        });
    });
}

/**
 * Delete File Image
 * @param file
 */
deleteFile = function (file) {
    oFile = JSON.parse(file);
    OPTMIZ.API().image.delete(oFile, currentFolder, function (result) {
        selectedThumbs = [];
        folderFiles = refreshThumbs(result);
        refreshPreviewFolder(folderFiles);
        attachThumbsMenu();
    });
};


function onFolderChange(folder) {
    currentFolder = folder;
}

/*
 *  Preview panel functions
 */
let refreshPreviewFolder = function (folder) {
    $('body>div.ui-layout-east').empty();
    folder = {
        'path': currentFolder,
        'count': folderFiles.length,
        'size': du(folderFiles),
        'selected': selectedThumbs.length,
        'selectedSize': duSelected(selectedThumbs)
    };
    $('body>div.ui-layout-east').append(renderPreviewFolder(folder));
};

function refreshPreviewImage(image) {
    $('body>div.ui-layout-east').empty();
    jsonImage = JSON.parse(image);
    //console.log(jsonImage);
    $('body>div.ui-layout-east').append(renderPreviewImage(jsonImage));
}

/**
 * Load Image details
 * @param imageFile
 * @param fileObject
 */
function loadImage(imageFile, fileObject) {
    OPTMIZ.API().image.load(imageFile, fileObject, function (result) {
        refreshPreviewImage(result);
    });
}


/*
 *  Main panel thumbnail functions
 */
function addSelected(thumb) {
    let findIt = false;
    for (let i = 0; i < selectedThumbs.length; i++) {
        if ($(thumb).attr('data-rel') == $(selectedThumbs[i]).attr('data-rel')) {
            findIt = true;
        }
    }
    if (!findIt) {
        selectedThumbs.push(thumb);
    }
}

function removeSelected(thumb) {
    for (let i = selectedThumbs.length - 1; i >= 0; i--) {
        if ($(thumb).attr('data-rel') == $(selectedThumbs[i]).attr('data-rel')) {
            selectedThumbs.splice(i, 1);
        }
    }
}

function removeAll() {
    for (let i = selectedThumbs.length - 1; i >= 0; i--) {
        $(selectedThumbs[i]).removeClass(selectedClass)
        selectedThumbs.splice(i, 1);
    }
}

/*
 *   Left panel filetree functions
 */
function filetreeFunction(data, onLoaded) {
    OPTMIZ.API().filetree.load(data.dir, function (result) {
        onLoaded(result);
    });
}

function makeFileTree(foldersOverride = null) {
    $('.jqueryFileTree').fileTree({
        root: '/',
        rootName: 'root',
        expandedFolders: (foldersOverride != null) ? foldersOverride : [],
        folderOpenClass: 'fa-folder-open-o',
        folderClass: 'fa-folder-o',
        rootClass: 'fa-globe',
        script: filetreeFunction, // fileTreeScript,
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

/*
 *  Attach file uplad to div
 */

function attachUpload(uploadScript, onBeforeAuthentication) {
    $(".upload").upload({
        maxSize: 1073741824,
        beforeSend: onBeforeSend,
        action: uploadScript,
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

function onEndAnimate(newCoord) {
    window.clearTimeout(endAnimate);
//    console.log(newCoord);
//    console.log('before : ',edImage);
    edImage = $.extend(true, edImage, newCoord)
//    console.log('after : ',edImage);
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

    let extraCoords = extrapolate([c.x, c.y, c.w, c.h], edImage.size[0], editorImageWidth);
    let coordHtml = extraCoords[0] + ' &times ' + extraCoords[1] + ((currentCropName != 'poi') ? ' <br \> ' + extraCoords[2] + ' &times ' + extraCoords[3] : '')
    coords.html(coordHtml);

    // save new coordinates in edImage object
    if (currentCropName === 'poi') {
        newCoord = {
            'poi': {
                'x': extraCoords[0],
                'y': extraCoords[1],
            }
        }
    } else {
        newCoord = {
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
//function extrapolate(coord, viewportWidth,imageWidth) {
function extrapolate(coord, viewportWidth,imageWidth) {
    let ratio = (editMode===emNew) ? 1 : (viewportWidth/imageWidth);
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

    $.extend(true, base, extended);
    if (instance) {
        instance.destroy();
    }

    let imageWidth= image['size'][0];
    let imageHeight = image['size'][1];
    $('#' + imgId).Jcrop(
        base,
        function () {
            instance = this;
            instance.newSelection();
            if (image['crops'] !== null && (typeof image['crops'] !== 'undefined') && typeof image['crops'][name] !== 'undefined') {
                c = image['crops'][name];
                instance.animateTo(extrapolate([c.x, c.y, c.w, c.h], editorImageWidth, imageWidth));
            } else if ((image[name] !== null) && (typeof image[name] !== 'undefined')) {
                c = image[name];
                instance.animateTo(extrapolate([c.x, c.y, 1, 1], editorImageWidth, imageWidth));
            } else if (name === 'poi') {
                // image center, in case of poi only
                instance.animateTo(extrapolate([(imageWidth / 2), (imageHeight / 2), 1, 1], editorImageWidth, imageWidth));
            }
        }
    );
}

/**
 * Save Image
 * @param fileObject
 */
function saveImage(fileObject) {
    OPTMIZ.API().image.update(fileObject, function (result) {
        loadImage($(selectedThumbs[0]).attr('data-rel'), decodeURI($(selectedThumbs[0]).attr('data-file')))
        $("#dialog-form").dialog("close");
    });
}

/**
 * Save new image
 * @param fileObject
 */
function saveNewImage(fileObject) {
    let fileInput = document.getElementById('filesToUpload');
    let file = fileInput.files[0];
    OPTMIZ.API().image.upload(file, currentFolder, fileObject, function (result) {
        $("#upload-form").dialog("close");
        $.loadThumbs(currentFolder);
    });
}

/**
 * Create folder
 * @param newFolder
 */
function createFolder(newFolder) {
    OPTMIZ.API().file.create(currentFolder, newFolder, function (result) {
        $("#upload-form").dialog("close");
        $.loadThumbs(currentFolder);
        $('.jqueryFileTree').data('fileTree').refreshTree(currentFolder); //.filetree
    });
}

function removeTreeFolder(folder) {
    $('.jqueryFileTree').data('fileTree').removeTree(folder);
}

function refreshTreeFolder(folder) {
    let parts = folder.split('/');
    parts.pop();
    let breadcrumb = '';
    let currentFolder = '/';
    let openedFolder = [];
    for (let i = 1; i < parts.length; i++) {
        breadcrumb += '/' + parts[i];
        openedFolder.push(breadcrumb + '/');
        currentFolder = breadcrumb + '/';
    }
    $('.jqueryFileTree').data('fileTree').refreshTree(currentFolder, openedFolder);
    currentFolder = breadcrumb + '/';
    $.loadThumbs(currentFolder);
}


function renameFolder(newFolder, rel) {
    console.log('renameFolder');
    currentFolder = rel;
    rel = rtrim(rel, '/');
    let source = rel;
    let destination = rel.split('/');
    destination.pop();
    let parentDestination = destination.join('/');

    destination.push(newFolder);
    destination = destination.join('/');
    OPTMIZ.API().file.move(source, destination, function (result) {
        $("#upload-form").dialog("close");

        let parts = currentFolder.split('/');
        parts.pop();
        parts.pop();
        refreshTreeFolder(parts.join('/'))

        parts.push(newFolder);
        parts.push('');
        refreshTreeFolder(parts.join('/'))

        $.loadThumbs(parts.join('/') + '/');
    });
}

function moveFile(source, destination) {
    let sourceFile = '/' + $(source).attr('data-rel');
    let destinationPath = $(destination).find('div').attr('rel');
    let sourceFileArr = sourceFile.split('/');
    let sourceFileName = sourceFileArr.pop();
    let destinationFile = destinationPath + sourceFileName
    OPTMIZ.API().file.move(sourceFile, destinationFile, function (result) {
        $.loadThumbs(currentFolder);
    });
}

function moveFolder(source, destination) {
    let sourcePath = $(source).find('div').attr('rel');
    let destinationPath = $(destination).find('div').attr('rel');

    sourcePath = rtrim(sourcePath, '/');

    let sourceArr = sourcePath.split('/');
    let folder = sourceArr.pop();

    sourceArr.push(folder);
    sourcePath = sourceArr.join('/');

    destinationPath = destinationPath + folder;

    if (sourcePath !== destinationPath) {
        OPTMIZ.API().file.move(sourcePath, destinationPath, function (result) {
            removeTreeFolder(sourcePath + '/');
            refreshTreeFolder(destinationPath);
            $.loadThumbs(destinationPath);
        });
    }
}


function deleteFolder(folder) {
    let folders = folder.split('/');
    folders.pop();
    folders.pop();
    currentFolder = folders.join('/') + '/';
    OPTMIZ.API().file.delete(folder, function (result) {
        $.loadThumbs(currentFolder);
        $('.jqueryFileTree').data('fileTree').refreshTree(currentFolder);
    });
}


$.loadThumbs = function (folder) {
    currentFolder = folder;
    OPTMIZ.API().file.load(folder, function (result) {
        selectedThumbs = [];
        folderFiles = refreshThumbs(result);
        refreshPreviewFolder(folderFiles);
        attachThumbsMenu();
    });
};


function cloneSelection() {
    if (selectedThumbs.length > 1) {
        let thumbClone = $(selectedThumbs[selectedThumbs.length - 1]).clone();
        thumbClone = $('<div class="thumb" style="background-color:darkgrey; overflow:visible"><span style="display:block;position:absolute; height:20px;width:25px; background-color:#4285f4;color:#d0d2d0; font-weight:700;text-align: center">' + selectedThumbs.length + '</span></div>').prepend(thumbClone);
        return $(thumbClone);
    } else if (selectedThumbs.length > 0) {
        let thumbClone = $(selectedThumbs[selectedThumbs.length - 1]).clone();
        return $(thumbClone);
        //return $(selectedThumbs[0]).clone().html();
    } else {
        return $("<div class='ui-widget-header'>Drop</div>");
    }
}

function refreshThumbs(files) {
    // remove actual list items
    $('body>div.ui-layout-center').empty();
    folderFiles = JSON.parse(files);
    // Iterate on files
    for (i = 0; i < folderFiles.length; i++) {
        $.appendThumbFromFile(folderFiles[i]);
    }

    $(".thumb-draggable").draggable({
        appendTo: "body",
        cursor: "crosshair",
        cursorAt: {top: 0, left: 0},
        //handle: '.title',
        opacity: 0.7,
        helper: function (event) {
            return cloneSelection();
        },
        start: function (event, ui) {
            if (selectedThumbs.length === 0) {
                $(event.target).toggleClass(selectedClass)
                addSelected(event.target);
                let thumbClone = $(selectedThumbs[selectedThumbs.length - 1]).clone();
                ui.helper.html(thumbClone.prop('outerHTML'));
            }
        },
        revert: "invalid"
    });

    let clickDelay = 600,
        lastClick, diffClick;
    $("body>.ui-layout-center .thumb").bind('mousedown mouseup', function (e) {
        if ((e.which === LEFT_CLICK ) || (selectedThumbs.length === 0)) {
            if (e.type === "mousedown") {
                lastClick = e.timeStamp; // get mousedown time
            } else {
                diffClick = e.timeStamp - lastClick;
                if (diffClick < clickDelay) {
                    // add selected class to group draggable objects
                    let thumb = $(this);

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
        }
    });
    return folderFiles;
}

function attachThumbsMenu() {
    $.contextMenu({
        selector: '.thumb.ui-selected',
        build: function ($trigger, e) {
            return {
                callback: function (key, options) {
                    let m = "clicked: " + key;
                    //window.console && console.log(m) || alert(m);
                    console.log(key, options);

                    // console.log(decodeURI($(options.selector).data('file')));
                },
                items: {
                    //"see": {name: "open", icon: "fa-eye", disabled: function(){ return (selectedThumbs.length>1) }},
                    //"copy": {name: "copy", icon: "fa-files-o", disabled: function(){ return (selectedThumbs.length>1) }},
                    //"cut": {name: "cut", icon: "fa-scissors", disabled: function(){ return (selectedThumbs.length==0) }},
                    "delete": {
                        name: "Delete", icon: "fa-eraser", disabled: function () {
                            return (selectedThumbs.length == 0)
                        }, callback: deleteFileMenuItemClick
                    },
                    "edit": {
                        name: "Edit", icon: "fa-edit", disabled: function () {
                            return (selectedThumbs.length == 0)
                        }, callback: editFileMenuItemClick
                    },
                    "rename": {
                        name: "Rename", icon: "fa-file-o", disabled: function () {
                            return (selectedThumbs.length > 1)
                        }, callback: renameFileMenuItemClick
                    },
                    "sep1": "---------",
                    "copy": generateCopyUrlSubMenu() //{name: "Copy url", icon: "fa-copy"}
                }
            }
        }
    });
}

function generateCopyUrlSubMenu() {
    return {
        name: "Copy url",
        icon: "fa-copy",
        items: getRatiosUrl()
    };
}

function getRatiosUrl() {
    let menu = {};
    OPTMIZ.USER().repository.ratios.forEach(function (ratio) {
        let subMenu = {};
        for (let i = 0; i < sizes.length; i++) {
            let keyName = sizes[i] + "x" + Math.floor(sizes[i] / ratio.lenghts.width * ratio.lenghts.height);
            subMenu = Object.assign(subMenu, {[ratio.name + ":" + sizes[i]]: {"name": keyName, callback: onRatioItemClick}});
        }
        menu = Object.assign(menu, {[ratio.name]: {"name": ratio.name, items: subMenu, callback: onRatioItemClick}});
    });
    return menu;
}

function onRatioItemClick(key, options) {
    $(options.selector).each(function () {
        let file = JSON.parse(decodeURI($(this).data('file')));
        let format = key.split(':');
        appCopyToClipBoard(imageBaseDomain + file['path'] + '/w:' + format[1] + '/p:' + format[0]);

    });
}

function updatePoi() {
    let valid = true;
    if (valid) {
        console.log(edImage);
        saveImage(edImage);
    }
    return valid;
}

function updateUpload() {
    let valid = true;
    if (valid) {
        //console.log(edImage);
        saveNewImage(edImage);
    }
    return valid;
}

function getRatioOptions() {
    let options = '<option value="poi">Point of interest</option>\n';
    OPTMIZ.USER().repository.ratios.forEach(function (ratio) {
        options = options + '<option value="' + ratio.name + '">' + ratio.name + ' (' + ratio.lenghts.width + '/' + ratio.lenghts.height + ')</option>';
    });
    return options;
}

function initForm(popin, image) {
    editMode = emEdit;

    edImage = image;

    // beark html fragment !
    popin.html("\
       <form id=\"edform\"  style='width:"+(editorImageWidth + editorImageMargin)+"px; overflow:hidden'>\
         <fieldset>\
           <label for=\"croppoi\">Edit ratio/poi :</label>\
         	<select id=\"croppoi\" name=\"croppoi\">" + getRatioOptions() + "\
         	</select>\
           <!-- Allow form submission with keyboard without duplicating the dialog button -->\
           <input type=\"submit\" tabindex=\"-1\" style=\"position:absolute; top:-1000px\">\
           <br \>\
           <img id=\"target\" src=\"" + imageBaseDomain + image['path'] + "/w:" + editorImageWidth + "/p:original\"><br>\
         </fieldset>\
       </form>");
    //<img id=\"target\" src=\"" + imageBaseDomain + image['path']+"/w400/original\"><br>\
    //<img id=\"target\" src=\"" + imageBaseDomain + image['path'] + "/original\"><br>\

    $('#croppoi').change(function () {
        currentCropName = $('#croppoi option:selected').val();
        setJcrop($('#croppoi option:selected').val(), params[$('#croppoi option:selected').val()], edImage, 'target');
    });

    currentCropName = 'poi';
    setJcrop(currentCropName, params['poi'], edImage, 'target');
}

let formFileToUpload = {};

function initUploadForm(popin) { //, image) {
    //edImage = image;

    editMode = emNew;

    // beark html fragment !
    popin.html("\
       <form id=\"eduploadform\"  style='width:"+(editorImageWidth + editorImageMargin)+"px; overflow:hidden'>\
         <fieldset>\
         <div>\
           <label for=\"croppoi\">Edit ratio/poi :</label>\
         	<select id=\"uploadcroppoi\" name=\"croppoi\">" + getRatioOptions() + "\
         	</select><br>\
          Select Files to Upload <input type=\"file\" name=\"filesToUpload[]\" id=\"filesToUpload\" />\
         	</div>\
         	<div id=\"progressbar\" style=\"display:none\"></div>\
           <!-- Allow form submission with keyboard without duplicating the dialog button -->\
           <input type=\"submit\" tabindex=\"-1\" style=\"position:absolute; top:-1000px\">\
           <br \>\
           <div id=\"uploaded-image\"></div><br>\
         </fieldset>\
       </form>");

    $('#filesToUpload').change(function (evt) {

        //edImage = FileImage();
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
            let files = evt.target.files || evt.dataTransfer.files;
            let result = '';
            let file;
            for (let i = 0; file = files[i]; i++) {
                // if the file is not an image, continue
                if (!file.type.match('image.*')) {
                    continue;
                }
                // create a fileReader to intercept file as dataUrl


                let reader = new FileReader();
                reader.onprogress = function (data) {
                    if (data.lengthComputable) {
                        let progress = parseInt(((data.loaded / data.total) * 100), 10);
                        $("#progressbar").progressbar({
                            value: progress
                        });

                    }
                };
                reader.onload = (function (tFile) {
                    // edImage.setFile({
                    //     type: 'file',
                    //     basename: tFile.name,
                    //     filename: tFile.name,
                    //     path: currentFolder + tFile.name,
                    //     timmestamp: Math.floor(tFile.lastModified / 1000)
                    // })
                    edImage.file.basename = tFile.name;
                    edImage.file.filename = tFile.name;
                    edImage.file.path = currentFolder + tFile.name;
                    edImage.file.size = tFile.size;
                    edImage.file.timestamp = Math.floor(tFile.lastModified / 1000);

                    edImage.path = '/files' + currentFolder + tFile.name;
                    return function (evt) {

                        $('#progressbar').hide();
                        // create a new img
                        let img = new Image();
                        img.onload = function () {
                            // when image is loaded, get width and instanciate a div with the image outer html
                            img.id = 'uploadtarget';

                            edImage.size[0] = img.width;
                            edImage.size[1] = img.height;

                            $('#uploaded-image').html(img.outerHTML);

                            $('#uploadcroppoi').change(function () {
                                currentCropName = $('#uploadcroppoi option:selected').val();
                                setJcrop($('#uploadcroppoi option:selected').val(), params[$('#uploadcroppoi option:selected').val()], edImage, 'uploadtarget');
                            });

                            currentCropName = 'poi';
                            $('#uploadtarget').width(editorImageWidth + editorImageMargin);
                            //$( "#upload-form" ).dialog( "option", "width", 'auto');
                            setJcrop(currentCropName, params['poi'], edImage, 'uploadtarget');
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
let debugImg;


function attachMainMenu() {
    $.contextMenu({
        selector: 'body>.ui-layout-center',
        callback: function (key, options) {
            let m = "clicked: " + key;
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
            let m = "clicked: " + key;
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
            let m = "clicked: " + key;
            window.console && console.log(m) || alert(m);
        },
        items: {
            "createfolder": {name: "Create folder", icon: "fa-folder-open-o", callback: createFolderMenuItemClick}
        }
    });
}

function deleteFolderNameMenuItemClick(key, option) {
    confirm('Delete folder', option.$trigger.context.rel, function () {
        deleteFolder(option.$trigger.context.rel);
    });
}

function renameFolderMenuItemClick(key, option) {
    // console.log(key);
    // console.log(option.$trigger);
    $.confirm({
        icon: 'fa fa-folder-o',
        title: 'rename folder',
        columnClass: 'col-md-4',
        boxWidth: '300px',
        useBootstrap: false,
        escapeKey: 'close',
        backgroundDismiss: true,
        type: 'blue',
        content: 'Enter name' +
        '<div class="input"><input type="text" id="foldername"></div>',
        onContentReady: function () {
            console.log(option.$trigger[0]);
            let foldersName = rtrim(option.$trigger[0].rel, '/');
            let folders = foldersName.split('/');
            let folder = folders.pop();
            $('.jconfirm-box-container input').val(folder);
            $('.jconfirm-box-container input').focus();
        },
        buttons: {
            rename: {
                text: 'Rename',
                btnClass: 'btn-blue',
                keys: [
                    'enter'
                ],
                action: function () {
                    let $input = this.$content.find('#foldername');
                    renameFolder($($input).val(), option.$trigger[0].rel);
                }
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
        type: 'blue',
        content: 'Enter name' +
        '<div class="input"><input type="text" id="foldername"></div>',
        onContentReady: function () {
            $('.jconfirm-box-container input').focus();
        },
        buttons: {
            create: {
                text: 'Create',
                btnClass: 'btn-blue',
                keys: ['enter'],
                action: function () {
                    let $input = this.$content.find('#foldername');
                    createFolder($($input).val());
                }
            },
            cancel: function () {
            }
        }
    });
}


/* login submit */
function submitLoginForm() {
    $("#error").fadeOut();
    $("#btn-login").html('<span class="glyphicon glyphicon-transfer"></span> &nbsp; sending ...');
    let data = {username: $("#login-form #username").val(), password: $("#login-form #password").val()};
    OPTMIZ.USER().login(data, onAfterLogin, onErrorLogin);
}


function onCancel(e) {
    let index = $(this).parents("li").data("index");
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
    let html = '';
    for (let i = 0; i < files.length; i++) {
        html += '<li data-index="' + files[i].index + '"><span class="content"><span class="file">' + files[i].name + '</span><span class="cancel">Cancel</span><span class="progress">Queued</span></span><span class="bar"></span></li>';
    }
    $(this).parents("form").find(".filelist.queue").append(html);
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
    let $file = $(this).parents("form").find(".filelist.queue").find("li[data-index=" + file.index + "]");

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
         let $target = $(this).parents("form").find(".filelist.queue").find("li[data-index=" + file.index + "]");
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


$(document).ready(function () {
    /*
     *  main init
     */
    // Attach open dialog action on updatePoi click (on right panel)
    $("#update-poi").click(function (e) {
        $("#dialog-form").dialog("open");
        e.preventDefault();
    });


    // define the dialog form
    dialog = $("#dialog-form").dialog({
        modal: true,
        autoOpen: false,
        resize: true,
        show: 5,
        height: 'auto',
        width: 'auto',
        open: function (event, ui) {
            initForm($(this), JSON.parse(decodeURI($(this).data('img'))));
            $( "#dialog-form" ).dialog( "option", "position", { my: "center top", at: "center top", of: window } );
        },
        buttons: {
            "Save": updatePoi,
            Cancel: function () {
                $(this).dialog("close");
            }
        },
    });

    // define the upload form
    upload = $("#upload-form").dialog({
        modal: true,
        autoOpen: false,
        show: 5,
        resize: true,
        height: 'auto',
        width: 'auto',
        open: function (event, ui) {
            //console.log($(this).data('img'));
            initUploadForm($(this)); //, JSON.parse( decodeURI($(this).data('img'))) );
            $( "#upload-form" ).dialog( "option", "position", { my: "center top", at: "center top", of: window } );
        },
        buttons: {
            "Save": updateUpload,
            Cancel: function () {
                $(this).dialog("close");
            }
        },
    });

    /* validation */
    $("#login-form").validate({
        rules: {
            password: {
                required: true,
            },
            username: {
                required: true
            },
        },
        messages: {
            password: {
                required: "please enter your password"
            },
            user_email: "please enter username",
        },
        submitHandler: submitLoginForm
    });
});

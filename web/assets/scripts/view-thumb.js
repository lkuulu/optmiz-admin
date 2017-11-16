function renderThumb(fileObject) {
    //console.log(fileObject);
    var thumb = " \
        <div class='thumb thumb-draggable' data-rel=\"" + fileObject['path'] + "\" data-file=\"" + encodeURI(JSON.stringify(fileObject)) + "\">\
          <div class='thinner' style=\"background-image: url('" + imageBaseDomain + fileObject['path'] + "/w:140/p:14x11');\"></div>\
          <div class='title'>\
            <div class='name' style=\"max-width:96px;\">" + fileObject['filename'] + "<span class='ext-list'>" + fileObject['extension'] + "</span>\
            </div>\
          </div>\
        </div>";
    return thumb;
}

function renderPhantomThumb(fileObject) {
    var thumb = " \
        <div class='thumb thumb-draggable'>\
          <div class='thinner' style=\"background-image: url('" + imageBaseDomain + fileObject['path'] + "/w:140/p:14x11');\"></div>\
          <div class='title'>\
            <div class='name' style=\"max-width:96px;\">" + fileObject['filename'] + "<span class='ext-list'>" + fileObject['extension'] + "</span></div>\
          </div>\
        </div>";
    return thumb;

}
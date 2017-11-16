function renderPreviewFolder(folderObject) {
    //upload
    var preview = "\
<form class=\"form\" action=\"#\" method=\"GET\">\
<div id=\"ext-comp-1149\" class=\"x-panel fr-details-panel\" style=\"width: 250px;\">\
 <div id=\"fr-details-previewbox\" style=\"visibility: visible;\">\
   <div class=\"title\">\
     <div style=\"display:table-row\">\
       <div id=\"fr-details-icon\"><img src=\"assets/img/folder.png\" style=\"margin-right:5px;\" height=\"35\" align=\"left\"></div>\
       <div id=\"fr-details-filename\">" + folderObject['path'] + "</div>\
     </div>\
   </div>\
   <div style=\"clear:both;\"></div>\
 </div>\
 <div id=\"fr-details-info\" class=\"\" style=\"\">\
   <div class=\"status\">\
     <div class=\"text\">" + ((folderObject['selected'] > 0) ? folderObject['selected'] : folderObject['count']) + " éléments" + ((folderObject['selected'] > 0) ? ' selectionnés' : '') + "</div>\
     <div class=\"size\">" + ((folderObject['selected'] > 0) ? folderObject['selectedSize'] : folderObject['size']) + "</div>\
     <div style=\"clear:both\"></div>\
     <div></div>\
   </div>\
 </div>\
 <div id=\"fr-details-readme\" style=\"display:none\"></div>\
 <div id=\"fr-details-metadata\" style=\"\"></div>\
</div>\
</form>";
    return preview;
}

function renderPreviewImage(fileObject) {
    var preview = "\
<div id=\"ext-comp-1149\" class=\"x-panel fr-details-panel\" style=\"width: 250px;\">\
  <div id=\"fr-details-previewbox\" style=\"visibility: visible;\">\
    <div class=\"title\">\
      <div style=\"display:table-row\">\
        <div id=\"fr-details-icon\"><img src=\"assets/img/" + fileObject['file']['extension'] + ".png\" style=\"margin-right:5px;\" height=\"30\" align=\"left\"></div>\
        <div id=\"fr-details-filename\">" + fileObject['file']['filename'] + "<span class=\"gray\">." + fileObject['file']['extension'] + "<span></span></span></div>\
      </div>\
    </div>\
    <div style=\"clear:both;\"></div>\
    <div class=\"previewthumb\" id=\"fr-details-thumb\" style=\"\">\
      <a href=\"" + imageBaseDomain + fileObject['path'] + "/w:1500/p:original\"  data-title=\"original\" data-lightbox=\"preview-image\">\
        <img class=\"detailsThumb\" id=\"ext-gen490\" src=\"" + imageBaseDomain + fileObject['path'] + "/w:235/p:original\" width=\"235\" height=\"auto\">\
      </a>\
    </div>\
  </div>\
  <div id=\"fr-details-info\" style=\"\">\
    <table width=\"100%\" cellspacing=\"1\">\
      <tbody>\
        <tr>\
          <td class=\"fieldName\">Date</td>\
          <td class=\"fieldValue\" title=\"506,938 bytes\">" + timeConverter(fileObject['file']['timestamp']) + "</td>\
        </tr>\
        <tr>\
          <td class=\"fieldName\">Size</td>\
          <td class=\"fieldValue\" title=\"506,938 bytes\">" + humanFileSize(fileObject['file']['size'], true) + "</td>\
        </tr>\
        <tr>\
          <td class=\"fieldName\">Type</td>\
          <td class=\"fieldValue\">" + fileObject['file']['extension'] + "</td>\
        </tr>\
          <tr>\
            <td class=\"fieldName\">Width</td>\
            <td class=\"fieldValue\">\
              <div>\
                <a href=\"javascript:;\">" + fileObject['size']['0'] + "</a>					\
              </div>\
            </td>\
          </tr>\
          <tr>\
            <td class=\"fieldName\">Height</td>\
            <td class=\"fieldValue\">\
              <div>\
                <a href=\"javascript:;\">" + fileObject['size']['1'] + "</a>					\
              </div>\
            </td>\
          </tr>\
      </tbody>\
    </table>\
  </div>\
  <div id=\"fr-details-readme\" style=\"display:none\"></div>\
  <div id=\"fr-details-metadata\" style=\"\">\
    " + renderPOI(fileObject) + "\
    " + renderCrops(fileObject) + "\
  </div>\
</div>";

    return preview;
}

function renderCrops(fileObject) {
    var crops = "\
         	  <div>\
           <div class=\"fieldsetname\">\
             Image crops\
            <a href=\"#\" onclick=\"$('#dialog-form').data('img', '" + encodeURI(JSON.stringify(fileObject)) + "'); javascript:dialog.dialog('open');\">\
              <li class=\"fa fa-edit\"></li>\
            </a>\
           </div>\
           <table width=\"100%\" cellspacing=\"1\">\
             <tbody>"
    if (fileObject['crops'] != null) {
        for (var i in fileObject['crops']) {
            // for (var i=0; i<fileObject['crops'].length; i++) {
            crops = crops + "\
               <tr>\
                 <td rowspan=\"2\" valign=\"top\" class=\"fieldName\">" + i + "</td>\
                 <td class=\"fieldValue\">\
                   <div>\
                     <a href=\"" + imageBaseDomain + fileObject['path'] + "/w:1500/p:" + i + "?gen\" data-title=\"" + i + "\" data-lightbox=\"preview-image\">" + fileObject['crops'][i]['x'] + " &times " + fileObject['crops'][i]['y'] + "</a>					\
                   </div>\
                 </td>\
               </tr>\
               <tr>\
                 <td class=\"fieldValue\">\
                   <div>\
                     <a href=\"javascript:;\"><span class=\"fa fa-arrows-h\">" + fileObject['crops'][i]['w'] + "</span> &times <span class=\"fa fa-arrows-v\">" + fileObject['crops'][i]['h'] + "</span></a>					\
                   </div>\
                 </td>\
               </tr>";
        }
    }
    crops = crops + "\
           </tbody>\
         </table>\
       </div>";
    return crops;
}


function renderPOI(fileObject) {
    var poi = "\
	  <div>\
      <div class=\"fieldsetname\">\
        Image POI\
        <a href=\"#\" onclick=\"$('#dialog-form').data('img', '" + encodeURI(JSON.stringify(fileObject)) + "'); javascript:dialog.dialog('open');\">\
          <li class=\"fa fa-edit\"></li>\
        </a>\
      </div>";
    if (fileObject['poi'] != null) {
        poi = poi + "\
      <table width=\"100%\" cellspacing=\"1\">\
        <tbody>\
          <tr>\
            <td class=\"fieldName\">Coordinates</td>\
            <td class=\"fieldValue\">\
              <div>\
                <a href=\"javascript:;\" >" + fileObject['poi']['x'] + " &times " + fileObject['poi']['y'] + "</a>\
              </div>\
            </td>\
          </tr>\
        </tbody>\
      </table>"
    }
    poi = poi + "</div>";
    return poi;

}

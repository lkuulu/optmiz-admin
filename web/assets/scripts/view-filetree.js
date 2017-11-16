function renderTree(filetree) {
    jsonFiletree = JSON.parse(filetree);

    var indent = '';
    for (var i = 0; i < jsonFiletree.info.level; i++) {
        indent += '<img class="tree-elbow-line" alt="" src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">';
    }

    var result = '<ul class="jqueryFileTree">';
    if (jsonFiletree.folders) {
        for (var i = 0; i < jsonFiletree.folders.length; i++) {
            result += '<li class="draggable directory collapsed " ><div class="droppable tree-node-el tree-node-leaf x-unselectable" rel="' + jsonFiletree.folders[i].rel + '/"><span class="tree-node-indent">' +
                indent +
                ((jsonFiletree.folders[i].hasSubDir) ? '<i class="fa-plus-square fa folder-picto"></i>':'') +
                ' <i class="tree-ec-icon fa"></i>' +
                ' <i rel="' + jsonFiletree.folders[i].rel + '/" class="tree-node-icon fa fa-lg fa-fw fa-2x icon-silver"></i>' +
                ' <a rel="' + jsonFiletree.folders[i].rel + '/" class="">' + jsonFiletree.folders[i].name + '</a>' +
                '</span></div>'+
                '</li>';
            result += '';
        }
    }
    if (jsonFiletree.files) {
        for (var i = 0; i < jsonFiletree.files.length; i++) {
            result += '<li class="file ext_' + jsonFiletree.files[i].ext + '"><a rel="' + jsonFiletree.files[i].rel + '">' + jsonFiletree.files[i].name + '</a></li>';
        }
    }
    result += '</ul>';
    return result;

}

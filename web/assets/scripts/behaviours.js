/*
 * globals && settings
 */
var outerLayout;
var layoutSettings_Outer = {
  name: "outerLayout",
  initClosed: false,
  //applyDefaultStyles: true,
  east__size: 290,
  livePaneResizing: true,
  animatePaneSizing: true,
  north: {
    spacing_open: 0,          // cosmetic spacing
    togglerLength_open: 0,    // HIDE the toggler button
    togglerLength_closed: -1, // "100%" OR -1 = full width of pane
    resizable: false,
    slidable: false,
    closable:false,
    fxName: "none"
  },
  east: {
    size: 290,
    resizable: false,
    slidable: true
  },
  west: {
    spacing_open: 1,          // cosmetic spacing
    size: 300,
    resizable: true,
    slidable: true
  }
};

var northLayout;
var layoutSettings_North = {
    name: "northLayout",
    initClosed: false,
    north__childOptions: {
        inset: {
            top:	0
            ,	bottom:	0
            ,	left:	0
            ,	right:	0
        }
    },

    east: {
        spacing_open: 0,
        size: 290,
        resizable: false,
        slidable: false,
        closable:false,
    },
    center: {
        spacing_open: 0
    },
    west: {
        spacing_open: 0,
        size: 300,
        resizable: false,
        slidable: false,
        closable:false,
    }
};

var params = {
        "poi": {
            "aspectRatio": 1,
            "maxSize": [1, 1],
            "minSize": [1, 1],
            "canDrag": false,
            "canResize": false
        }

  // ,"portrait": {
  //   "aspectRatio": (3 / 4)
  // },
  // "square": {
  //   "aspectRatio": 1
  // },
  // "landscape": {
  //   "aspectRatio": (4 / 3)
  // },
  // "large": {
  //   "aspectRatio": (16 / 9)
  // },
  // "xlarge": {
  //   "aspectRatio": (24 / 9)
  // }
};

lightbox.option({
  'resizeDuration': 200,
  'wrapAround': true
});

const editorImageWidth = 600;
const editorImageMargin = 0;
"use strict";

importJsOnce("js/viewers/meta/Viewer.js");
importJsOnce("js/viewers/meta/Space2DViewer.js");
importJsOnce("js/viewers/meta/Space3DViewer.js");
importJsOnce("js/viewers/static/Viewer.js");

importJsOnce("js/viewers/ImageViewer.js");
importJsOnce("js/viewers/LogViewer.js");
importJsOnce("js/viewers/ProcessListViewer.js");
importJsOnce("js/viewers/MapViewer.js");
importJsOnce("js/viewers/LaserScanViewer.js");
importJsOnce("js/viewers/GeometryViewer.js");
importJsOnce("js/viewers/PolygonViewer.js");
importJsOnce("js/viewers/DiagnosticViewer.js");
importJsOnce("js/viewers/TimeSeriesPlotViewer.js");
importJsOnce("js/viewers/PointCloud2Viewer.js");
importJsOnce("js/viewers/ImuViewer.js");
importJsOnce("js/viewers/JointStateViewer.js");
importJsOnce("js/viewers/CompassViewer.js");
importJsOnce("js/viewers/HydroPhotoViewer.js");
importJsOnce("js/viewers/HydroInfoViewer.js");
importJsOnce("js/viewers/PanelReportViewer.js");
importJsOnce("js/viewers/CamViewer.js");

// GenericViewer must be last
importJsOnce("js/viewers/GenericViewer.js");

importJsOnce("js/transports/WebSocketV1Transport.js");

var snackbarContainer = document.querySelector('#demo-toast-example');

let subscriptions = {};
let staticViewers = {};
let storedStaticViewers = {};

if(window.localStorage) {
  if(window.location.search && window.location.search.indexOf("reset") !== -1) {
    subscriptions = {};
    storedStaticViewers = {};
    updateStoredSubscriptions();
    window.location.href = "?";
  } else {
    try {
      subscriptions = JSON.parse(window.localStorage.getItem("subscriptions") || "{}");
      storedStaticViewers = JSON.parse(window.localStorage.getItem("staticViewers") || "{}");
    } catch(e) {
      console.log(e);
      subscriptions = {};
      storedStaticViewers = {};
    }
  }
}

let $grid = null;
$(() => {
  $grid = $('.grid').masonry({
    itemSelector: '.card',
    gutter: 10,
    percentPosition: true,
  });
  $grid.masonry("layout");
  restoreStaticViewers();
});

setInterval(() => {
  if(currentTransport && !currentTransport.isConnected()) {
    console.log("attempting to reconnect ...");
    currentTransport.connect();
  }
}, 5000);

function updateStoredSubscriptions() {
  if(window.localStorage) {
    let storedSubscriptions = {};
    for(let topicName in subscriptions) {
      storedSubscriptions[topicName] = {
        topicType: subscriptions[topicName].topicType,
        options: subscriptions[topicName].options || {},
      };
    }
    let storedStaticDefinitions = {};
    for(let viewerId in staticViewers) {
      let viewer = staticViewers[viewerId];
      storedStaticDefinitions[viewerId] = {
        viewerType: viewer.constructor.name,
        options: viewer.options,
      };
    }
    window.localStorage.setItem("subscriptions", JSON.stringify(storedSubscriptions));
    window.localStorage.setItem("staticViewers", JSON.stringify(storedStaticDefinitions));
  }
}

function newCard() {
  // creates a new card, adds it to the grid, and returns it.
  let card = $("<div></div>").addClass('card')
    .appendTo($('.grid'));
  return card;
}

let onOpen = function() {
  const urlParams = new URLSearchParams(window.location.search);

  for( let [key, value] of urlParams ){
    key = key.replace(/\\/g, '/');
    value = value.replace(/\\/g, '/');

    console.log("Auto subscribing to " + key + " of type " + value);
      
    const subscriptions = JSON.parse(window.localStorage.getItem('subscriptions') || '{}');
    if (!(key in subscriptions)) {
      initSubscribe({topicName: key, topicType: value});
    }
  }          
  
  for(let topic_name in subscriptions) {
    console.log("Re-subscribing to " + topic_name);
    initSubscribe({
      topicName: topic_name,
      topicType: subscriptions[topic_name].topicType,
      options: subscriptions[topic_name].options || {},
    });
  }

}

let onSystem = function(system) {
  if(system.hostname) {
    console.log("hostname: " + system.hostname);
  }

  if(system.version) {
    console.log("server version: " + system.version);
    versionCheck(system.version);
  }
}

let onMsg = function(msg) {
  if(!subscriptions[msg._topic_name]) {
    console.log("Received unsolicited message", msg);
  } else if(!subscriptions[msg._topic_name].viewer) {
    console.log("Received msg but no viewer", msg);
  } else {
    subscriptions[msg._topic_name].viewer.update(msg);
  }
}

let currentTopics = {};
let currentTopicsStr = "";

let onTopics = function(topics) {
  
  // check if topics has actually changed, if not, don't do anything
  // lazy shortcut to deep compares, might possibly even be faster than
  // implementing a deep compare due to
  // native optimization of JSON.stringify
  let newTopicsStr = JSON.stringify(topics);
  if(newTopicsStr === currentTopicsStr) return;
  currentTopics = topics;
  currentTopicsStr = newTopicsStr;
  
  let topicTree = treeifyPaths(Object.keys(topics));
  
  $("#topics-nav-ros").empty();
  $("#topics-nav-system").empty();
  
  addTopicTreeToNav(topicTree[0], $('#topics-nav-ros'));

  let camerOptions = {
    mode: "hls",
    rtspSrc: "rtsp://10.182.22.84:8554/test",
    hlsSrc: "http://10.182.22.84:8890/test/index.m3u8",
  };

  // Hydrolab, LML Basic, LML Advanced, Sztafeta, Woda, Ogień

  // 1. Konkurencja Hydrolab
  $('<a></a>')
  .addClass("mdl-navigation__link")
  .click(() => { 
    clearViewers();
    initSubscribe([
      {topicName: "/mavros/global_position/compass_hdg", topicType: "std_msgs/msg/Float64"}, // Kompas
      {
        topicName: "/mavros/gpsstatus/gps1/raw", 
        topicType: "mavros_msgs/msg/GPSRAW",
        options: { title: "Pozycja Drona" }
      }, // Lokalizacja Drona
      {viewer: CamViewer, viewerId: "camera", options: camerOptions}, // Stream z kamery

      // Wstawianie Topiku do HydroPhoto.msg, nie zmieniąc topicType
      {topicName: "/mavros/msg/HydroPhoto", topicType: "mavros_msgs/msg/HydroPhoto"},

      // Wstawianie Topiku do HydroInfo.msg,
      {topicName: "/mavros/msg/HydroInfo", topicType: "mavros_msgs/msg/HydroInfo"},

      // Testowałem z wykorzystaniem MediaMtx, Docker: 
      // docker run --rm -it --name mediamtx -e MTX_RTSPTRANSPORTS=tcp -e MTX_WEBRTCADDITIONALHOSTS=10.182.22.84 -p 8554:8554 -p 8889:8889 -p 8890:8888 -p 8189:8189/udp bluenviron/mediamtx:1

      // Uruchomienia Streama na portach 8890
      // ffmpeg -re -loop 1 -i obraz1.jpg -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p" -r 30 -c:v libx264 -preset ultrafast -tune zerolatency -profile:v baseline -level 3.1 -bf 0 -g 30 -keyint_min 30 -sc_threshold 0 -f rtsp -rtsp_transport tcp rtsp://10.182.22.84:8554/test

      // Odczytywanie streama na kliencie (np. VLC): rtsp://
      // ffplay -rtsp_transport tcp rtsp://10.182.22.84:8554/test
    ]); 
  })
  .text("HydroLab")
  .appendTo($("#topics-nav-system"));

  // 2. LML Basic
  $('<a></a>')
  .addClass("mdl-navigation__link")
  .click(() => { 
    console.log(subscriptions)
    clearViewers();
    initSubscribe([
      {topicName: "/mavros/global_position/compass_hdg", topicType: "std_msgs/msg/Float64"}, // Kompas
      {
        topicName: "/mavros/gpsstatus/gps1/raw", 
        topicType: "mavros_msgs/msg/GPSRAW",
        options: { title: "Pozycja Drona" }
      }, // Lokalizacja Drona
      {viewer: CamViewer, viewerId: "camera", options: camerOptions}, // Stream z kamery
    ]);
   })
  .text("LML Basic")
  .appendTo($("#topics-nav-system"));

  // 3. LML Advanced, TODO Dodanie BallStatus
  $('<a></a>')
  .addClass("mdl-navigation__link")
  .click(() => { 
    console.log(subscriptions)
    clearViewers();
    initSubscribe([
      {topicName: "/mavros/global_position/compass_hdg", topicType: "std_msgs/msg/Float64"}, // Kompas
      {
        topicName: "/mavros/gpsstatus/gps1/raw", 
        topicType: "mavros_msgs/msg/GPSRAW",
        options: { title: "Pozycja Drona" }
      }, // Lokalizacja Drona
      {viewer: CamViewer, viewerId: "camera", options: camerOptions}, // Stream z kamery
    ]);
   })
  .text("LML Advanced")
  .appendTo($("#topics-nav-system"));

  // 4. Sztafeta, TODO Dodanie BallStatus
  $('<a></a>')
  .addClass("mdl-navigation__link")
  .click(() => { 
    console.log(subscriptions)
    clearViewers();
    initSubscribe([
      {topicName: "/mavros/global_position/compass_hdg", topicType: "std_msgs/msg/Float64"}, // Kompas
      {
        topicName: "/mavros/gpsstatus/gps1/raw", 
        topicType: "mavros_msgs/msg/GPSRAW",
        options: { title: "Pozycja Krotek", mode: "points" }
      }, // Pozycja Krotek, tryb punktów
      {
        topicName: "/mavros/gpsstatus/gps1/raw", 
        topicType: "mavros_msgs/msg/GPSRAW",
        options: { title: "Pozycja Drona" }
      }, // Lokalizacja Drona
      {viewer: CamViewer, viewerId: "camera", options: camerOptions}, // Stream z kamery
    ]);
   })
  .text("Sztafeta")
  .appendTo($("#topics-nav-system"));

  // 5. Konkurencja Woda
  $('<a></a>')
  .addClass("mdl-navigation__link")
  .click(() => { 
    console.log(subscriptions)
    clearViewers();
    initSubscribe([
      {topicName: "/mavros/global_position/compass_hdg", topicType: "std_msgs/msg/Float64"}, // Kompas
      {
        topicName: "/mavros/gpsstatus/gps1/raw",
        topicType: "mavros_msgs/msg/GPSRAW",
        options: { title: "Pozycja Drona" }
      }, // Lokalizacja Drona
      {viewer: CamViewer, viewerId: "camera", options: camerOptions}, // Stream z kamery
    ]);
   })
  .text("Woda")
  .appendTo($("#topics-nav-system"));

  // 7. Konkurencja Ogień
  $('<a></a>')
  .addClass("mdl-navigation__link")
  .click(() => { 
    console.log(subscriptions)
    clearViewers();
    initSubscribe([
      {topicName: "/mavros/global_position/compass_hdg", topicType: "std_msgs/msg/Float64"}, // Kompas
      {
        topicName: "/mavros/gpsstatus/gps1/raw", 
        topicType: "mavros_msgs/msg/GPSRAW",
        options: { title: "Pozycja Drona" }
      }, // Lokalizacja Drona
      {viewer: CamViewer, viewerId: "camera", options: camerOptions}, // Stream z kamery

      // Tablica raportów paneli.
      {topicName: "/mavros/msg/PanelReport", topicType: "mavros_msgs/msg/PanelReport"},
    ]);
   })
  .text("Ogien")
  .appendTo($("#topics-nav-system"));

  // Domyślne 
  // $('<a></a>')
  // .addClass("mdl-navigation__link")
  // .click(() => { 
  //   clearViewers();
  //   initSubscribe([
  //     {topicName: "_top", topicType: "rosboard_msgs/msg/ProcessList"},
  //     {topicName: "_system_stats", topicType: "rosboard_msgs/msg/SystemStats"}
  //   ]); 
  // })
  // .text("Processes")
  // .appendTo($("#topics-nav-system"));
}

function addTopicTreeToNav(topicTree, el, level = 0, path = "") {
  topicTree.children.sort((a, b) => {
    if(a.name>b.name) return 1;
    if(a.name<b.name) return -1;
    return 0;
  });
  topicTree.children.forEach((subTree, i) => {
    let subEl = $('<div></div>')
    .css(level < 1 ? {} : {
      "padding-left": "0pt",
      "margin-left": "12pt",
      "border-left": "1px dashed #808080",
    })
    .appendTo(el);
    let fullTopicName = path + "/" + subTree.name;
    let topicType = currentTopics[fullTopicName];
    if(topicType) {
      $('<a></a>')
        .addClass("mdl-navigation__link")
        .css({
          "padding-left": "12pt",
          "margin-left": 0,
        })
        .click(() => { initSubscribe({topicName: fullTopicName, topicType: topicType}); })
        .text(subTree.name)
        .appendTo(subEl);
    } else {
      $('<a></a>')
      .addClass("mdl-navigation__link")
      .attr("disabled", "disabled")
      .css({
        "padding-left": "12pt",
        "margin-left": 0,
        opacity: 0.5,
      })
      .text(subTree.name)
      .appendTo(subEl);
    }
    addTopicTreeToNav(subTree, subEl, level + 1, path + "/" + subTree.name);
  });
}

function initDummy({topicName, topicType}) {
  console.log( "Initialized dummy " + topicName + " of type " + topicType);
  if(!subscriptions[topicName].viewer) {
    let card = newCard();
    let viewer = Viewer.getDefaultViewerForType(topicType);
    try {
      subscriptions[topicName].viewer = new viewer(card, topicName, topicType);
    } catch(e) {
      console.log(e);
      card.remove();
    }
    $grid.masonry("appended", card);
    $grid.masonry("layout");
  }
}

function appendViewerCard(card) {
  $grid.masonry("appended", card);
  $grid.masonry("layout");
}

function restoreStaticViewers() {
  for(let viewerId in storedStaticViewers) {
    let definition = storedStaticViewers[viewerId];
    initStaticViewer({
      viewerType: definition.viewerType,
      viewerId: viewerId,
      options: definition.options,
    });
  }
  storedStaticViewers = {};
}

function initStaticViewer({viewer, viewerType, viewerId, options = {}}) {
  viewer = viewer || StaticViewer.getViewer(viewerType);
  if(typeof viewer !== "function" || !(viewer.prototype instanceof StaticViewer)) {
    console.error("Unknown static viewer or viewer does not extend StaticViewer", viewerType || viewer);
    return;
  }

  viewerId = viewerId || viewer.name;
  if(staticViewers[viewerId]) return;

  let card = newCard();
  try {
    staticViewers[viewerId] = new viewer(card, viewerId, options);
  } catch(e) {
    console.error(e);
    card.remove();
    return;
  }
  appendViewerCard(card);
  updateStoredSubscriptions();
}

function initSubscribe(subscriptionDefinitions) {
  let definitions = Array.isArray(subscriptionDefinitions)
    ? subscriptionDefinitions
    : [subscriptionDefinitions];

  definitions.forEach((definition) => {
    if(definition && (definition.viewer || definition.viewerType)) {
      initStaticViewer(definition);
      return;
    }
    initTopicSubscription(definition);
  });
}

function initTopicSubscription({topicName, topicType, options = {}}) {
  console.log( "Subscribing to " + topicName + " of type " + topicType);
  // creates a subscriber for topicName
  // and also initializes a viewer (if it doesn't already exist)
  // in advance of arrival of the first data
  // this way the user gets a snappy UI response because the viewer appears immediately
  if(!subscriptions[topicName]) {
    subscriptions[topicName] = {
      topicType: topicType,
      options: options,
    };
  } else {
    subscriptions[topicName].options = options;
  }
  currentTransport.subscribe({topicName: topicName});
  if(!subscriptions[topicName].viewer) {
    let card = newCard();
    let viewer = Viewer.getDefaultViewerForType(topicType);
    if(!viewer) {
      console.error("No viewer available for topic type", topicType);
      card.remove();
      return;
    }
    try {
      subscriptions[topicName].viewer = new viewer(
        card,
        topicName,
        topicType,
        options
      );
    } catch(e) {
      console.error(e);
      card.remove();
      return;
    }
    appendViewerCard(card);
  }
  updateStoredSubscriptions();
}

function clearViewers() {
  for(let topicName in subscriptions) {
    currentTransport.unsubscribe({topicName: topicName});
    if(subscriptions[topicName].viewer) {
      subscriptions[topicName].viewer.destroy();
      $grid.masonry("remove", subscriptions[topicName].viewer.card);
    }
  }
  for(let viewerId in staticViewers) {
    staticViewers[viewerId].destroy();
    $grid.masonry("remove", staticViewers[viewerId].card);
  }
  subscriptions = {};
  staticViewers = {};
  updateStoredSubscriptions();
  $grid.masonry("layout");
}

let currentTransport = null;

function initDefaultTransport() {
  currentTransport = new WebSocketV1Transport({
    path: "/rosboard/v1",
    onOpen: onOpen,
    onMsg: onMsg,
    onTopics: onTopics,
    onSystem: onSystem,
  });
  currentTransport.connect();
}

function treeifyPaths(paths) {
  // turn a bunch of ros topics into a tree
  let result = [];
  let level = {result};

  paths.forEach(path => {
    path.split('/').reduce((r, name, i, a) => {
      if(!r[name]) {
        r[name] = {result: []};
        r.result.push({name, children: r[name].result})
      }
      
      return r[name];
    }, level)
  });
  return result;
}

let lastBotherTime = 0.0;
function versionCheck(currentVersionText) {
  $.get("https://raw.githubusercontent.com/dheera/rosboard/release/setup.py").done((data) => {
    let matches = data.match(/version='(.*)'/);
    if(matches.length < 2) return;
    let latestVersion = matches[1].split(".").map(num => parseInt(num, 10));
    let currentVersion = currentVersionText.split(".").map(num => parseInt(num, 10));
    let latestVersionInt = latestVersion[0] * 1000000 + latestVersion[1] * 1000 + latestVersion[2];
    let currentVersionInt = currentVersion[0] * 1000000 + currentVersion[1] * 1000 + currentVersion[2];
    if(currentVersion < latestVersion && Date.now() - lastBotherTime > 1800000) {
      lastBotherTime = Date.now();
      snackbarContainer.MaterialSnackbar.showSnackbar({
        message: "New version of ROSboard available (" + currentVersionText + " -> " + matches[1] + ").",
        actionText: "Check it out",
        actionHandler: ()=> {window.location.href="https://github.com/dheera/rosboard/"},
      });
    }
  });
}

$(() => {
  if(window.location.href.indexOf("rosboard.com") === -1) {
    initDefaultTransport();
  }
});

Viewer.onClose = function(viewerInstance) {
  if(viewerInstance instanceof StaticViewer) {
    viewerInstance.destroy();
    $grid.masonry("remove", viewerInstance.card);
    $grid.masonry("layout");
    delete(staticViewers[viewerInstance.viewerId]);
    updateStoredSubscriptions();
    return;
  }

  let topicName = viewerInstance.topicName;
  let topicType = viewerInstance.topicType;
  currentTransport.unsubscribe({topicName:topicName});
  viewerInstance.destroy();
  $grid.masonry("remove", viewerInstance.card);
  $grid.masonry("layout");
  delete(subscriptions[topicName].viewer);
  delete(subscriptions[topicName]);
  updateStoredSubscriptions();
}

Viewer.onSwitchViewer = (viewerInstance, newViewerType) => {
  let topicName = viewerInstance.topicName;
  let topicType = viewerInstance.topicType;
  if(!subscriptions[topicName].viewer === viewerInstance) console.error("viewerInstance does not match subscribed instance");
  let card = subscriptions[topicName].viewer.card;
  subscriptions[topicName].viewer.destroy();
  delete(subscriptions[topicName].viewer);
  subscriptions[topicName].viewer = new newViewerType(card, topicName, topicType);
};

"use strict";





function onTopics(topics) {
  let newTopicsStr = JSON.stringify(topics);
  if(newTopicsStr === currentTopicsStr) return;
  currentTopics = topics;
  currentTopicsStr = newTopicsStr;

  let topicTree = treeifyPaths(Object.keys(topics));

  $("#topics-nav-ros").empty();
  $("#topics-nav-system").empty();

  addTopicTreeToNav(topicTree[0], $("#topics-nav-ros"));

  let CameraVideo = { // Stream Video Webrtc 
    viewer: CamViewer, viewerId: "camera", options: {
      webrtcSrc: "http://127.0.0.1:8889/test"
    }
  }

  let DroneRoute = { // Pozycja / Ścieżka drona
    topicName: "/drone_mission_planner/location_history",
    topicType: "droniada_msgs/msg/DroneRoute",
    options: { title: "Lokalizacja Drona" }
  };

  let Compass = { // Kompass
    topicName: "/mavros/global_position/compass_hdg",
    topicType: "std_msgs/msg/Float64"
  };

  let MissionStatus = { // Status Misji
    topicName: "/mission_status",
    topicType: "droniada_msgs/msg/MissionStatus"
  };

  // 1. Konkurencja Hydrolab
  $("<a></a>")
    .addClass("mdl-navigation__link")
    .click(() => {
      clearViewers();
      initSubscribe([
        Compass, DroneRoute, CameraVideo, MissionStatus,
        {topicName: "/hydro_photo", topicType: "droniada_msgs/msg/HydroPhoto"},
        {topicName: "/hydro_info", topicType: "droniada_msgs/msg/HydroInfo"},
      ]);
    })
    .text("HydroLab")
    .appendTo($("#topics-nav-system"));

  // 2. LML Basic
  $("<a></a>")
    .addClass("mdl-navigation__link")
    .click(() => {
      console.log(subscriptions);
      clearViewers();
      initSubscribe([
        Compass, DroneRoute, CameraVideo, MissionStatus
      ]);
    })
    .text("LML Basic")
    .appendTo($("#topics-nav-system"));

  // 3. LML Advanced
  $("<a></a>")
    .addClass("mdl-navigation__link")
    .click(() => {
      console.log(subscriptions);
      clearViewers();
      initSubscribe([
        Compass, DroneRoute, CameraVideo, MissionStatus,
        { topicName: "/ball_status", topicType: "droniada_msgs/msg/BallStatus" } // Status Piłek
      ]);
    })
    .text("LML Advanced")
    .appendTo($("#topics-nav-system"));

  // 4. Sztafeta
  $("<a></a>")
    .addClass("mdl-navigation__link")
    .click(() => {
      console.log(subscriptions);
      clearViewers();
      initSubscribe([
        Compass, DroneRoute, CameraVideo, MissionStatus,
        { // Pozycja krotek jako punkty
          topicName: "/cargo_points",
          topicType: "droniada_msgs/msg/GeoPoints",
          options: { title: "Pozycja Krotek", mode: "points" }
        } 
      ]);
    })
    .text("Sztafeta")
    .appendTo($("#topics-nav-system"));

  // 5. Konkurencja Woda
  $("<a></a>")
    .addClass("mdl-navigation__link")
    .click(() => {
      console.log(subscriptions);
      clearViewers();
      initSubscribe([
        Compass, DroneRoute, CameraVideo, MissionStatus,
      ]);
    })
    .text("Woda")
    .appendTo($("#topics-nav-system"));

  // 7. Konkurencja Ogien
  $("<a></a>")
    .addClass("mdl-navigation__link")
    .click(() => {
      console.log(subscriptions);
      clearViewers();
      initSubscribe([
        Compass, DroneRoute, CameraVideo, MissionStatus,
        {topicName: "/panel_report", topicType: "droniada_msgs/msg/PanelReport"},
      ]);
    })
    .text("Ogien")
    .appendTo($("#topics-nav-system"));
}

function addTopicTreeToNav(topicTree, el, level = 0, path = "") {
  topicTree.children.sort((a, b) => {
    if(a.name > b.name) return 1;
    if(a.name < b.name) return -1;
    return 0;
  });

  topicTree.children.forEach((subTree) => {
    let subEl = $("<div></div>")
      .css(level < 1 ? {} : {
        "padding-left": "0pt",
        "margin-left": "12pt",
        "border-left": "1px dashed #808080",
      })
      .appendTo(el);
    let fullTopicName = path + "/" + subTree.name;
    let topicType = currentTopics[fullTopicName];

    if(topicType) {
      $("<a></a>")
        .addClass("mdl-navigation__link")
        .css({
          "padding-left": "12pt",
          "margin-left": 0,
        })
        .click(() => {
          initSubscribe({topicName: fullTopicName, topicType: topicType});
        })
        .text(subTree.name)
        .appendTo(subEl);
    } else {
      $("<a></a>")
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
    addTopicTreeToNav(
      subTree,
      subEl,
      level + 1,
      path + "/" + subTree.name
    );
  });
}

function treeifyPaths(paths) {
  let result = [];
  let level = {result};

  paths.forEach((path) => {
    path.split("/").reduce((parent, name) => {
      if(!parent[name]) {
        parent[name] = {result: []};
        parent.result.push({name, children: parent[name].result});
      }
      return parent[name];
    }, level);
  });
  return result;
}

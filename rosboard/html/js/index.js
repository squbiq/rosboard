"use strict";

importJsOnce("js/app/dependencies.js");
importJsOnce("js/app/state.js");
importJsOnce("js/app/storage.js");
importJsOnce("js/app/grid.js");
importJsOnce("js/app/subscriptions.js");
importJsOnce("js/app/topic-navigation.js");
importJsOnce("js/app/version-check.js");
importJsOnce("js/app/transport.js");

loadStoredSubscriptions();
initViewerCallbacks();
startReconnectTimer();

$(() => {
  initGrid();

  if(window.location.href.indexOf("rosboard.com") === -1) {
    initDefaultTransport();
  }
});

"use strict";

function loadStoredSubscriptions() {
  if(!window.localStorage) return;

  if(window.location.search && window.location.search.indexOf("reset") !== -1) {
    subscriptions = {};
    storedStaticViewers = {};
    updateStoredSubscriptions();
    window.location.href = "?";
    return;
  }

  try {
    subscriptions = JSON.parse(
      window.localStorage.getItem("subscriptions") || "{}"
    );
    storedStaticViewers = JSON.parse(
      window.localStorage.getItem("staticViewers") || "{}"
    );
  } catch(e) {
    console.log(e);
    subscriptions = {};
    storedStaticViewers = {};
  }
}

function updateStoredSubscriptions() {
  if(!window.localStorage) return;

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

  window.localStorage.setItem(
    "subscriptions",
    JSON.stringify(storedSubscriptions)
  );
  window.localStorage.setItem(
    "staticViewers",
    JSON.stringify(storedStaticDefinitions)
  );
}

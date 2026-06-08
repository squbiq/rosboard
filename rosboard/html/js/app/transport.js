"use strict";

function onOpen() {
  const urlParams = new URLSearchParams(window.location.search);

  for(let [key, value] of urlParams) {
    key = key.replace(/\\/g, "/");
    value = value.replace(/\\/g, "/");

    console.log("Auto subscribing to " + key + " of type " + value);

    const storedSubscriptions = JSON.parse(
      window.localStorage.getItem("subscriptions") || "{}"
    );
    if(!(key in storedSubscriptions)) {
      initSubscribe({topicName: key, topicType: value});
    }
  }

  for(let topicName in subscriptions) {
    console.log("Re-subscribing to " + topicName);
    initSubscribe({
      topicName: topicName,
      topicType: subscriptions[topicName].topicType,
      options: subscriptions[topicName].options || {},
    });
  }
}

function onSystem(system) {
  if(system.hostname) {
    console.log("hostname: " + system.hostname);
  }

  if(system.version) {
    console.log("server version: " + system.version);
    versionCheck(system.version);
  }
}

function onMsg(msg) {
  if(!subscriptions[msg._topic_name]) {
    console.log("Received unsolicited message", msg);
  } else if(!subscriptions[msg._topic_name].viewer) {
    console.log("Received msg but no viewer", msg);
  } else {
    subscriptions[msg._topic_name].viewer.update(msg);
  }
}

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

function startReconnectTimer() {
  setInterval(() => {
    if(currentTransport && !currentTransport.isConnected()) {
      console.log("attempting to reconnect ...");
      currentTransport.connect();
    }
  }, 5000);
}

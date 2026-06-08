"use strict";

function initDummy({topicName, topicType}) {
  console.log("Initialized dummy " + topicName + " of type " + topicType);
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

function initStaticViewer({viewer, viewerType, viewerId, options = {}}) {
  viewer = viewer || StaticViewer.getViewer(viewerType);
  if(typeof viewer !== "function" || !(viewer.prototype instanceof StaticViewer)) {
    console.error(
      "Unknown static viewer or viewer does not extend StaticViewer",
      viewerType || viewer
    );
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
  console.log("Subscribing to " + topicName + " of type " + topicType);
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

function initViewerCallbacks() {
  Viewer.onClose = function(viewerInstance) {
    if(viewerInstance instanceof StaticViewer) {
      viewerInstance.destroy();
      $grid.masonry("remove", viewerInstance.card);
      $grid.masonry("layout");
      delete staticViewers[viewerInstance.viewerId];
      updateStoredSubscriptions();
      return;
    }

    let topicName = viewerInstance.topicName;
    currentTransport.unsubscribe({topicName: topicName});
    viewerInstance.destroy();
    $grid.masonry("remove", viewerInstance.card);
    $grid.masonry("layout");
    delete subscriptions[topicName].viewer;
    delete subscriptions[topicName];
    updateStoredSubscriptions();
  };

  Viewer.onSwitchViewer = (viewerInstance, newViewerType) => {
    let topicName = viewerInstance.topicName;
    let topicType = viewerInstance.topicType;
    if(!subscriptions[topicName].viewer === viewerInstance) {
      console.error("viewerInstance does not match subscribed instance");
    }
    let card = subscriptions[topicName].viewer.card;
    subscriptions[topicName].viewer.destroy();
    delete subscriptions[topicName].viewer;
    subscriptions[topicName].viewer = new newViewerType(
      card,
      topicName,
      topicType
    );
  };
}

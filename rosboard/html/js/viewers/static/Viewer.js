"use strict";

// Base class for cards which render local or external content without a ROS topic.
class StaticViewer extends Viewer {
  constructor(card, viewerId, options = {}) {
    super(card, viewerId, "static/" + viewerId, options);

    this.viewerId = viewerId;
    this.card.settingsButton.hide();
    this.card.menu.hide();
    this.card.pauseButton.hide();

    if(this.loaderContainer) {
      this.loaderContainer.remove();
      this.loaderContainer = null;
    }
  }
}

StaticViewer._viewers = {};

StaticViewer.registerViewer = (viewer) => {
  StaticViewer._viewers[viewer.name] = viewer;
};

StaticViewer.getViewer = (viewerType) => {
  return StaticViewer._viewers[viewerType] || null;
};

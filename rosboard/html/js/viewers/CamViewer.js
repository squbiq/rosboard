"use strict";

class CamViewer extends Viewer {
  onCreate() {

    this.card.title.text("Video Kamery");
    this.camView = $(`<div id="camView">
        <img class="width: 100%" src="http://172.16.0.109:5000/video_feed"></img>
      </div>`)
      .appendTo(this.card.content);
    this.card[0].children[3].innerHTML=""
  }

  onData(msg) {
    
  }
}

CamViewer.friendlyName = "Compass";

CamViewer.supportedTypes = [
    "std_msgs/msg/CamViewFeed"
];

CamViewer.maxUpdateRate = 10000.0;

Viewer.registerViewer(CamViewer);
"use strict";

class CompassViewer extends Viewer {
  onCreate() {

    this.card.title.text("Kompas");
    this.viewer = $('<div id="compass"></div>')
      .css({
        'width': "100%",
        'height': "240px",
        'padding': "15px",
        'box-sizing': "border-box",
        'display': "flex",
        'align-items': "center",
        'justify-content': "center",
      })
      .appendTo(this.card.content);

    this.background = $('<div id="compass-bg"></div>')
      .css({
        'position': 'relative',
        'position': 'relative',
        'height': '100%',
        'border-width': '4px',
        'border-radius': '50%',
        'aspect-ratio': '1 / 1',
        'border': 'solid',
        'display': 'flex',
        'overflow': 'hidden',
      })
      .appendTo(this.viewer);

    this.arrow = $('<div id="compass-arrow"></div>')
      .css({
        'position': 'absolute',
        'left': 'calc(50% - 6px)',
        'top': '6px',
        'width': '12px',
        'height': '50%',
        'background-color': 'orange',
        'transform-origin': '50% calc(100% - 6px)',
        'border-radius': '10px',
      })
      .appendTo(this.background);

    console.log(this.card.content);
    console.log($(this.card.content[0]).html());
    this.card.content[0].style.width = "240px !important";

  }

  onData(msg) {
      this.arrow[0].style.rotate = `z ${msg.data}deg`;
  }
}

CompassViewer.friendlyName = "Compass";

CompassViewer.supportedTypes = [
    "std_msgs/msg/Float64"
];

CompassViewer.maxUpdateRate = 10000.0;

Viewer.registerViewer(CompassViewer);
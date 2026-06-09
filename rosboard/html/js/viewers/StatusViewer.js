"use strict";

class StatusViewer extends Viewer {
  onCreate() {
    this.card.title.text(this.options.title || "Status Misji");

    this.statusNames = {
      0: "Nie Rozpoczęta",
      1: "Rozpoczęta",
      2: "Zakończona",
    };

    this.infoContainer = $("<div></div>")
      .css({
        "display": "grid",
        "grid-template-columns": "minmax(170px, 1fr) auto",
        "gap": "10px 16px",
        "padding": "12px",
        "align-items": "center",
      })
      .appendTo(this.card.content);

    $("<span></span>")
      .text("Status Misji:")
      .css({"font-weight": "bold"})
      .appendTo(this.infoContainer);

    this.statusValue = $("<span></span>")
      .addClass("monospace")
      .text("-")
      .css({"text-align": "right"})
      .appendTo(this.infoContainer);

    super.onCreate();
  }

  onData(msg) {
    let status = this.extractStatus(msg);
    this.statusValue.text(
      status === null ? "-" : this.statusNames[status]
    );
  }

  extractStatus(msg) {
    let value = msg;

    if(msg && typeof msg === "object") {
      if(msg.status !== undefined) {
        value = msg.status;
      } else if(msg.mission !== undefined) {
        value = msg.mission;
      } else if(msg.data !== undefined) {
        value = msg.data;
      }
    }

    let status = Number(value);
    return Number.isInteger(status) && status >= 0 && status <= 2
      ? status
      : null;
  }
}

StatusViewer.friendlyName = "Status";

StatusViewer.supportedTypes = [
  "*/msg/Status",
  "*/msg/MissionStatus"
];

StatusViewer.maxUpdateRate = 10.0;

Viewer.registerViewer(StatusViewer);

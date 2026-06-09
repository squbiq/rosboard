"use strict";

class BallStatusViewer extends Viewer {
  onCreate() {
    this.card.title.text(this.options.title || "Status Piłek");

    this.statusNames = {
      0: "łapanie",
      1: "złapanie",
      2: "upuszczono",
    };
    this.colorNames = {
      0: "czerwoną",
      1: "żółtą",
      2: "niebieską",
    };

    this.logContainer = $("<div></div>")
      .addClass("monospace")
      .css({
        "box-sizing": "content-box",
        "max-height": "11.2em",
        "margin": "12px",
        "padding": "8px 12px",
        "line-height": "1.4em",
        "overflow-x": "auto",
        "overflow-y": "auto",
        "border": "1px solid #505050",
        "border-radius": "4px",
      })
      .appendTo(this.card.content);

    this.emptyMessage = $("<div></div>")
      .text("Waiting for ball status ...")
      .css({"color": "#808080"})
      .appendTo(this.logContainer);

    super.onCreate();
  }

  onData(msg) {
    if(this.emptyMessage) {
      this.emptyMessage.remove();
      this.emptyMessage = null;
    }

    $("<div></div>")
      .text(this.formatLogEntry(msg))
      .css({
        "min-height": "1.4em",
        "white-space": "nowrap",
      })
      .prependTo(this.logContainer);

    this.logContainer.scrollTop(0);
  }

  formatLogEntry(msg) {
    let timestamp = this.formatStamp(msg.header && msg.header.stamp);
    let status = this.statusNames[Number(msg.status)] ||
      `status ${msg.status}`;
    let color = this.colorNames[Number(msg.color)] ||
      `color ${msg.color}`;
    let point = this.formatPointType(msg.point_type);

    return `[${timestamp}] ${status} ${color} ${point}`;
  }

  formatPointType(pointType) {
    let value = Number(pointType);
    if(!Number.isInteger(value) || value < 1 || value > 6) {
      return `point type ${pointType}`;
    }

    let target = value <= 3 ? "beczkę" : "piłkę";
    let pointNumber = value <= 3 ? value : value - 3;
    return `${target} w punkcie ${pointNumber}`;
  }

  formatStamp(stamp) {
    if(!stamp) return this.formatDate(new Date());

    let seconds = Number(stamp.sec !== undefined ? stamp.sec : stamp.secs);
    let nanoseconds = Number(
      stamp.nanosec !== undefined ? stamp.nanosec : stamp.nsecs || 0
    );
    if(!Number.isFinite(seconds)) return "-";

    let date = new Date(seconds * 1000 + nanoseconds / 1e6);
    if(Number.isNaN(date.getTime())) return `${seconds}.${nanoseconds}`;

    return this.formatDate(date);
  }

  formatDate(date) {
    return date.toLocaleString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
      hour12: false,
    });
  }
}

BallStatusViewer.friendlyName = "BallStatus";

BallStatusViewer.supportedTypes = [
  "*/msg/BallStatus",
];

BallStatusViewer.maxUpdateRate = Infinity;

Viewer.registerViewer(BallStatusViewer);

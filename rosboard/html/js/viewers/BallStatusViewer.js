"use strict";

class BallStatusViewer extends Viewer {
  onCreate() {
    this.card.title.text(this.options.title || "Status Piłek");

    this.STATUS_GRABBING = 0;
    this.STATUS_GRABBED = 1;
    this.STATUS_RELEASED = 2;

    this.COLOR_RED = 0;
    this.COLOR_YELLOW = 1;
    this.COLOR_BLUE = 2;

    this.POINT_BARREL_1 = 1;
    this.POINT_BARREL_2 = 2;
    this.POINT_BARREL_3 = 3;
    this.POINT_BALL_1 = 4;
    this.POINT_BALL_2 = 5;
    this.POINT_BALL_3 = 6;

    this.statusNames = {
      0: "łapanie",
      1: "złapano",
      2: "upuszczono",
    };

    this.colorNames = {
      0: "czerwoną",
      1: "żółtą",
      2: "niebieską",
    };

    this.balls = [
      [50.2711640, 18.6709395], // BALL1
      [50.2711541, 18.6709987], // BALL2
      [50.2711711, 18.6708849], // BALL3
    ];

    this.barrels = [
      [50.2713913, 18.6710486], // BARREL_A
      [50.2713982, 18.6709785], // BARREL_B
      [50.2713954, 18.6709092], // BARREL_C
    ];

    this.pointCoordinates = {
      1: this.barrels[0],
      2: this.barrels[1],
      3: this.barrels[2],
      4: this.balls[0],
      5: this.balls[1],
      6: this.balls[2],
    };

    this.viewer = $("<div></div>")
      .css({"font-size": "11pt"})
      .appendTo(this.card.content);

    this.mapNode = $("<div></div>")
      .css({
        "height": "360px",
        "width": "100%",
      })
      .appendTo(this.viewer);

    this.map = L.map(this.mapNode[0], {
      dragging: true,
      scrollWheelZoom: true,
      touchZoom: true,
    }).setView(this.balls[0], 24);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);

    this.ballMarkers = [];
    this.barrelMarkers = [];

    this.renderMarkers();
    this.fitMapToPositions([...this.balls, ...this.barrels]);

    this.logContainer = $("<div></div>")
      .addClass("monospace")
      .css({
        "box-sizing": "content-box",
        "max-height": "11.2em",
        "margin": "12px",
        "padding": "8px 12px",
        "line-height": "1.4em",
        "overflow-x": "hidden",
        "overflow-y": "auto",
        "overflow-wrap": "anywhere",
        "border": "1px solid #505050",
        "border-radius": "4px",
      })
      .appendTo(this.viewer);

    this.emptyMessage = $("<div></div>")
      .text("Waiting for ball status ...")
      .css({"color": "#808080"})
      .appendTo(this.logContainer);

    setTimeout(() => this.map.invalidateSize(), 0);
    super.onCreate();
  }

  onData(msg) {
    this.updateMapFromStatus(msg);
    this.addLogEntry(msg);
  }

  updateMapFromStatus(msg) {
    if(!msg || typeof msg !== "object") return;

    const color = this.colorToCss(Number(msg.color));
    const pointType = Number(msg.point_type);

    if(!color || !Number.isFinite(pointType)) return;

    if(pointType >= this.POINT_BARREL_1 && pointType <= this.POINT_BARREL_3) {
      const index = pointType - this.POINT_BARREL_1;
      this.setMarkerColor(this.barrelMarkers[index], "↓", color);
    }

    if(pointType >= this.POINT_BALL_1 && pointType <= this.POINT_BALL_3) {
      const index = pointType - this.POINT_BALL_1;
      this.setMarkerColor(this.ballMarkers[index], "↑", color);
    }
  }

  addLogEntry(msg) {
    if(this.emptyMessage) {
      this.emptyMessage.remove();
      this.emptyMessage = null;
    }

    let logEntry = this.formatLogEntry(msg);
    let logItem = $("<div></div>")
      .css({
        "min-height": "1.4em",
        "white-space": "normal",
      })
      .prependTo(this.logContainer);

    $("<span></span>")
      .text(`[${logEntry.timestamp}]`)
      .appendTo(logItem);

    $("<span></span>")
      .text(logEntry.message)
      .css({
        "display": "inline-block",
        "margin-left": "0.5em",
      })
      .appendTo(logItem);

    this.logContainer.scrollTop(0);
  }

  renderMarkers() {
    this.clearMarkers();

    this.balls.forEach((position, index) => {
      const marker = L.marker(position, {
        icon: this.makeIcon("↑", "#777"),
      })
        .bindPopup(`Piłka ${index + 1}`)
        .addTo(this.map);

      this.ballMarkers.push(marker);
    });

    this.barrels.forEach((position, index) => {
      const marker = L.marker(position, {
        icon: this.makeIcon("↓", "#777"),
      })
        .bindPopup(`Beczka ${index + 1}`)
        .addTo(this.map);

      this.barrelMarkers.push(marker);
    });
  }

  makeIcon(arrow, color) {
    return L.divIcon({
      className: "lml-marker",
      html: `<div style="
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: ${color};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        border: 2px solid #555;
        box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      ">${arrow}</div>`,
      iconSize: [15, 15],
      iconAnchor: [7, 7],
      popupAnchor: [0, -10],
    });
  }

  setMarkerColor(marker, arrow, color) {
    if(!marker) return;
    marker.setIcon(this.makeIcon(arrow, color));
  }

  colorToCss(color) {
    switch(color) {
      case this.COLOR_RED:
        return "red";
      case this.COLOR_YELLOW:
        return "yellow";
      case this.COLOR_BLUE:
        return "blue";
      default:
        return null;
    }
  }

  clearMarkers() {
    if(this.ballMarkers) {
      this.ballMarkers.forEach((marker) => marker.remove());
    }

    if(this.barrelMarkers) {
      this.barrelMarkers.forEach((marker) => marker.remove());
    }

    this.ballMarkers = [];
    this.barrelMarkers = [];
  }

  fitMapToPositions(positions) {
    if(!positions.length) return;

    if(positions.length === 1) {
      this.map.setView(positions[0], 18);
    } else {
      this.map.fitBounds(L.latLngBounds(positions), {
        padding: [30, 30],
        maxZoom: 32,
      });
    }
  }

  formatLogEntry(msg) {
    let timestamp = this.formatStamp(msg.header && msg.header.stamp);
    let status = this.statusNames[Number(msg.status)] ||
      `status ${msg.status}`;
    let color = this.colorNames[Number(msg.color)] ||
      `color ${msg.color}`;
//    let point = this.formatPointType(msg.point_type);
    let pointType = Number(msg.point_type);
    let point = this.formatPointType(pointType);

    let coords = this.pointCoordinates[pointType];
    let coordsText = coords
      ? `(${coords[0].toFixed(7)}, ${coords[1].toFixed(7)})`
      : "";

    return {
      timestamp: timestamp,
      message: `${status} ${color} ${point} ${coordsText}`,
    };
  }

  formatPointType(pointType) {
    let value = Number(pointType);
    if(!Number.isInteger(value) || value < 1 || value > 6) {
      return `point type ${pointType}`;
    }

    let target = value <= 3 ? "beczce" : "punkcie";
    let pointNumber = value <= 3 ? value : value - 3;
    return `piłkę w ${target} ${pointNumber}`;
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

  onResize() {
    if(this.map) this.map.invalidateSize();
  }

  destroy() {
    this.clearMarkers();

    if(this.map) {
      this.map.remove();
      this.map = null;
    }

    super.destroy();
  }
}

BallStatusViewer.friendlyName = "BallStatus";

BallStatusViewer.supportedTypes = [
  "*/msg/BallStatus",
];

BallStatusViewer.maxUpdateRate = Infinity;

Viewer.registerViewer(BallStatusViewer);

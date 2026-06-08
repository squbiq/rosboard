"use strict";

class MapViewer extends Viewer {
  onCreate() {
    this.mapMode = this.options.mode === "points" ? "points" : "path";
    this.card.title.text(this.options.title || "Dane pojazdu");

    this.viewer = $("<div></div>")
      .css({"font-size": "11pt"})
      .appendTo(this.card.content);

    this.mapNode = $("<div></div>")
      .css({"height": "500px", "width": "100%"})
      .appendTo(this.viewer);

    this.positionInfo = $("<div></div>")
      .css({
        "display": "grid",
        "grid-template-columns": "minmax(170px, 1fr) auto",
        "gap": "10px 16px",
        "padding": "12px",
        "align-items": "center",
      })
      .appendTo(this.viewer);

    this.values = {};
    this.addValue("latitude", "Szerokość");
    this.addValue("longitude", "Długość");

    this.map = L.map(this.mapNode[0], {
      dragging: true,
      scrollWheelZoom: true,
      touchZoom: true,
    }).setView([51.505, -0.09], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);

    this.routeLine = L.polyline([], {
      color: "#ff9800",
      weight: 4,
    }).addTo(this.map);
    this.currentMarker = null;
    this.pointMarkers = [];

    setTimeout(() => this.map.invalidateSize(), 0);
    super.onCreate();
  }

  addValue(field, label) {
    $("<span></span>")
      .attr("contenteditable", "true")
      .text(label)
      .css({
        "font-weight": "bold",
        "outline": "none",
      })
      .appendTo(this.positionInfo);

    this.values[field] = $("<span></span>")
      .addClass("monospace")
      .text("-")
      .css({"text-align": "right"})
      .appendTo(this.positionInfo);
  }

  onData(msg) {
    this.updateMap(Array.isArray(msg.points) ? msg.points : []);
  }

  updateMap(points) {
    let positions = points
      .map((point) => {
        if(!point || typeof point !== "object") return null;

        let lat = Number(
          point.lat !== undefined ? point.lat : point.latitude
        );
        let lon = Number(
          point.lon !== undefined
            ? point.lon
            : point.lng !== undefined ? point.lng : point.longitude
        );
        return Number.isFinite(lat) && Number.isFinite(lon)
          ? [lat, lon]
          : null;
      })
      .filter((point) => point !== null);

    if(!positions.length) {
      this.clearMapData();
      this.values.latitude.text("-");
      this.values.longitude.text("-");
      return;
    }

    if(this.mapMode === "points") {
      this.renderPoints(positions);
    } else {
      this.renderPath(positions);
    }
  }

  clearMapData() {
    this.routeLine.setLatLngs([]);

    if(this.currentMarker) {
      this.currentMarker.remove();
      this.currentMarker = null;
    }

    this.pointMarkers.forEach((marker) => marker.remove());
    this.pointMarkers = [];
  }

  renderPath(route) {
    this.clearPointMarkers();

    let lastPosition = route[route.length - 1];
    this.routeLine.setLatLngs(route.slice(0, -1));
    this.updatePositionInfo(lastPosition);

    if(!this.currentMarker) {
      this.currentMarker = L.marker(lastPosition)
        .bindPopup("Aktualna pozycja")
        .addTo(this.map);
    } else {
      this.currentMarker.setLatLng(lastPosition);
    }

    this.fitMapToPositions(route, lastPosition);
  }

  renderPoints(positions) {
    this.routeLine.setLatLngs([]);
    if(this.currentMarker) {
      this.currentMarker.remove();
      this.currentMarker = null;
    }

    this.clearPointMarkers();
    this.pointMarkers = positions.map((position, index) =>
      L.marker(position)
        .bindPopup(`Punkt ${index + 1}`)
        .addTo(this.map)
    );

    let lastPosition = positions[positions.length - 1];
    this.updatePositionInfo(lastPosition);
    this.fitMapToPositions(positions, lastPosition);
  }

  clearPointMarkers() {
    this.pointMarkers.forEach((marker) => marker.remove());
    this.pointMarkers = [];
  }

  updatePositionInfo(lastPosition) {
    this.values.latitude.text(lastPosition[0].toFixed(7));
    this.values.longitude.text(lastPosition[1].toFixed(7));
  }

  fitMapToPositions(positions, lastPosition) {
    if(positions.length === 1) {
      this.map.setView(lastPosition, 17);
    } else {
      this.map.fitBounds(L.latLngBounds(positions), {
        padding: [30, 30],
        maxZoom: 18,
      });
    }
  }

  onResize() {
    if(this.map) this.map.invalidateSize();
  }

  destroy() {
    if(this.map) {
      this.map.remove();
      this.map = null;
    }
    super.destroy();
  }
}

MapViewer.friendlyName = "Street Map";

MapViewer.supportedTypes = [
  "geographic_msgs/msg/GeoPoint",
  "mavros_msgs/msg/GPSRAW"
];

MapViewer.maxUpdateRate = 10.0;

Viewer.registerViewer(MapViewer);

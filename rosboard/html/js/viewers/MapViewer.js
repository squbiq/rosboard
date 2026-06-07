"use strict";

class MapViewer extends Viewer {
  onCreate() {
    this.card.title.text("Trasa pojazdu");

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
    this.card.title.text(msg._topic_name || "Trasa pojazdu");
    this.updateRoute(Array.isArray(msg.points) ? msg.points : []);
  }

  updateRoute(points) {
    let route = points
      .map((point) => {
        let lat = Number(point && point.lat);
        let lon = Number(point && point.lon);
        return Number.isFinite(lat) && Number.isFinite(lon)
          ? [lat, lon]
          : null;
      })
      .filter((point) => point !== null);

    if(!route.length) {
      this.routeLine.setLatLngs([]);
      this.values.latitude.text("-");
      this.values.longitude.text("-");
      if(this.currentMarker) {
        this.currentMarker.remove();
        this.currentMarker = null;
      }
      return;
    }

    let lastPosition = route[route.length - 1];
    let routeWithoutCurrentPosition = route.slice(0, -1);
    this.routeLine.setLatLngs(routeWithoutCurrentPosition);
    this.values.latitude.text(lastPosition[0].toFixed(7));
    this.values.longitude.text(lastPosition[1].toFixed(7));

    if(!this.currentMarker) {
      this.currentMarker = L.marker(lastPosition)
        .bindPopup("Aktualna pozycja")
        .addTo(this.map);
    } else {
      this.currentMarker.setLatLng(lastPosition);
    }

    if(route.length === 1) {
      this.map.setView(lastPosition, 17);
    } else {
      this.map.fitBounds(L.latLngBounds(route), {
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
];

MapViewer.maxUpdateRate = 10.0;

Viewer.registerViewer(MapViewer);

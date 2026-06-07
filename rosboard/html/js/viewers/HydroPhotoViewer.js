"use strict";

class HydroPhotoViewer extends Viewer {
  onCreate() {
    this.items = [];
    this.currentIndex = -1;
    this.markers = [];
    this.card.title.text("HydroPhoto");

    this.photoContainer = $("<div></div>")
      .css({
        "min-height": "260px",
        "background": "#000000",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "overflow": "hidden",
      })
      .appendTo(this.card.content);

    this.photo = $("<img>")
      .attr("alt", "Hydro photo")
      .css({
        "display": "none",
        "max-width": "100%",
        "max-height": "500px",
      })
      .appendTo(this.photoContainer);

    this.emptyPhotoText = $("<span></span>")
      .text("Waiting for photo ...")
      .css({"color": "#ffffff"})
      .appendTo(this.photoContainer);

    $("<div></div>")
      .text("Lokalizacja Basenu")
      .css({
        "font-size": "16px",
        "font-weight": "bold",
        "padding": "12px 8px",
        "text-align": "center",
      })
      .appendTo(this.card.content);

    this.mapNode = $("<div></div>")
      .css({"height": "320px", "width": "100%"})
      .appendTo(this.card.content);

    this.map = L.map(this.mapNode[0], {
      dragging: true,
      scrollWheelZoom: true,
      touchZoom: true,
    }).setView([51.505, -0.09], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);

    this.createPoolSelector();
    setTimeout(() => this.map.invalidateSize(), 0);
    super.onCreate();
  }

  createPoolSelector() {
    $("<div></div>")
      .attr("contenteditable", "true")
      .text("Identyfikator basenu (pool_id)")
      .css({
        "font-weight": "bold",
        "outline": "none",
        "padding": "12px 0",
        "text-align": "center",
        "width": "100%",
      })
      .appendTo(this.card.content);

    let controls = $("<div></div>")
      .css({
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "gap": "20px",
        "padding-bottom": "12px",
      })
      .appendTo(this.card.content);

    this.previousButton = this.createArrowButton("chevron_left", controls);
    this.poolValue = $("<span></span>")
      .addClass("monospace")
      .text("-")
      .css({
        "min-width": "70px",
        "text-align": "center",
        "font-size": "16px",
      })
      .appendTo(controls);
    this.nextButton = this.createArrowButton("chevron_right", controls);

    this.previousButton.click(() => this.showItem(this.currentIndex - 1));
    this.nextButton.click(() => this.showItem(this.currentIndex + 1));
  }

  createArrowButton(icon, container) {
    return $("<button></button>")
      .addClass("mdl-button mdl-js-button mdl-button--icon")
      .append($("<i></i>").addClass("material-icons").text(icon))
      .appendTo(container);
  }

  onData(msg) {
    this.card.title.text(msg._topic_name || "HydroPhoto");
    this.items = this.extractItems(msg);
    this.renderMap();
    this.showItem(this.items.length - 1);
  }

  extractItems(msg) {
    if(Array.isArray(msg)) return msg;
    if(!msg || typeof msg !== "object") return [];

    let collection = Object.values(msg).find((value) =>
      Array.isArray(value) &&
      value.some((item) => item && typeof item === "object" && "pool_id" in item)
    );
    return collection || ("pool_id" in msg ? [msg] : []);
  }

  renderMap() {
    this.markerLayer.clearLayers();
    this.markers = [];
    let positions = [];

    this.items.forEach((item) => {
      let lat = Number(item.lat);
      let lon = Number(item.lon);
      if(!Number.isFinite(lat) || !Number.isFinite(lon)) {
        this.markers.push(null);
        return;
      }

      let position = [lat, lon];
      positions.push(position);
      this.markers.push(
        L.marker(position)
          .bindPopup(`Pool ID: ${item.pool_id}<br>Lat: ${lat}<br>Lon: ${lon}`)
          .addTo(this.markerLayer)
      );
    });

    if(positions.length === 1) {
      this.map.setView(positions[0], 17);
    } else if(positions.length > 1) {
      this.map.fitBounds(L.latLngBounds(positions), {
        padding: [30, 30],
        maxZoom: 18,
      });
    }
  }

  showItem(index) {
    if(!this.items.length) {
      this.currentIndex = -1;
      this.poolValue.text("-");
      this.photo.hide().removeAttr("src");
      this.emptyPhotoText.show();
      this.updateButtons();
      return;
    }

    this.currentIndex = Math.max(0, Math.min(index, this.items.length - 1));
    let item = this.items[this.currentIndex];
    this.poolValue.text(item.pool_id !== undefined ? item.pool_id : "-");

    let photoUrl = this.getPhotoUrl(item.photo);
    if(photoUrl) {
      this.photo.attr("src", photoUrl).show();
      this.emptyPhotoText.hide();
    } else {
      this.photo.hide().removeAttr("src");
      this.emptyPhotoText.show();
    }

    let marker = this.markers[this.currentIndex];
    if(marker) marker.openPopup();
    this.updateButtons();
  }

  updateButtons() {
    this.previousButton.prop("disabled", this.currentIndex <= 0);
    this.nextButton.prop(
      "disabled",
      this.currentIndex < 0 || this.currentIndex >= this.items.length - 1
    );
  }

  getPhotoUrl(photo) {
    if(!photo) return null;
    if(photo._data_jpeg) return "data:image/jpeg;base64," + photo._data_jpeg;
    if(typeof photo.data === "string") {
      let mimeType = photo.format && photo.format.includes("png")
        ? "image/png"
        : "image/jpeg";
      return `data:${mimeType};base64,${photo.data}`;
    }
    return null;
  }

  onResize() {
    if(this.map) this.map.invalidateSize();
  }

  destroy() {
    if(this.map) {
      this.map.remove();
      this.map = null;
    }
    this.items = [];
    this.markers = [];
    super.destroy();
  }
}

HydroPhotoViewer.friendlyName = "HydroPhoto";

HydroPhotoViewer.supportedTypes = [
  "*/msg/HydroPhoto",
];

HydroPhotoViewer.maxUpdateRate = 10.0;

Viewer.registerViewer(HydroPhotoViewer);

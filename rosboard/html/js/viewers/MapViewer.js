"use strict";

class MapViewer extends Viewer {
  onCreate() {
    this.viewer = $('<div></div>')
      .css({'font-size': '11pt' })
      .appendTo(this.card.content);

    this.mapId = "map-" + Math.floor(Math.random()*10000);

    this.map = $('<div id="' + this.mapId + '"></div>')
      .css({ "height": "500px", "width": "100%", "filter": "invert(100%) saturate(50%)" })
      .appendTo(this.viewer);
    
    this.posInfo = $(`<div id="posInfo">
        <p id="posInfo-lat">Latt: </p>
        <p id="posInfo-long">Long: </p>
      </div>`)
      .css({ "height": "100px", "width": "100%", "color": "white", "padding": "15px", "box-sizing": "border-box" })
      .appendTo(this.viewer);
    
    this.mapLeaflet = L.map(this.map[0]).setView([51.505,-0.09], 15);
    this.mapLeaflet.dragging.disable();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapLeaflet);

    this.marker = null;
  }

onData(msg) {
      this.card.title.text("Pozycja drona");
      
      let lat, lon;

      // 1. Extract coordinates based on the ROS message type
      if (msg.latitude !== undefined && msg.longitude !== undefined) {
          // It's a sensor_msgs/NavSatFix
          lat = msg.latitude;
          lon = msg.longitude;
      } 
      else if (msg.lat !== undefined && msg.lon !== undefined) {
          // It's a mavros_msgs/GPSRAW
          // Check if it's the raw integer format (values wildly outside normal lat/lon bounds)
          if (msg.lat > 90 || msg.lat < -90 || msg.lon > 180 || msg.lon < -180) {
              lat = msg.lat / 1e7; // Divide by 10,000,000 to get standard degrees
              lon = msg.lon / 1e7;
          } else {
              lat = msg.lat;
              lon = msg.lon;
          }
      } else {
          // Unrecognized message format, ignore it to prevent crashing the map
          console.error("MapViewer: Could not find valid lat/lon in message", msg);
          return;
      }

      // 2. Final safety check (prevent Leaflet from receiving NaN or undefined)
      if (isNaN(lat) || isNaN(lon)) return;

      const newPos = [lat, lon];

      $("#posInfo-lat").html("Latt: " + lat);
      $("#posInfo-long").html("Long: " + lon);

      // 3. Update the map smoothly without destroying the marker
      if (!this.marker) {
          this.marker = L.marker(newPos).addTo(this.mapLeaflet);
          this.mapLeaflet.setView(newPos, 15); 
      } else {
          this.marker.setLatLng(newPos);
          
          // Auto-center if the drone flies off the screen
          if (!this.mapLeaflet.getBounds().contains(newPos)) {
              this.mapLeaflet.setView(newPos, this.mapLeaflet.getZoom(), { animate: false });
          }
      }
  }
}

MapViewer.friendlyName = "Street Map";

MapViewer.supportedTypes = [
    "sensor_msgs/msg/NavSatFix",
    "mavros_msgs/msg/GPSRAW"
];

MapViewer.maxUpdateRate = 10000.0;

Viewer.registerViewer(MapViewer);
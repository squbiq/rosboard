"use strict";

class CamViewer extends StaticViewer {
  onCreate() {
    this.card.title.text(this.options.title || "Video Kamery");

    if(!this.options.webrtcSrc) {
      this.error("Brak adresu WHEP w options.webrtcSrc.");
      return;
    }

    if(typeof MediaMTXWebRTCReader === "undefined") {
      this.error("Nie załadowano biblioteki mediamtx-reader.js.");
      return;
    }

    this.videoContainer = $("<div></div>")
      .css({
        "position": "relative",
        "width": "100%",
        "aspect-ratio": this.options.aspectRatio || "16 / 9",
        "background": "#000000",
        "overflow": "hidden",
      })
      .appendTo(this.card.content);

    this.video = $("<video></video>")
      .attr({
        autoplay: true,
        controls: true,
        playsinline: true,
      })
      .prop("muted", this.options.muted !== false)
      .css({
        "display": "block",
        "position": "absolute",
        "inset": "0",
        "width": "100%",
        "height": "100%",
        "object-fit": "contain",
        "background": "#000000",
      })
      .on("loadedmetadata resize", () => this.layoutGrid())
      .appendTo(this.videoContainer);

    this.status = $("<div></div>")
      .addClass("monospace")
      .text("Łączenie z WebRTC...")
      .css({
        "padding": "6px 10px",
        "font-size": "11px",
        "text-align": "center",
      })
      .appendTo(this.card.content);

    if(typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.layoutGrid());
      this.resizeObserver.observe(this.card[0]);
    }

    let whepUrl = this.getWhepUrl(this.options.webrtcSrc);
    let sourceHost = new URL(whepUrl).hostname;

    this.reader = new MediaMTXWebRTCReader({
      url: whepUrl,
      user: this.options.user || "",
      pass: this.options.pass || "",
      token: this.options.token || "",
      localCandidateHost: this.isLoopbackHost(sourceHost)
        ? sourceHost
        : undefined,
      onError: (message) => {
        this.status.text(`WebRTC: ${message}`);
      },
      onConnectionState: (state) => {
        this.updateConnectionStatus(state);
      },
      onTrack: (event) => {
        if(!event.streams || !event.streams[0]) return;

        let videoElement = this.video[0];
        if(videoElement.srcObject !== event.streams[0]) {
          videoElement.srcObject = event.streams[0];
        }
        this.playVideo(videoElement);
      },
    });
  }

  getWhepUrl(source) {
    return source.replace(/\/+$/, "").endsWith("/whep")
      ? source.replace(/\/+$/, "")
      : source.replace(/\/+$/, "") + "/whep";
  }

  isLoopbackHost(host) {
    return host === "127.0.0.1" || host === "localhost" || host === "::1";
  }

  updateConnectionStatus(state) {
    let labels = {
      "new": "WebRTC: inicjalizacja",
      "connecting": "WebRTC: łączenie ICE...",
      "connected": "WebRTC połączone",
      "disconnected": "WebRTC: połączenie przerwane",
      "failed": "WebRTC: połączenie ICE nieudane",
      "closed": "WebRTC: połączenie zamknięte",
    };
    this.status.text(labels[state] || `WebRTC: ${state}`);
    this.layoutGrid();
  }

  layoutGrid() {
    if(this.layoutPending) {
      return;
    }

    this.layoutPending = true;
    window.requestAnimationFrame(() => {
      this.layoutPending = false;
      if(typeof $grid !== "undefined" && $grid) {
        $grid.masonry("layout");
      }
    });
  }

  playVideo(videoElement) {
    let playPromise = videoElement.play();
    if(playPromise) {
      playPromise.catch(() => {
        this.status.text("Naciśnij play, aby uruchomić stream");
      });
    }
  }

  destroy() {
    if(this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if(this.reader) {
      this.reader.close();
      this.reader = null;
    }

    if(this.video) {
      let videoElement = this.video[0];
      videoElement.pause();
      videoElement.srcObject = null;
    }

    super.destroy();
  }
}

CamViewer.friendlyName = "Camera";

StaticViewer.registerViewer(CamViewer);

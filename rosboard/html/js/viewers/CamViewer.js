"use strict";

class CamViewer extends StaticViewer {
  onCreate() {
    this.card.title.text("Video Kamery");

    // options: {
    //  mode = "webrtc" | "hls",
    //  rtspSrc: "rtsp://10.109.43.243:8554/test", // ścieżka rtsp
    //  hlsSrc: "http://10.109.43.243:8890/test/index.m3u8", // ścieżka hls
    // } Jedna musi być !

    this.options.mode = this.options.mode || "hls";
    this.options.rtspSrc = this.options.rtspSrc || "rtsp://10.109.43.243:8554/test";
    this.options.hlsSrc = this.options.hlsSrc || "http://10.109.43.243:8890/test/index.m3u8";
    if(this.options.hlsSrc === "http://10.109.43.243:8888/test/index.m3u8") {
      this.options.hlsSrc = "http://10.109.43.243:8890/test/index.m3u8";
    }

    this.player = $("<div></div>").appendTo(this.card.content);

    if(this.options.mode === "webrtc") {
      this.loadWebRtc();
    } else {
      this.loadHls();
    }
  }

  loadWebRtc() {
    let webRtcSrc = this.getWebRtcSrc(this.options.rtspSrc);
    if(!webRtcSrc) {
      this.error("Niepoprawna ścieżka rtspSrc.");
      return;
    }

    this.frame = $("<iframe></iframe>")
      .attr({
        src: webRtcSrc,
        allow: "autoplay; fullscreen; microphone",
        allowfullscreen: true,
      })
      .css({
        "border": "0",
        "display": "block",
        "width": "100%",
        "height": "420px",
        "background": "#000000",
      })
      .appendTo(this.player);
  }

  loadHls() {
    if(!this.options.hlsSrc) {
      this.error("Brak ścieżki hlsSrc.");
      return;
    }

    this.video = $("<video></video>")
      .attr({
        autoplay: true,
        controls: true,
        playsinline: true,
      })
      .prop("muted", true)
      .css({
        "display": "block",
        "width": "100%",
        "background": "#000000",
      })
      .appendTo(this.player);

    let videoElement = this.video[0];
    if(typeof Hls !== "undefined" && Hls.isSupported()) {
      this.hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        let playPromise = videoElement.play();
        if(playPromise) playPromise.catch(() => {});
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if(!data.fatal) return;
        if(data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          this.hls.startLoad();
        } else if(data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          this.hls.recoverMediaError();
        } else {
          this.error("Błąd HLS: " + data.details);
          this.hls.destroy();
          this.hls = null;
        }
      });
      this.hls.loadSource(this.options.hlsSrc);
      this.hls.attachMedia(videoElement);
    } else if(videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      videoElement.src = this.options.hlsSrc;
    } else {
      this.error("Ta przeglądarka nie obsługuje HLS.");
    }
  }

  getWebRtcSrc(rtspSrc) {
    try {
      let source = new URL(rtspSrc);
      let path = source.pathname.replace(/\/+$/, "");
      return `http://${source.hostname}:8889${path}`;
    } catch(error) {
      console.error("Niepoprawny rtspSrc", rtspSrc, error);
      return null;
    }
  }

  destroyPlayer() {
    if(this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if(this.video) {
      this.video[0].pause();
      this.video.removeAttr("src");
      this.video[0].load();
      this.video = null;
    }
    this.frame = null;
    if(this.player) this.player.empty();
  }

  destroy() {
    this.destroyPlayer();
    super.destroy();
  }
}

CamViewer.friendlyName = "Camera";

StaticViewer.registerViewer(CamViewer);

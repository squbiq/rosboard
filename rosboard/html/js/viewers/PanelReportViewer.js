class PanelReportViewer extends Viewer {
  onCreate() {
    this.latestReportsByPanelId = {};
    this.panelIdOrder = [];
    this.selectedPanelIndex = 0;

    this.panelCards = [this.createPanelCard(this.card, true)];
    super.onCreate();
  }

  createPanelCard(card, isPrimary) {
    if(!isPrimary) {
      card.title = $("<div></div>").addClass("card-title").appendTo(card);
      card.content = $("<div></div>").addClass("card-content").appendTo(card);
    }

    card.title.text("Panel Report");

    let panelCard = {
      card: card,
      values: {},
    };

    panelCard.imageContainer = $("<div></div>")
      .css({
        "min-height": "240px",
        "background": "#000000",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
      })
      .appendTo(card.content);

    panelCard.panelImage = $("<img>")
      .attr("alt", "PanelReportImg")
      .css({
        "display": "none",
        "max-width": "100%",
        "max-height": "500px",
      })
      .on("load", () => $grid.masonry("layout"))
      .appendTo(panelCard.imageContainer);

    panelCard.emptyImageText = $("<span></span>")
      .text("Waiting for panel image ...")
      .css({"color": "#ffffff"})
      .appendTo(panelCard.imageContainer);

    panelCard.infoContainer = $("<div></div>")
      .css({
        "display": "grid",
        "grid-template-columns": "minmax(170px, 1fr) auto",
        "gap": "10px 16px",
        "padding": "12px",
        "align-items": "center",
      })
      .appendTo(card.content);

    this.addValue(panelCard, "timestamp", "Czas (header.stamp)");
    this.addValue(panelCard, "panel_id", "ID panelu (panel_id)");
    this.addValue(panelCard, "panel_angle", "Kąt panelu (panel_angle)");
    this.addValue(panelCard, "lat", "Szerokość geograficzna (lat)");
    this.addValue(panelCard, "lon", "Długość geograficzna (lon)");

    $("<div></div>")
      .text("Wykryte karty")
      .css({
        "font-size": "16px",
        "font-weight": "bold",
        "padding": "12px 12px 6px",
      })
      .appendTo(card.content);

    panelCard.reportList = $("<ul></ul>")
      .css({
        "box-sizing": "border-box",
        "max-height": "260px",
        "margin": "0 12px 12px",
        "padding": "8px 8px 8px 28px",
        "overflow-y": "auto",
        "border": "1px solid #505050",
        "border-radius": "4px",
      })
      .appendTo(card.content);

    panelCard.navContainer = $("<div></div>")
      .css({
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "gap": "12px",
        "padding": "0 12px 12px",
      })
      .appendTo(card.content);

    panelCard.prevButton = $("<button></button>")
      .text("←")
      .on("click", () => this.selectPreviousPanel())
      .appendTo(panelCard.navContainer);

    panelCard.panelCounter = $("<span></span>")
      .addClass("monospace")
      .text("0 / 0")
      .appendTo(panelCard.navContainer);

    panelCard.nextButton = $("<button></button>")
      .text("→")
      .on("click", () => this.selectNextPanel())
      .appendTo(panelCard.navContainer);

    return panelCard;
  }

  addValue(panelCard, field, label) {
    $("<span></span>")
      .attr("contenteditable", "true")
      .text(label)
      .css({
        "font-weight": "bold",
        "outline": "none",
      })
      .appendTo(panelCard.infoContainer);

    panelCard.values[field] = $("<span></span>")
      .addClass("monospace")
      .text("-")
      .css({"text-align": "right"})
      .appendTo(panelCard.infoContainer);
  }

  onData(msg) {
  let reports = this.extractReports(msg);

  let lastReceivedPanelIdKey = null;

  reports.forEach((report) => {
    if(report.panel_id === undefined || report.panel_id === null) return;

    let panelId = Number(report.panel_id);
    if(!Number.isFinite(panelId)) return;

    report._panel_id_key = String(panelId);
    lastReceivedPanelIdKey = report._panel_id_key;

    if(!(report._panel_id_key in this.latestReportsByPanelId)) {
      this.panelIdOrder.push(report._panel_id_key);
      this.panelIdOrder.sort((a, b) => Number(a) - Number(b));
    }

    this.latestReportsByPanelId[report._panel_id_key] = report;
  });

  if(lastReceivedPanelIdKey !== null) {
    this.selectedPanelIndex =
      this.panelIdOrder.indexOf(lastReceivedPanelIdKey);
  }

  if(
    this.selectedPanelIndex < 0 ||
    this.selectedPanelIndex >= this.panelIdOrder.length
  ) {
    this.selectedPanelIndex =
      Math.max(this.panelIdOrder.length - 1, 0);
  }

  this.renderSelectedPanel();
  $grid.masonry("layout");
}

  renderSelectedPanel() {
    let panelCard = this.panelCards[0];

    if(!this.panelIdOrder.length) {
      this.clearPanelCard(panelCard);
      panelCard.panelCounter.text("0 / 0");
      panelCard.prevButton.prop("disabled", true);
      panelCard.nextButton.prop("disabled", true);
      return;
    }

    let panelIdKey = this.panelIdOrder[this.selectedPanelIndex];
    let report = this.latestReportsByPanelId[panelIdKey];

    this.renderPanelCard(panelCard, report, this.selectedPanelIndex);

    panelCard.panelCounter.text(
      `${this.selectedPanelIndex + 1} / ${this.panelIdOrder.length}`
    );

    let disabled = this.panelIdOrder.length <= 1;
    panelCard.prevButton.prop("disabled", disabled);
    panelCard.nextButton.prop("disabled", disabled);
  }

  selectPreviousPanel() {
    if(!this.panelIdOrder.length) return;

    this.selectedPanelIndex =
      (this.selectedPanelIndex - 1 + this.panelIdOrder.length) %
      this.panelIdOrder.length;

    this.renderSelectedPanel();
    $grid.masonry("layout");
  }

  selectNextPanel() {
    if(!this.panelIdOrder.length) return;

    this.selectedPanelIndex =
      (this.selectedPanelIndex + 1) % this.panelIdOrder.length;

    this.renderSelectedPanel();
    $grid.masonry("layout");
  }

  extractReports(msg) {
    if(Array.isArray(msg)) return msg;
    if(!msg || typeof msg !== "object") return [];

    let collection = Object.values(msg).find((value) =>
      Array.isArray(value) &&
      value.some((item) =>
        item &&
        typeof item === "object" &&
        ("panel_image" in item || "panel_angle" in item || "panel_id" in item)
      )
    );

    return collection || (
      "panel_image" in msg || "panel_angle" in msg || "panel_id" in msg
        ? [msg]
        : []
    );
  }

  renderPanelCard(panelCard, report, index) {
    let topicName = report._topic_name || this.topicName || "PanelReport";

    panelCard.card.title.text(
      `${topicName} - panel ${report.panel_id}`
    );

    panelCard.values.timestamp.text(
      this.formatStamp(report.header && report.header.stamp)
    );
    panelCard.values.panel_id.text(this.formatNumber(report.panel_id, 0));
    panelCard.values.panel_angle.text(this.formatNumber(report.panel_angle, 0));
    panelCard.values.lat.text(this.formatNumber(report.lat, 7));
    panelCard.values.lon.text(this.formatNumber(report.lon, 7));

    let imageUrl = this.getImageUrl(report.panel_image);
    if(imageUrl) {
      panelCard.panelImage.attr("src", imageUrl).show();
      panelCard.emptyImageText.hide();
    } else {
      panelCard.panelImage.hide().removeAttr("src");
      panelCard.emptyImageText.show();
    }

    this.renderReports(
      panelCard.reportList,
      Array.isArray(report.card) ? report.card : []
    );
  }

  clearPanelCard(panelCard) {
    panelCard.card.title.text(this.topicName || "PanelReport");
    Object.values(panelCard.values).forEach((value) => value.text("-"));
    panelCard.panelImage.hide().removeAttr("src");
    panelCard.emptyImageText.show();
    this.renderReports(panelCard.reportList, []);
  }

  renderReports(reportList, reports) {
    reportList.empty();

    if(!reports.length) {
      $("<li></li>")
        .text("Brak wykrytych kart")
        .css({"color": "#808080"})
        .appendTo(reportList);
      return;
    }

    reports.forEach((report) => {
      let timestamp = this.formatStamp(report.header && report.header.stamp);
      $("<li></li>")
        .addClass("monospace")
        .text(
          `[${timestamp}] wykryto ${report.col} col ${report.row} row, kolor ${report.color}`
        )
        .css({
          "padding": "4px 0",
          "overflow-wrap": "anywhere",
        })
        .appendTo(reportList);
    });
  }

  getImageUrl(image) {
    if(!image) return null;
    if(image._data_jpeg) return "data:image/jpeg;base64," + image._data_jpeg;

    if(typeof image.data === "string") {
      let mimeType = image.format && image.format.includes("png")
        ? "image/png"
        : "image/jpeg";
      return `data:${mimeType};base64,${image.data}`;
    }

    return null;
  }

  formatStamp(stamp) {
    if(!stamp) return "-";

    let seconds = Number(stamp.sec !== undefined ? stamp.sec : stamp.secs);
    let nanoseconds = Number(
      stamp.nanosec !== undefined ? stamp.nanosec : stamp.nsecs || 0
    );

    if(!Number.isFinite(seconds)) return "-";

    let date = new Date(seconds * 1000 + nanoseconds / 1e6);
    if(Number.isNaN(date.getTime())) return `${seconds}.${nanoseconds}`;

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

  formatNumber(value, precision) {
    let number = Number(value);
    return Number.isFinite(number) ? number.toFixed(precision) : "-";
  }

  destroy() {
    this.latestReportsByPanelId = {};
    this.panelIdOrder = [];
    this.selectedPanelIndex = 0;

    super.destroy();
    $grid.masonry("layout");
  }
}

PanelReportViewer.friendlyName = "PanelReport";

PanelReportViewer.supportedTypes = [
  "*/msg/PanelReport",
];

PanelReportViewer.maxUpdateRate = 10.0;

Viewer.registerViewer(PanelReportViewer);


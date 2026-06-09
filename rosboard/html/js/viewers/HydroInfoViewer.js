"use strict";

class HydroInfoViewer extends Viewer {
  onCreate() {
    this.card.title.text(this.options.title || "HydroInfo");
    this.items = [];
    this.currentIndex = -1;
    this.historyResetTimeout = null;
    this.isBrowsingHistory = false;
    this.values = {};

    this.infoContainer = $("<div></div>")
      .css({
        "display": "grid",
        "grid-template-columns": "minmax(170px, 1fr) auto",
        "gap": "10px 16px",
        "padding": "12px",
        "align-items": "center",
      })
      .appendTo(this.card.content);

    this.addValue("temperature", "Temperatura (temperature)");
    this.addValue("conductivity", "Przewodność (conductivity)");
    this.addValue("ph", "Odczyn pH (ph)");
    this.createPoolSelector();

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
      .appendTo(this.infoContainer);

    this.values[field] = $("<span></span>")
      .addClass("monospace")
      .text("-")
      .css({"text-align": "right"})
      .appendTo(this.infoContainer);
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

    this.previousButton.click(() =>
      this.navigateTo(this.currentIndex - 1)
    );
    this.nextButton.click(() =>
      this.navigateTo(this.currentIndex + 1)
    );
  }

  createArrowButton(icon, container) {
    return $("<button></button>")
      .addClass("mdl-button mdl-js-button mdl-button--icon")
      .append($("<i></i>").addClass("material-icons").text(icon))
      .appendTo(container);
  }

onData(msg) {
  let newItems = this.extractItems(msg);
  if(!newItems.length) return;

  let lastChangedIndex = -1;

  newItems.forEach((newItem) => {
    let existingIndex = this.items.findIndex((item) =>
      item && item.pool_id === newItem.pool_id
    );

    if(existingIndex >= 0) {
      this.items[existingIndex] = newItem;
      lastChangedIndex = existingIndex;
    } else {
      this.items.push(newItem);
      lastChangedIndex = this.items.length - 1;
    }
  });

  if(!this.isBrowsingHistory) {
    this.showItem(lastChangedIndex);
  } else {
    this.showItem(this.currentIndex);
  }
}

  navigateTo(index) {
    this.isBrowsingHistory = true;
    this.showItem(index);
    this.scheduleLatestItem();
  }

  scheduleLatestItem() {
    if(this.historyResetTimeout) {
      clearTimeout(this.historyResetTimeout);
    }

    this.historyResetTimeout = setTimeout(() => {
      this.historyResetTimeout = null;
      this.isBrowsingHistory = false;
      this.showItem(this.items.length - 1);
    }, 5000);
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

  showItem(index) {
    if(!this.items.length) {
      this.currentIndex = -1;
      this.poolValue.text("-");
      Object.values(this.values).forEach((value) => value.text("-"));
      this.updateButtons();
      return;
    }

    this.currentIndex = Math.max(0, Math.min(index, this.items.length - 1));
    let item = this.items[this.currentIndex];
    this.poolValue.text(item.pool_id !== undefined ? item.pool_id : "-");
    this.values.temperature.text(this.formatValue(item.temperature));
    this.values.conductivity.text(this.formatValue(item.conductivity));
    this.values.ph.text(this.formatValue(item.ph));
    this.updateButtons();
  }

  updateButtons() {
    this.previousButton.prop(
      "disabled",
      this.currentIndex <= 0
    );
    this.nextButton.prop(
      "disabled",
      this.currentIndex < 0 || this.currentIndex >= this.items.length - 1
    );
  }

  formatValue(value) {
    let number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "-";
  }

  destroy() {
    if(this.historyResetTimeout) {
      clearTimeout(this.historyResetTimeout);
      this.historyResetTimeout = null;
    }
    super.destroy();
  }
}

HydroInfoViewer.friendlyName = "HydroInfo";

HydroInfoViewer.supportedTypes = [
  "*/msg/HydroInfo",
];

HydroInfoViewer.maxUpdateRate = Infinity;

Viewer.registerViewer(HydroInfoViewer);

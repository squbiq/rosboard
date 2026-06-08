"use strict";

function initGrid() {
  $grid = $(".grid").masonry({
    itemSelector: ".card",
    gutter: 10,
    percentPosition: true,
  });
  $grid.masonry("layout");
  restoreStaticViewers();
}

function newCard() {
  return $("<div></div>")
    .addClass("card")
    .appendTo($(".grid"));
}

function appendViewerCard(card) {
  $grid.masonry("appended", card);
  $grid.masonry("layout");
}

function restoreStaticViewers() {
  for(let viewerId in storedStaticViewers) {
    let definition = storedStaticViewers[viewerId];
    initStaticViewer({
      viewerType: definition.viewerType,
      viewerId: viewerId,
      options: definition.options,
    });
  }
  storedStaticViewers = {};
}

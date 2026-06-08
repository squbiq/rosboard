"use strict";

let lastBotherTime = 0.0;

function versionCheck(currentVersionText) {
  $.get("https://raw.githubusercontent.com/dheera/rosboard/release/setup.py")
    .done((data) => {
      let matches = data.match(/version='(.*)'/);
      if(matches.length < 2) return;

      let latestVersion = matches[1]
        .split(".")
        .map((num) => parseInt(num, 10));
      let currentVersion = currentVersionText
        .split(".")
        .map((num) => parseInt(num, 10));
      let latestVersionInt =
        latestVersion[0] * 1000000 +
        latestVersion[1] * 1000 +
        latestVersion[2];
      let currentVersionInt =
        currentVersion[0] * 1000000 +
        currentVersion[1] * 1000 +
        currentVersion[2];

      if(
        currentVersion < latestVersion &&
        Date.now() - lastBotherTime > 1800000
      ) {
        lastBotherTime = Date.now();
        snackbarContainer.MaterialSnackbar.showSnackbar({
          message:
            "New version of ROSboard available (" +
            currentVersionText +
            " -> " +
            matches[1] +
            ").",
          actionText: "Check it out",
          actionHandler: () => {
            window.location.href = "https://github.com/dheera/rosboard/";
          },
        });
      }
    });
}

"use strict";

var snackbarContainer = document.querySelector("#demo-toast-example");

let subscriptions = {};
let staticViewers = {};
let storedStaticViewers = {};
let currentTopics = {};
let currentTopicsStr = "";
let currentTransport = null;
let $grid = null;

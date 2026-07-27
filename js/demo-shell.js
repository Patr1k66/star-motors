(function () {
  "use strict";

  var frame = document.getElementById("demo-frame");
  if (!frame) return;

  var SITE_PREFIX = "/star-motors";
  var ORIGIN = "https://star-motors.ru";

  var path = window.location.pathname || "/";
  if (path.indexOf(SITE_PREFIX) === 0) {
    path = path.slice(SITE_PREFIX.length) || "/";
  }
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  if (path === "/" || path === "/index.html") {
    window.location.replace(SITE_PREFIX + "/");
    return;
  }

  var target = ORIGIN + path.replace(/\/+$/, "") + "/";
  if (window.location.search) {
    target += window.location.search;
  }
  frame.src = target;
})();

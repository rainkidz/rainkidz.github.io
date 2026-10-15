var DATA_BASE = "/app-download/apps/";
var ASSET_BASE = "/app-download/";

function resolveAsset(p) {
  if (!p) return "";
  if (/^(https?:)?\/\//.test(p) || p.charAt(0) === "/") return p;
  return ASSET_BASE + p;
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  var mb = bytes / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(1) + " MB" : Math.round(bytes / 1024) + " KB";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function createRow(app, slug) {
  var isPlay = !app.url && !!app.playStoreUrl;
  var row = document.createElement("article");
  row.className = "app-row";

  var meta = [];
  var size = formatSize(app.size);
  var date = formatDate(app.releasedAt);
  if (size) meta.push(size);
  if (date) meta.push("Updated " + date);

  var action = isPlay
    ? '<a class="btn btn-sm btn-ghost" href="' + escapeHtml(app.playStoreUrl) + '" target="_blank" rel="noopener"><img class="i i-16" src="assets/icons/ui/play-store.svg" alt="">Google Play</a>'
    : '<a class="btn btn-sm btn-primary" href="' + escapeHtml(app.url) + '"><img class="i i-16" src="assets/icons/ui/download.svg" alt="">Download APK</a>';

  row.innerHTML =
    '<div class="app-row-icon"><img src="' + escapeHtml(resolveAsset(app.icon)) + '" alt="' + escapeHtml(app.name) + ' icon" loading="lazy" onerror="this.style.display=\'none\'"></div>' +
    '<div class="app-row-body">' +
      '<div class="app-row-title"><h3>' + escapeHtml(app.name) + '</h3><span class="pill">v' + escapeHtml(app.versionName) + '</span></div>' +
      '<p class="app-tagline">' + escapeHtml(app.tagline || "") + '</p>' +
      (meta.length ? '<p class="app-meta">' + escapeHtml(meta.join("  •  ")) + '</p>' : "") +
    '</div>' +
    '<div class="app-row-actions">' + action +
      '<a class="btn btn-sm btn-ghost" href="app.html?slug=' + encodeURIComponent(slug) + '">Details <img class="i i-14" src="assets/icons/ui/arrow-right.svg" alt=""></a>' +
    '</div>';
  return row;
}

function fetchJson(url) {
  return fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  });
}

function loadApps() {
  var list = document.getElementById("apps-list");
  var count = document.getElementById("build-count");
  fetchJson(DATA_BASE + "index.json").then(function (slugs) {
    return Promise.allSettled(slugs.map(function (slug) { return fetchJson(DATA_BASE + slug + ".json"); })).then(function (results) {
      return { slugs: slugs, results: results };
    });
  }).then(function (bundle) {
    list.innerHTML = "";
    var n = 0;
    bundle.results.forEach(function (result, i) {
      var app = result.status === "fulfilled" ? result.value : null;
      if (app && (app.url || app.playStoreUrl)) {
        list.appendChild(createRow(app, bundle.slugs[i]));
        n++;
      }
    });
    if (n === 0) list.innerHTML = '<p class="loading">No apps available.</p>';
    if (count) count.textContent = n + " STABLE BUILD" + (n === 1 ? "" : "S");
  }).catch(function () {
    list.innerHTML = '<p class="loading">Failed to load app list. Reload the page.</p>';
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
loadApps();

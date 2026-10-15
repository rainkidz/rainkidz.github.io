var DATA_BASE = "/app-download/apps/";
var ASSET_BASE = "/app-download/";

var CAP_ICONS = {
  tubenime: ["search.svg", "archive.svg", "refresh.svg", "shield-check.svg", "folder.svg", "cube.svg"],
  wispmail: ["mail.svg", "shield-check.svg", "qr.svg", "history.svg", "fingerprint.svg", "folder.svg"],
  toyotapartsprice: ["search.svg", "archive.svg", "cube.svg", "history.svg", "folder.svg", "code.svg"]
};

var MIN_SDK_OS = { 21: "5.0", 23: "6.0", 24: "7.0", 26: "8.0", 28: "9.0", 29: "10", 30: "11", 31: "12", 33: "13", 34: "14", 35: "15" };

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

function shortHash(checksum) {
  if (!checksum) return "";
  var hex = String(checksum).replace(/^sha256:/i, "");
  return hex.length > 20 ? hex.slice(0, 8) + "..." + hex.slice(-8) : hex;
}

function fetchJson(url) {
  return fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  });
}

function loadOldVersions(repoSlug) {
  if (!repoSlug) return Promise.resolve(null);
  return fetch("https://api.github.com/repos/" + repoSlug + "/releases?per_page=20").then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (releases) {
    if (!Array.isArray(releases) || releases.length === 0) return null;
    return releases.filter(function (r) { return !r.draft; });
  }).catch(function () { return null; });
}

function oldVersionsHtml(releases, currentVersionName) {
  if (!releases || !releases.length) return "";
  var rows = releases.map(function (r) {
    var apk = (r.assets || []).filter(function (a) { return /\.apk$/i.test(a.name); })[0];
    var link = apk ? apk.browser_download_url : r.html_url;
    var tag = r.name || r.tag_name;
    var isCurrent = tag === currentVersionName || r.tag_name === ("v" + currentVersionName);
    return '<tr' + (isCurrent ? ' class="row-current"' : "") + '>' +
      '<td><span class="vcell">' + escapeHtml(tag) + (isCurrent ? ' <span class="pill pill-current">CURRENT</span>' : "") + '</span></td>' +
      '<td class="num">' + (apk ? escapeHtml(formatSize(apk.size)) : "-") + '</td>' +
      '<td class="num">' + escapeHtml(formatDate(r.published_at)) + '</td>' +
      '<td class="num">universal</td>' +
      '<td class="num"><a href="' + escapeHtml(link) + '" target="_blank" rel="noopener">Download</a></td>' +
    "</tr>";
  }).join("");
  return '<section class="section"><div class="section-head"><h2>Version Archive</h2></div>' +
    '<div class="table-wrap"><table class="version-table"><thead><tr>' +
    "<th>Version</th><th>Size</th><th>Released</th><th>Architecture</th><th>Download</th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table></div></section>";
}

function shotFailed(img) {
  var fig = img.closest(".shot");
  if (fig) fig.style.display = "none";
  var sec = document.getElementById("shots-section");
  if (sec && !sec.querySelector('.shot:not([style*="none"])')) sec.style.display = "none";
}

function renderDetail(app, slug) {
  document.title = app.name + " - Rainstudio";
  var root = document.getElementById("app-root");
  var hasApk = !!app.url;
  var icons = CAP_ICONS[slug] || CAP_ICONS.tubenime;

  var metaParts = [];
  if (app.package) metaParts.push('<span class="pkg-chip">pkg: ' + escapeHtml(app.package) + ' <a href="#" id="copy-pkg" title="Copy package name"><img class="i i-14" src="assets/icons/ui/copy.svg" alt="copy"></a></span>');
  var size = formatSize(app.size);
  if (size) metaParts.push("<span>" + escapeHtml(size) + "</span>");
  var date = formatDate(app.releasedAt);
  if (date) metaParts.push("<span>Released " + escapeHtml(date) + "</span>");
  if (app.minSdk) metaParts.push('<span class="pkg-ok">Android ' + escapeHtml(MIN_SDK_OS[app.minSdk] || ("API " + app.minSdk)) + "+</span>");

  var links = [];
  if (app.sourceUrl) links.push('<a href="' + escapeHtml(app.sourceUrl) + '" target="_blank" rel="noopener"><img class="i i-14" src="assets/icons/ui/code.svg" alt="">Source Code (GitHub)</a>');
  else if (!hasApk && app.playStoreUrl) links.push('<a href="' + escapeHtml(app.playStoreUrl) + '" target="_blank" rel="noopener">Google Play Store <img class="i i-14" src="assets/icons/ui/external.svg" alt=""></a>');
  if (app.playStoreUrl && hasApk) links.push('<a href="' + escapeHtml(app.playStoreUrl) + '" target="_blank" rel="noopener">Google Play</a>');
  else if (hasApk) links.push('<span class="dim">Google Play (N/A — Sideload only)</span>');
  if (!hasApk) links.push('<a href="index.html">All apps</a>');
  if (app.sourceUrl) links.push('<a href="' + escapeHtml(app.sourceUrl.replace(/\/$/, "") + "/issues") + '" target="_blank" rel="noopener"><img class="i i-14" src="assets/icons/ui/bug.svg" alt="">Report Issue</a>');

  var panel;
  if (hasApk) {
    panel =
      '<section class="dl-panel"><div class="dl-row">' +
        '<a class="btn btn-primary" href="' + escapeHtml(app.url) + '"><img class="i i-18" src="assets/icons/ui/download.svg" alt="">Download APK (v' + escapeHtml(app.versionName) + ')</a>' +
        '<button class="btn btn-ghost btn-sm" id="qr-toggle" type="button"><img class="i i-16" src="assets/icons/ui/qr.svg" alt="">Show QR</button>' +
      "</div>" +
      (app.checksum ?
        '<p class="verify-label">SHA-256 Checksum</p>' +
        '<div class="hash-box"><code title="' + escapeHtml(String(app.checksum).replace(/^sha256:/i, "")) + '">' + escapeHtml(shortHash(app.checksum)) + '</code>' +
        '<button class="btn btn-ghost btn-sm" id="copy-hash" type="button"><img class="i i-14" src="assets/icons/ui/copy.svg" alt="">Copy Hash</button></div>'
        : "") +
      '<div id="qr-box" class="qr-box" hidden></div>' +
      '<p class="qr-hint" id="qr-hint" hidden>Scan to download on your phone.</p>' +
      '<div class="link-row">' + links.join("") + "</div></section>";
  } else {
    panel =
      '<section class="dl-panel"><div class="dl-row"><div>' +
        '<p class="verify-label" style="margin:0 0 4px">Official distribution channel</p>' +
        "<p><b>Available on Android via Google Play</b></p>" +
      "</div>" +
      '<a class="btn btn-primary" href="' + escapeHtml(app.playStoreUrl || "#") + '" target="_blank" rel="noopener"><img class="i i-18" src="assets/icons/ui/play-store.svg" alt="">Get it on Google Play</a>' +
      "</div>" +
      '<div class="link-row">' + links.join("") + "</div></section>" +
      (app.notice ?
        '<div class="note-box notice-amber"><img src="assets/icons/ui/lock.svg" alt=""><p>' + escapeHtml(app.notice).replace("support@tasti.id", '<a href="mailto:support@tasti.id">support@tasti.id</a>') + "</p></div>"
        : "");
  }

  var featuresHtml = (app.features || []).map(function (f, i) {
    var icon = icons[i % icons.length];
    var parts = String(f).split(/[.]\s+(?=[A-Z])/);
    var title = parts.shift();
    var desc = parts.join(". ");
    return '<div class="cap-card"><div class="tile"><img src="assets/icons/ui/' + icon + '" alt=""></div>' +
      "<h3>" + escapeHtml(title) + "</h3>" + (desc ? "<p>" + escapeHtml(desc) + "</p>" : "") + "</div>";
  }).join("");

  var shots = (app.screenshots || []).filter(Boolean);
  var shotsHtml = shots.length
    ? '<section class="section" id="shots-section"><div class="section-head"><h2>Interface Previews</h2><span class="side-label">Scroll horizontally →</span></div>' +
      '<div class="shots" id="shots">' + shots.map(function (s) {
        return '<figure class="shot"><img src="' + escapeHtml(resolveAsset(s)) + '" alt="' + escapeHtml(app.name) + ' screenshot" loading="lazy" onerror="shotFailed(this)"></figure>';
      }).join("") + "</div></section>"
    : "";

  var changelogHtml = (app.changelog || []).length
    ? '<section class="section"><div class="rel-head"><h3>What\'s new in v' + escapeHtml(app.versionName) + "</h3>" +
      (date ? '<time>Published ' + escapeHtml(date) + "</time>" : "") + "</div>" +
      '<ul class="rel-list">' + app.changelog.map(function (c) { return "<li>" + escapeHtml(c) + "</li>"; }).join("") + "</ul></section>"
    : "";

  var installHtml = hasApk
    ? '<section class="section"><details class="collapse"><summary><span><b><img src="assets/icons/ui/info.svg" alt="">How to Install Sideloaded APK</b><br><small>Step-by-step guidance for manual Android package deployment</small></span><img src="assets/icons/ui/chevron-down.svg" alt=""></summary>' +
      '<ol class="steps"><li>Tap <b>Download APK</b> (or scan the QR code with your phone).</li><li>Open the downloaded file.</li><li>If prompted, enable <b>"Install unknown apps"</b> for your browser.</li><li>Tap <b>Install</b>.</li></ol></details></section>'
    : '<section class="section"><div class="section-head"><h2>How to Install</h2></div><div class="steps-grid" style="grid-template-columns:repeat(3,1fr)">' +
      '<div class="step-card"><div class="step-num">1</div><h3>Open Store</h3><p>Tap "Get it on Google Play" to open the official Play Store listing.</p></div>' +
      '<div class="step-card"><div class="step-num">2</div><h3>Google Auth</h3><p>Sign in with your Google account if prompted on your Android phone.</p></div>' +
      '<div class="step-card"><div class="step-num">3</div><h3>Install &amp; Launch</h3><p>Tap Install and launch directly from your app drawer once finished.</p></div>' +
      "</div></section>";

  root.innerHTML =
    '<nav class="breadcrumb"><a href="index.html"><img class="i i-14" src="assets/icons/ui/arrow-left.svg" alt="">Back to catalog</a></nav>' +
    '<section class="app-hero"><div class="app-icon-lg"><img src="' + escapeHtml(resolveAsset(app.icon)) + '" alt="' + escapeHtml(app.name) + ' icon" onerror="this.style.display=\'none\'"></div>' +
    '<div class="app-hero-meta"><h1>' + escapeHtml(app.name) + ' <span class="pill">v' + escapeHtml(app.versionName) + "</span></h1>" +
    '<p class="app-tagline">' + escapeHtml(app.tagline || "") + '</p><p class="pkg-line">' + metaParts.join(" <span>·</span> ") + "</p></div></section>" +
    panel +
    (app.description ? '<section class="section"><div class="section-head"><h2>About ' + escapeHtml(app.name) + "</h2></div>" + '<p class="section-sub" style="max-width:75ch">' + escapeHtml(app.description) + "</p></section>" : "") +
    (featuresHtml ? '<section class="section"><div class="section-head"><h2>Key Capabilities</h2></div><div class="cap-grid">' + featuresHtml + "</div></section>" : "") +
    shotsHtml + changelogHtml + '<div id="versions-section"></div>' +
    (!hasApk && !app.repoSlug ? '<section class="section"><div class="note-box"><img src="assets/icons/ui/info.svg" alt=""><p>This app is distributed via the Play Store and updates automatically.</p></div></section>' : "") +
    installHtml;

  var copyPkg = document.getElementById("copy-pkg");
  if (copyPkg && app.package) copyPkg.addEventListener("click", function (e) {
    e.preventDefault();
    if (navigator.clipboard) navigator.clipboard.writeText(app.package).catch(function () {});
  });

  var copyBtn = document.getElementById("copy-hash");
  if (copyBtn && app.checksum) copyBtn.addEventListener("click", function (e) {
    var btn = e.currentTarget;
    var done = function (ok) {
      btn.innerHTML = ok ? "Copied!" : "Failed";
      setTimeout(function () { btn.innerHTML = '<img class="i i-14" src="assets/icons/ui/copy.svg" alt="">Copy Hash'; }, 2000);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(String(app.checksum).replace(/^sha256:/i, "")).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });

  var qrToggle = document.getElementById("qr-toggle");
  if (qrToggle && hasApk) {
    if (!window.QR) { qrToggle.style.display = "none"; }
    var rendered = false;
    qrToggle.addEventListener("click", function () {
      var box = document.getElementById("qr-box");
      var hint = document.getElementById("qr-hint");
      if (!rendered) {
        rendered = true;
        if (window.QR) window.QR.render(box, app.url);
        hint.removeAttribute("hidden");
        qrToggle.innerHTML = '<img class="i i-16" src="assets/icons/ui/qr.svg" alt="">Hide QR';
        return;
      }
      var show = box.hasAttribute("hidden");
      if (show) { box.removeAttribute("hidden"); hint.removeAttribute("hidden"); qrToggle.innerHTML = '<img class="i i-16" src="assets/icons/ui/qr.svg" alt="">Hide QR'; }
      else { box.setAttribute("hidden", ""); hint.setAttribute("hidden", ""); qrToggle.innerHTML = '<img class="i i-16" src="assets/icons/ui/qr.svg" alt="">Show QR'; }
    });
  }

  if (hasApk && app.repoSlug) {
    loadOldVersions(app.repoSlug).then(function (releases) {
      var section = document.getElementById("versions-section");
      if (section && releases) section.innerHTML = oldVersionsHtml(releases, app.versionName);
    });
  }
}

function init() {
  var slug = new URLSearchParams(window.location.search).get("slug");
  var root = document.getElementById("app-root");
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    root.innerHTML = '<p class="loading">App not found. <a href="index.html">Back to catalog</a></p>';
    return;
  }
  fetchJson(DATA_BASE + encodeURIComponent(slug) + ".json").then(function (app) {
    renderDetail(app, slug);
  }).catch(function () {
    root.innerHTML = '<p class="loading">App not found. <a href="index.html">Back to catalog</a></p>';
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
init();

(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.id = "glass";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");

  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0;

  // Pre-rendered droplet sprite (highlight top-left + faint rim).
  function makeSprite(size) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var g = c.getContext("2d");
    var r = size / 2;
    var base = g.createRadialGradient(r, r, r * 0.1, r, r, r);
    base.addColorStop(0, "rgba(190, 240, 230, 0.05)");
    base.addColorStop(0.75, "rgba(150, 220, 210, 0.10)");
    base.addColorStop(0.92, "rgba(200, 245, 238, 0.22)");
    base.addColorStop(1, "rgba(200, 245, 238, 0)");
    g.fillStyle = base;
    g.beginPath();
    g.arc(r, r, r, 0, Math.PI * 2);
    g.fill();
    var hl = g.createRadialGradient(r * 0.68, r * 0.62, 0, r * 0.68, r * 0.62, r * 0.42);
    hl.addColorStop(0, "rgba(240, 255, 252, 0.85)");
    hl.addColorStop(1, "rgba(240, 255, 252, 0)");
    g.fillStyle = hl;
    g.beginPath();
    g.arc(r * 0.68, r * 0.62, r * 0.42, 0, Math.PI * 2);
    g.fill();
    return c;
  }
  var sprite = makeSprite(64);

  var statics = [];
  var runners = [];
  var trails = [];

  function build() {
    W = Math.floor(window.innerWidth * DPR);
    H = Math.floor(window.innerHeight * DPR);
    canvas.width = W;
    canvas.height = H;
    var area = window.innerWidth * window.innerHeight;
    var nStatic = Math.max(60, Math.min(150, Math.floor(area / 11000)));
    statics = [];
    for (var i = 0; i < nStatic; i++) {
      statics.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (0.8 + Math.random() * 2.2) * DPR,
        a: 0.10 + Math.random() * 0.18,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.2 + Math.random() * 0.5
      });
    }
    runners = [];
    var nRun = Math.max(3, Math.min(7, Math.floor(area / 220000)));
    for (var j = 0; j < nRun; j++) spawnRunner(true);
    trails = [];
  }

  function spawnRunner(anywhere) {
    runners.push({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -30 * DPR,
      r: (2.2 + Math.random() * 2.4) * DPR,
      speed: (0.5 + Math.random() * 0.7) * DPR,
      wob: Math.random() * Math.PI * 2,
      wobSpeed: 0.008 + Math.random() * 0.012,
      wobAmp: (6 + Math.random() * 10) * DPR,
      life: 0
    });
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, W, H);
    var i, d, tw;
    for (i = 0; i < statics.length; i++) {
      d = statics[i];
      tw = reduceMotion ? 0 : Math.sin(t / 1000 * d.twSpeed + d.tw) * 0.05;
      ctx.globalAlpha = Math.max(0.04, d.a + tw);
      var s = d.r * 2;
      ctx.drawImage(sprite, d.x - d.r, d.y - d.r, s, s);
    }
    // fading trails
    for (i = trails.length - 1; i >= 0; i--) {
      var tr = trails[i];
      tr.age += 16;
      var k = 1 - tr.age / 2200;
      if (k <= 0) { trails.splice(i, 1); continue; }
      ctx.globalAlpha = 0.16 * k;
      ctx.drawImage(sprite, tr.x - tr.r, tr.y - tr.r, tr.r * 2, tr.r * 5);
    }
    ctx.globalAlpha = 1;
  }

  function step(t) {
    drawFrame(t);
    if (reduceMotion) return; // single static frame
    for (var i = 0; i < runners.length; i++) {
      var r = runners[i];
      r.life += 16;
      r.wob += r.wobSpeed * 16;
      r.y += r.speed * 2.4;
      r.x += Math.sin(r.wob) * r.wobAmp * 0.02;
      if (trails.length < 240 && (r.life % 96) < 16) {
        trails.push({ x: r.x, y: r.y, r: r.r * 0.8, age: 0 });
      }
      if (r.y - r.r * 4 > H) {
        runners.splice(i, 1);
        i--;
        setTimeout(spawnRunner, 1500 + Math.random() * 4000);
      }
    }
    for (var j = 0; j < runners.length; j++) {
      var q = runners[j];
      ctx.globalAlpha = 0.5;
      ctx.drawImage(sprite, q.x - q.r * 1.6, q.y - q.r * 1.6, q.r * 3.2, q.r * 3.2);
    }
    ctx.globalAlpha = 1;
  }

  var running = true;
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running && !reduceMotion) requestAnimationFrame(loop);
  });

  var resizeT = null;
  window.addEventListener("resize", function () {
    if (resizeT) clearTimeout(resizeT);
    resizeT = setTimeout(build, 200);
  });

  function loop(t) {
    if (!running) return;
    step(t || 0);
    if (!reduceMotion) requestAnimationFrame(loop);
  }

  build();
  if (reduceMotion) drawFrame(0);
  else requestAnimationFrame(loop);
})();

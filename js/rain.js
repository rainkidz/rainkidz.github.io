(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.createElement("canvas");
  canvas.id = "rain";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");

  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0, drops = [];
  var SLANT = 0.18; // ~10deg drift

  function build() {
    W = Math.floor(window.innerWidth * DPR);
    H = Math.floor(window.innerHeight * DPR);
    canvas.width = W;
    canvas.height = H;
    var count = Math.max(40, Math.min(110, Math.floor((window.innerWidth * window.innerHeight) / 16000)));
    drops = [];
    for (var i = 0; i < count; i++) {
      var far = Math.random() < 0.55;
      drops.push({
        x: Math.random() * (W + 200 * DPR),
        y: Math.random() * H,
        len: (far ? 9 + Math.random() * 10 : 18 + Math.random() * 22) * DPR,
        speed: (far ? 0.55 + Math.random() * 0.5 : 1.0 + Math.random() * 0.9) * DPR,
        alpha: far ? 0.10 + Math.random() * 0.10 : 0.18 + Math.random() * 0.14,
        wob: Math.random() * Math.PI * 2,
        wobSpeed: 0.002 + Math.random() * 0.004
      });
    }
  }

  var running = true;
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  var resizeT = null;
  window.addEventListener("resize", function () {
    if (resizeT) clearTimeout(resizeT);
    resizeT = setTimeout(build, 200);
  });

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = DPR;
    ctx.lineCap = "round";
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.wob += d.wobSpeed * 16;
      var sway = Math.sin(d.wob) * DPR;
      d.y += d.speed * 2.2;
      d.x += d.speed * 2.2 * SLANT + sway * 0.1;
      if (d.y - d.len > H) {
        d.y = -d.len - Math.random() * 40 * DPR;
        d.x = Math.random() * (W + 200 * DPR);
      }
      if (d.x > W + 60 * DPR) d.x = -40 * DPR;
      ctx.strokeStyle = "rgba(150, 220, 210, " + d.alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * SLANT, d.y - d.len);
      ctx.stroke();
    }
    requestAnimationFrame(frame);
  }

  build();
  requestAnimationFrame(frame);
})();

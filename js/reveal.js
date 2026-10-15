(function () {
  document.documentElement.classList.add("js");

  function revealAll(root) {
    var els = Array.prototype.slice.call((root || document).querySelectorAll("[data-reveal]:not(.in)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.addEventListener("DOMContentLoaded", function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
        el.classList.add("in");
      });
    });
    window.__revealScan = function () {};
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { revealAll(document); });
  } else {
    revealAll(document);
  }
  window.__revealScan = revealAll;
})();

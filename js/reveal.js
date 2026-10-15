(function () {
  document.documentElement.classList.add("js", "reveal");

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

  function revealEverything() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-reveal]:not(.in)"), function (el) {
      el.classList.add("in");
    });
  }

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.addEventListener("DOMContentLoaded", revealEverything);
    window.__revealScan = function () {};
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { revealAll(document); });
  } else {
    revealAll(document);
  }
  // Safety net: never leave content hidden (e.g. observer never fires).
  setTimeout(revealEverything, 2500);
  window.__revealScan = revealAll;
})();

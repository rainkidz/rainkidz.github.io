document.getElementById("year").textContent = new Date().getFullYear();

(function () {
  var input = document.getElementById("faq-filter");
  var empty = document.getElementById("faq-empty");
  if (!input) return;
  var items = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
  var groups = Array.prototype.slice.call(document.querySelectorAll("[data-group]"));

  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    var visible = 0;
    items.forEach(function (item) {
      var hit = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
      item.classList.toggle("hidden", !hit);
      if (hit) { visible++; item.open = !!q; }
    });
    groups.forEach(function (g) {
      var anyVisible = Array.prototype.some.call(g.querySelectorAll(".faq-item"), function (el) {
        return !el.classList.contains("hidden");
      });
      g.classList.toggle("hidden", !anyVisible);
    });
    if (empty) empty.classList.toggle("hidden", visible !== 0);
  });
})();

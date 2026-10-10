/* סקריפט משותף: פס טעינה בלחיצה על קישור פנימי */
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (a.getAttribute('href').charAt(0) === '#' || a.origin !== location.origin) return;
    document.body.classList.add('leaving');
  });
  window.addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });
})();

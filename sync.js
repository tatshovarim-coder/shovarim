/* סנכרון משותף בין כל המשתמשים באמצעות Firebase Realtime Database.
   אם ההגדרות לא מולאו או שאין חיבור - האתר ממשיך לעבוד מקומית בדפדפן כמו קודם. */
(function () {
  var cfg = window.FIREBASE_CONFIG || {};
  var configured = !!(cfg.apiKey && cfg.databaseURL) && String(cfg.apiKey).indexOf('PASTE') < 0 && String(cfg.databaseURL).indexOf('PASTE') < 0;
  var needLogin = !!window.FIREBASE_REQUIRE_LOGIN;
  var V = '10.12.2', BASE = 'https://www.gstatic.com/firebasejs/' + V + '/';
  var db = null, badge = null;

  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res;
      s.onerror = function () { rej(new Error('load failed: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function mkBadge() {
    badge = document.createElement('div');
    badge.setAttribute('dir', 'rtl');
    badge.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:998;font:500 12px Heebo,Arial,sans-serif;background:#fff;color:#64748b;border:1px solid #e2e8f0;border-radius:99px;padding:4px 12px;box-shadow:0 4px 12px #0f172a14;display:flex;align-items:center;gap:6px;pointer-events:none';
    badge.innerHTML = '<i style="width:8px;height:8px;border-radius:50%;background:#f59e0b;display:inline-block"></i><span>מתחבר…</span>';
    document.body.appendChild(badge);
  }
  function setBadge(ok) {
    if (!badge) return;
    badge.firstChild.style.background = ok ? '#16a34a' : '#f59e0b';
    badge.lastChild.textContent = ok ? 'מסונכרן' : 'לא מחובר – שומר מקומית';
  }

  function loginGate() {
    return new Promise(function (resolve) {
      var auth = firebase.auth();
      var unsub = auth.onAuthStateChanged(function (u) {
        if (u) { unsub(); var o = document.getElementById('ysync-login'); if (o) o.remove(); resolve(true); return; }
        if (document.getElementById('ysync-login')) return;
        var o = document.createElement('div');
        o.id = 'ysync-login'; o.setAttribute('dir', 'rtl');
        o.style.cssText = 'position:fixed;inset:0;z-index:2000;background:#0f172acc;display:grid;place-items:center;font-family:Heebo,Arial,sans-serif';
        o.innerHTML = '<div style="background:#fff;border-radius:18px;padding:26px;width:min(340px,92vw);box-shadow:0 20px 60px #0004">' +
          '<h3 style="margin:0 0 4px;font-size:20px">כניסה</h3><p style="margin:0 0 14px;color:#64748b;font-size:14px">הזינו את פרטי הכניסה המשותפים</p>' +
          '<input id="ysE" type="email" placeholder="מייל" autocomplete="username" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:10px;font:inherit;direction:ltr">' +
          '<input id="ysP" type="password" placeholder="סיסמה" autocomplete="current-password" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:10px;font:inherit;direction:ltr">' +
          '<div id="ysM" style="color:#dc2626;font-size:13px;min-height:18px"></div>' +
          '<button id="ysB" style="width:100%;padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font:700 15px inherit;cursor:pointer">כניסה</button></div>';
        document.body.appendChild(o);
        var go = function () {
          var m = document.getElementById('ysM'); m.textContent = '';
          auth.signInWithEmailAndPassword(document.getElementById('ysE').value.trim(), document.getElementById('ysP').value)
            .catch(function () { m.textContent = 'מייל או סיסמה שגויים'; });
        };
        document.getElementById('ysB').onclick = go;
        o.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      });
    });
  }

  var ready;
  if (!configured) {
    ready = Promise.resolve(false);
  } else {
    ready = load(BASE + 'firebase-app-compat.js')
      .then(function () { return load(BASE + 'firebase-database-compat.js'); })
      .then(function () { return needLogin ? load(BASE + 'firebase-auth-compat.js') : 0; })
      .then(function () { firebase.initializeApp(cfg); db = firebase.database(); return needLogin ? loginGate() : true; })
      .then(function (ok) {
        var start = function () {
          mkBadge();
          db.ref('.info/connected').on('value', function (s) { setBadge(!!s.val()); });
        };
        if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
        return ok;
      })
      .catch(function (e) { console.warn('Firebase sync disabled:', e); return false; });
  }

  window.YSync = {
    ready: ready,
    set: function (p, v) { return db.ref(p).set(v); },
    update: function (p, o) { return db.ref(p).update(o); },
    onValue: function (p, cb) { db.ref(p).on('value', function (s) { cb(s.val()); }, function (e) { console.warn(e); }); }
  };
})();

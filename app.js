/* Undangan publik — vanilla JS. Data dari Supabase (settings) + RPC. */
(function () {
'use strict';
var CF = window.CONFIG || {}, KEY = CF.SUPABASE_ANON_KEY || '';
var Q = new URLSearchParams(location.search), PREV = Q.get('preview') === '1';
var CODE = (Q.get('to') || '').replace(/[^a-z0-9-]/gi, '').slice(0, 60);
var G = { name: 'Tamu Undangan', max: 50, ok: false }; // data tamu dari ?to=
var C, aud, ti = 0, on = false, att = null, cnt = 1;

var D = window.DEFAULT_CONTENT; // dari default.js

/* ---------- Helper ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
function url(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? esc(u) : '#'; }
function cssu(u) { return /^https?:\/\//i.test(u || '') ? 'url(' + JSON.stringify(u) + ')' : ''; }
function cssa(u) { return esc(cssu(u)); } // untuk dipakai di dalam atribut style="..."
function col(c) { return /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#cccccc'; }
function $(s) { return document.querySelector(s); }
function toast(m, bad) { var t = $('#toast'); t.textContent = m; t.className = 'show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 3200); }
function sec(t) { return C.sections.filter(function (s) { return s.type === t && s.enabled !== false; })[0]; }
function api(path, o) {
  o = o || {}; o.headers = { apikey: KEY, 'Content-Type': 'application/json' };
  if (KEY.indexOf('sb_') !== 0) o.headers.Authorization = 'Bearer ' + KEY;
  return fetch(CF.SUPABASE_URL + '/rest/v1/' + path, o).then(function (r) {
    return r.text().then(function (t) { if (!r.ok) throw new Error(t); return t ? JSON.parse(t) : null; });
  });
}
function rpc(n, a) { return api('rpc/' + n, { method: 'POST', body: JSON.stringify(a || {}) }); }
function fl(n) { // bunga SVG placeholder
  return '<svg class="fw" width="' + n + '" height="' + n + '" viewBox="0 0 100 100"><g fill="#c98a9a" opacity=".9"><circle cx="50" cy="26" r="18"/><circle cx="74" cy="44" r="18"/><circle cx="65" cy="72" r="18"/><circle cx="35" cy="72" r="18"/><circle cx="26" cy="44" r="18"/></g><circle cx="50" cy="52" r="12" fill="#f3ede4"/></svg>';
}
function frame() { // bingkai oval timbul dengan ornamen bunga (SVG)
  var pet = function (x, y, k) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><g fill="#c98a9a"><circle cy="-13" r="9"/><circle cx="12" cy="-4" r="9"/><circle cx="8" cy="11" r="9"/><circle cx="-8" cy="11" r="9"/><circle cx="-12" cy="-4" r="9"/></g><circle r="6" fill="#f3ede4"/></g>'; };
  var lf = function (x, y, r) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="15" ry="5" transform="rotate(' + r + ' ' + x + ' ' + y + ')" style="fill:var(--s)" opacity=".7"/>'; };
  return '<svg class="fr" viewBox="0 0 400 520" aria-hidden="true"><defs><radialGradient id="ovg" cx="50%" cy="45%" r="65%"><stop offset="0" style="stop-color:#fff"/><stop offset="1" style="stop-color:var(--cd)"/></radialGradient></defs>' +
    '<ellipse cx="200" cy="260" rx="192" ry="252" fill="url(#ovg)" style="stroke:var(--s)" stroke-width="1.6"/>' +
    '<ellipse cx="198.5" cy="258.5" rx="178" ry="238" fill="none" stroke="#fff" stroke-width="2" opacity=".95"/>' +
    '<ellipse cx="201.5" cy="261.5" rx="178" ry="238" fill="none" style="stroke:var(--p)" stroke-width="1.5" opacity=".16"/>' +
    '<ellipse cx="200" cy="260" rx="178" ry="238" fill="none" style="stroke:var(--s)" stroke-width="1"/>' +
    '<ellipse cx="200" cy="260" rx="167" ry="227" fill="none" style="stroke:var(--s)" stroke-width="2.4" stroke-dasharray="0.1 7" stroke-linecap="round"/>' +
    lf(170, 16, -18) + lf(230, 16, 18) + lf(154, 26, -34) + lf(246, 26, 34) + pet(200, 8, 1.15) +
    lf(170, 504, 18) + lf(230, 504, -18) + lf(154, 494, 34) + lf(246, 494, -34) + pet(200, 512, 1.15) +
    pet(16, 260, .6) + pet(384, 260, .6) + pet(64, 82, .5) + pet(336, 82, .5) + pet(64, 438, .5) + pet(336, 438, .5) + '</svg>';
}
function names() { var c = sec('couple'); return c ? [c.data.groom || '', c.data.bride || ''] : ['', '']; }

/* ---------- Render tiap jenis bagian ---------- */
var R = {
  couple: function (d) {
    var f = C.theme.assets.ovalFrame, st = f ? ' style="background-image:' + cssa(f) + '"' : '';
    return '<div class="oval' + (f ? ' img' : '') + '"' + st + '>' + (f ? '' : frame()) + '<div class="oc"><p class="ey">' + esc(d.intro) + '</p><h1 class="sc">' + esc(d.groom) + '<span>&amp;</span>' + esc(d.bride) + '</h1><i class="dv"></i><p><b>' + esc(d.date) + '</b></p><p>' + esc(d.place) + '</p></div></div>';
  },
  polaroid: function (d) {
    return (d.photos || []).slice(0, 2).map(function (p) {
      var st = p.url ? ' style="background-image:' + cssa(p.url) + '"' : '';
      return '<div class="pol" data-lb><div class="im"' + st + '></div>' + esc(p.caption) + '</div>';
    }).join('') + '<h2 class="sc" style="margin-top:20px">Our Love Story</h2>' + (d.linkText ? '<button class="btn o" data-lb>' + esc(d.linkText) + '</button>' : '');
  },
  events: function (d) {
    var m = d.moreDetails || {};
    return '<div class="card">' + (d.items || []).map(function (e) {
      return '<div class="ev"><h3>' + esc(e.title) + '</h3><p><b>' + esc(e.venue) + '</b></p><p>' + nl(e.desc) + '</p><p class="tm">' + esc(e.time) + '</p>' +
        (e.mapUrl ? '<a class="btn" target="_blank" rel="noopener" href="' + url(e.mapUrl) + '">Get Direction</a>' : '') + '</div>';
    }).join('') + (m.label ? '<button class="rib" data-more>' + esc(m.label) + '</button><p class="more" hidden>' + nl(m.text) + '</p>' : '') +
      '<button class="btn o" data-ics>Tambahkan ke kalender</button></div>';
  },
  dresscode: function (d) {
    return '<div class="card"><h2 class="sc">' + esc(d.title) + '</h2><p>' + nl(d.text) + '</p><div class="sw">' +
      (d.colors || []).map(function (c) { return '<i style="background:' + col(c) + '"></i>'; }).join('') + '</div></div>';
  },
  countdown: function () {
    var l = ['Hari', 'Jam', 'Menit', 'Detik'];
    return '<h2 class="sc">Menuju Hari Bahagia</h2><div class="cd" id="cd">' + l.map(function (x, i) { return '<div><b id="cd' + i + '">0</b><small>' + x + '</small></div>'; }).join('') + '</div>';
  },
  registry: function (d) {
    return '<div class="card"><svg class="qf" viewBox="0 0 100 100"><g fill="#f3ede4"><circle cx="50" cy="27" r="24"/><circle cx="73" cy="50" r="24"/><circle cx="50" cy="73" r="24"/><circle cx="27" cy="50" r="24"/><rect x="27" y="27" width="46" height="46"/></g></svg><h2 class="sc">' + esc(d.title) + '</h2><p>' + nl(d.text) + '</p>' +
      (d.buttons || []).map(function (b) {
        if (b.accountNo) return '<div class="acc"><b>' + esc(b.label) + '</b><br>' + esc(b.bank) + ' ' + esc(b.accountNo) + '<br>a.n. ' + esc(b.accountName) + '<br><button class="btn o" data-copy="' + esc(b.accountNo) + '">Salin No. Rekening</button></div>';
        return '<a class="btn" target="_blank" rel="noopener" href="' + url(b.url) + '">' + esc(b.label) + '</a>';
      }).join('') + '</div>';
  },
  rsvp: function (d) {
    var mx = Math.min(d.maxGuests || 8, G.ok ? G.max : 50), b = '', i;
    for (i = 1; i <= mx; i++) b += '<button class="cnt' + (i === 1 ? ' on' : '') + '" data-n="' + i + '">' + i + '</button>';
    var q = (d.questions || []).map(function (x) {
      return '<label>' + esc(x.label) + (x.required ? ' *' : '') + '</label><input data-q="' + esc(x.key) + '"' + (x.required ? ' data-r="1"' : '') + ' maxlength="200">';
    }).join('');
    return '<div class="card"><h2 class="sc">' + esc(d.title || 'Kindly RSVP') + '</h2><p>Mohon konfirmasi kehadiran Anda.</p><div class="fm">' +
      '<label>Nama lengkap</label><input id="f-n" maxlength="100" value="' + (G.ok ? esc(G.name) : '') + '">' +
      '<label>No. HP</label><input id="f-p" type="tel" maxlength="20">' +
      '<label>Apakah Anda akan hadir?</label><div class="row"><button class="att" data-a="1">❤ Saya hadir</button><button class="att" data-a="0">💔 Maaf, tidak bisa</button></div>' +
      '<div id="cw" hidden><label>Jumlah tamu</label>' + b + '</div>' + q +
      '<label>Pesan & doa</label><textarea id="f-m" rows="3" maxlength="500"></textarea>' +
      '<p style="text-align:center"><button class="btn" id="send">Kirim konfirmasi</button></p></div></div>';
  },
  wishes: function () { return '<h2 class="sc">Ucapan & Doa</h2><div id="wl"></div>'; },
  footer: function (d) { var n = names(); return '<p>' + nl(d.text) + '</p><h2 class="sc">' + esc(n[0]) + ' &amp; ' + esc(n[1]) + '</h2>'; },
  /* jenis tambahan yang bisa ditambah admin */
  text: function (d) { return '<h2 class="sc">' + esc(d.title) + '</h2><p>' + nl(d.text) + '</p>'; },
  image: function (d) { return '<img src="' + url(d.url) + '" alt="' + esc(d.caption) + '" loading="lazy" style="max-width:100%;border-radius:16px"><p>' + esc(d.caption) + '</p>'; },
  gallery: function (d) {
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + (d.images || []).map(function (u) { u = u.url || u; return '<img src="' + url(u) + '" loading="lazy" alt="" style="width:100%;border-radius:12px">'; }).join('') + '</div>';
  },
  video: function (d) {
    var m = String(d.url || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return m ? '<iframe src="https://www.youtube-nocookie.com/embed/' + m[1] + '" style="width:100%;aspect-ratio:16/9;border:0;border-radius:16px" allowfullscreen loading="lazy"></iframe>' : '';
  },
  quote: function (d) { return '<h3><i>“' + esc(d.text) + '”</i></h3><p>' + esc(d.by) + '</p>'; },
  buttons: function (d) { return (d.buttons || []).map(function (b) { return '<a class="btn" target="_blank" rel="noopener" href="' + url(b.url) + '">' + esc(b.label) + '</a>'; }).join(''); },
  html: function (d) { return '<p>' + nl(d.text) + '</p>'; }
};

/* ---------- Musik ---------- */
function tr() { return ((C.music || {}).tracks || []).filter(function (t) { return t.url; }); }
function load(i) { var t = tr(); if (!t.length) return; ti = (i + t.length) % t.length; aud.src = t[ti].url; var e = $('#mt'); if (e) e.textContent = t[ti].title || 'Lagu ' + (ti + 1); }
function play() { if (aud) aud.play().then(function () { on = true; ui(); }).catch(function () {}); }
function stop() { aud.pause(); on = false; ui(); }
function ui() { var v = $('#vin'), b = $('[data-m=t]'); if (v) v.classList.toggle('spin', on); if (b) b.textContent = on ? '⏸' : '▶'; $('#mus').textContent = on ? '🔊' : '🔇'; }
function player() {
  if (!(C.music || {}).enabled || !tr().length) return '';
  return '<section class="sec rv"><div class="card mp"><div class="vin" id="vin"></div><div><small>Sedang diputar</small><h3 id="mt"></h3><button class="ib" data-m="p" aria-label="Sebelumnya">⏮</button><button class="ib" data-m="t" aria-label="Putar">▶</button><button class="ib" data-m="n" aria-label="Berikutnya">⏭</button></div></div></section>';
}

/* ---------- Countdown, kalender, RSVP ---------- */
function tick() {
  var t = sec('countdown'); if (!t || !$('#cd0')) return;
  var ms = new Date(t.data.targetISO) - Date.now(); if (isNaN(ms)) return;
  if (ms <= 0) { $('#cd').innerHTML = '<p class="sc" style="font-size:2rem;grid-column:1/-1">Hari bahagia telah tiba</p>'; return; }
  var s = Math.floor(ms / 1000), v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
  v.forEach(function (x, i) { $('#cd' + i).textContent = i ? ('0' + x).slice(-2) : x; });
}
function ics() { // unduh file .ics
  var t = sec('countdown'), st = new Date((t && t.data.targetISO) || Date.now()), en = new Date(+st + 3 * 36e5), n = names(), ev = sec('events');
  var f = function (d) { return d.toISOString().replace(/[-:]|\.\d{3}/g, ''); };
  var loc = ev && ev.data.items && ev.data.items[0] ? ev.data.items[0].venue : '';
  var txt = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:' + f(st) + '\r\nDTEND:' + f(en) + '\r\nSUMMARY:Pernikahan ' + n[0] + ' & ' + n[1] + '\r\nLOCATION:' + loc + '\r\nEND:VEVENT\r\nEND:VCALENDAR';
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = 'undangan.ics'; a.click();
}
function wishes() {
  if (!$('#wl')) return;
  rpc('get_wishes').then(function (r) {
    $('#wl').innerHTML = (r || []).map(function (w) {
      return '<div class="wi"><b>' + esc(w.full_name) + '</b><br>' + nl(w.message) + '<br><small>' + new Date(w.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + '</small></div>';
    }).join('') || '<p><small>Jadilah yang pertama memberi ucapan.</small></p>';
  }).catch(function () {});
}
function send() {
  var d = sec('rsvp').data, n = $('#f-n').value.trim(), K = 'rsvp_' + (CODE || 'umum');
  if (!n) return toast('Nama wajib diisi', 1);
  if (att === null) return toast('Pilih kehadiran Anda', 1);
  var ans = {}, bad = false;
  document.querySelectorAll('[data-q]').forEach(function (i) { var v = i.value.trim(); if (i.dataset.r && !v) bad = true; ans[i.dataset.q] = v; });
  if (bad) return toast('Lengkapi kolom bertanda *', 1);
  if (PREV) return toast('Mode pratinjau: tidak dikirim');
  var b = $('#send'); b.disabled = true;
  rpc('submit_rsvp', { p_code: CODE, p_name: n, p_phone: $('#f-p').value.trim(), p_attending: att, p_count: att ? cnt : 0, p_message: $('#f-m').value.trim(), p_answers: ans })
    .then(function () { try { localStorage.setItem(K, '1'); } catch (e) {} toast(d.successMessage || 'Terima kasih!'); b.textContent = 'Terkirim ✓'; wishes(); })
    .catch(function () { b.disabled = false; toast('Gagal mengirim, coba lagi', 1); });
}
function lb() { // galeri/cerita
  var s = sec('polaroid'), h = '', d = s ? s.data : {};
  (d.photos || []).forEach(function (p) { if (p.url) h += '<img src="' + url(p.url) + '" alt="">'; h += '<p>' + esc(p.caption) + '</p>'; });
  (d.gallery || []).forEach(function (g) { h += '<img src="' + url(g.url || g) + '" alt="">'; });
  var e = document.createElement('div'); e.id = 'lb'; e.innerHTML = h + '<p><small>Ketuk untuk menutup</small></p>'; document.body.appendChild(e);
}

/* ---------- Bangun halaman ---------- */
function start(c) {
  C = c; C.theme = C.theme || D.theme; C.theme.assets = C.theme.assets || {}; C.sections = C.sections || [];
  var t = C.theme, co = t.colors || {}, fo = t.fonts || {}, as = t.assets, r = document.documentElement.style;
  [['--p', co.primary], ['--s', co.secondary], ['--a', co.accent], ['--bg', co.bg], ['--cd', co.card], ['--tx', co.text]].forEach(function (x) { if (x[1]) r.setProperty(x[0], x[1]); });
  var fn = function (n) { return String(n || '').replace(/[^\w ]/g, ''); }, fam = [];
  [['--fs', fo.script], ['--fh', fo.heading], ['--fb', fo.body]].forEach(function (x) { if (fn(x[1])) { r.setProperty(x[0], '"' + fn(x[1]) + '"'); fam.push('family=' + fn(x[1]).replace(/ /g, '+')); } });
  if (fam.length) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?' + fam.join('&') + '&display=swap'; document.head.appendChild(l); }
  var m = C.meta || {}; if (m.title) document.title = m.title;
  if (m.description) document.querySelector('meta[name=description]').content = m.description;

  var n = names(), cv = sec('cover'), h = '';
  if (cv) {
    var seal = as.waxSeal ? '<img src="' + url(as.waxSeal) + '" alt="">' : esc((n[0][0] || '') + (n[1][0] || ''));
    h += '<div id="cover"><div><p>Undangan Pernikahan</p><h1 class="sc">' + esc(n[0]) + ' &amp; ' + esc(n[1]) + '</h1><p>Kepada Yth.</p><h3>' + esc(G.name) + '</h3>' +
      '<div class="env" id="env"' + (as.envelope ? ' style="background-image:' + cssa(as.envelope) + '"' : '') + '><div class="bd"></div><div class="fi">' + fl(70) + '</div><div class="flp"></div><div class="seal">' + seal + '</div></div>' +
      '<button class="btn" id="open">Buka Undangan</button></div></div>';
  }
  var bg = C.background || D.background || {}, ov = parseFloat(bg.overlay); ov = isNaN(ov) ? .55 : Math.max(0, Math.min(1, ov));
  if (bg.type === 'image' && /^https?:\/\//i.test(bg.imageUrl || '')) h += '<div id="bgl" style="background-image:' + cssa(bg.imageUrl) + '"><div class="bgo" style="opacity:' + ov + '"></div></div>';
  else if (bg.type === 'video' && /^https?:\/\//i.test(bg.videoUrl || '')) h += '<div id="bgl"><video src="' + url(bg.videoUrl) + '" autoplay muted loop playsinline preload="auto"></video><div class="bgo" style="opacity:' + ov + '"></div></div>';
  var it = C.intro || D.intro || {}, cp = sec('couple'), introOn = it.enabled === true;
  if (introOn) {
    h += '<div id="intro">' + (/^https?:\/\//i.test(it.videoUrl || '') ? '<video id="iv" src="' + url(it.videoUrl) + '" playsinline preload="auto"></video>' :
      '<div class="ia"><small>Kami mengundang Anda</small><h1 class="sc">Save the Date</h1><i class="dv"></i><p>' + esc(cp ? cp.data.date : '') + '</p></div>') +
      (it.showSkip !== false ? '<button id="skip" hidden>Lewati ›</button>' : '') + '</div>';
  }
  h += as.flowersTopLeft ? '<img class="dc tl" alt="" src="' + url(as.flowersTopLeft) + '">' : '<div class="dc tl">' + fl(150) + '</div>';
  h += as.flowersBottomRight ? '<img class="dc br" alt="" src="' + url(as.flowersBottomRight) + '">' : '<div class="dc br">' + fl(150) + '</div>';
  C.sections.forEach(function (s) {
    if (s.enabled === false || s.type === 'cover' || !R[s.type]) return;
    h += '<section class="sec rv t-' + esc(s.type) + '" id="' + esc(s.id) + '">' + R[s.type](s.data || {}) + '</section>';
    if (s.type === 'couple') h += player();
  });
  var app = $('#app'); app.innerHTML = h;
  if (as.pageBackground) app.style.backgroundImage = cssu(as.pageBackground);

  if (tr().length) { aud = new Audio(); aud.preload = 'none'; aud.loop = tr().length === 1; aud.onended = function () { load(ti + 1); play(); }; load(0); $('#mus').hidden = false; }
  tick(); setInterval(tick, 1000); wishes();
  try { if (localStorage.getItem('rsvp_' + (CODE || 'umum')) && $('#send')) { $('#send').disabled = true; $('#send').textContent = 'Sudah terkirim ✓'; } } catch (e) {}

  var autoplay = (C.music || {}).autoplay !== false, revealed = false;
  function watch() { // animasi muncul saat di-scroll
    var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 }) : null;
    document.querySelectorAll('.rv').forEach(function (e) { io ? io.observe(e) : e.classList.add('in'); });
  }
  function reveal() { // tampilkan undangan (setelah intro selesai)
    if (revealed) return; revealed = true;
    var i = $('#intro'); if (i) { i.classList.add('gone'); var v = $('#iv'); if (v) v.pause(); setTimeout(function () { i.remove(); }, 1100); }
    document.body.classList.remove('lk'); window.scrollTo(0, 0); setTimeout(watch, 150);
    if (aud && autoplay) play();
  }
  function startIntro() { // putar video / animasi pembuka
    var i = $('#intro'), v = $('#iv'), sk = $('#skip'); i.classList.add('go');
    if (sk) { sk.onclick = reveal; setTimeout(function () { sk.hidden = false; }, 2500); }
    if (v) {
      v.onended = reveal; v.onerror = reveal;
      v.play().catch(function () { v.muted = true; return v.play(); }).catch(reveal);
      setTimeout(function () { if (!v.currentTime) reveal(); }, 10000); // video gagal mulai: jangan menahan tamu
    } else setTimeout(reveal, 5600);
  }
  var bv = $('#bgl video'); if (bv) { bv.muted = true; bv.play().catch(function () {}); }
  if (cv) {
    $('#open').onclick = function () {
      this.disabled = true; $('#env').classList.add('op');
      if (CODE && !PREV) rpc('mark_opened', { p_code: CODE }).catch(function () {});
      if (introOn) startIntro(); // dimulai saat ketukan tamu agar video bersuara boleh diputar
      setTimeout(function () {
        $('#cover').classList.add('gone');
        if (!introOn) reveal();
        setTimeout(function () { var c = $('#cover'); if (c) c.remove(); }, 1100);
      }, 900);
    };
  } else {
    if (introOn) startIntro(); else reveal();
    if (CODE && !PREV) rpc('mark_opened', { p_code: CODE }).catch(function () {});
    document.addEventListener('click', function f() { if (aud && autoplay && !on) play(); document.removeEventListener('click', f); });
  }
}

/* ---------- Satu pendengar klik untuk semua tombol ---------- */
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-m],[data-copy],[data-ics],[data-more],[data-lb],.att,.cnt,#send,#mus,#lb');
  if (!t) return;
  if (t.dataset.m) { var k = t.dataset.m; if (k === 't') { on ? stop() : play(); } else { load(ti + (k === 'p' ? -1 : 1)); if (on) play(); } }
  else if (t.id === 'mus') { on ? stop() : play(); }
  else if (t.dataset.copy) { (navigator.clipboard ? navigator.clipboard.writeText(t.dataset.copy) : Promise.reject()).then(function () { toast('Nomor rekening disalin'); }).catch(function () { toast('Gagal menyalin, salin manual', 1); }); }
  else if (t.hasAttribute('data-ics')) ics();
  else if (t.hasAttribute('data-more')) t.nextElementSibling.hidden = !t.nextElementSibling.hidden;
  else if (t.hasAttribute('data-lb')) lb();
  else if (t.classList.contains('att')) { att = t.dataset.a === '1'; document.querySelectorAll('.att').forEach(function (x) { x.classList.toggle('on', x === t); }); $('#cw').hidden = !att; }
  else if (t.classList.contains('cnt')) { cnt = +t.dataset.n; document.querySelectorAll('.cnt').forEach(function (x) { x.classList.toggle('on', x === t); }); }
  else if (t.id === 'send') send();
  else if (t.id === 'lb') t.remove();
});

/* ---------- Mulai: ambil konten + data tamu ---------- */
var cached = null;
try { cached = JSON.parse(localStorage.getItem('inv_c')); } catch (e) {}
var gp = CODE ? rpc('get_guest', { p_code: CODE }).then(function (r) { if (r && r[0]) { G.name = r[0].name; G.max = r[0].max_guests || 50; G.ok = true; } }).catch(function () {}) : Promise.resolve();
var fresh = api('settings?id=eq.1&select=content').then(function (r) {
  var c = r && r[0] && r[0].content; c = c && c.sections && c.sections.length ? c : D;
  try { localStorage.setItem('inv_c', JSON.stringify(c)); } catch (e) {}
  return c;
}).catch(function () { return null; });
var first = cached && cached.sections && !PREV
  ? Promise.race([fresh.then(function (c) { return c || cached; }), new Promise(function (r) { setTimeout(function () { r(cached); }, 1200); })])
  : fresh.then(function (c) { return c || D; });
first.then(function (c) { return gp.then(function () { start(c); }); });
})();

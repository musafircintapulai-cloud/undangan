/* Panel admin — vanilla JS. Semua aksi lewat Apps Script (token di sessionStorage). */
(function () {
'use strict';
var CF = window.CONFIG || {}, T = sessionStorage.getItem('adm_t') || '';
var S = { c: null, g: [], r: [], tab: 'dash', sel: {}, op: {}, fg: { q: '', cat: '', st: '', sort: 'new' }, rf: '', dirty: false, imp: [] };
var TABS = [['dash', 'Dashboard'], ['konten', 'Konten'], ['tema', 'Tema'], ['musik', 'Musik'], ['latar', 'Intro & Latar'], ['tamu', 'Tamu'], ['wa', 'Kirim WA'], ['rsvp', 'RSVP & Ucapan'], ['akun', 'Akun']];
var NEW = { text: { title: '', text: '' }, image: { url: '', caption: '' }, gallery: { images: [] }, video: { url: '' }, quote: { text: '', by: '' }, buttons: { buttons: [{ label: '', url: '' }] }, html: { text: '' } };
var TPL = { photos: { url: '', caption: '' }, items: { title: '', venue: '', desc: '', time: '', mapUrl: '' }, buttons: { label: '', url: '' }, tracks: { title: '', url: '' }, questions: { key: '', label: '', type: 'text', required: false }, colors: '#cccccc', images: '', gallery: '' };
var FONTS = ['Pinyon Script', 'Italianno', 'Great Vibes', 'Allura', 'Parisienne', 'Playfair Display', 'Cormorant Garamond', 'Lora', 'Libre Baskerville', 'Inter', 'Poppins', 'Montserrat', 'Nunito'];

/* ---------- Helper ---------- */
function $(s) { return document.querySelector(s); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(m, bad) { var t = $('#toast'); t.textContent = m; t.className = 'show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 3200); }
function st(m) { $('#st').textContent = m; }
function dirty() { S.dirty = true; st('Belum disimpan'); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function dt(s) { return s ? new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–'; }
function api(action, payload) {
  return fetch(CF.APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, token: T, payload: payload || {} }) })
    .then(function (r) { return r.json(); })
    .then(function (j) { if (!j.ok) { if (action !== 'login' && /Sesi/.test(j.error || '')) out(); throw new Error(j.error || 'Gagal'); } return j.data; });
}
function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Disalin'); }).catch(function () { toast('Gagal menyalin', 1); }); }
function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
function csv(name, head, rows) {
  var t = '\ufeff' + [head].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = name; a.click();
}
function norm(raw) { // sama dengan Code.gs
  var s = String(raw || '').trim(); if (!s) return '';
  s = s.replace(/[^\d+]/g, ''); if (s[0] === '+') s = s.slice(1); s = s.replace(/\D/g, '');
  if (s.indexOf('62') !== 0) { if (s[0] === '0') s = '62' + s.slice(1); else if (s[0] === '8') s = '62' + s; }
  if (s.indexOf('620') === 0) s = '62' + s.slice(3);
  return s.length < 9 || s.length > 15 ? null : s;
}
function base() {
  var b = (S.c && S.c.meta && S.c.meta.baseUrl) || CF.BASE_URL || '';
  if (!b || /GANTI/.test(b)) b = location.href.replace(/admin\.html.*$/, '');
  return b.replace(/\/+$/, '');
}
function link(g) { return base() + '/?to=' + g.code; }
function modal(h) { closeM(); var d = document.createElement('div'); d.id = 'md'; d.innerHTML = '<div class="mb">' + h + '<p style="text-align:right"><button class="b o" data-act="mclose">Tutup</button></p></div>'; document.body.appendChild(d); }
function closeM() { var m = $('#md'); if (m) m.remove(); }

/* ---------- Login / sesi ---------- */
function out() { T = ''; sessionStorage.removeItem('adm_t'); $('#app').hidden = true; $('#login').hidden = false; }
function boot() {
  $('#login').hidden = true; $('#app').hidden = false; st('Memuat…');
  Promise.all([api('getContent'), api('listGuests')]).then(function (r) {
    var c = r[0] && r[0].content; S.c = c && c.sections && c.sections.length ? c : clone(window.DEFAULT_CONTENT);
    S.c.meta = S.c.meta || { title: '', description: '', baseUrl: '' }; S.c.wa = S.c.wa || clone(window.DEFAULT_CONTENT.wa); S.c.music = S.c.music || clone(window.DEFAULT_CONTENT.music);
    S.c.intro = S.c.intro || clone(window.DEFAULT_CONTENT.intro); S.c.background = S.c.background || clone(window.DEFAULT_CONTENT.background);
    S.g = r[1] || []; st(''); render();
  }).catch(function (e) { toast(e.message, 1); });
}
$('#lg').onclick = function () {
  $('#le').textContent = '';
  api('login', { password: $('#pw').value }).then(function (d) { T = d.token; sessionStorage.setItem('adm_t', T); $('#pw').value = ''; boot(); })
    .catch(function (e) { $('#le').textContent = e.message; });
};
$('#pw').onkeydown = function (e) { if (e.key === 'Enter') $('#lg').click(); };
window.onbeforeunload = function () { return S.dirty ? 'Perubahan belum disimpan' : undefined; };

/* ---------- Penyunting generik (untuk Konten, Tema, Musik) ---------- */
function lab(k) { return esc(String(k).replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); })); }
function obj(o, p) { return Object.keys(o).map(function (k) { return fld(k, o[k], p + '.' + k); }).join(''); }
function fld(k, v, p) {
  var P = esc(p), t = typeof v;
  if (p === 'background.type') return '<label>Jenis latar<select data-p="background.type">' + [['none', 'Warna polos (tanpa foto/video)'], ['image', 'Foto'], ['video', 'Video']].map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
  if (Array.isArray(v)) return arr(k, v, p);
  if (v && t === 'object') return '<fieldset><legend>' + lab(k) + '</legend>' + obj(v, p) + '</fieldset>';
  if (t === 'boolean') return '<label class="ck"><input type="checkbox" data-p="' + P + '" data-t="b"' + (v ? ' checked' : '') + '> ' + lab(k) + '</label>';
  if (t === 'number') return '<label>' + lab(k) + '<input type="number" step="any" data-p="' + P + '" data-t="n" value="' + esc(v) + '"></label>';
  var s = String(v == null ? '' : v);
  if (/^theme\.colors/.test(p)) return '<label>' + lab(k) + '<input type="color" data-p="' + P + '" value="' + esc(s) + '"></label>';
  if (/^theme\.fonts/.test(p)) return '<label>' + lab(k) + '<input list="fonts" data-p="' + P + '" value="' + esc(s) + '"></label>';
  var up = (/^(url|videoUrl|imageUrl)$/.test(k) || /^theme\.assets/.test(p)) ? '<button class="b s" data-act="up" data-p="' + P + '">Upload</button>' : '';
  if (k === 'text' || k === 'desc' || k === 'template' || s.length > 80 || s.indexOf('\n') >= 0) return '<label>' + lab(k) + '<textarea rows="3" data-p="' + P + '">' + esc(s) + '</textarea></label>';
  return '<label>' + lab(k) + '<span class="r"><input data-p="' + P + '" value="' + esc(s) + '">' + up + '</span></label>';
}
function arr(k, a, p) {
  var h = '<fieldset><legend>' + lab(k) + '</legend>';
  a.forEach(function (x, i) {
    var q = esc(p + '.' + i);
    h += '<div class="it"><div class="ib2"><button data-act="mv" data-d="-1" data-p="' + q + '">↑</button><button data-act="mv" data-d="1" data-p="' + q + '">↓</button><button data-act="rm" data-p="' + q + '">✕</button></div>';
    if (x && typeof x === 'object') h += obj(x, p + '.' + i);
    else if (k === 'colors') h += '<input type="color" data-p="' + q + '" value="' + esc(x) + '">';
    else h += '<span class="r"><input data-p="' + q + '" value="' + esc(x) + '">' + (k === 'images' || k === 'gallery' ? '<button class="b s" data-act="up" data-p="' + q + '">Upload</button>' : '') + '</span>';
    h += '</div>';
  });
  return h + '<button class="b s" data-act="add" data-p="' + esc(p) + '">+ Tambah</button></fieldset>';
}
function ref(p) { var a = p.split('.'), k = a.pop(), o = S.c; a.forEach(function (x) { o = o[x]; }); return [o, k]; }
function setv(p, v) { var r = ref(p); r[0][r[1]] = v; }
function blank(x) { if (Array.isArray(x)) return []; if (x && typeof x === 'object') { var o = {}; for (var k in x) o[k] = blank(x[k]); return o; } return typeof x === 'boolean' ? false : typeof x === 'number' ? 0 : ''; }
function saveBar() { return '<div class="bar"><button class="b" data-act="save">Simpan</button><button class="b o" data-act="prev">Pratinjau undangan</button></div>'; }

/* ---------- Upload (kompres gambar di browser) ---------- */
function shrink(f) {
  return new Promise(function (res, rej) {
    var im = new Image(), u = URL.createObjectURL(f);
    im.onerror = function () { rej(new Error('Gambar tidak terbaca')); };
    im.onload = function () {
      var k = Math.min(1, 1600 / Math.max(im.width, im.height)), w = Math.round(im.width * k), h = Math.round(im.height * k), q = .85, c = document.createElement('canvas');
      (function go() {
        c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
        c.toBlob(function (b) {
          if (b.size > 400 * 1024 && (q > .45 || w > 600)) { if (q > .45) q -= .15; else { w = Math.round(w * .8); h = Math.round(h * .8); } return go(); }
          var r = new FileReader(); r.onload = function () { res({ b64: r.result.split(',')[1], type: b.type }); }; r.readAsDataURL(b);
        }, 'image/webp', q);
      })();
    };
    im.src = u;
  });
}
function raw(f) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res({ b64: r.result.split(',')[1], type: f.type }); }; r.readAsDataURL(f); }); }
function upload(p) {
  var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,audio/mpeg,video/mp4,video/webm';
  i.onchange = function () {
    var f = i.files[0]; if (!f) return;
    var au = f.type === 'audio/mpeg', vd = /^video\/(mp4|webm)$/.test(f.type); if (au && f.size > 8 * 1024 * 1024) return toast('MP3 maksimal 8MB', 1);
    if (vd && f.size > 15 * 1024 * 1024) return toast('Video maksimal 15MB. Kompres dulu, atau upload lewat Supabase Storage lalu tempel URL-nya.', 1);
    st('Mengunggah…');
    (au || vd ? raw(f) : shrink(f)).then(function (r) {
      return api('uploadFile', { base64: r.b64, contentType: r.type, folder: au ? 'music' : vd ? 'video' : /^theme\.assets/.test(p) ? 'assets' : 'images', name: f.name });
    }).then(function (d) {
      setv(p, d.url); var el = document.querySelector('[data-p="' + p + '"]:not(button)'); if (el) el.value = d.url; dirty(); toast('Terunggah. Klik Simpan.');
    }).catch(function (e) { st(''); toast(e.message, 1); });
  };
  i.click();
}

/* ---------- Halaman ---------- */
function render() {
  $('#nav').innerHTML = TABS.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('');
  $('#ttl').textContent = TABS.filter(function (t) { return t[0] === S.tab; })[0][1];
  var f = { dash: pgDash, konten: pgKonten, tema: pgTema, musik: pgMusik, latar: pgLatar, tamu: pgTamu, wa: pgWa, rsvp: pgRsvp, akun: pgAkun }[S.tab]; f();
}
function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y); }
function pg(h) { $('#pg').innerHTML = h; }

function pgDash() {
  pg('<p>Memuat statistik…</p>');
  api('stats').then(function (s) {
    var x = [['Total tamu', s.totalGuests], ['WA terkirim', s.waSent], ['Sudah membuka', s.opened], ['RSVP masuk', s.rsvpTotal], ['Hadir', s.attending], ['Tidak hadir', s.notAttending], ['Total orang hadir', s.totalPeopleAttending]];
    pg('<div class="cards">' + x.map(function (i) { return '<div class="cd"><small>' + i[0] + '</small><b>' + i[1] + '</b></div>'; }).join('') + '</div>');
  }).catch(function (e) { pg('<p class="bad">' + esc(e.message) + '</p>'); });
}

function pgKonten() {
  var h = saveBar() + '<div class="bar"><select id="nt">' + Object.keys(NEW).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select><button class="b o" data-act="addsec">+ Tambah bagian</button></div>';
  h += '<details class="sc2"><summary><b>Info halaman</b> <small>(judul, deskripsi, alamat situs)</small></summary>' + obj(S.c.meta, 'meta') + '</details>';
  S.c.sections.forEach(function (s, i) {
    h += '<details class="sc2" data-id="' + esc(s.id) + '"' + (S.op[s.id] ? ' open' : '') + '><summary><b>' + esc(s.id) + '</b> <small>(' + esc(s.type) + ')' + (s.enabled === false ? ' — nonaktif' : '') + '</small></summary>' +
      '<div class="bar"><label class="ck"><input type="checkbox" data-p="sections.' + i + '.enabled" data-t="b"' + (s.enabled !== false ? ' checked' : '') + '> Aktif</label>' +
      '<button class="b s o" data-act="mvs" data-i="' + i + '" data-d="-1">↑ Naik</button><button class="b s o" data-act="mvs" data-i="' + i + '" data-d="1">↓ Turun</button>' +
      '<button class="b s o" data-act="dup" data-i="' + i + '">Duplikat</button><button class="b s d" data-act="del" data-i="' + i + '">Hapus</button></div>' +
      obj(s.data || {}, 'sections.' + i + '.data') + '</details>';
  });
  pg(h);
}
function pgTema() { pg(saveBar() + '<datalist id="fonts">' + FONTS.map(function (f) { return '<option value="' + f + '">'; }).join('') + '</datalist>' + obj(S.c.theme, 'theme') + '<p><small>Aset dekoratif kosong = memakai gambar SVG bawaan.</small></p>'); }
function pgLatar() {
  pg(saveBar() + '<h3>Intro (video / animasi pembuka)</h3><p><small>Diputar setelah tamu membuka amplop. Bagian "The Wedding Of" muncul setelah intro selesai. Kosongkan Video Url untuk memakai animasi bawaan. Video: MP4 pendek (5–15 detik), maks 15MB; biarkan 1–2 detik pertama berupa fade-in karena tertutup amplop yang sedang membuka.</small></p>' + obj(S.c.intro, 'intro') +
    '<h3>Latar halaman</h3><p><small>Foto atau video di belakang seluruh isi undangan. "Overlay" 0–1 = seberapa pekat warna latar menutupi foto/video agar teks tetap terbaca (0 = foto penuh). Video latar sebaiknya di bawah 5MB agar ringan di HP.</small></p>' + obj(S.c.background, 'background'));
}
function pgMusik() { pg(saveBar() + obj(S.c.music, 'music') + '<p><small>Upload MP3 (maks 8MB) atau tempel URL langsung.</small></p>'); }

/* ----- Tamu ----- */
function fg() {
  var f = S.fg, q = f.q.toLowerCase();
  var r = S.g.filter(function (g) {
    return (!q || (g.name + ' ' + (g.phone || '')).toLowerCase().indexOf(q) >= 0) && (!f.cat || g.category === f.cat) &&
      (!f.st || (f.st === 'wa' ? g.wa_sent : f.st === 'nowa' ? !g.wa_sent : f.st === 'open' ? g.opened_at : !g.opened_at));
  });
  if (f.sort === 'name') r = r.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  return r;
}
function tbl() {
  var rows = fg();
  return '<div class="tw"><table><tr><th><input type="checkbox" data-act="all"></th><th>Nama</th><th>No HP</th><th>Kategori</th><th>Maks</th><th>WA</th><th>Dibuka</th><th></th></tr>' +
    rows.map(function (g) {
      return '<tr><td><input type="checkbox" data-id="' + g.id + '"' + (S.sel[g.id] ? ' checked' : '') + '></td><td>' + esc(g.name) + '<br><small>' + esc(g.code) + '</small></td><td>' + esc(g.phone || '–') + '</td><td>' + esc(g.category || '–') + '</td><td>' + g.max_guests + '</td>' +
        '<td class="' + (g.wa_sent ? 'ok' : '') + '">' + (g.wa_sent ? '✓ ' + dt(g.wa_sent_at) : '–') + '</td><td class="' + (g.opened_at ? 'ok' : '') + '">' + (g.opened_at ? '✓ ' + dt(g.opened_at) : '–') + '</td>' +
        '<td><button class="b s o" data-act="gedit" data-id="' + g.id + '">Edit</button><button class="b s o" data-act="glink" data-id="' + g.id + '">Salin link</button></td></tr>';
    }).join('') + '</table></div><p><small>' + rows.length + ' dari ' + S.g.length + ' tamu</small></p>';
}
function pgTamu() {
  var cats = {}; S.g.forEach(function (g) { if (g.category) cats[g.category] = 1; });
  var f = S.fg;
  pg('<div class="bar"><button class="b" data-act="gadd">+ Tambah tamu</button><button class="b o" data-act="gimp">Impor dari Excel</button><button class="b d" data-act="gdel">Hapus terpilih</button><button class="b o" data-act="gcsv">Ekspor CSV</button></div>' +
    '<div class="bar"><input id="gq" placeholder="Cari nama / HP" value="' + esc(f.q) + '"><select id="gc"><option value="">Semua kategori</option>' + Object.keys(cats).map(function (c) { return '<option' + (f.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
    '<select id="gs">' + [['', 'Semua status'], ['wa', 'Sudah dikirim WA'], ['nowa', 'Belum dikirim WA'], ['open', 'Sudah membuka'], ['noopen', 'Belum membuka']].map(function (o) { return '<option value="' + o[0] + '"' + (f.st === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
    '<select id="go"><option value="new">Terbaru</option><option value="name"' + (f.sort === 'name' ? ' selected' : '') + '>Nama A–Z</option></select></div><div id="tt">' + tbl() + '</div>');
}
function guestForm(g) {
  g = g || { name: '', phone: '', category: '', max_guests: 2 };
  modal('<h3 style="margin-top:0">' + (g.id ? 'Edit tamu' : 'Tambah tamu') + '</h3><label>Nama<input id="gn" value="' + esc(g.name) + '"></label><label>No HP<input id="gp" value="' + esc(g.phone || '') + '"></label><label>Kategori<input id="gk" value="' + esc(g.category || '') + '"></label><label>Maks tamu<input id="gm" type="number" min="1" max="50" value="' + esc(g.max_guests) + '"></label>' +
    '<button class="b" data-act="gsave" data-id="' + (g.id || '') + '">Simpan</button>');
}
function importPreview() {
  var L = $('#it').value.split(/\r?\n/).filter(function (l) { return l.trim(); }), seen = {};
  S.g.forEach(function (g) { seen[g.name.toLowerCase() + '|' + (g.phone || '')] = 1; });
  S.imp = [];
  L.forEach(function (l, i) {
    var d = l.indexOf('\t') >= 0 ? '\t' : l.indexOf(';') >= 0 ? ';' : ',', c = l.split(d).map(function (x) { return x.trim(); });
    if (i === 0 && (/^(nama|name)/i.test(c[0]) || /hp|phone|telp|wa/i.test(c[1] || ''))) return;
    var p = norm(c[1]), e = '';
    if (!c[0]) e = 'Nama kosong'; else if (p === null) e = 'HP tidak valid'; else if (seen[c[0].toLowerCase() + '|' + p]) e = 'Duplikat';
    if (!e) seen[c[0].toLowerCase() + '|' + p] = 1;
    S.imp.push({ name: c[0] || '', phone: p || '', category: c[2] || '', max_guests: c[3] || '', err: e });
  });
  var ok = S.imp.filter(function (r) { return !r.err; });
  $('#ip').innerHTML = '<div class="tw"><table><tr><th>Nama</th><th>HP</th><th>Kategori</th><th>Maks</th><th>Status</th></tr>' + S.imp.map(function (r) {
    return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.phone) + '</td><td>' + esc(r.category) + '</td><td>' + esc(r.max_guests) + '</td><td class="' + (r.err ? 'bad' : 'ok') + '">' + (r.err || 'OK') + '</td></tr>';
  }).join('') + '</table></div><p>' + ok.length + ' valid, ' + (S.imp.length - ok.length) + ' bermasalah (dilewati).</p>' + (ok.length ? '<button class="b" data-act="isave">Simpan ' + ok.length + ' tamu</button>' : '');
}

/* ----- WhatsApp ----- */
function msg(g) { return (S.c.wa.template || '').replace(/\{nama\}/g, g.name).replace(/\{link\}/g, link(g)).replace(/\{kategori\}/g, g.category || ''); }
function waNext() { return S.g.filter(function (g) { return g.phone && !g.wa_sent; })[0]; }
function sendWa(g) {
  window.open('https://wa.me/' + g.phone + '?text=' + encodeURIComponent(msg(g)), '_blank', 'noopener'); // dibuka langsung agar tidak diblokir popup
  api('markSent', { ids: [g.id] }).then(function () { g.wa_sent = true; g.wa_sent_at = new Date().toISOString(); rerender(); }).catch(function (e) { toast(e.message, 1); });
}
function pgWa() {
  var n = waNext(), sample = S.g[0] || { name: 'Budi', category: '', code: 'contoh' }, sent = S.g.filter(function (g) { return g.wa_sent; }).length;
  pg('<label>Template pesan <small>(variabel: {nama} {link} {kategori})</small><textarea rows="6" data-p="wa.template">' + esc(S.c.wa.template) + '</textarea></label>' +
    '<div class="bar"><button class="b" data-act="save">Simpan template</button><button class="b o" data-act="wreset">Reset status terkirim</button></div>' +
    '<p><b>Pratinjau</b> (' + esc(sample.name) + '):</p><pre id="wpv" style="white-space:pre-wrap;background:#fff;padding:10px;border-radius:8px">' + esc(msg(sample)) + '</pre>' +
    '<div class="bar"><button class="b" data-act="wnext"' + (n ? '' : ' disabled') + '>Berikutnya: ' + (n ? esc(n.name) : 'selesai') + '</button><span>' + sent + ' / ' + S.g.length + ' terkirim</span></div>' +
    '<div class="tw"><table><tr><th>Nama</th><th>No HP</th><th>Status</th><th></th></tr>' + S.g.map(function (g) {
      return '<tr><td>' + esc(g.name) + '</td><td>' + (g.phone ? esc(g.phone) : '<span class="bad">Tanpa HP</span>') + '</td><td class="' + (g.wa_sent ? 'ok' : '') + '">' + (g.wa_sent ? '✓ ' + dt(g.wa_sent_at) : '–') + '</td><td>' +
        (g.phone ? '<button class="b s" data-act="wsend" data-id="' + g.id + '">Kirim WA</button>' : '') + '<button class="b s o" data-act="wcopy" data-id="' + g.id + '">Salin pesan</button><button class="b s o" data-act="glink" data-id="' + g.id + '">Salin link</button></td></tr>';
    }).join('') + '</table></div>');
}

/* ----- RSVP ----- */
function rvRows() { return S.r.filter(function (r) { return !S.rf || (S.rf === 'y' ? r.attending : !r.attending); }); }
function ans(a) { return Object.keys(a || {}).filter(function (k) { return a[k]; }).map(function (k) { return k + ': ' + a[k]; }).join('; '); }
function pgRsvp() {
  pg('<p>Memuat…</p>');
  api('listRsvps').then(function (r) {
    S.r = r || [];
    var rows = rvRows();
    pg('<div class="bar"><select id="rf"><option value="">Semua</option><option value="y"' + (S.rf === 'y' ? ' selected' : '') + '>Hadir</option><option value="n"' + (S.rf === 'n' ? ' selected' : '') + '>Tidak hadir</option></select><button class="b d" data-act="rdel">Hapus terpilih</button><button class="b o" data-act="rcsv">Ekspor CSV</button></div>' +
      '<div class="tw"><table><tr><th></th><th>Nama</th><th>HP</th><th>Hadir</th><th>Jumlah</th><th>Pesan</th><th>Jawaban</th><th>Waktu</th></tr>' + rows.map(function (r) {
        return '<tr><td><input type="checkbox" data-id="' + r.id + '"' + (S.sel[r.id] ? ' checked' : '') + '></td><td>' + esc(r.full_name) + '</td><td>' + esc(r.phone || '') + '</td><td class="' + (r.attending ? 'ok' : 'bad') + '">' + (r.attending ? 'Hadir' : 'Tidak') + '</td><td>' + r.guests_count + '</td><td>' + esc(r.message || '') + '</td><td>' + esc(ans(r.answers)) + '</td><td>' + dt(r.created_at) + '</td></tr>';
      }).join('') + '</table></div><p><small>' + rows.length + ' jawaban</small></p>');
  }).catch(function (e) { pg('<p class="bad">' + esc(e.message) + '</p>'); });
}

function pgAkun() {
  pg('<div class="box" style="max-width:380px"><h3 style="margin-top:0">Ganti password</h3><label>Password lama<input id="po" type="password"></label><label>Password baru (min. 8 karakter)<input id="pn" type="password"></label><button class="b" data-act="chpw">Ganti password</button><hr><button class="b o" data-act="logout">Keluar</button></div>');
}

/* ---------- Pendengar ---------- */
function onVal(e) {
  var t = e.target, p = t.dataset && t.dataset.p; if (!p || t.tagName === 'BUTTON') return;
  setv(p, t.dataset.t === 'b' ? t.checked : t.dataset.t === 'n' ? +t.value : t.value); dirty();
  if (p === 'wa.template' && $('#wpv')) $('#wpv').textContent = msg(S.g[0] || { name: 'Budi', category: '', code: 'contoh' });
}
document.addEventListener('input', onVal);
document.addEventListener('change', function (e) {
  onVal(e); var t = e.target;
  if (t.dataset.id && t.type === 'checkbox') S.sel[t.dataset.id] = t.checked;
  if (t.dataset.act === 'all') { fg().forEach(function (g) { S.sel[g.id] = t.checked; }); document.querySelectorAll('#tt [data-id]').forEach(function (c) { c.checked = t.checked; }); }
  if (t.id === 'gc') { S.fg.cat = t.value; $('#tt').innerHTML = tbl(); }
  if (t.id === 'gs') { S.fg.st = t.value; $('#tt').innerHTML = tbl(); }
  if (t.id === 'go') { S.fg.sort = t.value; $('#tt').innerHTML = tbl(); }
  if (t.id === 'rf') { S.rf = t.value; pgRsvp(); }
});
document.addEventListener('input', function (e) { if (e.target.id === 'gq') { S.fg.q = e.target.value; $('#tt').innerHTML = tbl(); } });
document.addEventListener('toggle', function (e) { var d = e.target; if (d.dataset && d.dataset.id) S.op[d.dataset.id] = d.open; }, true);

function ids() { return Object.keys(S.sel).filter(function (k) { return S.sel[k]; }); }
function gById(id) { return S.g.filter(function (g) { return g.id === id; })[0]; }
function reload() { return api('listGuests').then(function (d) { S.g = d; S.sel = {}; }); }
function fail(e) { toast(e.message, 1); }

document.addEventListener('click', function (e) {
  if (e.target.id === 'md') return closeM();
  var tb = e.target.closest('[data-tab]');
  if (tb) { if (S.dirty && !confirm('Ada perubahan belum disimpan. Pindah halaman?')) return; S.dirty = false; st(''); S.tab = tb.dataset.tab; S.sel = {}; return render(); }
  var b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT') return;
  var a = b.dataset.act, d = +b.dataset.d, i = +b.dataset.i, p = b.dataset.p, id = b.dataset.id, g;
  if (a === 'mclose') closeM();
  else if (a === 'save') { st('Menyimpan…'); api('saveContent', { content: S.c }).then(function () { S.dirty = false; st('Tersimpan ✓'); toast('Tersimpan'); }).catch(function (x) { st('Gagal'); fail(x); }); }
  else if (a === 'prev') { modal('<p><small>Menampilkan versi yang sudah disimpan.</small></p><iframe src="index.html?preview=1" style="width:100%;height:70vh;border:1px solid #ddd;border-radius:10px"></iframe>'); }
  else if (a === 'up') upload(p);
  else if (a === 'add') { var r = ref(p), ar = r[0][r[1]], k = r[1]; ar.push(ar.length && typeof ar[0] === 'object' ? blank(ar[0]) : TPL[k] !== undefined ? clone(TPL[k]) : ''); dirty(); rerender(); }
  else if (a === 'rm') { var r2 = ref(p); r2[0].splice(+r2[1], 1); dirty(); rerender(); }
  else if (a === 'mv') { var r3 = ref(p), n = +r3[1], m = n + d; if (m >= 0 && m < r3[0].length) { var x = r3[0][n]; r3[0][n] = r3[0][m]; r3[0][m] = x; dirty(); rerender(); } }
  else if (a === 'mvs') { var s = S.c.sections, j = i + d; if (j >= 0 && j < s.length) { var y = s[i]; s[i] = s[j]; s[j] = y; dirty(); rerender(); } }
  else if (a === 'dup') { var c = clone(S.c.sections[i]); c.id += '-' + Math.random().toString(36).slice(2, 6); S.c.sections.splice(i + 1, 0, c); dirty(); rerender(); }
  else if (a === 'del') { if (confirm('Hapus bagian ini?')) { S.c.sections.splice(i, 1); dirty(); rerender(); } }
  else if (a === 'addsec') { var ty = $('#nt').value; S.c.sections.push({ id: ty + '-' + Math.random().toString(36).slice(2, 6), type: ty, enabled: true, data: clone(NEW[ty]) }); dirty(); rerender(); }
  /* tamu */
  else if (a === 'gadd') guestForm();
  else if (a === 'gedit') guestForm(gById(id));
  else if (a === 'gsave') { api('saveGuest', { id: id || undefined, name: $('#gn').value, phone: $('#gp').value, category: $('#gk').value, max_guests: $('#gm').value }).then(reload).then(function () { closeM(); toast('Tersimpan'); render(); }).catch(fail); }
  else if (a === 'glink') { g = gById(id); copy(link(g)); }
  else if (a === 'gdel') { var D = ids(); if (!D.length) return toast('Pilih tamu dulu', 1); if (confirm('Hapus ' + D.length + ' tamu?')) api('deleteGuests', { ids: D }).then(reload).then(function () { toast('Terhapus'); render(); }).catch(fail); }
  else if (a === 'gcsv') csv('tamu.csv', ['nama', 'hp', 'kategori', 'maks', 'link', 'status_wa', 'dibuka'], fg().map(function (g) { return [g.name, g.phone, g.category, g.max_guests, link(g), g.wa_sent ? 'terkirim' : 'belum', g.opened_at ? 'ya' : 'belum']; }));
  else if (a === 'gimp') modal('<h3 style="margin-top:0">Impor dari Excel</h3><p><small>Tempel baris dari Excel. Kolom: Nama | No HP | Kategori | Maks Tamu (kategori & maks opsional).</small></p><textarea id="it" rows="8" placeholder="Budi Santoso&#9;08123456789&#9;Keluarga&#9;2"></textarea><button class="b" data-act="iprev">Pratinjau</button><div id="ip"></div>');
  else if (a === 'iprev') importPreview();
  else if (a === 'isave') { var ok = S.imp.filter(function (r) { return !r.err; }); b.disabled = true; api('importGuests', { rows: ok }).then(function (r) { toast(r.inserted + ' tamu disimpan'); closeM(); return reload(); }).then(render).catch(function (x) { b.disabled = false; fail(x); }); }
  /* WhatsApp */
  else if (a === 'wsend') sendWa(gById(id));
  else if (a === 'wnext') { g = waNext(); if (g) sendWa(g); }
  else if (a === 'wcopy') copy(msg(gById(id)));
  else if (a === 'wreset') { if (confirm('Reset status terkirim untuk SEMUA tamu?')) api('resetSent', {}).then(reload).then(function () { toast('Status direset'); render(); }).catch(fail); }
  /* RSVP */
  else if (a === 'rdel') { var R = ids(); if (!R.length) return toast('Pilih data dulu', 1); if (confirm('Hapus ' + R.length + ' jawaban?')) api('deleteRsvp', { ids: R }).then(function () { S.sel = {}; toast('Terhapus'); pgRsvp(); }).catch(fail); }
  else if (a === 'rcsv') csv('rsvp.csv', ['nama', 'hp', 'hadir', 'jumlah', 'pesan', 'jawaban', 'waktu'], rvRows().map(function (r) { return [r.full_name, r.phone, r.attending ? 'hadir' : 'tidak', r.guests_count, r.message, ans(r.answers), r.created_at]; }));
  /* akun */
  else if (a === 'chpw') api('changePassword', { oldPassword: $('#po').value, newPassword: $('#pn').value }).then(function () { toast('Password diganti. Silakan login ulang.'); out(); }).catch(fail);
  else if (a === 'logout') api('logout').catch(function () {}).then(out);
});

if (T) boot();
})();

window.openAdmin = function (C, DEF, sha) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TXT = [['title', 'Browser tab title'], ['s1_top', 'Scene 1 · top text'], ['s1_hint', 'Scene 1 · hint text'], ['s2_top', 'Scene 2 · small top text'], ['s2_title', 'Scene 2 · big title (Enter = new line)', 1], ['s2_sub', 'Scene 2 · small bottom text'], ['s3_top', 'Scene 3 · top text'], ['s3_title', 'Scene 3 · script title'], ['s3_sub', 'Scene 3 · bottom text'], ['msg', 'Personal message (shown at the end with photos)', 1]];
  const COL = [['bg1', 'Background 1'], ['bg2', 'Background 2'], ['red', 'Red screen'], ['gold', 'Underline'], ['heart', 'Heart'], ['leaf1', 'Leaf 1'], ['leaf2', 'Leaf 2'], ['leaf3', 'Leaf 3'], ['trunk', 'Tree trunk'], ['txt', 'Text']];
  // GitHub target: auto-detect from https://USER.github.io/REPO/
  const auto = { owner: location.hostname.split('.')[0], repo: location.pathname.split('/')[1] || '', branch: 'main' };
  const G = Object.assign(auto, JSON.parse(localStorage.getItem('bday_gh') || '{}'));
  const pend = []; // files waiting to be committed: {path, b64}
  document.getElementById('adm')?.remove();
  const el = document.createElement('div'); el.id = 'adm';
  el.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:min(440px,100%);z-index:100;background:#fff;color:#222;font:14px system-ui;font-style:normal;overflow-y:auto;padding:16px;box-shadow:-6px 0 30px #0005';
  document.body.append(el);
  const css = 'width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;font:inherit;margin:3px 0 10px', bt = (c = '#c8204a') => `border:0;border-radius:8px;padding:9px 14px;background:${c};color:#fff;cursor:pointer;font:inherit;margin:3px 3px 3px 0`;
  const gh = async (path, method = 'GET', body) => {
    const r = await fetch(`https://api.github.com/repos/${G.owner}/${G.repo}/contents/${path}` + (method === 'GET' ? `?ref=${G.branch}` : ''), { method, headers: { Authorization: 'Bearer ' + G.token, Accept: 'application/vnd.github+json' }, body: body && JSON.stringify(body) });
    if (r.status === 404 && method === 'GET') return null;
    const j = await r.json(); if (!r.ok) throw new Error(r.status === 401 ? 'Bad token' : j.message || 'GitHub error'); return j;
  };
  const put = async (path, b64, msg) => { const old = await gh(path); await gh(path, 'PUT', { message: msg, content: b64, branch: G.branch, ...(old ? { sha: old.sha } : {}) }) };
  const b64 = s => btoa(unescape(encodeURIComponent(s)));
  const fileB64 = f => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result.split(',')[1]); r.readAsDataURL(f) });
  function draw() {
    el.innerHTML = `<h2 style="margin-bottom:10px">Admin panel</h2>
    <div style="position:sticky;top:-16px;background:#fff;padding:8px 0;z-index:2"><button id="sv" style="${bt()}">💾 Publish</button><button id="rp" style="${bt('#555')}">Preview</button><button id="cl" style="${bt('#999')}">Close</button> <div id="ms" style="min-height:1.3em"></div></div>
    <h3>Texts</h3>${TXT.map(([k, l, t]) => `<label>${l}${t ? `<textarea data-k="${k}" rows="3" style="${css}">${esc(C[k] ?? '')}</textarea>` : `<input data-k="${k}" value="${esc(C[k] ?? '')}" style="${css}">`}</label>`).join('')}
    <h3>Colors</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${COL.map(([k, l]) => `<label>${l}<input type="color" data-k="${k}" value="${C[k]}" style="display:block;width:100%;height:36px;margin-top:3px"></label>`).join('')}</div>
    <h3 style="margin-top:14px">Photos <small>(polaroids at the end)</small></h3>
    ${C.photos.map((p, i) => `<div style="display:flex;gap:8px;align-items:center;margin:6px 0"><img src="${esc(p.pv || p.url)}" style="width:56px;height:56px;object-fit:cover;border-radius:6px"><input data-cap="${i}" value="${esc(p.cap || '')}" placeholder="caption" style="${css};margin:0"><button data-del="${i}" style="${bt('#b00')}">✕</button></div>`).join('')}
    <input type="file" id="up" accept="image/*" multiple>
    <h3 style="margin-top:14px">Music</h3>${C.music ? `<div>${esc(C.music)} <button id="dm" style="${bt('#b00')}">Remove</button></div>` : ''}
    <input type="file" id="mu" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav"><small style="display:block">mp3, max 10MB. Starts when the arrow is released.</small>
    <h3 style="margin-top:14px">Change PIN</h3><input id="np" inputmode="numeric" placeholder="new PIN (4-12 digits)" style="${css}"><button id="cp" style="${bt('#555')}">Set new PIN</button><small style="display:block">Then press Publish.</small>
    <h3 style="margin-top:14px">GitHub connection</h3><small>Needed only to publish. Token is kept only in this browser.</small>
    <input id="go" placeholder="GitHub username" value="${esc(G.owner)}" style="${css}"><input id="gr" placeholder="repository name" value="${esc(G.repo)}" style="${css}">
    <input id="gb" placeholder="branch (main)" value="${esc(G.branch)}" style="${css}"><input id="gt" type="password" placeholder="Personal access token" value="${esc(G.token || '')}" style="${css}">
    <button id="fg" style="${bt('#999')}">Forget token</button>
    <h3 style="margin-top:10px">Reset</h3><button id="rs" style="${bt('#b00')}">Reset texts & colors</button>`;
    const q = s => el.querySelector(s), ms = t => q('#ms').textContent = t;
    el.querySelectorAll('[data-k]').forEach(i => i.oninput = () => C[i.dataset.k] = i.value);
    el.querySelectorAll('[data-cap]').forEach(i => i.oninput = () => C.photos[i.dataset.cap].cap = i.value);
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { C.photos.splice(b.dataset.del, 1); draw() });
    q('#cl').onclick = () => el.remove();
    q('#rp').onclick = () => { cfg = C; play() };
    q('#up').onchange = async e => {
      for (const f of e.target.files) {
        try {
          const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(f) });
          const k = Math.min(1, 1200 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          const d = c.toDataURL('image/jpeg', .82), name = 'uploads/' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.jpg';
          pend.push({ path: name, b64: d.split(',')[1] }); C.photos.push({ url: name, cap: '', pv: d });
        } catch { ms('✗ Could not read ' + f.name) }
      }
      draw(); ms('Photos added — press Publish');
    };
    q('#mu').onchange = async e => {
      const f = e.target.files[0]; if (!f) return; if (f.size > 10e6) return ms('Max 10MB');
      const name = 'uploads/music-' + Date.now() + (f.name.match(/\.\w+$/) || ['.mp3'])[0].toLowerCase();
      pend.push({ path: name, b64: await fileB64(f) }); C.music = name; draw(); ms('Music added — press Publish');
    };
    const dm = q('#dm'); if (dm) dm.onclick = () => { C.music = ''; draw() };
    q('#cp').onclick = async () => { const v = q('#np').value; if (!/^\d{4,12}$/.test(v)) return ms('PIN must be 4-12 digits'); C.pinHash = await sha('bday' + v); ms('New PIN set — press Publish') };
    q('#fg').onclick = () => { localStorage.removeItem('bday_gh'); G.token = ''; q('#gt').value = ''; ms('Token removed from this browser') };
    q('#rs').onclick = () => { if (confirm('Reset all texts and colors?')) { Object.assign(C, DEF, { photos: C.photos, music: C.music }); draw() } };
    q('#sv').onclick = async () => {
      G.owner = q('#go').value.trim(); G.repo = q('#gr').value.trim(); G.branch = q('#gb').value.trim() || 'main'; G.token = q('#gt').value.trim();
      if (!G.owner || !G.repo || !G.token) return ms('✗ Fill the GitHub connection fields first');
      localStorage.setItem('bday_gh', JSON.stringify(G));
      try {
        for (let i = 0; i < pend.length; i++) { ms(`Uploading file ${i + 1}/${pend.length}…`); await put(pend[i].path, pend[i].b64, 'Add upload') }
        pend.length = 0; ms('Saving settings…');
        const out = { ...C, photos: C.photos.map(({ url, cap }) => ({ url, cap })) };
        await put('config.json', b64(JSON.stringify(out, null, 1)), 'Update site settings');
        ms('✓ Published! The live site updates in about 1 minute (then refresh).');
      } catch (x) { ms('✗ ' + x.message) }
    };
  }
  draw();
};

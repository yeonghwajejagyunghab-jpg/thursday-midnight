{
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  };
  const load = async (path) => {
    try {
      const r = await fetch(path, { cache: 'no-cache' });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  };
  const num = (v) => { const x = parseInt(v, 10); return Number.isFinite(x) ? x : 0; };
  const termFor = (n) => '목요일 0시 · ' + n + '주차';

  const meta = (p) => {
    const no = el('p', 'no sans');
    no.appendChild(el('span', 'n', num(p.n) + '주차'));
    const tm = el('time', '', p.date || '');
    tm.setAttribute('datetime', p.date || '');
    no.appendChild(tm);
    return no;
  };

  const page = document.body.dataset.page;

  if (page === 'index') {
    const ticks = document.getElementById('ticks');
    let t = '';
    for (let i = 1; i < 60; i++) {
      const major = i % 5 === 0;
      t += '<line x1="200" y1="' + (major ? 30 : 34) + '" x2="200" y2="' + (major ? 50 : 42) +
        '" stroke="' + (major ? '#ebe5d9' : '#4a5258') + '" stroke-width="' + (major ? 2.5 : 1.2) +
        '" transform="rotate(' + (i * 6) + ' 200 200)"/>';
    }
    ticks.innerHTML = t;

    (async () => {
      const [posts, memo, log] = await Promise.all([
        load('data/posts.json'), load('data/memo.json'), load('data/log.json')
      ]);

      const list = document.getElementById('postlist');
      list.textContent = '';
      if (!Array.isArray(posts) || !posts.length) {
        list.appendChild(el('p', 'sub sans', posts ? '아직 글이 없습니다.' : '글을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.'));
      } else {
        for (const p of posts) {
          const d = el('div', 'entry' + (p.skipped ? ' skipped' : ''));
          d.appendChild(meta(p));
          const h = el('h2');
          const a = el('a', '', p.title || (p.skipped ? '이번 주는 쓰지 않는다' : num(p.n) + '주차'));
          a.href = 'post.html?n=' + num(p.n);
          h.appendChild(a);
          d.appendChild(h);
          const first = Array.isArray(p.body) && p.body[0];
          if (first) d.appendChild(el('p', 'ex', first));
          const more = el('a', 'more sans', '읽고 댓글 남기기');
          more.href = a.href;
          d.appendChild(more);
          list.appendChild(d);
        }
      }

      if (memo) {
        document.getElementById('memodate').textContent = (memo.date || '') + '에 남김';
        const ml = document.getElementById('memolist');
        for (const l of (memo.lines || [])) ml.appendChild(el('li', '', l));
      }

      const ll = document.getElementById('loglist');
      for (const r of (Array.isArray(log) ? log : [])) {
        const li = el('li');
        const tm = el('time', '', r.date || '');
        tm.setAttribute('datetime', r.date || '');
        li.appendChild(tm);
        li.appendChild(el('span', '', r.text || ''));
        ll.appendChild(li);
      }
    })();
  }

  if (page === 'post') {
    (async () => {
      const n = num(new URLSearchParams(location.search).get('n'));
      const [posts, gcfg] = await Promise.all([load('data/posts.json'), load('data/giscus.json')]);
      const box = document.getElementById('post');
      box.textContent = '';
      const list = Array.isArray(posts) ? posts : [];
      const i = list.findIndex((p) => num(p.n) === n);
      if (i < 0) {
        box.appendChild(el('p', 'sub sans', '이 글을 찾지 못했습니다.'));
        return;
      }
      const p = list[i];
      if (p.skipped) box.classList.add('skipped');
      box.appendChild(meta(p));
      const title = p.title || (p.skipped ? '이번 주는 쓰지 않는다' : num(p.n) + '주차');
      box.appendChild(el('h2', '', title));
      document.title = title + ' · 목요일 0시';
      for (const para of (p.body || [])) box.appendChild(el('p', '', para));
      if (p.note) box.appendChild(el('p', 'note sans', p.note));

      const pager = document.getElementById('pager');
      const older = list[i + 1], newer = list[i - 1];
      const link = (q, label) => {
        if (!q) return el('span');
        const a = el('a', '', label + ' · ' + (q.title || num(q.n) + '주차'));
        a.href = 'post.html?n=' + num(q.n);
        return a;
      };
      pager.appendChild(link(older, '이전 글'));
      pager.appendChild(link(newer, '다음 글'));

      const slot = document.getElementById('giscus');
      if (!gcfg || !gcfg.repoId || !gcfg.categoryId) {
        slot.appendChild(el('p', 'sub sans', '댓글은 곧 열립니다.'));
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      const attrs = {
        'data-repo': gcfg.repo, 'data-repo-id': gcfg.repoId,
        'data-category': gcfg.category, 'data-category-id': gcfg.categoryId,
        'data-mapping': 'specific', 'data-term': termFor(num(p.n)), 'data-strict': '1',
        'data-reactions-enabled': '1', 'data-emit-metadata': '0', 'data-input-position': 'top',
        'data-theme': 'transparent_dark', 'data-lang': 'ko', 'data-loading': 'lazy'
      };
      for (const k in attrs) s.setAttribute(k, String(attrs[k]));
      s.crossOrigin = 'anonymous';
      s.async = true;
      slot.appendChild(s);
    })();
  }
}

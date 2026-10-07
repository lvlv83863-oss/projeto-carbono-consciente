/* =========================================================
   arvore.js — planta que cresce até virar árvore
   Substitui o antigo planta.js (que usava o SVG de 5 folhas).
   API:  plantarArvore(nivel)   → toca a animação completa
         atualizarPlanta(nivel) → atualiza sem repetir o plantio
   nivel = 0..100 (saúde dos hábitos). Defina window.PLANTA_NIVEL
   ou data-nivel="..." em #planta-cena para o valor inicial.
   ========================================================= */
(() => {
  const cena = document.getElementById('planta-cena');
  if (!cena) return;
  const svg = cena.querySelector('.planta-svg');
  const leg = document.getElementById('planta-legenda');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  let seed = 7;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };

  // Copas: [cx, cy, raio, estágio, estágioMáx, nº de folhas]
  const copas = [
    [160,250,10,1,1,7],
    [118,225,28,2,0,20], [203,218,28,2,0,20],
    [96,178,34,3,0,24],  [226,172,34,3,0,24], [160,148,38,3,0,26],
    [130,122,34,4,0,24], [192,120,34,4,0,24], [160,100,38,4,0,26]
  ];
  const gC = document.getElementById('copas');
  copas.forEach(([cx, cy, r, e, emax, n], ci) => {
    const g = el('g', { class: 'copa', 'data-e': e }, gC);
    if (emax) g.dataset.emax = emax;
    g.style.setProperty('--d', (ci * 0.25 % 2).toFixed(2) + 's');
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.85;
      const rot = a * 180 / Math.PI + (rnd() - .5) * 100;
      const w = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, g);
      const p = el('path', { class: 'folha t' + (i % 3), d: 'M0,0 C5,-9 17,-9 22,0 C17,9 5,9 0,0Z' }, w);
      p.style.setProperty('--r', rot.toFixed(0) + 'deg');
      p.style.setProperty('--s', (.7 + rnd() * .6).toFixed(2));
      p.style.setProperty('--d', (i * 0.04).toFixed(2) + 's');
    }
  });

  // Flores
  const gF = document.getElementById('flores');
  [[96,166],[234,162],[128,108],[198,106],[160,84],[116,212],[208,206],[82,184],[172,136],[146,158]].forEach(([x, y], i) => {
    const f = el('g', { class: 'flor', 'data-e': 4, transform: `translate(${x} ${y})` }, gF);
    f.style.setProperty('--d', (i * 0.12).toFixed(2) + 's');
    const inn = el('g', { class: 'flor-in' }, f);
    for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180;
      el('circle', { cx: (Math.cos(a) * 3.6).toFixed(1), cy: (Math.sin(a) * 3.6).toFixed(1), r: 3 }, inn); }
    el('circle', { class: 'flor-centro', r: 2 }, inn);
  });

  // Pétalas e vagalumes
  const gP = document.getElementById('particulas');
  for (let i = 0; i < 5; i++) {
    const p = el('ellipse', { class: 'petala', 'data-e': 4, cx: 100 + rnd() * 120, cy: 120 + rnd() * 60, rx: 3, ry: 1.8 }, gP);
    p.style.setProperty('--d', (i * 1.4) + 's'); p.style.setProperty('--dx', ((rnd() - .5) * 60).toFixed(0) + 'px');
  }
  for (let i = 0; i < 7; i++) {
    const v = el('circle', { class: 'vagalume', 'data-e': 4, cx: 70 + rnd() * 180, cy: 150 + rnd() * 140, r: 2 }, gP);
    v.style.setProperty('--d', (i * 0.7) + 's'); v.style.setProperty('--dx', ((rnd() - .5) * 30).toFixed(0) + 'px');
  }

  // Grama
  const gG = document.getElementById('grama');
  for (let i = 0; i < 26; i++) {
    const x = 100 + i * 4.6 + rnd() * 3, h = 8 + rnd() * 10, c = (rnd() - .5) * 8;
    const b = el('path', { class: 'grama', d: `M${x.toFixed(1)},305 q${c.toFixed(1)},-${(h / 2).toFixed(1)} ${(c * 1.4).toFixed(1)},-${h.toFixed(1)}` }, gG);
    b.style.setProperty('--d', (rnd() * 2).toFixed(2) + 's');
  }

  const legendas = [
    'Plantando sua semente...',
    'Um brotinho nasceu. Cada trajeto sustentável faz ele crescer.',
    'Já é uma muda firme. Seus hábitos estão ganhando raiz.',
    'Uma árvore jovem, cheia de folhas. Continue assim!',
    'Uma árvore frondosa em flor. Seus hábitos estão incríveis!'
  ];
  const TRONCO = [0, .3, .55, .8, 1], BRILHO = [0, .1, .25, .5, .85], TOPO = [0, 252, 212, 172, 108];
  const estagioDe = n => n < 20 ? 1 : n < 45 ? 2 : n < 70 ? 3 : 4;

  let ultimoNivel = 90, ultimoInicio = 0;

  function aplicar(nivel, e) {
    ultimoNivel = nivel;
    const h = 40 + (128 - 40) * (nivel / 100);
    cena.style.setProperty('--planta-cor', `hsl(${h.toFixed(0)} 46% ${(40 - nivel * .06).toFixed(0)}%)`);
    cena.style.setProperty('--planta-escala', (.78 + .22 * nivel / 100).toFixed(2));
    cena.style.setProperty('--planta-droop', (nivel < 40 ? (40 - nivel) * .7 : 0).toFixed(0) + 'deg');
    cena.style.setProperty('--tronco', TRONCO[e]);
    cena.style.setProperty('--brilho', BRILHO[e]);
    svg.dataset.estagio = e;
    svg.querySelectorAll('[data-e]').forEach(n => {
      const max = n.dataset.emax ? +n.dataset.emax : 99;
      n.classList.toggle('on', e >= +n.dataset.e && e <= max);
      n.classList.toggle('off', e > max);
    });
    if (leg) leg.textContent = legendas[e];
  }

  // ---- Efeitos ----
  const gE = document.getElementById('efeitos');
  const ESTRELA = 'M0,-5 L1.3,-1.3 L5,0 L1.3,1.3 L0,5 L-1.3,1.3 L-5,0 L-1.3,-1.3Z';
  function lancar(x, y, n, { cor = '#fff3b0', alcance = 40, estrela = true, subir = 0, t = 0.9 } = {}) {
    if (reduz) return;
    for (let i = 0; i < n; i++) {
      const g = el('g', { transform: `translate(${x} ${y})` }, gE);
      const a = Math.random() * Math.PI * 2, d = alcance * (.4 + Math.random() * .6);
      const f = estrela ? el('path', { d: ESTRELA, fill: cor }, g) : el('circle', { r: 1.5 + Math.random() * 2, fill: cor }, g);
      f.setAttribute('class', 'fagulha');
      f.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
      f.style.setProperty('--dy', (Math.sin(a) * d * (estrela ? 1 : .5) - subir).toFixed(0) + 'px');
      f.style.setProperty('--rot', ((Math.random() - .5) * 360).toFixed(0) + 'deg');
      f.style.setProperty('--t', (t + Math.random() * .4).toFixed(2) + 's');
      f.addEventListener('animationend', () => g.remove());
    }
  }
  const onda = svg.querySelector('.onda');
  const pulsar = () => { onda.classList.remove('pulsar'); void onda.getBoundingClientRect(); onda.classList.add('pulsar'); };
  function celebrar(e) {
    pulsar();
    lancar(160, TOPO[e], 8 + e * 3, { alcance: 34 + e * 14 });
    if (e === 4) lancar(160, 130, 22, { cor: '#f2a7c3', estrela: false, alcance: 95, subir: 25, t: 1.4 });
  }

  // Chuva
  const gChuva = document.getElementById('chuva');
  for (let i = 0; i < 12; i++) {
    const x = 125 + i * 6 + rnd() * 3;
    const g = el('path', { class: 'gota', d: `M${x.toFixed(1)},62 l-1.5,8` }, gChuva);
    g.style.setProperty('--d', (rnd() * .9).toFixed(2) + 's');
  }

  // ---- Linha do tempo do plantio ----
  let timers = [], atual = 0;
  const agendar = (fn, ms) => timers.push(setTimeout(fn, ms));

  window.plantarArvore = function (nivel = 90) {
    timers.forEach(clearTimeout); timers = [];
    gE.replaceChildren();
    const alvo = estagioDe(nivel);
    ultimoInicio = Date.now();
    cena.classList.remove('semente-caindo', 'planta-viva', 'chovendo');
    cena.classList.add('resetando');                            // volta ao zero sem animar
    atual = 0; aplicar(nivel, 0);
    void svg.getBoundingClientRect();
    cena.classList.remove('resetando');
    if (reduz) { aplicar(nivel, alvo); atual = alvo; cena.classList.add('planta-viva'); return; }
    void svg.getBoundingClientRect();
    cena.classList.add('semente-caindo');                       // semente gira e cai
    agendar(() => {                                             // impacto
      pulsar();
      lancar(160, 300, 14, { cor: '#6b4f2a', estrela: false, alcance: 46, subir: 28, t: .7 });
      lancar(160, 300, 8, { cor: '#9bd47a', estrela: false, alcance: 30, subir: 18, t: .8 });
    }, 1050);
    agendar(() => cena.classList.add('chovendo'), 1500);        // nuvem rega
    for (let e = 1; e <= alvo; e++) agendar(() => { atual = e; aplicar(nivel, e); celebrar(e); }, 2300 + (e - 1) * 2300);
    agendar(() => cena.classList.remove('chovendo'), 2300 + Math.min(alvo, 2) * 2300 - 400);
    agendar(() => cena.classList.add('planta-viva'), 2300 + alvo * 1500);
  };

  window.atualizarPlanta = nivel => {
    const e = estagioDe(nivel);
    cena.classList.add('planta-viva', 'semente-caindo');
    aplicar(nivel, e);
    if (e > atual) celebrar(e);
    atual = e;
  };

  // ---- Clique na árvore: semeia e cresce de novo ----
  cena.setAttribute('role', 'button');
  cena.setAttribute('tabindex', '0');
  cena.setAttribute('aria-label', 'Árvore. Clique para plantar de novo');
  const dica = document.createElement('span');
  dica.className = 'planta-dica';
  dica.textContent = 'Clique na árvore para plantar de novo';
  cena.appendChild(dica);

  const replantar = () => {
    if (Date.now() - ultimoInicio < 700) return;                // evita cliques duplos acidentais
    window.plantarArvore(ultimoNivel);
  };
  cena.addEventListener('click', replantar);
  cena.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); replantar(); }
  });

  // ---- Início: planta quando a seção aparece na tela ----
  const nivelInicial = () => {
    const v = window.PLANTA_NIVEL ?? parseFloat(cena.dataset.nivel);
    return Number.isFinite(v) ? v : 90;
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { io.disconnect(); window.plantarArvore(nivelInicial()); }
    }, { threshold: .4 });
    io.observe(cena);
  } else window.plantarArvore(nivelInicial());
})();
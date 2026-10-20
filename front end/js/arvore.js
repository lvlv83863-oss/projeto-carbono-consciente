/* =========================================================
   CARBONO CONSCIENTE — arvore.js
   Árvore que cresce conforme a sequência de dias seguidos
   com registro de deslocamento.

   Regras:
   - Sequência = dias consecutivos com registro, contando até hoje
     (ou até ontem, se hoje ainda não foi registrado).
   - Último registro há 2+ dias  -> sequência rompida: reinicia (semente).
   - Último registro há 7+ dias  -> a árvore morre.
   - Voltou a registrar          -> nova semente, sequência recomeça em 1.

   Uso: window.Arvore.atualizar(listaDeRegistros)
   Cada registro precisa ter o campo "data" no formato YYYY-MM-DD.
   ========================================================= */
(function () {
  "use strict";

  const DIAS_PARA_ROMPER = 2; // último registro antes de ontem
  const DIAS_PARA_MORRER = 7; // dias sem registro até a árvore secar

  const FASES = [
    { id: "semente", min: 0 },
    { id: "broto", min: 1 },
    { id: "muda", min: 3 },
    { id: "jovem", min: 7 },
    { id: "frondosa", min: 14 },
    { id: "florida", min: 30 },
  ];

  const COPA = {
    muda: { h: 70, w: 5, r: 38, n: 14, flores: 0 },
    jovem: { h: 100, w: 8, r: 62, n: 34, flores: 0 },
    frondosa: { h: 120, w: 10, r: 86, n: 62, flores: 0 },
    florida: { h: 128, w: 12, r: 98, n: 84, flores: 10 },
  };

  const VERDES = ["#2e7d32", "#3f9a43", "#5aa65a", "#1f6b2a", "#4caf50"];
  const BASE = 270; // y do chão

  /* ---------- utilidades ---------- */
  function t(chave, vars, padrao) {
    if (window.i18n) {
      const r = window.i18n.t(chave, vars);
      if (r && r !== chave) return r;
    }
    return padrao;
  }

  function rng(semente) {
    let s = semente;
    return function () {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let x = Math.imul(s ^ (s >>> 15), 1 | s);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function diaNum(iso) {
    const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    return Date.UTC(a, m - 1, d) / 86400000;
  }

  function hojeNum() {
    const n = new Date();
    return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 86400000;
  }

  /* ---------- regra da sequência ---------- */
  function calcular(registros) {
    const dias = new Set(registros.map((r) => diaNum(r.data)));
    const hoje = hojeNum();
    const passados = [...dias].filter((d) => d <= hoje);
    if (!passados.length) return { estado: "vazio", streak: 0, gap: 0 };

    const ultimo = Math.max(...passados);
    const gap = hoje - ultimo;
    if (gap >= DIAS_PARA_MORRER) return { estado: "morta", streak: 0, gap };
    if (gap >= DIAS_PARA_ROMPER) return { estado: "rompida", streak: 0, gap };

    let streak = 0;
    for (let d = ultimo; dias.has(d); d--) streak++;
    return { estado: gap === 0 ? "viva" : "pendente", streak, gap };
  }

  function faseDe(streak) {
    let fase = FASES[0];
    FASES.forEach((f) => {
      if (streak >= f.min) fase = f;
    });
    return fase;
  }

  /* ---------- desenho ---------- */
  function chao() {
    const rnd = rng(7);
    let s =
      '<ellipse cx="150" cy="277" rx="104" ry="17" fill="#4b2e1a"/>' +
      '<ellipse cx="150" cy="272" rx="88" ry="10" fill="#3d6b2c"/>';
    for (let i = 0; i < 16; i++) {
      const x = 88 + rnd() * 124;
      const h = 8 + rnd() * 12;
      const inc = (rnd() - 0.5) * 8;
      s += `<path d="M${x.toFixed(1)} 274 q${(inc / 2).toFixed(1)} ${(-h / 2).toFixed(1)} ${inc.toFixed(1)} ${-h.toFixed(1)}" stroke="#2f7a34" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  }

  function tronco(h, w, cor) {
    const topo = BASE - h;
    return (
      `<path d="M${150 - w} ${BASE} C${150 - w * 0.8} ${BASE - h * 0.45} ${150 - w * 0.45} ${topo + h * 0.2} ${150 - w * 0.4} ${topo} ` +
      `L${150 + w * 0.4} ${topo} C${150 + w * 0.45} ${topo + h * 0.2} ${150 + w * 0.8} ${BASE - h * 0.45} ${150 + w} ${BASE} Z" fill="${cor}"/>` +
      `<path d="M150 ${BASE} L150 ${topo}" stroke="rgba(0,0,0,0.14)" stroke-width="${(w * 0.4).toFixed(1)}"/>`
    );
  }

  function semente() {
    return (
      '<ellipse cx="150" cy="268" rx="30" ry="9" fill="#5a3a22"/>' +
      '<ellipse cx="150" cy="261" rx="8" ry="5.5" fill="#9a6a3c"/>' +
      '<ellipse cx="148" cy="259.5" rx="2.6" ry="1.6" fill="rgba(255,255,255,0.45)"/>'
    );
  }

  function broto() {
    return (
      '<path d="M150 270 Q148 252 151 232" stroke="#5aa65a" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<g transform="translate(151 232) rotate(-38)"><ellipse class="arv-folha" style="--i:0" cx="-9" cy="0" rx="11" ry="5.5" fill="#5aa65a"/></g>' +
      '<g transform="translate(151 234) rotate(36)"><ellipse class="arv-folha" style="--i:2" cx="9" cy="0" rx="11" ry="5.5" fill="#3f9a43"/></g>'
    );
  }

  function copa(c) {
    const rnd = rng(42);
    const topo = BASE - c.h;
    const cy = topo - c.r * 0.2 + 8;
    const ry = c.r * 0.85;
    const escala = c.r < 50 ? 0.85 : 1;

    let ramos = "";
    if (c.r >= 60) {
      [[0.5, -1], [0.62, 1], [0.38, 1], [0.72, -1]].forEach(([alt, lado]) => {
        const y0 = BASE - c.h * alt;
        const x1 = 150 + lado * c.r * 0.8;
        const y1 = y0 - c.r * 0.35;
        ramos += `<path d="M150 ${y0.toFixed(1)} Q${(150 + lado * c.r * 0.4).toFixed(1)} ${(y0 - 4).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="#6b4226" stroke-width="${Math.max(2.5, c.w * 0.45).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
      });
    }

    const miolo = `<ellipse cx="150" cy="${cy.toFixed(1)}" rx="${(c.r * 0.82).toFixed(1)}" ry="${(ry * 0.78).toFixed(1)}" fill="#24702d"/>`;

    const folhas = [];
    for (let i = 0; i < c.n; i++) {
      const ang = rnd() * Math.PI * 2;
      const dist = Math.sqrt(rnd());
      folhas.push({
        x: 150 + Math.cos(ang) * dist * c.r,
        y: cy + Math.sin(ang) * dist * ry,
        rot: rnd() * 180,
        rx: (9 + rnd() * 5) * escala,
        ry: (4.5 + rnd() * 3) * escala,
        cor: VERDES[Math.floor(rnd() * VERDES.length)],
      });
    }
    folhas.sort((a, b) => a.y - b.y);
    const folhasSvg = folhas
      .map(
        (f, i) =>
          `<g transform="translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.rot.toFixed(0)})"><ellipse class="arv-folha" style="--i:${i}" rx="${f.rx.toFixed(1)}" ry="${f.ry.toFixed(1)}" fill="${f.cor}"/></g>`
      )
      .join("");

    let flores = "";
    for (let i = 0; i < c.flores; i++) {
      const ang = rnd() * Math.PI * 2;
      const dist = Math.sqrt(rnd()) * 0.85;
      const x = 150 + Math.cos(ang) * dist * c.r;
      const y = cy + Math.sin(ang) * dist * ry;
      let petalas = "";
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        petalas += `<circle cx="${(Math.cos(a) * 4).toFixed(1)}" cy="${(Math.sin(a) * 4).toFixed(1)}" r="3.2" fill="#e8c9ff"/>`;
      }
      flores += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="arv-flor" style="--i:${i}">${petalas}<circle r="2.4" fill="#ffcf5a"/></g></g>`;
    }

    let vagalumes = "";
    if (c.flores) {
      for (let i = 0; i < 6; i++) {
        const x = 150 + (rnd() - 0.5) * c.r * 2.1;
        const y = cy + (rnd() - 0.2) * ry * 1.5;
        vagalumes += `<circle class="arv-vagalume" style="--i:${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#ffe9a0"/>`;
      }
    }

    return `<g class="arv-copa">${ramos}${miolo}${folhasSvg}${flores}</g>${vagalumes}`;
  }

  function morta() {
    const segmentos = [
      [150, 172, 112, 142, 5], [112, 142, 92, 118, 3], [112, 142, 104, 112, 3],
      [150, 160, 192, 132, 5], [192, 132, 214, 116, 3], [192, 132, 200, 104, 3],
      [150, 150, 150, 100, 5], [150, 100, 136, 78, 3], [150, 100, 166, 74, 3],
    ];
    const galhos = segmentos
      .map(([x1, y1, x2, y2, w]) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#6e5a4a" stroke-width="${w}" stroke-linecap="round"/>`)
      .join("");
    const secas = [[92, 118, 20], [214, 116, -30], [136, 78, 40], [166, 74, -50], [104, 112, 10]]
      .map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="7" ry="3.4" fill="#a58b5b"/></g>`)
      .join("");
    const caidas = [[112, 276, 15], [186, 278, -20], [145, 281, 40]]
      .map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="7" ry="3" fill="#8f7648"/></g>`)
      .join("");
    return (
      tronco(120, 10, "#6e5a4a") +
      galhos +
      secas +
      caidas +
      '<g transform="translate(176 150)"><g class="arv-cai"><ellipse rx="7" ry="3.4" fill="#a58b5b"/></g></g>'
    );
  }

  function montar(fase, estaMorta, rotulo) {
    let corpo;
    if (estaMorta) corpo = morta();
    else if (fase.id === "semente") corpo = semente();
    else if (fase.id === "broto") corpo = broto();
    else {
      const c = COPA[fase.id];
      corpo = tronco(c.h, c.w, "#7a4e2d") + copa(c);
    }
    return `<svg class="arv-svg" viewBox="0 0 300 300" role="img" aria-label="${rotulo}">${chao()}<g class="arv-planta">${corpo}</g></svg>`;
  }

  /* ---------- textos ---------- */
  function legenda(info, fase) {
    if (info.estado === "vazio")
      return t("painel.arvore.vazio", null, "Registre seu primeiro deslocamento para plantar a semente.");
    if (info.estado === "rompida")
      return t("painel.arvore.rompida", { dias: info.gap }, `Sua sequência foi rompida há ${info.gap} dias. Registre hoje para plantar uma nova semente.`);
    if (info.estado === "morta")
      return t("painel.arvore.morta", { dias: info.gap }, `Sua árvore secou após ${info.gap} dias sem registros. Registre um deslocamento para começar de novo.`);
    const padroes = {
      broto: "Um broto nasceu! Continue registrando todo dia.",
      muda: "Sua muda está firme e crescendo.",
      jovem: "Uma árvore jovem, cheia de folhas novas.",
      frondosa: "Uma árvore frondosa. Seus hábitos estão incríveis!",
      florida: "Uma árvore frondosa em flor. Seus hábitos estão incríveis!",
    };
    return t(`painel.arvore.fase_${fase.id}`, null, padroes[fase.id]);
  }

  function dica(info, fase, prox) {
    if (info.estado === "pendente")
      return t("painel.arvore.dica_pendente", null, "Registre hoje para manter a sequência!");
    if (info.estado === "viva") {
      if (!prox) return t("painel.arvore.dica_maxima", null, "Fase máxima alcançada. Continue assim!");
      const falta = prox.min - info.streak;
      return t("painel.arvore.dica_falta", { dias: falta }, `Faltam ${falta} ${falta === 1 ? "dia" : "dias"} para a próxima fase.`);
    }
    return t("painel.arvore.dica_reinicio", null, "Cada dia seguido faz a árvore crescer.");
  }

  /* ---------- atualização da interface ---------- */
  let ultimaChave = null;

  function atualizar(registros) {
    const card = document.getElementById("painel-arvore");
    if (!card) return;
    const palco = document.getElementById("arvore-palco");

    const info = calcular(registros || []);
    const fase = faseDe(info.streak);
    const idx = FASES.indexOf(fase);
    const prox = FASES[idx + 1];
    const estaMorta = info.estado === "morta";

    card.dataset.estado = info.estado;
    card.dataset.fase = fase.id;

    const textoLegenda = legenda(info, fase);
    const chave = `${info.estado}|${fase.id}`;
    if (chave !== ultimaChave) {
      palco.innerHTML = montar(fase, estaMorta, textoLegenda);
      ultimaChave = chave;
    }

    document.getElementById("arvore-dias").textContent = info.streak;
    document.getElementById("arvore-dias-rotulo").textContent =
      info.streak === 1 ? t("painel.arvore.dia_seguido", null, "dia seguido") : t("painel.arvore.dias_seguidos", null, "dias seguidos");
    document.getElementById("arvore-legenda").textContent = textoLegenda;
    document.getElementById("arvore-dica").textContent = dica(info, fase, prox);

    const progresso = prox ? (info.streak - fase.min) / (prox.min - fase.min) : 1;
    document.getElementById("arvore-barra").style.width = `${Math.round(Math.max(0, Math.min(1, progresso)) * 100)}%`;
  }

  // Clique na árvore: reproduz a animação de crescimento.
  document.addEventListener("click", (e) => {
    const palco = e.target.closest("#arvore-palco");
    if (!palco) return;
    const html = palco.innerHTML;
    palco.innerHTML = "";
    void palco.offsetWidth;
    palco.innerHTML = html;
  });

  window.Arvore = { atualizar, calcular };
})();
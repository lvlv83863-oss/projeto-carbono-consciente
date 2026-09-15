/* =========================================================
   CARBONO CONSCIENTE — globo.js
   Globo interativo em <canvas> (porte para JS puro do
   componente Globe em React/TypeScript): partículas por
   continente, arcos animados entre países, 6 hotspots
   clicáveis com dados reais de emissão per capita, painel
   de detalhes e legenda de intensidade.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- DADOS GEOGRÁFICOS (contorno aproximado dos continentes) ---------- */
  const CONTINENT_POLYGONS = [
    // América do Norte
    [[71,-141],[55,-130],[48,-124],[38,-122],[30,-117],[22,-105],[16,-94],[10,-84],[8,-77],[14,-68],[20,-72],[25,-80],[30,-81],[35,-77],[40,-74],[45,-67],[48,-54],[55,-60],[62,-68],[70,-85],[72,-105],[78,-130],[78,-141]],
    // América do Sul
    [[-5,-80],[-10,-76],[-18,-70],[-28,-70],[-38,-63],[-50,-68],[-55,-65],[-52,-58],[-40,-62],[-30,-50],[-22,-43],[-14,-39],[-5,-35],[5,-52],[8,-60],[5,-72],[-5,-80]],
    // Europa
    [[36,10],[38,2],[44,-8],[50,-5],[55,-2],[58,5],[64,14],[70,26],[68,40],[62,30],[56,22],[52,20],[48,18],[44,26],[40,24],[36,26],[34,18],[36,10]],
    // África
    [[36,10],[34,0],[20,-17],[5,-15],[-3,-10],[-18,12],[-34,18],[-34,26],[-20,35],[-4,40],[10,42],[18,42],[28,34],[36,22],[38,16],[36,10]],
    // Ásia
    [[70,30],[68,60],[68,100],[68,140],[58,140],[50,140],[40,128],[28,120],[22,110],[10,105],[0,104],[-5,106],[5,82],[16,74],[26,62],[32,48],[40,50],[52,50],[62,60],[70,30]],
    // Oceania
    [[-16,130],[-24,114],[-34,117],[-38,140],[-38,148],[-28,154],[-18,148],[-14,136],[-16,130]],
  ];

  /* ---------- DADOS REAIS — Emissões de carbono por país ----------
     Fonte: Global Carbon Budget / Our World in Data, 2024 (ano-base 2024).
     Estes são os únicos 6 países com dados no projeto — por isso são os
     únicos pontos clicáveis do globo (sem GeoJSON de fronteiras reais). */
  const CITIES = [
    { lat: 39.8,  lng: -98.6,  label: "Estados Unidos", iso: "US", continent: "América do Norte", tonYear: 14.20, kgDay: 38.90, kgWeek: 273.08, kgMonth: 1183.33 },
    { lat: -15.8, lng: -47.9,  label: "Brasil",         iso: "BR", continent: "América do Sul",    tonYear: 2.28,  kgDay: 6.25,  kgWeek: 43.85,  kgMonth: 190.00 },
    { lat: 51.2,  lng: 10.4,   label: "Alemanha",       iso: "DE", continent: "Europa",             tonYear: 6.77,  kgDay: 18.55, kgWeek: 130.19, kgMonth: 564.17 },
    { lat: 9.1,   lng: 7.5,    label: "Nigéria",        iso: "NG", continent: "África",             tonYear: 0.58,  kgDay: 1.59,  kgWeek: 11.15,  kgMonth: 48.33 },
    { lat: 35.9,  lng: 104.2,  label: "China",          iso: "CN", continent: "Ásia",                tonYear: 8.66,  kgDay: 23.73, kgWeek: 166.54, kgMonth: 721.67 },
    { lat: -25.3, lng: 133.8,  label: "Austrália",      iso: "AU", continent: "Oceania",             tonYear: 14.48, kgDay: 39.67, kgWeek: 278.46, kgMonth: 1206.67 },
  ];

  const RANKED_CITIES = CITIES.slice().sort((a, b) => b.tonYear - a.tonYear);
  const rankOf = (iso) => RANKED_CITIES.findIndex((c) => c.iso === iso) + 1;
  const maxTonYear = Math.max.apply(null, CITIES.map((c) => c.tonYear));
  const minTonYear = Math.min.apply(null, CITIES.map((c) => c.tonYear));

  const ARCS = [
    { a: [-15.8, -47.9], b: [39.8, -98.6] },
    { a: [39.8, -98.6],  b: [51.2, 10.4] },
    { a: [51.2, 10.4],   b: [9.1, 7.5] },
    { a: [9.1, 7.5],     b: [35.9, 104.2] },
    { a: [35.9, 104.2],  b: [-25.3, 133.8] },
    { a: [-25.3, 133.8], b: [-15.8, -47.9] },
  ];

  /* ---------- FUNÇÕES GEOMÉTRICAS ---------- */
  function pointInPoly(lat, lng, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const yi = poly[i][0], xi = poly[i][1];
      const yj = poly[j][0], xj = poly[j][1];
      if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function distDeg(lat1, lng1, lat2, lng2) {
    return Math.hypot(lat1 - lat2, lng1 - lng2);
  }

  function nearHotspot(lat, lng) {
    for (const c of CITIES) {
      if (distDeg(lat, lng, c.lat, c.lng) < 14) return true;
    }
    return false;
  }

  /* Partículas pré-computadas uma única vez (compartilhadas por qualquer
     instância do globo na página) — pontos "hot" perto dos 6 países com
     dados brilham mais, como manchas de luz de cidade. */
  let cachedParticles = null;
  function getParticles() {
    if (cachedParticles) return cachedParticles;
    const pts = [];
    for (let attempt = 0; pts.length < 6500 && attempt < 600000; attempt++) {
      const lat = Math.random() * 160 - 70;
      const lng = Math.random() * 360 - 180;
      for (const poly of CONTINENT_POLYGONS) {
        if (pointInPoly(lat, lng, poly)) {
          const hot = nearHotspot(lat, lng);
          pts.push({
            lat, lng,
            size: hot ? (Math.random() < 0.35 ? 2.0 : 1.2) : (Math.random() < 0.08 ? 1.4 : 0.8),
            alpha: hot ? 0.65 + Math.random() * 0.35 : 0.2 + Math.random() * 0.35,
            hot,
          });
          break;
        }
      }
    }
    for (const poly of CONTINENT_POLYGONS) {
      for (let i = 0; i < poly.length - 1; i++) {
        const la = poly[i][0], lo = poly[i][1];
        const la2 = poly[i + 1][0], lo2 = poly[i + 1][1];
        const steps = Math.ceil(Math.hypot(la2 - la, lo2 - lo) * 3.5);
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const lat = la + (la2 - la) * t + (Math.random() - 0.5) * 0.7;
          const lng = lo + (lo2 - lo) * t + (Math.random() - 0.5) * 0.7;
          pts.push({ lat, lng, size: 1.1 + Math.random() * 0.5, alpha: 0.35 + Math.random() * 0.2, hot: false });
        }
      }
    }
    cachedParticles = pts;
    return pts;
  }

  function toXYZ(lat, lng, R) {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    return {
      x: -R * Math.sin(phi) * Math.cos(theta),
      y: R * Math.cos(phi),
      z: R * Math.sin(phi) * Math.sin(theta),
    };
  }

  function rotPt(p, rx, ry) {
    const x = p.x * Math.cos(ry) + p.z * Math.sin(ry);
    const z = -p.x * Math.sin(ry) + p.z * Math.cos(ry);
    const y2 = p.y * Math.cos(rx) - z * Math.sin(rx);
    const z2 = p.y * Math.sin(rx) + z * Math.cos(rx);
    return { x, y: y2, z: z2 };
  }

  function slerpXYZ(a, b, t, R) {
    const A = toXYZ(a[0], a[1], R);
    const B = toXYZ(b[0], b[1], R);
    const dot = Math.max(-1, Math.min(1, (A.x * B.x + A.y * B.y + A.z * B.z) / (R * R)));
    const omega = Math.acos(dot);
    if (Math.abs(omega) < 0.001) return A;
    const s0 = Math.sin((1 - t) * omega) / Math.sin(omega);
    const s1 = Math.sin(t * omega) / Math.sin(omega);
    return { x: A.x * s0 + B.x * s1, y: A.y * s0 + B.y * s1, z: A.z * s0 + B.z * s1 };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /* Intensidade (0..1) proporcional à emissão per capita, normalizada
     entre o menor (Nigéria) e o maior (Austrália) valor da tabela. */
  function emissionIntensity(tonYear) {
    if (maxTonYear === minTonYear) return 0.5;
    return (tonYear - minTonYear) / (maxTonYear - minTonYear);
  }

  /* Paleta 100% alinhada aos tokens do site: claro = verde, escuro = roxo. */
  function getCol(dark) {
    return {
      particle:   dark ? [140, 90, 200] : [22, 163, 74],
      particleHi: dark ? [235, 215, 255] : [190, 255, 205],
      arc:        dark ? [225, 210, 255] : [60, 150, 90],
      arcA:       dark ? "rgba(200,170,255," : "rgba(60,150,90,",
      city:       dark ? "#f5eaff" : "#eafff0",
      cityHover:  "#ffffff",
      cityA:      dark ? "rgba(216,180,255," : "rgba(34,197,94,",
      label:      dark ? "rgba(245,238,255," : "rgba(8,30,12,",
      labelBg:    dark ? "rgba(14,4,32," : "rgba(240,255,244,",
      glow:       dark ? "rgba(70,20,140,0.22)" : "rgba(22,163,74,0.10)",
    };
  }

  /* ---------- MONTAGEM DE UMA INSTÂNCIA DO GLOBO ---------- */
  function montarGlobo(wrap) {
    wrap.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.className = "globo-canvas";
    canvas.width = 520;
    canvas.height = 520;
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Globo interativo de emissões de carbono. Arraste para girar, role para aproximar e toque nos pontos em destaque para ver dados de cada país."
    );
    wrap.appendChild(canvas);

    const legenda = document.createElement("div");
    legenda.className = "globo-legenda";
    legenda.innerHTML =
      '<span>Emissão per capita</span>' +
      '<div class="linha">' +
      "<span>Baixa</span>" +
      '<div class="pontos">' +
      [0.25, 0.5, 0.75, 1]
        .map((s) => `<span class="ponto" style="width:${5 + s * 6}px;height:${5 + s * 6}px;opacity:${0.4 + s * 0.6}"></span>`)
        .join("") +
      "</div>" +
      "<span>Alta</span>" +
      "</div>";
    wrap.appendChild(legenda);

    const painel = document.createElement("div");
    painel.className = "globo-painel";
    painel.style.display = "none";
    painel.setAttribute("role", "dialog");
    wrap.appendChild(painel);

    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height, CX = W / 2, CY = H / 2;
    const particles = getParticles();
    const arcProgress = ARCS.map((_, i) => ({ p: i / ARCS.length, spd: 0.003 + Math.random() * 0.002 }));

    const st = { rotY: 0.5, rotX: -0.15, velX: 0, velY: 0, dragging: false, lx: 0, ly: 0, moved: false, zoom: 1 };
    let hoveredIso = null;
    let selectedIso = null;
    let cityScreenPos = {};
    let rafId = null;

    function temaAtual() {
      return document.documentElement.getAttribute("data-theme") === "escuro";
    }

    function fecharPainel() {
      selectedIso = null;
      painel.style.display = "none";
      painel.innerHTML = "";
    }

    function abrirPainel(city) {
      selectedIso = city.iso;
      painel.style.display = "block";
      painel.innerHTML =
        '<div class="painel-topo">' +
        `<div class="painel-nome">${city.label}</div>` +
        '<button class="painel-fechar" aria-label="Fechar painel">×</button>' +
        "</div>" +
        `<div class="painel-continente">${city.continent}</div>` +
        '<div class="painel-dados">' +
        `<div><span>Emissão per capita: </span>${city.tonYear.toFixed(2).replace(".", ",")} t/ano</div>` +
        `<div><span>Equivalente diário: </span>${city.kgDay.toFixed(2).replace(".", ",")} kg/dia</div>` +
        `<div><span>Equivalente semanal: </span>${city.kgWeek.toFixed(2).replace(".", ",")} kg/sem</div>` +
        `<div><span>Equivalente mensal: </span>${city.kgMonth.toFixed(2).replace(".", ",")} kg/mês</div>` +
        `<div class="painel-rank" style="margin-top:6px;"><span>Posição no ranking (dos 6 países da pesquisa): </span><strong>${rankOf(city.iso)}º</strong></div>` +
        "</div>" +
        '<div class="painel-fonte">Estimativa baseada em dados territoriais de CO₂ fóssil per capita (Global Carbon Budget / Our World in Data, 2024). Ano-base: 2024.</div>';
      painel.querySelector(".painel-fechar").addEventListener("click", fecharPainel);
    }

    function draw() {
      const R = Math.min(W, H) * 0.41 * st.zoom;
      ctx.clearRect(0, 0, W, H);
      const dark = temaAtual();
      const col = getCol(dark);

      // Glow de fundo
      const g = ctx.createRadialGradient(CX, CY, R * 0.05, CX, CY, R * 1.2);
      g.addColorStop(0, col.glow); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, R * 1.2, 0, Math.PI * 2); ctx.fill();

      // Silhueta da esfera
      const sphereGrad = ctx.createRadialGradient(CX - R * 0.3, CY - R * 0.35, R * 0.1, CX, CY, R * 1.02);
      if (dark) {
        sphereGrad.addColorStop(0, "rgba(35,14,60,0.55)");
        sphereGrad.addColorStop(1, "rgba(4,1,14,0.92)");
      } else {
        sphereGrad.addColorStop(0, "rgba(225,245,232,0.55)");
        sphereGrad.addColorStop(1, "rgba(200,235,210,0.25)");
      }
      ctx.fillStyle = sphereGrad;
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.fill();

      // Partículas dos continentes
      for (const p of particles) {
        const xyz = rotPt(toXYZ(p.lat, p.lng, R), st.rotX, st.rotY);
        if (xyz.z < 5) continue;
        const fade = Math.min(1, (xyz.z + R) / (R * 1.5));
        const a = (p.alpha * fade).toFixed(2);
        const rgb = p.hot ? col.particleHi : col.particle;
        const sx = CX + xyz.x, sy = CY - xyz.y;
        if (p.hot && dark) {
          ctx.save();
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`;
          ctx.beginPath(); ctx.arc(sx, sy, p.size * 0.68, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(sx, sy, p.size * 0.68, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; ctx.fill();
        }
      }

      // Arcos animados entre países
      for (let i = 0; i < ARCS.length; i++) {
        const arc = ARCS[i];
        arcProgress[i].p = (arcProgress[i].p + arcProgress[i].spd) % 1.4;
        const t = Math.min(arcProgress[i].p, 1);
        if (t <= 0) continue;
        const STEPS = 55;
        const endS = Math.floor(t * STEPS);
        ctx.save();
        ctx.shadowBlur = 10; ctx.shadowColor = col.arcA + "0.6)";
        ctx.strokeStyle = `rgba(${col.arc.join(",")},0.55)`; ctx.lineWidth = 1.1;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= endS; s++) {
          const pt = rotPt(slerpXYZ(arc.a, arc.b, s / STEPS, R), st.rotX, st.rotY);
          if (pt.z < 0) { started = false; continue; }
          if (!started) { ctx.moveTo(CX + pt.x, CY - pt.y); started = true; }
          else ctx.lineTo(CX + pt.x, CY - pt.y);
        }
        ctx.stroke();
        if (endS > 0 && endS < STEPS) {
          const hd = rotPt(slerpXYZ(arc.a, arc.b, endS / STEPS, R), st.rotX, st.rotY);
          if (hd.z > 0) {
            ctx.shadowBlur = 20; ctx.fillStyle = `rgba(${col.arc.join(",")},1)`;
            ctx.beginPath(); ctx.arc(CX + hd.x, CY - hd.y, 3.5, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.restore();
      }

      // Países com dados (hotspots clicáveis)
      const screenPos = {};
      for (const city of CITIES) {
        const xyz = rotPt(toXYZ(city.lat, city.lng, R), st.rotX, st.rotY);
        const visible = xyz.z >= 10;
        const sx = CX + xyz.x, sy = CY - xyz.y;
        screenPos[city.iso] = { sx, sy, visible };
        if (!visible) continue;

        const isHover = hoveredIso === city.iso;
        const isSelected = selectedIso === city.iso;
        const intensity = emissionIntensity(city.tonYear);
        const baseRadius = 3 + intensity * 3;
        const radius = isHover || isSelected ? baseRadius + 2 : baseRadius;

        const pulse = (Date.now() / 1000) % 2;
        for (let ring = 0; ring < 2; ring++) {
          const rp = (pulse + ring) % 2;
          const ringR = radius + 4 + rp * (14 + intensity * 6);
          const ringA = Math.max(0, 0.35 - rp * 0.18) * (isSelected || isHover ? 1.4 : 1);
          if (ringA <= 0.01) continue;
          ctx.beginPath();
          ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = col.cityA + ringA.toFixed(2) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.save();
        ctx.shadowBlur = isHover || isSelected ? 28 : 16 + intensity * 12;
        ctx.shadowColor = col.cityA + (isHover || isSelected ? "1)" : "0.9)");
        ctx.fillStyle = isHover || isSelected ? col.cityHover : col.city;
        ctx.beginPath(); ctx.arc(sx, sy, radius, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = col.cityA + (isSelected ? "0.85)" : "0.45)");
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath(); ctx.arc(sx, sy, radius + (isSelected ? 7 : 4), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        if (!selectedIso || isSelected) {
          const lx = sx + 12, ly = sy - 15;
          const boxW = 104;
          ctx.fillStyle = col.labelBg + "0.84)"; ctx.strokeStyle = col.cityA + "0.4)"; ctx.lineWidth = 1;
          roundRect(ctx, lx, ly, boxW, 32, 6); ctx.fill(); ctx.stroke();
          ctx.fillStyle = col.city; ctx.font = 'bold 10px "IBM Plex Mono",monospace';
          ctx.fillText(`${city.kgDay.toFixed(2).replace(".", ",")} kg/dia`, lx + 7, ly + 12);
          ctx.fillStyle = col.label + "0.7)"; ctx.font = '9px "IBM Plex Mono",monospace';
          ctx.fillText(city.label, lx + 7, ly + 24);
        }
      }
      cityScreenPos = screenPos;
    }

    function loop() {
      if (!st.dragging) {
        st.velX *= 0.94; st.velY *= 0.94;
        st.rotY += 0.0025 + st.velY;
        st.rotX = Math.max(-0.55, Math.min(0.55, st.rotX + st.velX));
      }
      draw();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    /* ---------- INTERAÇÃO (mouse + toque via Pointer Events) ---------- */
    function hitTestCity(x, y) {
      let best = null, bestDist = 16;
      for (const iso of Object.keys(cityScreenPos)) {
        const p = cityScreenPos[iso];
        if (!p.visible) continue;
        const d = Math.hypot(p.sx - x, p.sy - y);
        if (d < bestDist) { bestDist = d; best = iso; }
      }
      return best;
    }

    function getLocal(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    canvas.addEventListener("pointerdown", (e) => {
      const p = getLocal(e.clientX, e.clientY);
      st.dragging = true; st.lx = p.x; st.ly = p.y; st.velX = 0; st.velY = 0; st.moved = false;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener("pointermove", (e) => {
      const p = getLocal(e.clientX, e.clientY);
      if (st.dragging) {
        if (Math.hypot(p.x - st.lx, p.y - st.ly) > 3) st.moved = true;
        st.velY = (p.x - st.lx) * 0.006; st.velX = (p.y - st.ly) * 0.006;
        st.rotY += st.velY; st.rotX = Math.max(-0.55, Math.min(0.55, st.rotX + st.velX));
        st.lx = p.x; st.ly = p.y;
        return;
      }
      const iso = hitTestCity(p.x, p.y);
      hoveredIso = iso;
      canvas.style.cursor = iso ? "pointer" : "grab";
    });

    canvas.addEventListener("pointerup", (e) => {
      const p = getLocal(e.clientX, e.clientY);
      st.dragging = false;
      if (!st.moved) {
        const iso = hitTestCity(p.x, p.y);
        if (iso) {
          const city = CITIES.find((c) => c.iso === iso);
          if (city) abrirPainel(city);
        }
      }
    });

    canvas.addEventListener("pointerleave", () => { hoveredIso = null; });

    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.06 : 0.06;
        st.zoom = Math.max(0.7, Math.min(1.6, st.zoom + delta));
      },
      { passive: false }
    );

    // Encerra o loop se o globo for removido do DOM (evita vazamento de memória)
    const observadorRemocao = new MutationObserver(() => {
      if (!document.body.contains(canvas)) {
        cancelAnimationFrame(rafId);
        observadorRemocao.disconnect();
      }
    });
    observadorRemocao.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- INICIALIZAÇÃO ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".globo-wrap").forEach(montarGlobo);
  });
})();

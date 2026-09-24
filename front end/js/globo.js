/* =========================================================
   CARBONO CONSCIENTE — globo.js
   Globo 3D (WebGL, via globe.gl/three.js) com o contorno real
   dos países do mundo e emissão de CO₂ per capita de ~169
   países. Clique simples abre um painel com os dados do país;
   dois cliques seguidos no mesmo país colocam o globo em modo
   destaque (overlay), liberando espaço para girar/aproximar e
   explorar as informações com calma.
   ========================================================= */

(function () {
  "use strict";

  const URL_PAISES = "../data/paises.geojson";
  const URL_EMISSOES = "../data/emissoes.json";

  /* ---------- Carregamento de dados (compartilhado entre instâncias) ---------- */
  let promessaDados = null;
  function carregarDados() {
    if (!promessaDados) {
      promessaDados = Promise.all([
        fetch(URL_PAISES).then((r) => r.json()),
        fetch(URL_EMISSOES).then((r) => r.json()),
      ]).then(([geojson, emissoes]) => ({
        features: geojson.features,
        emissoes,
      }));
    }
    return promessaDados;
  }

  /* ISO_A3 do país, com fallback para ADM0_A3 (o Natural Earth marca
     alguns países, como França e Noruega, com ISO_A3 = "-99"). */
  function isoDoPais(feature) {
    const p = feature.properties || {};
    return p.ISO_A3 && p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3;
  }

  function centroideAproximado(feature) {
    const anel =
      feature.geometry.type === "Polygon"
        ? feature.geometry.coordinates[0]
        : feature.geometry.coordinates.reduce((maior, poly) => (poly[0].length > maior.length ? poly[0] : maior), feature.geometry.coordinates[0][0]);
    let sx = 0, sy = 0;
    for (const [x, y] of anel) { sx += x; sy += y; }
    return { lng: sx / anel.length, lat: sy / anel.length };
  }

  function normalizarTexto(texto) {
    return (texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  function fmt(n) {
    return n.toFixed(2).replace(".", ",");
  }

  function corRgba(rgb, a) {
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  }

  function hexParaRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || "").trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128];
  }

  /* Lê os mesmos tokens de cor (CSS custom properties) usados no resto do
     site, para que o degradê do globo siga exatamente a identidade visual
     das outras seções (verde no tema claro, roxo no tema escuro). */
  function tokensDeCor() {
    const s = getComputedStyle(document.documentElement);
    return {
      baixo: hexParaRgb(s.getPropertyValue("--cor-fundo-alt")),
      alto: hexParaRgb(s.getPropertyValue("--cor-principal")),
      principal: s.getPropertyValue("--cor-principal").trim(),
      linha: s.getPropertyValue("--globo-linhas").trim(),
    };
  }

  function corPorIntensidade(t, tokens) {
    return [0, 1, 2].map((i) => Math.round(tokens.baixo[i] + (tokens.alto[i] - tokens.baixo[i]) * t));
  }

  /* ---------- MONTAGEM DE UMA INSTÂNCIA DO GLOBO ---------- */
  function montarGlobo(wrap) {
    wrap.innerHTML = "";
    const decorativo = wrap.dataset.decorativo === "true";

    const globoDiv = document.createElement("div");
    globoDiv.className = "globo-3d";
    wrap.appendChild(globoDiv);

    // A versão decorativa (globo da tela de login) fica só com a esfera
    // girando — sem legenda, painel de dados ou botão de foco, que não
    // fazem sentido ali (ela não é clicável).
    if (decorativo) return montarDecorativo(wrap, globoDiv);

    const legenda = document.createElement("div");
    legenda.className = "globo-legenda";
    legenda.innerHTML =
      "<span>Emissão per capita</span>" +
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

    const botaoFecharFoco = document.createElement("button");
    botaoFecharFoco.className = "globo-fechar-foco";
    botaoFecharFoco.setAttribute("aria-label", "Sair do modo destaque");
    botaoFecharFoco.textContent = "×";
    botaoFecharFoco.style.display = "none";
    wrap.appendChild(botaoFecharFoco);

    // Busca por país — só aparece no modo destaque (CSS cuida da exibição).
    const buscaWrap = document.createElement("div");
    buscaWrap.className = "globo-busca";
    buscaWrap.innerHTML =
      '<input type="text" placeholder="Buscar país..." aria-label="Buscar país no globo" autocomplete="off">' +
      '<div class="globo-busca-resultados"></div>';
    wrap.appendChild(buscaWrap);
    const campoBusca = buscaWrap.querySelector("input");
    const resultadosBusca = buscaWrap.querySelector(".globo-busca-resultados");

    /* ---------- estado ---------- */
    let world = null;
    let featuresCarregadas = [];
    let emissoesPorIso = {};
    let rankedIsos = [];
    let minTon = 0, maxTon = 1;
    let selecionadoIso = null;
    let hoverIso = null;
    let featureAtual = null;
    let tokens = tokensDeCor();
    let emFoco = false;
    let backdrop = null;
    const paiOriginal = wrap.parentNode;
    const irmaoOriginal = wrap.nextSibling;

    function temaAtual() {
      return document.documentElement.getAttribute("data-theme") === "escuro";
    }

    function normalizar(tonYear) {
      if (maxTon === minTon) return 0.5;
      return (tonYear - minTon) / (maxTon - minTon);
    }

    function rankOf(iso) {
      const idx = rankedIsos.indexOf(iso);
      return idx === -1 ? null : idx + 1;
    }

    function corPais(feature) {
      const iso = isoDoPais(feature);
      const dado = emissoesPorIso[iso];
      const base = dado ? corPorIntensidade(normalizar(dado.tonYear), tokens) : tokens.baixo;
      const a = iso === selecionadoIso || iso === hoverIso ? 0.98 : dado ? 0.88 : 0.6;
      return corRgba(base, a);
    }

    function alturaPais(feature) {
      const iso = isoDoPais(feature);
      if (iso === selecionadoIso) return 0.045;
      if (iso === hoverIso) return 0.02;
      return 0.006;
    }

    function atualizarCamada() {
      if (world) world.polygonAltitude(alturaPais).polygonCapColor(corPais);
    }

    function nomeDoPais(feature) {
      const dado = emissoesPorIso[isoDoPais(feature)];
      return (dado && dado.nome) || feature.properties.NAME || "";
    }

    function rotuloPais(feature) {
      const dado = emissoesPorIso[isoDoPais(feature)];
      const nome = nomeDoPais(feature);
      if (!dado) return `<div class="globo-tooltip"><strong>${nome}</strong><br>sem dados de CO₂</div>`;
      return `<div class="globo-tooltip"><strong>${nome}</strong><br>${fmt(dado.tonYear)} t/ano por pessoa</div>`;
    }

    function fecharPainel() {
      selecionadoIso = null;
      painel.style.display = "none";
      painel.innerHTML = "";
      atualizarCamada();
      if (world) world.controls().autoRotate = true;
    }

    function abrirPainel(feature) {
      const iso = isoDoPais(feature);
      const dado = emissoesPorIso[iso];
      selecionadoIso = iso;
      painel.style.display = "block";

      if (!dado) {
        painel.innerHTML =
          '<div class="painel-topo">' +
          `<div class="painel-nome">${feature.properties.NAME || "Território"}</div>` +
          '<button class="painel-fechar" aria-label="Fechar painel">×</button>' +
          "</div>" +
          '<div class="painel-fonte">Sem dados de emissão de CO₂ per capita disponíveis para este território.</div>';
      } else {
        painel.innerHTML =
          '<div class="painel-topo">' +
          `<div class="painel-nome">${dado.nome}</div>` +
          '<button class="painel-fechar" aria-label="Fechar painel">×</button>' +
          "</div>" +
          `<div class="painel-continente">${dado.continente}</div>` +
          '<div class="painel-dados">' +
          `<div><span>Emissão per capita: </span>${fmt(dado.tonYear)} t/ano</div>` +
          `<div><span>Equivalente diário: </span>${fmt(dado.kgDay)} kg/dia</div>` +
          `<div><span>Equivalente semanal: </span>${fmt(dado.kgWeek)} kg/sem</div>` +
          `<div><span>Equivalente mensal: </span>${fmt(dado.kgMonth)} kg/mês</div>` +
          `<div class="painel-rank" style="margin-top:6px;"><span>Posição no ranking (de ${rankedIsos.length} países): </span><strong>${rankOf(iso)}º</strong></div>` +
          "</div>" +
          '<div class="painel-fonte">Estimativa de CO₂ fóssil per capita (Global Carbon Budget / Our World in Data, ano-base 2024).</div>';
      }
      painel.querySelector(".painel-fechar").addEventListener("click", fecharPainel);
      atualizarCamada();
      if (world) world.controls().autoRotate = false;
    }

    function redimensionar() {
      if (!world) return;
      const r = globoDiv.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) world.width(r.width).height(r.height);
    }

    function onEsc(e) { if (e.key === "Escape") sairFoco(); }

    function entrarFoco(feature) {
      if (emFoco) return;
      emFoco = true;

      wrap.style.transform = ""; // limpa qualquer parallax aplicado por efeitos.js
      backdrop = document.createElement("div");
      backdrop.className = "globo-backdrop";
      document.body.appendChild(backdrop);
      document.body.appendChild(wrap);
      wrap.classList.add("em-foco");
      botaoFecharFoco.style.display = "flex";

      requestAnimationFrame(() => {
        backdrop.classList.add("ativo");
        wrap.classList.add("ativo");
        redimensionar();
        if (feature) {
          const { lat, lng } = centroideAproximado(feature);
          world.pointOfView({ lat, lng, altitude: 1.6 }, 900);
        }
        // a caixa ainda está em transição de tamanho (CSS) neste ponto;
        // remede assim que ela terminar de crescer para o WebGL preencher certo.
        setTimeout(redimensionar, 340);
      });

      document.addEventListener("keydown", onEsc);
      backdrop.addEventListener("click", sairFoco);
    }

    function sairFoco() {
      if (!emFoco) return;
      emFoco = false;
      wrap.classList.remove("ativo");
      if (backdrop) backdrop.classList.remove("ativo");
      document.removeEventListener("keydown", onEsc);

      setTimeout(() => {
        wrap.classList.remove("em-foco");
        botaoFecharFoco.style.display = "none";
        if (irmaoOriginal && irmaoOriginal.parentNode === paiOriginal) {
          paiOriginal.insertBefore(wrap, irmaoOriginal);
        } else {
          paiOriginal.appendChild(wrap);
        }
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        backdrop = null;
        redimensionar();
        world.pointOfView({ lat: 15, lng: 0, altitude: 2.2 }, 700);
      }, 320);
      campoBusca.value = "";
      resultadosBusca.innerHTML = "";
      resultadosBusca.classList.remove("ativo");
    }
    botaoFecharFoco.addEventListener("click", sairFoco);

    /* ---------- busca de país (só usada no modo destaque) ---------- */
    function buscarPaises(termo) {
      const alvo = normalizarTexto(termo);
      if (!alvo) return [];
      return featuresCarregadas.filter((f) => normalizarTexto(nomeDoPais(f)).includes(alvo)).slice(0, 6);
    }

    function irParaPais(feature) {
      if (!world || !feature) return;
      featureAtual = feature;
      abrirPainel(feature);
      const { lat, lng } = centroideAproximado(feature);
      world.pointOfView({ lat, lng, altitude: 1.4 }, 800);
      campoBusca.value = "";
      resultadosBusca.innerHTML = "";
      resultadosBusca.classList.remove("ativo");
    }

    campoBusca.addEventListener("input", () => {
      const encontrados = buscarPaises(campoBusca.value);
      if (!encontrados.length) {
        resultadosBusca.innerHTML = "";
        resultadosBusca.classList.remove("ativo");
        return;
      }
      resultadosBusca.innerHTML = encontrados.map((_, i) => `<button type="button" data-indice="${i}"></button>`).join("");
      const botoes = resultadosBusca.querySelectorAll("button");
      botoes.forEach((botao, i) => {
        botao.textContent = nomeDoPais(encontrados[i]);
        botao.addEventListener("click", () => irParaPais(encontrados[i]));
      });
      resultadosBusca.classList.add("ativo");
    });

    campoBusca.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const [primeiro] = buscarPaises(campoBusca.value);
      if (primeiro) irParaPais(primeiro);
    });

    /* ---------- nuvens decorativas em partículas (somem ao passar o mouse) ----------
       Cada nuvem é um pequeno aglomerado de blobs borrados (não emoji),
       nascendo perto das bordas do globo — nunca na faixa central, onde
       ficam os países — e no máximo MAX_NUVENS por vez, pra não tampar
       o globo. */
    const MAX_NUVENS = 3;

    function posicaoNaBorda() {
      const lado = Math.floor(Math.random() * 4); // 0 topo, 1 base, 2 esquerda, 3 direita
      const eixoLivre = `${Math.random() * 70}%`;
      const inicioBorda = `${2 + Math.random() * 10}%`;
      const fimBorda = `${88 - Math.random() * 10}%`;
      if (lado === 0) return { top: inicioBorda, left: eixoLivre };
      if (lado === 1) return { top: fimBorda, left: eixoLivre };
      if (lado === 2) return { top: eixoLivre, left: inicioBorda };
      return { top: eixoLivre, left: fimBorda };
    }

    function montarParticulas(grupo) {
      const partes = 4 + Math.floor(Math.random() * 3); // 4 a 6 blobs
      for (let i = 0; i < partes; i++) {
        const parte = document.createElement("span");
        parte.className = "globo-nuvem-parte";
        const tamanho = 16 + Math.random() * 18;
        parte.style.width = `${tamanho}px`;
        parte.style.height = `${tamanho * (0.55 + Math.random() * 0.25)}px`;
        parte.style.left = `${i * (11 + Math.random() * 6)}px`;
        parte.style.top = `${8 + (Math.random() * 12 - 6)}px`;
        parte.style.opacity = (0.55 + Math.random() * 0.35).toFixed(2);
        grupo.appendChild(parte);
      }
    }

    function nascerNuvem(atraso) {
      setTimeout(() => {
        if (!document.body.contains(wrap)) return;
        if (wrap.querySelectorAll(".globo-nuvem").length >= MAX_NUVENS) {
          nascerNuvem(1500);
          return;
        }
        const grupo = document.createElement("div");
        grupo.className = "globo-nuvem";
        const pos = posicaoNaBorda();
        grupo.style.top = pos.top;
        grupo.style.left = pos.left;
        const duracao = 12 + Math.random() * 8;
        grupo.style.animationDuration = `${duracao}s`;
        grupo.style.animationDelay = `-${(Math.random() * duracao).toFixed(2)}s`;
        montarParticulas(grupo);
        grupo.addEventListener(
          "mouseenter",
          () => {
            grupo.classList.add("sumindo");
            setTimeout(() => {
              grupo.remove();
              nascerNuvem(2000 + Math.random() * 3000);
            }, 500);
          },
          { once: true }
        );
        wrap.appendChild(grupo);
      }, atraso);
    }

    for (let i = 0; i < MAX_NUVENS; i++) nascerNuvem(i * 900);

    function aoClicarPais(feature) {
      if (!feature) return;
      featureAtual = feature;
      abrirPainel(feature);
    }

    /* ---------- inicialização assíncrona ---------- */
    carregarDados().then(({ features, emissoes }) => {
      featuresCarregadas = features;
      emissoesPorIso = emissoes;
      rankedIsos = Object.keys(emissoes).sort((a, b) => emissoes[b].tonYear - emissoes[a].tonYear);
      const valores = Object.keys(emissoes).map((k) => emissoes[k].tonYear);
      minTon = Math.min.apply(null, valores);
      maxTon = Math.max.apply(null, valores);

      world = Globe()(globoDiv)
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor(tokens.principal)
        .atmosphereAltitude(0.22)
        .globeImageUrl(temaAtual() ? "../data/globo-escuro.png" : "../data/globo-claro.png")
        .polygonsData(features)
        .polygonCapColor(corPais)
        .polygonSideColor(() => "rgba(0,0,0,0.18)")
        .polygonStrokeColor(() => tokens.linha)
        .polygonAltitude(alturaPais)
        .polygonsTransitionDuration(250)
        .polygonLabel(rotuloPais)
        .onPolygonClick(aoClicarPais)
        .onPolygonHover((f) => {
          hoverIso = f ? isoDoPais(f) : null;
          if (f) featureAtual = f;
          atualizarCamada();
        });

      world.pointOfView({ lat: 15, lng: 0, altitude: 2.2 }, 0);
      world.controls().autoRotate = true;
      world.controls().autoRotateSpeed = 0.35;

      const canvasInterno = world.renderer().domElement;
      canvasInterno.setAttribute("role", "img");
      canvasInterno.setAttribute(
        "aria-label",
        "Globo interativo de emissões de carbono. Arraste para girar, role para aproximar, clique num país para ver os dados e clique duas vezes para colocar o globo em destaque."
      );
      canvasInterno.addEventListener("dblclick", () => {
        if (featureAtual) entrarFoco(featureAtual);
      });

      // Rastro de partículas ao arrastar pra girar (só observa o ponteiro —
      // não interfere na rotação, que continua por conta do OrbitControls).
      let arrastandoRastro = false;
      let ultimaParticulaRastro = 0;
      canvasInterno.addEventListener("pointerdown", () => { arrastandoRastro = true; });
      window.addEventListener("pointerup", () => { arrastandoRastro = false; });
      canvasInterno.addEventListener("pointermove", (e) => {
        if (!arrastandoRastro) return;
        const agora = Date.now();
        if (agora - ultimaParticulaRastro < 45) return;
        ultimaParticulaRastro = agora;
        const r = wrap.getBoundingClientRect();
        const particula = document.createElement("span");
        particula.className = "globo-rastro";
        particula.style.left = `${e.clientX - r.left}px`;
        particula.style.top = `${e.clientY - r.top}px`;
        wrap.appendChild(particula);
        setTimeout(() => particula.remove(), 650);
      });

      redimensionar();
      window.addEventListener("resize", redimensionar);

      const observadorTema = new MutationObserver(() => {
        tokens = tokensDeCor();
        world.atmosphereColor(tokens.principal);
        world.globeImageUrl(temaAtual() ? "../data/globo-escuro.png" : "../data/globo-claro.png");
        world.polygonStrokeColor(() => tokens.linha);
        atualizarCamada();
      });
      observadorTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      const observadorRemocao = new MutationObserver(() => {
        if (!document.body.contains(wrap)) {
          window.removeEventListener("resize", redimensionar);
          observadorTema.disconnect();
          observadorRemocao.disconnect();
          if (world && world._destructor) world._destructor();
        }
      });
      observadorRemocao.observe(document.body, { childList: true, subtree: true });
    });
  }

  /* ---------- versão puramente decorativa (tela de login) ----------
     Sem clique, sem duplo clique, sem arrastar: só gira sozinha. */
  function montarDecorativo(wrap, globoDiv) {
    carregarDados().then(({ features }) => {
      function temaAtual() {
        return document.documentElement.getAttribute("data-theme") === "escuro";
      }
      let tokens = tokensDeCor();

      const world = Globe()(globoDiv)
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor(tokens.principal)
        .atmosphereAltitude(0.22)
        .globeImageUrl(temaAtual() ? "../data/globo-escuro.png" : "../data/globo-claro.png")
        .polygonsData(features)
        .polygonCapColor((f) => corRgba(corPorIntensidade(0.55, tokens), 0.5))
        .polygonSideColor(() => "rgba(0,0,0,0.1)")
        .polygonStrokeColor(() => tokens.linha)
        .polygonAltitude(0.006)
        .enablePointerInteraction(false);

      world.pointOfView({ lat: 15, lng: 0, altitude: 2.2 }, 0);
      world.controls().autoRotate = true;
      world.controls().autoRotateSpeed = 0.55;
      // Importante: manter "enabled = true" (só travando os gestos abaixo).
      // Desligar o controls inteiro (enabled = false) faz o OrbitControls
      // parar de recalcular a câmera a cada frame, o que corrompia o
      // enquadramento e cortava a base da esfera nesta versão decorativa.
      world.controls().enableRotate = false;
      world.controls().enableZoom = false;
      world.controls().enablePan = false;

      const canvasInterno = world.renderer().domElement;
      canvasInterno.setAttribute("role", "img");
      canvasInterno.setAttribute("aria-label", "Globo decorativo girando, ilustrando o alcance global do projeto Carbono Consciente.");

      function redimensionar() {
        const r = globoDiv.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) world.width(r.width).height(r.height);
      }
      redimensionar();
      window.addEventListener("resize", redimensionar);

      const observadorTema = new MutationObserver(() => {
        tokens = tokensDeCor();
        world
          .atmosphereColor(tokens.principal)
          .globeImageUrl(temaAtual() ? "../data/globo-escuro.png" : "../data/globo-claro.png")
          .polygonCapColor(() => corRgba(corPorIntensidade(0.55, tokens), 0.5))
          .polygonStrokeColor(() => tokens.linha);
      });
      observadorTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      const observadorRemocao = new MutationObserver(() => {
        if (!document.body.contains(wrap)) {
          window.removeEventListener("resize", redimensionar);
          observadorTema.disconnect();
          observadorRemocao.disconnect();
          if (world._destructor) world._destructor();
        }
      });
      observadorRemocao.observe(document.body, { childList: true, subtree: true });
    });
  }

  /* ---------- INICIALIZAÇÃO ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".globo-wrap").forEach(montarGlobo);
  });
})();

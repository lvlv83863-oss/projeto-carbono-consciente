/* =========================================================
   CARBONO CONSCIENTE — dados.js
   Busca estatísticas, notícias reais e curiosidades na API
   (front end/js/config.js define API_BASE). Se o backend
   estiver fora do ar, os fallbacks tratam cada seção sem
   quebrar a página.
   ========================================================= */
(function () {
  "use strict";

  function cabecalhosAuth() {
    const token = localStorage.getItem("carbono-token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function t(chave, vars) { return window.i18n ? window.i18n.t(chave, vars) : chave; }

  function formatarData(dataIso) {
    try {
      return new Intl.DateTimeFormat(window.i18n ? window.i18n.idiomaAtual : "pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dataIso));
    } catch {
      return dataIso;
    }
  }

  // O backend manda "chave" + "vars" (front end/js/../../backend/src/servicos/estatisticasServico.js)
  // em vez de uma frase pronta — "descricao" continua vindo como fallback de
  // segurança, usado só se a chave não existir no dicionário do idioma atual.
  function descricaoEstatistica(item) {
    const chave = "inicial.estatisticas." + item.chave;
    const traduzido = t(chave, item.vars);
    return traduzido !== chave ? traduzido : item.descricao;
  }

  /* ---------- ESTATÍSTICAS (personalizadas quando logado) ---------- */
  async function atualizarEstatisticas() {
    let corpo;
    try {
      const resposta = await fetch(API_BASE + "/estatisticas", { headers: cabecalhosAuth() });
      if (!resposta.ok) return;
      corpo = await resposta.json();
    } catch {
      return; // backend fora do ar — mantém os números fixos do HTML
    }

    const blocos = document.querySelectorAll(".stats-inner .stat");
    corpo.itens.forEach((item, i) => {
      const bloco = blocos[i];
      if (!bloco) return;
      const numero = bloco.querySelector("strong");
      const descricao = bloco.querySelector("span");
      if (numero) {
        if (item.semDados) {
          numero.textContent = t("inicial.estatisticas.sem_dados_suficientes");
        } else if (window.Interativo) {
          window.Interativo.animarNumero(numero, item.valor);
        } else {
          numero.textContent = item.valor;
        }
      }
      if (descricao) descricao.textContent = descricaoEstatistica(item);
    });
  }

  /* ---------- NOTÍCIAS REAIS (carrossel + modal) ---------- */
  function montarCardNoticia(noticia, indice) {
    const card = document.createElement("article");
    card.className = "noticia-card";
    card.innerHTML =
      `<figure><div class="noticia-imagem ${noticia.corClasse}">${window.Icones.icone(noticia.icone)}</div></figure>` +
      '<div class="noticia-conteudo">' +
      `<div class="noticia-categoria">${window.Icones.icone(noticia.icone, "icone-svg-mini")} ${noticia.categoria}</div>` +
      `<div class="noticia-titulo">${noticia.titulo}</div>` +
      `<span class="noticia-data">${noticia.fonte ? noticia.fonte + " · " : ""}${formatarData(noticia.data)}</span>` +
      "</div>";
    card.addEventListener("click", () => abrirModalNoticia(noticia));
    setTimeout(() => card.classList.add("visivel"), 60 * indice);
    return card;
  }

  function abrirModalNoticia(noticia) {
    const modal = document.getElementById("noticia-modal");
    const conteudo = document.getElementById("noticia-modal-conteudo");
    if (!modal || !conteudo) return;

    conteudo.innerHTML =
      `<div class="noticia-modal-categoria">${window.Icones.icone(noticia.icone, "icone-svg-mini")} ${noticia.categoria}</div>` +
      `<h3>${noticia.titulo}</h3>` +
      `<div class="noticia-modal-meta">${noticia.fonte ? noticia.fonte + " · " : ""}${formatarData(noticia.data)}</div>` +
      (noticia.linkExterno
        ? `<a href="${noticia.linkExterno}" target="_blank" rel="noopener" class="link-ver-mais">${t("inicial.noticias.ler_na_origem")}</a>`
        : `<p>${t("inicial.noticias.sem_link")}</p>`);

    modal.hidden = false;
  }

  function fecharModalNoticia() {
    const modal = document.getElementById("noticia-modal");
    if (modal) modal.hidden = true;
  }

  function mostrarEsqueletoNoticias(carrossel) {
    carrossel.innerHTML = Array.from({ length: 4 })
      .map(
        () =>
          '<div class="noticia-card noticia-esqueleto">' +
          '<div class="esqueleto-bloco esqueleto-imagem"></div>' +
          '<div class="noticia-conteudo">' +
          '<div class="esqueleto-bloco esqueleto-linha" style="width:55%"></div>' +
          '<div class="esqueleto-bloco esqueleto-linha" style="width:90%"></div>' +
          '<div class="esqueleto-bloco esqueleto-linha" style="width:70%"></div>' +
          "</div></div>"
      )
      .join("");
  }

  // Evita que uma resposta desatualizada (de uma troca de idioma anterior)
  // pise na mais recente se o usuário trocar de idioma várias vezes rápido.
  let tokenNoticias = 0;

  async function atualizarNoticias() {
    const carrossel = document.getElementById("noticias-carrossel");
    if (!carrossel) return;
    mostrarEsqueletoNoticias(carrossel);

    const meuToken = ++tokenNoticias;
    const idioma = window.i18n ? window.i18n.idiomaAtual : "pt";

    let lista;
    try {
      const resposta = await fetch(`${API_BASE}/noticias?idioma=${encodeURIComponent(idioma)}`, { cache: "no-store" });
      if (!resposta.ok) throw new Error("falhou");
      lista = await resposta.json();
    } catch {
      if (meuToken !== tokenNoticias) return;
      carrossel.innerHTML = `<p class="noticias-carregando">${t("inicial.noticias.erro_carregar")}</p>`;
      return;
    }
    if (meuToken !== tokenNoticias) return; // uma troca de idioma mais recente já chegou ou está a caminho

    if (!lista.length) {
      carrossel.innerHTML = `<p class="noticias-carregando">${t("inicial.noticias.nenhuma")}</p>`;
      return;
    }

    carrossel.innerHTML = "";
    lista.forEach((noticia, i) => carrossel.appendChild(montarCardNoticia(noticia, i)));
    if (window.Interativo) window.Interativo.ativarGlow(".noticia-card:not(.noticia-esqueleto)");
  }

  // Separado de atualizarNoticias() de propósito: esses listeners só
  // precisam ser registrados uma vez — como atualizarNoticias() agora roda
  // de novo a cada troca de idioma, registrá-los ali dentro os empilharia
  // sem limite (um novo listener de Escape/clique por troca).
  function iniciarControlesNoticias() {
    document.getElementById("noticia-modal-fechar")?.addEventListener("click", fecharModalNoticia);
    document.getElementById("noticia-modal-fundo")?.addEventListener("click", fecharModalNoticia);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fecharModalNoticia();
    });

    const setaEsq = document.querySelector(".noticias-seta-esq");
    const setaDir = document.querySelector(".noticias-seta-dir");
    const passo = () => (document.querySelector("#noticias-carrossel .noticia-card")?.offsetWidth || 280) + 22;
    setaEsq?.addEventListener("click", () => document.getElementById("noticias-carrossel")?.scrollBy({ left: -passo(), behavior: "smooth" }));
    setaDir?.addEventListener("click", () => document.getElementById("noticias-carrossel")?.scrollBy({ left: passo(), behavior: "smooth" }));
  }

  /* ---------- CURIOSIDADES (uma por vez, muda com o tempo + botão) ---------- */
  async function iniciarCuriosidades() {
    const textoEl = document.getElementById("curiosidade-texto");
    const botao = document.getElementById("curiosidade-trocar");
    if (!textoEl) return;

    textoEl.innerHTML =
      '<span class="esqueleto-bloco esqueleto-linha" style="width:100%"></span>' +
      '<span class="esqueleto-bloco esqueleto-linha" style="width:80%"></span>';

    let lista;
    try {
      const resposta = await fetch(API_BASE + "/curiosidades");
      if (!resposta.ok) throw new Error("falhou");
      lista = await resposta.json();
    } catch {
      textoEl.textContent = t("inicial.curiosidades.erro_carregar");
      return;
    }
    if (!lista.length) return;

    const diaDoAno = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    let indice = diaDoAno % lista.length;

    // O backend manda o texto pronto em português (fallback de segurança);
    // front end/i18n/locales/*.json tem as mesmas 18 curiosidades traduzidas
    // em "inicial.curiosidades.fatos.fatoN" (N = posição 1-based na lista) —
    // mesmo padrão de chave+fallback já usado pras estatísticas.
    function textoFato(item, indiceZeroBased) {
      const chave = "inicial.curiosidades.fatos.fato" + (indiceZeroBased + 1);
      const traduzido = t(chave);
      return traduzido !== chave ? traduzido : item.texto;
    }

    function mostrar() {
      textoEl.textContent = textoFato(lista[indice], indice);
    }
    mostrar();

    botao?.addEventListener("click", () => {
      indice = (indice + 1) % lista.length;
      mostrar();
    });

    // Troca de idioma: reexibe a MESMA curiosidade atual, só traduzida —
    // não avança o índice, pra não parecer que trocou de fato ao trocar
    // só de idioma.
    document.addEventListener("i18n:mudou", mostrar);
  }

  document.addEventListener("DOMContentLoaded", () => {
    atualizarEstatisticas();
    atualizarNoticias();
    iniciarControlesNoticias();
    iniciarCuriosidades();

    // Troca de idioma no header: notícias são conteúdo localizado por país,
    // então trocam junto — sem reload de página.
    document.addEventListener("i18n:mudou", () => {
      fecharModalNoticia();
      atualizarNoticias();
    });

    // "Tempo real": re-busca as estatísticas periodicamente e sempre que a
    // aba volta a ficar visível (ex.: usuário voltou do painel após
    // registrar um novo deslocamento).
    setInterval(atualizarEstatisticas, 45000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") atualizarEstatisticas();
    });
  });
})();

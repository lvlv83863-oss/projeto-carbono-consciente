/* =========================================================
   CARBONO CONSCIENTE — i18n.js
   Motor de tradução em JS puro (sem build/framework). Carregado
   como o PRIMEIRO script do body em todas as páginas, para já
   começar a buscar o dicionário de idioma antes do resto da
   página montar.

   Prioridade de escolha do idioma ao abrir a página:
     1. localStorage "carbono-idioma"      (escolha manual do usuário)
     2. país salvo em "carbono-usuario"    (de quem já está logado)
     3. navigator.language do navegador
     4. "pt" (idioma nativo do site)

   Uso no HTML:
     data-i18n="chave"                     -> define textContent
     data-i18n-html="chave"                -> define innerHTML (só
                                               para textos com markup
                                               inline confiável, vindo
                                               do nosso próprio JSON)
     data-i18n-attr-placeholder="chave"     -> define o atributo
     data-i18n-attr-aria-label="chave"         indicado após "attr-"
     data-i18n-attr-content="chave"         -> ex.: <meta content="">

   Uso no JS:
     window.i18n.t("chave")                -> string traduzida
     window.i18n.setIdioma("es")           -> troca na hora
     window.i18n.pronto                    -> Promise
     window.i18n.aplicarNoElemento(el)     -> reaplica num subtree novo
   ========================================================= */
(function () {
  "use strict";

  const CHAVE_LOCALSTORAGE = "carbono-idioma";
  const IDIOMA_PADRAO = "pt";
  const CAMINHO_BASE = (function () {
    // i18n.js vive em "front end/i18n/"; as páginas vivem em
    // "front end/html/" — então os caminhos relativos a partir daqui
    // precisam subir um nível, igual os outros scripts já fazem com "../".
    return "../i18n/locales/";
  })();

  let idiomaAtual = IDIOMA_PADRAO;
  let dicionarioAtual = {};
  let dicionarioIngles = {};
  let idiomasDisponiveis = {};
  const cacheDicionarios = {};

  let resolverPronto;
  const pronto = new Promise((resolve) => { resolverPronto = resolve; });
  window.i18nPronto = pronto; // rede de segurança lida por transicoes.js

  function normalizarTagIdioma(tag) {
    if (!tag) return null;
    return tag.split("-")[0].toLowerCase();
  }

  function paisDoUsuarioLogado() {
    try {
      const bruto = localStorage.getItem("carbono-usuario");
      if (!bruto) return null;
      const usuario = JSON.parse(bruto);
      return usuario && usuario.pais ? usuario.pais : null;
    } catch {
      return null;
    }
  }

  function escolherIdiomaInicial() {
    try {
      const salvo = localStorage.getItem(CHAVE_LOCALSTORAGE);
      if (salvo) return salvo;
    } catch { /* localStorage indisponível (modo privado etc.) — segue o fluxo */ }

    const pais = paisDoUsuarioLogado();
    if (pais && window.__paisIdioma && window.__paisIdioma[pais]) {
      return window.__paisIdioma[pais].principal;
    }

    const idiomasNavegador = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const tag of idiomasNavegador) {
      const base = normalizarTagIdioma(tag);
      if (base) return base; // valida depois, ao tentar buscar o arquivo
    }

    return IDIOMA_PADRAO;
  }

  async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) throw new Error("não encontrado: " + caminho);
    return resposta.json();
  }

  async function carregarDicionario(codigo) {
    if (cacheDicionarios[codigo]) return cacheDicionarios[codigo];
    try {
      const dados = await buscarJson(CAMINHO_BASE + codigo + ".json");
      cacheDicionarios[codigo] = dados;
      return dados;
    } catch {
      return null;
    }
  }

  function valorPorChave(dicionario, chave) {
    if (!dicionario) return undefined;
    // chaves em dot-notation simples, ex.: "auth.cadastro.pais_label"
    let atual = dicionario;
    for (const parte of chave.split(".")) {
      if (atual == null) return undefined;
      atual = atual[parte];
    }
    return typeof atual === "string" ? atual : undefined;
  }

  function interpolar(texto, vars) {
    if (!vars) return texto;
    return texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, nome) => (nome in vars ? String(vars[nome]) : match));
  }

  function t(chave, vars) {
    const valor = valorPorChave(dicionarioAtual, chave) ?? valorPorChave(dicionarioIngles, chave) ?? chave;
    return interpolar(valor, vars);
  }

  function aplicarNoElemento(raiz) {
    raiz.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    raiz.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    raiz.querySelectorAll("*").forEach((el) => {
      for (const attr of el.attributes) {
        if (!attr.name.startsWith("data-i18n-attr-")) continue;
        const nomeAtributo = attr.name.slice("data-i18n-attr-".length);
        el.setAttribute(nomeAtributo, t(attr.value));
      }
    });
    // o próprio elemento raiz também pode ter os atributos (não só os filhos)
    if (raiz.nodeType === 1) {
      if (raiz.hasAttribute("data-i18n")) raiz.textContent = t(raiz.getAttribute("data-i18n"));
      if (raiz.hasAttribute("data-i18n-html")) raiz.innerHTML = t(raiz.getAttribute("data-i18n-html"));
      for (const attr of raiz.attributes || []) {
        if (!attr.name.startsWith("data-i18n-attr-")) continue;
        const nomeAtributo = attr.name.slice("data-i18n-attr-".length);
        raiz.setAttribute(nomeAtributo, t(attr.value));
      }
    }
  }

  function aplicarNaPagina() {
    aplicarNoElemento(document.documentElement);
    document.documentElement.setAttribute("lang", idiomaAtual);
    const info = idiomasDisponiveis[idiomaAtual];
    document.documentElement.setAttribute("dir", info && info.rtl ? "rtl" : "ltr");
  }

  async function definirIdiomaInterno(codigo, persistir) {
    let dicionario = await carregarDicionario(codigo);
    let idiomaResolvido = codigo;
    if (!dicionario) {
      console.warn(`[i18n] idioma "${codigo}" não encontrado, caindo para inglês.`);
      idiomaResolvido = "en";
      dicionario = dicionarioIngles;
    }
    idiomaAtual = idiomaResolvido;
    dicionarioAtual = dicionario;
    aplicarNaPagina();
    if (persistir) {
      try { localStorage.setItem(CHAVE_LOCALSTORAGE, idiomaResolvido); } catch { /* ignora */ }
    }
    document.dispatchEvent(new CustomEvent("i18n:mudou", { detail: { idioma: idiomaResolvido } }));
  }

  async function setIdioma(codigo) {
    await definirIdiomaInterno(codigo, true);
  }

  async function iniciar() {
    try {
      idiomasDisponiveis = await buscarJson("../i18n/idiomas.json");
    } catch {
      idiomasDisponiveis = { pt: { rtl: false, tier: 1 }, en: { rtl: false, tier: 1 } };
    }
    try {
      window.__paisIdioma = await buscarJson("../data/pais-idioma.json");
    } catch {
      window.__paisIdioma = {};
    }

    dicionarioIngles = (await carregarDicionario("en")) || {};

    const candidato = escolherIdiomaInicial();
    const candidatoValido = idiomasDisponiveis[candidato] ? candidato : IDIOMA_PADRAO;
    await definirIdiomaInterno(candidatoValido, false);

    resolverPronto();
  }

  window.i18n = {
    t,
    setIdioma,
    aplicarNoElemento,
    get idiomaAtual() { return idiomaAtual; },
    get idiomasDisponiveis() { return idiomasDisponiveis; },
    pronto,
  };

  iniciar();
})();

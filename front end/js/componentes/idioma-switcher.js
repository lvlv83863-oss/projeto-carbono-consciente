/* =========================================================
   CARBONO CONSCIENTE — idioma-switcher.js
   Injeta o botão de troca de idioma dentro de ".header-acoes"
   em todas as páginas (mesmo container do .theme-toggle), sem
   precisar duplicar markup novo nos 3 HTMLs — segue o mesmo
   padrão de injeção via JS que o resto do header já usa.
   Depende de window.i18n (front end/i18n/i18n.js) e
   window.SeletorBusca (front end/js/componentes/seletor-busca.js).
   ========================================================= */
(function () {
  "use strict";

  // Cada idioma aparece escrito em si mesmo (autônimo — "Español", "العربية",
  // "中文"), não traduzido para o idioma atual da UI. É assim que se reconhece
  // a própria língua de relance numa lista de 96 opções.
  function nomeIdioma(codigo) {
    try {
      return new Intl.DisplayNames([codigo], { type: "language" }).of(codigo);
    } catch {
      return codigo.toUpperCase();
    }
  }

  function rotuloBotao(codigo) {
    return codigo.slice(0, 2).toUpperCase();
  }

  function montar() {
    const acoes = document.querySelector(".header-acoes");
    if (!acoes || !window.i18n || !window.SeletorBusca) return;

    const wrap = document.createElement("div");
    wrap.className = "idioma-switcher-wrap";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "idioma-switcher";
    botao.setAttribute("aria-label", window.i18n.t("header.idioma_aria"));
    botao.textContent = rotuloBotao(window.i18n.idiomaAtual);

    const painel = document.createElement("div");
    painel.className = "idioma-painel";
    painel.hidden = true;
    painel.innerHTML =
      '<input type="text" class="idioma-painel-busca" autocomplete="off">' +
      '<div class="seletor-busca-resultados idioma-painel-resultados"></div>';

    wrap.appendChild(botao);
    wrap.appendChild(painel);
    acoes.insertBefore(wrap, acoes.firstChild);

    const campoBusca = painel.querySelector(".idioma-painel-busca");
    const resultados = painel.querySelector(".idioma-painel-resultados");

    function listaIdiomas() {
      return Object.keys(window.i18n.idiomasDisponiveis).map((codigo) => ({ codigo }));
    }

    function textoOpcao(opcao) {
      return nomeIdioma(opcao.codigo);
    }

    const seletor = window.SeletorBusca.criar({
      input: campoBusca,
      containerResultados: resultados,
      opcoes: listaIdiomas,
      textoOpcao,
      valorOpcao: (opcao) => opcao.codigo,
      aoEscolher: (opcao) => {
        window.i18n.setIdioma(opcao.codigo);
        fecharPainel();
      },
      maxResultados: 10,
    });

    function abrirPainel() {
      painel.hidden = false;
      campoBusca.value = "";
      campoBusca.setAttribute("placeholder", window.i18n.t("header.idioma_buscar_placeholder"));
      campoBusca.focus();
      // Mostra TODOS os idiomas disponíveis antes de digitar (o container já
      // rola — ver .seletor-busca-resultados — então não há motivo pra
      // truncar a lista aqui; truncar só faz sentido pra resultados de busca
      // filtrada, que é o que maxResultados já limita no SeletorBusca).
      // Ordenados pelo nome no idioma atual, pra facilitar achar visualmente.
      const opcoesIniciais = listaIdiomas().sort((a, b) => textoOpcao(a).localeCompare(textoOpcao(b), window.i18n.idiomaAtual));
      resultados.innerHTML = opcoesIniciais
        .map((opcao) => `<button type="button" data-valor="${opcao.codigo}">${textoOpcao(opcao)}</button>`)
        .join("");
      resultados.classList.add("ativo");
      resultados.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("mousedown", (e) => {
          e.preventDefault();
          window.i18n.setIdioma(btn.getAttribute("data-valor"));
          fecharPainel();
        });
      });
    }

    function fecharPainel() {
      painel.hidden = true;
      seletor.fechar();
    }

    botao.addEventListener("click", (e) => {
      e.stopPropagation();
      if (painel.hidden) abrirPainel();
      else fecharPainel();
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) fecharPainel();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fecharPainel();
    });

    document.addEventListener("i18n:mudou", () => {
      botao.textContent = rotuloBotao(window.i18n.idiomaAtual);
      botao.setAttribute("aria-label", window.i18n.t("header.idioma_aria"));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.i18n && window.i18n.pronto) {
      window.i18n.pronto.then(montar);
    } else {
      montar();
    }
  });
})();

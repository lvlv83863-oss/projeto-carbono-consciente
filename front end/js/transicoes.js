/* =========================================================
   CARBONO CONSCIENTE — transicoes.js
   Fade-in suave ao carregar a página e fade-out rápido antes
   de navegar por um link interno, evitando o "salto seco" de
   trocar de página. Não mexe nos redirecionamentos já feitos
   via JS (login/logout), só na navegação por link visível.
   ========================================================= */
(function () {
  "use strict";

  document.documentElement.classList.add("pagina-carregando");

  function mostrarPagina() {
    // Espera a primeira passada de tradução (front end/i18n/i18n.js) antes de
    // revelar a página, pra não piscar o texto em português e trocar na hora
    // seguinte. window.i18nPronto é uma Promise resolvida de segurança mesmo
    // que i18n.js não carregue, então isso nunca trava a página.
    Promise.resolve(window.i18nPronto).then(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("pagina-carregando");
      });
    });
  }

  if (document.readyState === "complete") mostrarPagina();
  else window.addEventListener("load", mostrarPagina);

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;

    const link = e.target.closest("a[href]");
    if (!link) return;
    if (link.id === "link-login") return; // já tem navegação própria (login/sair) em inicial.js

    const href = link.getAttribute("href");
    if (!href || !href.endsWith(".html") || link.target === "_blank") return;

    e.preventDefault();
    document.documentElement.classList.add("pagina-saindo");
    setTimeout(() => {
      window.location.href = href;
    }, 240);
  });
})();

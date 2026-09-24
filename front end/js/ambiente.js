/* =========================================================
   CARBONO CONSCIENTE — ambiente.js
   Camada decorativa ligada ao tema, ancorada a seções
   específicas da página (não à tela toda): no tema claro, uma
   videira que "cresce" (efeito de traço se desenhando) com
   folhas quando a seção entra na tela; no tema escuro, fluxos
   de vento que fluem continuamente e reagem à rolagem da
   página. Tudo pointer-events:none — nunca atrapalha clique em
   nada por baixo.
   ========================================================= */
(function () {
  "use strict";

  const SECOES = ["#inicio", "#estatisticas", ".secao-curiosidades", ".secao-noticias"];

  function temaEscuro() {
    return document.documentElement.getAttribute("data-theme") === "escuro";
  }

  function svgVideira() {
    return (
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="ambiente-videira" aria-hidden="true">' +
      '<path class="ambiente-traco" d="M10 0 C30 20 -6 42 16 60 S42 90 22 100" />' +
      '<path class="ambiente-traco" d="M90 0 C68 24 106 46 80 66 S54 86 76 100" />' +
      "</svg>" +
      '<span class="ambiente-folha" style="top:20%;left:12%;">' + window.Icones.icone("folha") + "</span>" +
      '<span class="ambiente-folha" style="top:46%;left:84%;">' + window.Icones.icone("folha") + "</span>" +
      '<span class="ambiente-folha" style="top:72%;left:18%;">' + window.Icones.icone("folha") + "</span>"
    );
  }

  function svgVento() {
    return (
      '<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="ambiente-vento-svg" aria-hidden="true">' +
      '<path class="ambiente-fluxo" d="M-10 20 C20 8 40 32 60 18 S92 26 110 14" />' +
      '<path class="ambiente-fluxo" d="M-10 55 C24 42 46 66 66 50 S96 60 110 46" />' +
      '<path class="ambiente-fluxo" d="M-10 86 C20 74 46 94 68 80 S96 90 110 76" />' +
      "</svg>"
    );
  }

  function montarCamada(secao) {
    const camada = document.createElement("div");
    camada.className = "ambiente-secao";
    camada.setAttribute("aria-hidden", "true");
    secao.insertBefore(camada, secao.firstChild);
    return camada;
  }

  function prepararVideira(camada) {
    camada.innerHTML = svgVideira();
    camada.querySelectorAll(".ambiente-traco").forEach((path) => {
      const comprimento = path.getTotalLength();
      path.style.strokeDasharray = String(comprimento);
      path.style.strokeDashoffset = String(comprimento);
    });
  }

  function crescerVideira(camada) {
    camada.classList.add("ativa");
    camada.querySelectorAll(".ambiente-traco").forEach((path) => {
      path.style.strokeDashoffset = "0";
    });
  }

  let escutaRolagemAtiva = false;
  function escutarRolagem() {
    if (escutaRolagemAtiva) return;
    escutaRolagemAtiva = true;
    window.addEventListener(
      "scroll",
      () => {
        const ciclo = window.scrollY % 500;
        document.documentElement.style.setProperty("--ambiente-deslocamento", `${(ciclo / 500) * 26}px`);
      },
      { passive: true }
    );
  }

  function iniciar() {
    document.querySelectorAll(".ambiente-secao").forEach((el) => el.remove());

    const escuro = temaEscuro();
    const alvos = SECOES.map((sel) => document.querySelector(sel)).filter(Boolean);
    if (!alvos.length) return;

    alvos.forEach((secao) => {
      const camada = montarCamada(secao);
      if (escuro) {
        camada.classList.add("ambiente-vento");
        camada.innerHTML = svgVento();
      } else {
        camada.classList.add("ambiente-planta");
        prepararVideira(camada);
      }
    });

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          const camada = entrada.target.querySelector(":scope > .ambiente-secao");
          if (camada) {
            if (escuro) camada.classList.add("ativa");
            else crescerVideira(camada);
          }
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.25 }
    );
    alvos.forEach((secao) => observador.observe(secao));

    // Vento reage sutilmente à rolagem da página.
    if (escuro) escutarRolagem();
  }

  document.addEventListener("DOMContentLoaded", () => {
    iniciar();
    new MutationObserver(iniciar).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  });
})();

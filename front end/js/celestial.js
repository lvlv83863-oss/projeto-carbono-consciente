/* =========================================================
   CARBONO CONSCIENTE — celestial.js
   Camadas ambiente extras, ligadas ao tema: estrelas piscando
   no fundo (tema escuro) ou borboletas/abelhas voando (tema
   claro), mais partículas subindo perto do rodapé nos dois
   temas. Tudo pointer-events:none — só decorativo.
   ========================================================= */
(function () {
  "use strict";

  const QUANTIDADE_ESTRELAS = 32;
  const QUANTIDADE_INSETOS = 3;

  function temaEscuro() {
    return document.documentElement.getAttribute("data-theme") === "escuro";
  }

  function obterCamada(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
    }
    el.innerHTML = "";
    return el;
  }

  /* ---------- estrelas (tema escuro) ---------- */
  function criarEstrelas() {
    const camada = obterCamada("celestial-estrelas");
    for (let i = 0; i < QUANTIDADE_ESTRELAS; i++) {
      const estrela = document.createElement("span");
      estrela.className = "estrela";
      estrela.style.left = `${Math.random() * 100}vw`;
      estrela.style.top = `${Math.random() * 100}vh`;
      estrela.style.width = estrela.style.height = `${1 + Math.random() * 2}px`;
      estrela.style.animationDuration = `${2.5 + Math.random() * 3.5}s`;
      estrela.style.animationDelay = `-${(Math.random() * 5).toFixed(2)}s`;
      camada.appendChild(estrela);
    }
  }

  /* ---------- borboletas/abelhas (tema claro) ---------- */
  const SVG_INSETO =
    '<svg viewBox="0 0 32 24" class="inseto-svg" aria-hidden="true">' +
    '<g class="inseto-asas">' +
    '<ellipse cx="10" cy="8" rx="9" ry="7" />' +
    '<ellipse cx="22" cy="8" rx="9" ry="7" />' +
    '<ellipse cx="10" cy="17" rx="6" ry="5" />' +
    '<ellipse cx="22" cy="17" rx="6" ry="5" />' +
    "</g>" +
    '<line x1="16" y1="2" x2="16" y2="22" class="inseto-corpo" />' +
    "</svg>";

  function criarInsetos() {
    const camada = obterCamada("celestial-insetos");
    for (let i = 0; i < QUANTIDADE_INSETOS; i++) {
      const inseto = document.createElement("div");
      inseto.className = `inseto inseto-rota-${1 + (i % 3)}`;
      inseto.innerHTML = SVG_INSETO;
      inseto.style.animationDuration = `${16 + Math.random() * 8}s`;
      inseto.style.animationDelay = `${i * 5 + Math.random() * 3}s`;
      camada.appendChild(inseto);
    }
  }

  /* ---------- partículas subindo perto do rodapé ---------- */
  function iniciarParticulasRodape() {
    const rodape = document.querySelector(".site-footer");
    if (!rodape) return;

    function nascer() {
      if (!document.body.contains(rodape)) return;
      const p = document.createElement("span");
      p.className = "rodape-particula";
      p.style.left = `${Math.random() * 96}%`;
      p.style.animationDuration = `${6 + Math.random() * 5}s`;
      rodape.appendChild(p);
      setTimeout(() => p.remove(), 11000);
      setTimeout(nascer, 900 + Math.random() * 900);
    }
    nascer();
  }

  function iniciar() {
    if (temaEscuro()) {
      criarEstrelas();
      obterCamada("celestial-insetos");
    } else {
      criarInsetos();
      obterCamada("celestial-estrelas");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    iniciar();
    iniciarParticulasRodape();
    new MutationObserver(iniciar).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  });
})();

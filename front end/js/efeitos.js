/* =========================================================
   CARBONO CONSCIENTE — efeitos.js
   Barra de progresso de rolagem (todas as páginas), e no hero
   da home: título entrando palavra a palavra + leve parallax
   entre o texto e o globo ao rolar.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- barra de progresso de rolagem ---------- */
  function iniciarBarraProgresso() {
    const barra = document.createElement("div");
    barra.id = "barra-progresso";
    barra.setAttribute("aria-hidden", "true");
    document.body.appendChild(barra);

    function atualizar() {
      const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
      const progresso = alturaTotal > 0 ? (window.scrollY / alturaTotal) * 100 : 0;
      barra.style.width = `${Math.min(100, Math.max(0, progresso)).toFixed(2)}%`;
    }

    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    atualizar();
  }

  /* ---------- título do hero entrando palavra a palavra ---------- */
  function revelarTituloHero() {
    const h1 = document.querySelector(".hero-texto h1");
    if (!h1 || h1.dataset.revelado) return;
    h1.dataset.revelado = "1";
    const palavras = h1.textContent.trim().split(/\s+/);
    h1.innerHTML = palavras
      .map((p, i) => `<span class="palavra-revela" style="animation-delay:${(i * 0.09).toFixed(2)}s">${p}</span>`)
      .join(" ");
  }

  /* ---------- parallax sutil do hero ---------- */
  function iniciarParallaxHero() {
    const hero = document.getElementById("inicio");
    const texto = document.querySelector(".hero .hero-texto");
    const globo = document.querySelector(".hero .globo-wrap");
    if (!hero || !texto) return;

    function atualizar() {
      const r = hero.getBoundingClientRect();
      // só calcula enquanto o hero está perto da tela (evita trabalho à toa)
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const progresso = -r.top; // quanto já rolamos pra dentro do hero
      texto.style.transform = `translateY(${(progresso * 0.06).toFixed(2)}px)`;
      // não mexe no globo enquanto ele estiver no modo destaque (globo.js
      // assume o controle de posição/tamanho dele nesse estado)
      if (globo && !globo.classList.contains("em-foco")) {
        globo.style.transform = `translateY(${(progresso * -0.1).toFixed(2)}px)`;
      }
    }

    window.addEventListener("scroll", atualizar, { passive: true });
    atualizar();
  }

  document.addEventListener("DOMContentLoaded", () => {
    iniciarBarraProgresso();
    revelarTituloHero();
    iniciarParallaxHero();
  });
})();

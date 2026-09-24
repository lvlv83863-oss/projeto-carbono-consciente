/* =========================================================
   CARBONO CONSCIENTE — particulas.js
   Fundo de partículas leves (canvas 2D, sem WebGL/biblioteca)
   no hero: pólen verde no tema claro, poeira roxa no escuro,
   reagindo de leve ao mouse. Puramente decorativo.
   ========================================================= */
(function () {
  "use strict";

  const QUANTIDADE = 46;
  const RAIO_MOUSE = 110;

  function hexParaRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || "").trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [120, 180, 130];
  }

  function corAtual() {
    return hexParaRgb(getComputedStyle(document.documentElement).getPropertyValue("--cor-principal"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("inicio");
    if (!hero) return;

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.className = "hero-particulas";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);
    const ctx = canvas.getContext("2d");

    let largura = 0,
      altura = 0;
    let cor = corAtual();
    const mouse = { x: -9999, y: -9999 };
    let particulas = [];

    function criarParticulas() {
      particulas = Array.from({ length: QUANTIDADE }, () => ({
        x: Math.random() * largura,
        y: Math.random() * altura,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        raio: 1.2 + Math.random() * 2.2,
        alfa: 0.25 + Math.random() * 0.45,
      }));
    }

    function redimensionar() {
      const r = hero.getBoundingClientRect();
      largura = canvas.width = r.width;
      altura = canvas.height = r.height;
      criarParticulas();
    }

    function desenharEstatico() {
      ctx.clearRect(0, 0, largura, altura);
      particulas.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cor[0]},${cor[1]},${cor[2]},${p.alfa})`;
        ctx.fill();
      });
    }

    function passo() {
      ctx.clearRect(0, 0, largura, altura);
      particulas.forEach((p) => {
        // afasta de leve perto do mouse
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RAIO_MOUSE) {
          const forca = (1 - dist / RAIO_MOUSE) * 0.6;
          p.vx += (dx / (dist || 1)) * forca * 0.05;
          p.vy += (dy / (dist || 1)) * forca * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;

        if (p.x < -10) p.x = largura + 10;
        if (p.x > largura + 10) p.x = -10;
        if (p.y < -10) p.y = altura + 10;
        if (p.y > altura + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cor[0]},${cor[1]},${cor[2]},${p.alfa})`;
        ctx.fill();
      });
      requestAnimationFrame(passo);
    }

    redimensionar();
    window.addEventListener("resize", redimensionar);
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("mouseleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    if (reduzMovimento) {
      desenharEstatico();
    } else {
      requestAnimationFrame(passo);
    }

    new MutationObserver(() => {
      cor = corAtual();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  });
})();

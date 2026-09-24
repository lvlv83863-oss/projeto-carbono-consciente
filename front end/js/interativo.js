/* =========================================================
   CARBONO CONSCIENTE — interativo.js
   Micro-interações reaproveitáveis pelo site: números que
   contam de 0 até o valor real ao entrarem na tela, e cards
   com leve profundidade 3D + brilho seguindo o mouse.
   Exposto como window.Interativo para dados.js/painel.js
   chamarem depois de renderizar conteúdo dinâmico.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- números contando ---------- */
  const jaAnimados = new WeakSet();
  const visiveisAgora = new WeakSet();

  function analisarTexto(texto) {
    const m = /^(-?)(\d+(?:,\d+)?)(.*)$/.exec(String(texto).trim());
    if (!m) return null;
    const numero = parseFloat(m[2].replace(",", "."));
    const casas = m[2].includes(",") ? m[2].split(",")[1].length : 0;
    return { valor: m[1] === "-" ? -numero : numero, casas, sufixo: m[3] };
  }

  function formatarNumero(valor, casas) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  function animarValor(elemento, textoFinal) {
    const info = analisarTexto(textoFinal);
    if (!info) {
      elemento.textContent = textoFinal;
      return;
    }
    const duracao = 1100;
    const inicio = performance.now();
    function passo(agora) {
      const progresso = Math.min(1, (agora - inicio) / duracao);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      elemento.textContent = formatarNumero(info.valor * suavizado, info.casas) + info.sufixo;
      if (progresso < 1) requestAnimationFrame(passo);
      else elemento.textContent = textoFinal;
    }
    requestAnimationFrame(passo);
  }

  const observadorNumeros = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        visiveisAgora.add(entrada.target);
        const valor = entrada.target.dataset.valorFinal;
        if (valor && !jaAnimados.has(entrada.target)) {
          jaAnimados.add(entrada.target);
          animarValor(entrada.target, valor);
        }
      });
    },
    { threshold: 0.4 }
  );

  // Chamado no lugar de "elemento.textContent = texto" para números que
  // devem contar ao entrar na tela (estatísticas da home, cards do painel).
  function animarNumero(elemento, textoFinal) {
    if (!elemento) return;
    elemento.dataset.valorFinal = textoFinal;
    observadorNumeros.observe(elemento);
    if (visiveisAgora.has(elemento) && !jaAnimados.has(elemento)) {
      jaAnimados.add(elemento);
      animarValor(elemento, textoFinal);
    } else if (!jaAnimados.has(elemento)) {
      elemento.textContent = textoFinal; // valor visível de imediato caso ainda fora da tela
    }
  }

  /* ---------- cards com brilho seguindo o mouse (+ tilt 3D opcional) ----------
     O tilt (rotateX/rotateY) só é aplicado em cards que não têm animação de
     transform própria (ex.: .painel-card) — em .dica-card/.noticia-card, que
     já usam "transform" pra entrada com fade (efeito .reveal), aplicar tilt
     ali por cima quebraria essa animação; nesses, só o brilho é ativado. */
  function ativarBrilho(card) {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    });
  }

  function ativarCartaoInterativo(seletor, comTilt) {
    document.querySelectorAll(seletor).forEach((card) => {
      if (card.dataset.tiltAtivo) return;
      card.dataset.tiltAtivo = "1";
      card.classList.add(comTilt ? "tilt-glow" : "glow-mouse");
      ativarBrilho(card);
      if (comTilt) {
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.setProperty("--tilt-x", `${((0.5 - py) * 12).toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${((px - 0.5) * 12).toFixed(2)}deg`);
        });
        card.addEventListener("mouseleave", () => {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
        });
      }
    });
  }

  function ativarTiltGlow(seletor) {
    ativarCartaoInterativo(seletor, true);
  }

  function ativarGlow(seletor) {
    ativarCartaoInterativo(seletor, false);
  }

  window.Interativo = { animarNumero, ativarTiltGlow, ativarGlow };

  document.addEventListener("DOMContentLoaded", () => {
    ativarGlow(".dica-card");
  });
})();

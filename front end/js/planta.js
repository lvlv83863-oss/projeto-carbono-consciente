/* =========================================================
   CARBONO CONSCIENTE — planta.js
   Planta animada na seção "O que é Carbono Consciente": ao
   entrar na tela, uma semente cai na terra, o caule cresce e as
   folhas se abrem até o estado correspondente à saúde do
   usuário (comparação do CO₂ dele com a média dos países, vinda
   de /api/estatisticas). Sem login, mostra uma planta de
   exemplo saudável com um convite pra logar.
   ========================================================= */
(function () {
  "use strict";

  const SAUDE_PADRAO_DESLOGADO = 65;

  function hexParaRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || "").trim());
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [120, 120, 120];
  }

  function corDaSaude(saude) {
    const murcha = [141, 110, 63]; // marrom seco
    const viva = hexParaRgb(getComputedStyle(document.documentElement).getPropertyValue("--cor-principal"));
    const t = Math.max(0, Math.min(1, saude / 100));
    const rgb = [0, 1, 2].map((i) => Math.round(murcha[i] + (viva[i] - murcha[i]) * t));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  async function buscarSaude() {
    const token = localStorage.getItem("carbono-token");
    if (!token || typeof API_BASE === "undefined") {
      return { saude: SAUDE_PADRAO_DESLOGADO, logado: false };
    }
    try {
      const resposta = await fetch(API_BASE + "/estatisticas", { headers: { Authorization: `Bearer ${token}` } });
      if (!resposta.ok) return { saude: SAUDE_PADRAO_DESLOGADO, logado: false };
      const corpo = await resposta.json();
      if (!corpo.logado || typeof corpo.saudePlanta !== "number") {
        return { saude: SAUDE_PADRAO_DESLOGADO, logado: false };
      }
      return { saude: corpo.saudePlanta, logado: true };
    } catch {
      return { saude: SAUDE_PADRAO_DESLOGADO, logado: false };
    }
  }

  function tocarCrescimento(cena, saude, logado) {
    const droop = Math.max(0, (55 - saude) * 0.7); // 0deg saudável, até ~38deg bem murcha
    const escala = 0.85 + Math.min(1, saude / 100) * 0.15;

    cena.style.setProperty("--planta-cor", corDaSaude(saude));
    cena.style.setProperty("--planta-droop", `${droop.toFixed(1)}deg`);
    cena.style.setProperty("--planta-escala", escala.toFixed(2));

    const legenda = cena.querySelector(".planta-legenda");
    if (legenda) {
      legenda.textContent = logado
        ? saude >= 70
          ? "Seus hábitos estão mantendo essa planta viva e saudável."
          : saude >= 40
          ? "Seus hábitos estão dando conta — dá pra melhorar mais."
          : "Seus hábitos estão deixando essa planta murcha — que tal registrar deslocamentos mais leves?"
        : "Faça login para ver a sua própria planta.";
    }

    const caule = cena.querySelector(".planta-caule");
    if (caule) {
      const comprimento = caule.getTotalLength();
      caule.style.strokeDasharray = String(comprimento);
      caule.style.strokeDashoffset = String(comprimento);
    }

    requestAnimationFrame(() => {
      cena.classList.add("semente-caindo");
      setTimeout(() => cena.classList.add("caule-crescendo"), 650);
      setTimeout(() => cena.classList.add("folhas-aparecendo"), 1050);
      if (saude >= 70) setTimeout(() => cena.classList.add("flor-aberta"), 2500);
      setTimeout(() => cena.classList.add("planta-viva"), 3200);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const secao = document.getElementById("carbono");
    const cena = document.getElementById("planta-cena");
    if (!secao || !cena) return;

    let disparado = false;
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting || disparado) return;
          disparado = true;
          buscarSaude().then(({ saude, logado }) => tocarCrescimento(cena, saude, logado));
          observador.unobserve(secao);
        });
      },
      { threshold: 0.25 }
    );
    observador.observe(secao);
  });
})();

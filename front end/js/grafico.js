/* =========================================================
   CARBONO CONSCIENTE — grafico.js
   Gráfico de linha em SVG (sem biblioteca) mostrando a
   evolução diária de CO₂ do usuário nos últimos dias. Usado
   pelo painel (front end/js/painel.js).
   ========================================================= */
(function () {
  "use strict";

  function desenhar(container, serie) {
    if (!container || !serie || !serie.length) return;

    const largura = 640;
    const altura = 220;
    const margem = { topo: 18, baixo: 26, esq: 10, dir: 10 };
    const maximo = Math.max(1, ...serie.map((d) => d.totalCo2));
    const passoX = serie.length > 1 ? (largura - margem.esq - margem.dir) / (serie.length - 1) : 0;

    const pontos = serie.map((d, i) => ({
      x: margem.esq + i * passoX,
      y: margem.topo + (1 - d.totalCo2 / maximo) * (altura - margem.topo - margem.baixo),
      dado: d,
    }));

    const linha = pontos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const baseY = altura - margem.baixo;
    const area = `${margem.esq},${baseY} ${linha} ${pontos[pontos.length - 1].x.toFixed(1)},${baseY}`;

    const rotulos = serie
      .map((d, i) => ({ i, texto: d.data.slice(5).split("-").reverse().join("/") }))
      .filter((r) => r.i === 0 || r.i === serie.length - 1 || r.i % 3 === 0);

    container.innerHTML =
      `<svg viewBox="0 0 ${largura} ${altura}" preserveAspectRatio="none" class="grafico-svg" role="img" aria-label="Evolução do CO₂ nos últimos ${serie.length} dias">` +
      `<polygon class="grafico-area" points="${area}" />` +
      `<polyline class="grafico-linha" points="${linha}" />` +
      pontos
        .map(
          (p) =>
            `<circle class="grafico-ponto" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.4"><title>${p.dado.data}: ${p.dado.totalCo2
              .toFixed(2)
              .replace(".", ",")} kg</title></circle>`
        )
        .join("") +
      "</svg>" +
      '<div class="grafico-eixo">' +
      rotulos.map((r) => `<span>${r.texto}</span>`).join("") +
      "</div>";

    const linhaEl = container.querySelector(".grafico-linha");
    const areaEl = container.querySelector(".grafico-area");

    if (linhaEl) {
      const comprimento = linhaEl.getTotalLength();
      linhaEl.style.strokeDasharray = String(comprimento);
      linhaEl.style.strokeDashoffset = String(comprimento);
      requestAnimationFrame(() => {
        linhaEl.style.transition = "stroke-dashoffset 1.5s ease";
        linhaEl.style.strokeDashoffset = "0";
      });
    }

    if (areaEl) {
      areaEl.style.opacity = "0";
      requestAnimationFrame(() => {
        areaEl.style.transition = "opacity 1.3s ease .3s";
        areaEl.style.opacity = "0.18";
      });
    }
  }

  window.Grafico = { desenhar };
})();

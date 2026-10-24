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

    // Rótulos do eixo: no máximo ~6, distribuídos igualmente (funciona para 14, 30 e 90 dias)
    const qtdRotulos = Math.min(6, serie.length);
    const indices = [
      ...new Set(
        Array.from({ length: qtdRotulos }, (_, k) =>
          qtdRotulos > 1 ? Math.round((k * (serie.length - 1)) / (qtdRotulos - 1)) : 0
        )
      ),
    ];
    const rotulos = indices.map((i) => ({
      i,
      texto: serie[i].data.slice(5).split("-").reverse().join("/"),
    }));

    // Em séries longas, só marca os dias com registro (evita 90 círculos)
    const curta = serie.length <= 31;
    const pontosVisiveis = curta ? pontos : pontos.filter((p) => p.dado.totalCo2 > 0);
    const raio = curta ? 3.4 : 2.6;

    const rotuloAria = window.i18n
      ? window.i18n.t("painel.grafico_aria", { dias: serie.length })
      : `Evolução do CO₂ nos últimos ${serie.length} dias`;

    container.innerHTML =
      `<svg viewBox="0 0 ${largura} ${altura}" preserveAspectRatio="none" class="grafico-svg" role="img" aria-label="${rotuloAria}">` +
      `<polygon class="grafico-area" points="${area}" />` +
      `<polyline class="grafico-linha" points="${linha}" />` +
      pontosVisiveis
        .map(
          (p) =>
            `<circle class="grafico-ponto" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${raio}"><title>${p.dado.data
              .split("-")
              .reverse()
              .join("/")}: ${p.dado.totalCo2.toFixed(2).replace(".", ",")} kg</title></circle>`
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
        linhaEl.style.transition = "stroke-dashoffset 1.1s ease";
        linhaEl.style.strokeDashoffset = "0";
      });
    }

    if (areaEl) {
      areaEl.style.opacity = "0";
      requestAnimationFrame(() => {
        areaEl.style.transition = "opacity 1s ease .2s";
        areaEl.style.opacity = "0.18";
      });
    }
  }

  window.Grafico = { desenhar };
})();
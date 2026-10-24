/* =========================================================
   CARBONO CONSCIENTE — painel.js
   Tela logada de registro de deslocamentos e acompanhamento
   da pegada de carbono (front end/js/config.js define API_BASE).
   ========================================================= */
(function () {
  "use strict";

  const token = localStorage.getItem("carbono-token");
  if (!token) {
    window.location.replace("login.html");
    return;
  }

  const CABECALHOS = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  function t(chave, vars) { return window.i18n ? window.i18n.t(chave, vars) : chave; }

  // Os 8 meios de transporte são um conjunto fechado e fixo (seed do banco,
  // backend/sql/schema.sql) — mesmo padrão de tradução via lookup já usado
  // pros 6 nomes de continente em front end/js/globo.js (CHAVE_CONTINENTE).
  const CHAVE_MEIO = {
    "Carro (gasolina)": "painel.meios.carro_gasolina",
    "Carro (etanol)": "painel.meios.carro_etanol",
    "Carro (elétrico)": "painel.meios.carro_eletrico",
    "Motocicleta": "painel.meios.motocicleta",
    "Ônibus": "painel.meios.onibus",
    "Metrô/Trem": "painel.meios.metro_trem",
    "Bicicleta": "painel.meios.bicicleta",
    "A pé": "painel.meios.a_pe",
  };
  function nomeMeio(nomeOriginal) {
    const chave = CHAVE_MEIO[nomeOriginal];
    return chave ? t(chave) : nomeOriginal;
  }

  function saiuDaSessao() {
    localStorage.removeItem("carbono-token");
    localStorage.removeItem("carbono-usuario");
    window.location.replace("login.html");
  }

  async function chamarApi(caminho, opcoes) {
    let resposta;
    try {
      resposta = await fetch(API_BASE + caminho, opcoes);
    } catch {
      throw new Error(t("painel.erro_servidor"));
    }
    if (resposta.status === 401) {
      saiuDaSessao();
      throw new Error(t("painel.sessao_expirada"));
    }
    if (resposta.status === 204) return null;
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || t("painel.erro_generico"));
    return dados;
  }

  function fmtKg(n) {
    return `${n.toFixed(2).replace(".", ",")} kg`;
  }

  function fmtDataBR(iso) {
    try {
      return new Intl.DateTimeFormat(window.i18n ? window.i18n.idiomaAtual : "pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(iso + "T00:00:00")
      );
    } catch {
      return iso;
    }
  }

  function isoDeDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function hojeISO() {
    return isoDeDate(new Date());
  }

  function fmtDiaMes(iso) {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  }

  function calcularDelta(atual, anterior) {
    if (anterior === 0) {
      return atual === 0
        ? { texto: t("painel.delta_sem_registros"), classe: "neutro" }
        : { texto: t("painel.delta_primeiro_registro"), classe: "neutro" };
    }
    const variacao = ((atual - anterior) / anterior) * 100;
    if (Math.abs(variacao) < 1) return { texto: t("painel.delta_estavel"), classe: "neutro" };
    const subiu = variacao > 0;
    return {
      texto: `${subiu ? "▲" : "▼"} ${t("painel.delta_variacao", { percentual: Math.abs(variacao).toFixed(0) })}`,
      classe: subiu ? "subiu" : "desceu",
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const seletorMeio = document.getElementById("habito-meio");
    const campoData = document.getElementById("habito-data");
    const campoDistancia = document.getElementById("habito-distancia");
    const campoObservacao = document.getElementById("habito-observacao");
    const form = document.getElementById("form-habito");
    const mensagem = document.getElementById("painel-mensagem");
    const lista = document.getElementById("painel-lista");
    const botaoEnviar = form.querySelector(".btn-principal");

    campoData.value = hojeISO();
    campoData.max = hojeISO();

    if (window.Interativo) window.Interativo.ativarTiltGlow(".painel-card");

    function mostrarMensagem(texto, tipo) {
      mensagem.textContent = texto;
      mensagem.classList.remove("erro", "sucesso");
      if (texto) mensagem.classList.add(tipo);
    }

    // O botão agora tem ícone + <span>: o texto é trocado só no <span>
    // pra não apagar o ícone.
    function textoBotao(texto) {
      const alvo = botaoEnviar.querySelector("span") || botaoEnviar;
      alvo.textContent = texto;
    }

    // ---------- GRÁFICO POR PERÍODO ----------
    const graficoEl = document.getElementById("painel-grafico");
    const graficoTituloEl = document.querySelector(".painel-grafico-topo h2 span:last-child");
    const botoesPeriodo = document.querySelectorAll(".painel-periodo");
    let registrosCache = [];
    let periodoAtual = 14;

    // Mesmo formato que o grafico.js espera: { data, totalCo2 }
    function montarSerie(registros, dias) {
      const totais = new Map();
      registros.forEach((r) => {
        const dia = String(r.data).slice(0, 10);
        totais.set(dia, (totais.get(dia) || 0) + Number(r.co2 || 0));
      });
      const hoje = new Date();
      const serie = [];
      for (let i = dias - 1; i >= 0; i--) {
        const iso = isoDeDate(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i));
        serie.push({ data: iso, totalCo2: totais.get(iso) || 0 });
      }
      return serie;
    }

    function textoTituloGrafico(dias) {
      const chave = "painel.grafico_titulo_dias";
      const traduzido = t(chave, { dias });
      return traduzido && traduzido !== chave ? traduzido : `Evolução nos últimos ${dias} dias`;
    }

    function desenharGrafico() {
      if (!graficoEl || !window.Grafico) return;

      if (graficoTituloEl) {
        graficoTituloEl.removeAttribute("data-i18n"); // impede o i18n de sobrescrever o período
        graficoTituloEl.textContent = textoTituloGrafico(periodoAtual);
      }

      const serie = montarSerie(registrosCache, periodoAtual);

      if (!serie.some((p) => p.totalCo2 > 0)) {
        const msg = t("painel.grafico_vazio");
        graficoEl.innerHTML = `<p class="painel-vazio">${
          msg !== "painel.grafico_vazio" ? msg : `Nenhum registro nos últimos ${periodoAtual} dias.`
        }</p>`;
        return;
      }

      window.Grafico.desenhar(graficoEl, serie);

      const total = serie.reduce((s, p) => s + p.totalCo2, 0);
      const pico = serie.reduce((a, b) => (b.totalCo2 > a.totalCo2 ? b : a));
      graficoEl.insertAdjacentHTML(
        "beforeend",
        `<div class="grafico-resumo">
          <span>Total: <b>${fmtKg(total)}</b></span>
          <span>Média/dia: <b>${fmtKg(total / serie.length)}</b></span>
          <span>Pico: <b>${fmtKg(pico.totalCo2)}</b> (${fmtDiaMes(pico.data)})</span>
        </div>`
      );
    }

    botoesPeriodo.forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.classList.contains("ativo"));
      btn.addEventListener("click", () => {
        if (Number(btn.dataset.periodo) === periodoAtual) return;
        periodoAtual = Number(btn.dataset.periodo);
        botoesPeriodo.forEach((b) => {
          b.classList.toggle("ativo", b === btn);
          b.setAttribute("aria-pressed", b === btn);
        });
        desenharGrafico();
      });
    });

    // ---------- TRANSIÇÃO DE TEMA ----------
    // Liga a classe só durante a troca, para não pesar o resto do tempo.
    const botaoTema = document.querySelector(".theme-toggle");
    if (botaoTema) {
      botaoTema.addEventListener("click", () => {
        const raiz = document.documentElement;
        raiz.classList.add("tema-transicionando");
        clearTimeout(botaoTema._timerTema);
        botaoTema._timerTema = setTimeout(() => raiz.classList.remove("tema-transicionando"), 400);
      });
    }

    // ---------- DADOS ----------
    async function carregarMeios() {
      const meios = await chamarApi("/meios-transporte", { headers: CABECALHOS });
      // <option> só aceita texto — o ícone (SVG) aparece na lista de
      // registros abaixo, que é HTML de verdade.
      seletorMeio.innerHTML = meios.map((m) => `<option value="${m.id}">${nomeMeio(m.nome)}</option>`).join("");
    }

    async function carregarResumo() {
      const resumo = await chamarApi("/habitos/resumo", { headers: CABECALHOS });

      const configCards = [
        { card: "hoje", atual: resumo.hoje.totalCo2, anterior: resumo.ontem.totalCo2 },
        { card: "semana", atual: resumo.semanaAtual.totalCo2, anterior: resumo.semanaAnterior.totalCo2 },
        { card: "mes", atual: resumo.mesAtual.totalCo2, anterior: resumo.mesAnterior.totalCo2 },
      ];

      configCards.forEach(({ card, atual, anterior }) => {
        const el = document.querySelector(`.painel-card[data-card="${card}"]`);
        if (!el) return;
        const numero = el.querySelector("strong");
        if (window.Interativo) window.Interativo.animarNumero(numero, fmtKg(atual));
        else numero.textContent = fmtKg(atual);
        const delta = calcularDelta(atual, anterior);
        const deltaEl = el.querySelector(".painel-delta");
        deltaEl.textContent = delta.texto;
        deltaEl.className = `painel-delta ${delta.classe}`;
      });
    }

    async function carregarLista() {
      const registros = await chamarApi("/habitos", { headers: CABECALHOS });

      // O gráfico usa os mesmos registros reais da lista, no período ativo.
      registrosCache = registros;
      desenharGrafico();

      // Árvore da sequência: calcula os dias seguidos a partir dos registros.
      if (window.Arvore) window.Arvore.atualizar(registros);

      if (!registros.length) {
        lista.innerHTML = `<p class="painel-vazio">${t("painel.registros_vazio")}</p>`;
        return;
      }
      lista.innerHTML = registros
        .map(
          (r) => `
        <div class="painel-item" data-id="${r.id}">
          <div class="painel-item-info">
            <span class="painel-item-icone">${window.Icones.icone((r.meio && r.meio.icone) || "carro")}</span>
            <div class="painel-item-detalhes">
              <strong>${(r.meio && nomeMeio(r.meio.nome)) || t("painel.meio_removido")}</strong>
              <span>${fmtDataBR(r.data)} · ${r.distanciaKm.toString().replace(".", ",")} km${r.observacao ? " · " + r.observacao : ""}</span>
            </div>
          </div>
          <div class="painel-item-info">
            <span class="painel-item-co2">${fmtKg(r.co2)}</span>
            <button class="painel-remover" title="${t("painel.remover_registro")}" data-id="${r.id}" aria-label="${t("painel.remover_registro")}">×</button>
          </div>
        </div>`
        )
        .join("");
    }

    async function atualizarTudo() {
      await Promise.all([carregarResumo(), carregarLista()]);
    }

    lista.addEventListener("click", async (e) => {
      const botao = e.target.closest(".painel-remover");
      if (!botao) return;
      botao.disabled = true;
      try {
        await chamarApi(`/habitos/${botao.dataset.id}`, { method: "DELETE", headers: CABECALHOS });
        await atualizarTudo();
      } catch (erro) {
        mostrarMensagem(erro.message, "erro");
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      mostrarMensagem("", "erro");
      botaoEnviar.disabled = true;
      textoBotao(t("painel.salvando"));
      try {
        await chamarApi("/habitos", {
          method: "POST",
          headers: CABECALHOS,
          body: JSON.stringify({
            idMeio: Number(seletorMeio.value),
            data: campoData.value,
            distanciaKm: campoDistancia.value,
            observacao: campoObservacao.value,
          }),
        });
        campoDistancia.value = "";
        campoObservacao.value = "";
        mostrarMensagem(t("painel.registrado_sucesso"), "sucesso");
        await atualizarTudo();
      } catch (erro) {
        mostrarMensagem(erro.message, "erro");
      } finally {
        botaoEnviar.disabled = false;
        textoBotao(t("painel.botao_adicionar"));
      }
    });

    carregarMeios()
      .then(atualizarTudo)
      .catch((erro) => mostrarMensagem(erro.message, "erro"));
  });
})();
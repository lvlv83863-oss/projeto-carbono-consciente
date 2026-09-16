/* =========================================================
   CARBONO CONSCIENTE — dados.js
   Busca notícias e estatísticas na API (front end/js/config.js
   define API_BASE) e atualiza o texto dos cards/números que já
   existem no HTML. Se a API estiver fora do ar, simplesmente
   não mexe em nada — o conteúdo fixo do HTML continua servindo
   de conteúdo de fallback.

   Importante: isto só troca o TEXTO dentro dos elementos que já
   existem no HTML (nunca recria os elementos em si), porque a
   animação de entrada ao rolar (inicial.js) já registrou esses
   mesmos elementos num IntersectionObserver — recriá-los faria
   os novos nós nunca receberem a classe "visivel" e ficarem
   invisíveis.
   ========================================================= */
(function () {
  "use strict";

  function formatarData(dataIso) {
    try {
      const data = new Date(dataIso + "T00:00:00");
      return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(data);
    } catch {
      return dataIso;
    }
  }

  async function atualizarEstatisticas() {
    let lista;
    try {
      const resposta = await fetch(API_BASE + "/estatisticas");
      if (!resposta.ok) return;
      lista = await resposta.json();
    } catch {
      return; // backend fora do ar — mantém os números fixos do HTML
    }

    lista.forEach((item) => {
      const bloco = document.querySelector(`.stat[data-chave="${item.chave}"]`);
      if (!bloco) return;
      const numero = bloco.querySelector("strong");
      const descricao = bloco.querySelector("span");
      if (numero) numero.textContent = item.valor;
      if (descricao) descricao.textContent = item.descricao;
    });
  }

  async function atualizarNoticias() {
    let lista;
    try {
      const resposta = await fetch(API_BASE + "/noticias");
      if (!resposta.ok) return;
      lista = await resposta.json();
    } catch {
      return; // backend fora do ar — mantém as notícias fixas do HTML
    }

    lista.forEach((noticia) => {
      const card = document.querySelector(`.noticia-card[data-id="${noticia.id}"]`);
      if (!card) return;
      const categoria = card.querySelector(".noticia-categoria");
      const texto = card.querySelector(".noticia-conteudo p");
      const data = card.querySelector(".noticia-data");
      if (categoria) categoria.textContent = `${noticia.emoji} ${noticia.categoria}`;
      if (texto) texto.textContent = noticia.texto;
      if (data) data.textContent = formatarData(noticia.data);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    atualizarEstatisticas();
    atualizarNoticias();
  });
})();

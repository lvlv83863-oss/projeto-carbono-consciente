/* =========================================================
   CARBONO CONSCIENTE — seletor-busca.js
   Combobox pesquisável genérico, reaproveitado pelo campo de
   país no cadastro (front end/js/auth.js) e pelo seletor de
   idioma do header (front end/js/componentes/idioma-switcher.js).
   Inspirado na busca por país já existente no globo
   (front end/js/globo.js), generalizada em fábrica + navegação
   por teclado, já que aqui vira parte de formulários reais.
   ========================================================= */
(function () {
  "use strict";

  function normalizarTexto(texto) {
    return (texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  /**
   * criar({
   *   input: HTMLInputElement,            // campo de texto onde o usuário digita
   *   containerResultados: HTMLElement,   // onde a lista de resultados é renderizada
   *   opcoes: () => Array|Array,          // lista de opções (ou função que retorna a lista, avaliada a cada busca)
   *   textoOpcao: (opcao) => string,      // label visível/pesquisável da opção
   *   valorOpcao: (opcao) => string,      // valor interno (ex.: código ISO)
   *   aoEscolher: (opcao) => void,        // callback ao selecionar
   *   maxResultados: number,              // default 8
   * })
   */
  function criar({ input, containerResultados, opcoes, textoOpcao, valorOpcao, aoEscolher, maxResultados = 8 }) {
    let foco = -1;
    let resultadosAtuais = [];

    function listaOpcoes() {
      return typeof opcoes === "function" ? opcoes() : opcoes;
    }

    function buscar(termo) {
      const alvo = normalizarTexto(termo);
      if (!alvo) return [];
      return listaOpcoes()
        .filter((opcao) => normalizarTexto(textoOpcao(opcao)).includes(alvo))
        .slice(0, maxResultados);
    }

    function fechar() {
      containerResultados.innerHTML = "";
      containerResultados.classList.remove("ativo");
      foco = -1;
      resultadosAtuais = [];
    }

    function escolher(opcao) {
      input.value = textoOpcao(opcao);
      fechar();
      aoEscolher(opcao);
    }

    function destacar(indice) {
      const botoes = containerResultados.querySelectorAll("button");
      botoes.forEach((b, i) => b.classList.toggle("em-foco", i === indice));
      if (botoes[indice]) botoes[indice].scrollIntoView({ block: "nearest" });
    }

    function renderizar(encontrados) {
      resultadosAtuais = encontrados;
      foco = -1;
      if (!encontrados.length) {
        fechar();
        return;
      }
      containerResultados.innerHTML = encontrados
        .map((_, i) => `<button type="button" data-indice="${i}"></button>`)
        .join("");
      containerResultados.querySelectorAll("button").forEach((botao, i) => {
        botao.textContent = textoOpcao(encontrados[i]);
        botao.setAttribute("data-valor", valorOpcao(encontrados[i]));
        botao.addEventListener("mousedown", (e) => {
          e.preventDefault(); // evita o blur do input antes do click
          escolher(encontrados[i]);
        });
      });
      containerResultados.classList.add("ativo");
    }

    input.addEventListener("input", () => {
      renderizar(buscar(input.value));
    });

    input.addEventListener("focus", () => {
      if (input.value) renderizar(buscar(input.value));
    });

    input.addEventListener("blur", () => {
      // pequeno atraso para o mousedown do botão (acima) rodar antes de fechar
      setTimeout(fechar, 120);
    });

    input.addEventListener("keydown", (e) => {
      if (!resultadosAtuais.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        foco = (foco + 1) % resultadosAtuais.length;
        destacar(foco);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        foco = foco <= 0 ? resultadosAtuais.length - 1 : foco - 1;
        destacar(foco);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const escolhido = resultadosAtuais[foco] ?? resultadosAtuais[0];
        if (escolhido) escolher(escolhido);
      } else if (e.key === "Escape") {
        fechar();
      }
    });

    return { fechar, buscar };
  }

  window.SeletorBusca = { criar };
})();

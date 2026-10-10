/* =========================================================
   CARBONO CONSCIENTE — auth.js
   Login e cadastro conectados à API (front end/js/config.js
   define API_BASE). Substitui o antigo script inline de
   login.html, que só dava e.preventDefault() sem enviar nada.
   ========================================================= */
(function () {
  "use strict";

  const URL_EMISSOES = "../data/emissoes.json";

  function t(chave, vars) {
    return window.i18n ? window.i18n.t(chave, vars) : chave;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    const formCadastro = document.getElementById("form-cadastro");

    document.getElementById("ir-para-cadastro").addEventListener("click", () => {
      formLogin.classList.add("escondido");
      formCadastro.classList.remove("escondido");
    });

    document.getElementById("ir-para-login").addEventListener("click", () => {
      formCadastro.classList.add("escondido");
      formLogin.classList.remove("escondido");
    });

    document.querySelectorAll(".btn-google").forEach((botao) => {
      botao.addEventListener("click", () => {
        mostrarMensagem(botao.closest("form"), t("auth.google_em_breve"), "info");
      });
    });

    function mostrarMensagem(form, texto, tipo) {
      let el = form.querySelector(".auth-mensagem");
      if (!el) {
        el = document.createElement("div");
        el.className = "auth-mensagem";
        form.insertBefore(el, form.querySelector(".btn-entrar"));
      }
      el.textContent = texto;
      el.classList.remove("erro", "sucesso", "info");
      if (texto) el.classList.add(tipo);
    }

    function definirCarregando(form, carregando, rotuloNormal) {
      const botao = form.querySelector(".btn-entrar");
      botao.disabled = carregando;
      botao.textContent = carregando ? t("auth.enviando") : rotuloNormal;
    }

    async function enviarJson(caminho, corpo) {
      let resposta;
      try {
        resposta = await fetch(API_BASE + caminho, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
      } catch {
        throw new Error(t("auth.erro_servidor"));
      }
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || t("auth.erro_generico"));
      return dados;
    }

    function salvarSessao(dados) {
      localStorage.setItem("carbono-token", dados.token);
      localStorage.setItem("carbono-usuario", JSON.stringify(dados.usuario));
    }

    /* ---------- campo de país (cadastro) — busca pesquisável ---------- */
    (function configurarCampoPais() {
      const campoPais = document.getElementById("cad-pais");
      const campoPaisCodigo = document.getElementById("cad-pais-codigo");
      const resultadosPais = document.getElementById("cad-pais-resultados");
      if (!campoPais || !window.SeletorBusca) return;

      let opcoesPaises = [];

      fetch(URL_EMISSOES)
        .then((r) => r.json())
        .then((emissoes) => {
          opcoesPaises = Object.entries(emissoes).map(([iso3, dado]) => ({ iso3, iso2: dado.iso2 }));
        })
        .catch(() => { opcoesPaises = []; });

      function nomePais(opcao) {
        try {
          return new Intl.DisplayNames([window.i18n ? window.i18n.idiomaAtual : "pt"], { type: "region" }).of(opcao.iso2);
        } catch {
          return opcao.iso3;
        }
      }

      window.SeletorBusca.criar({
        input: campoPais,
        containerResultados: resultadosPais,
        opcoes: () => opcoesPaises,
        textoOpcao: nomePais,
        valorOpcao: (opcao) => opcao.iso3,
        aoEscolher: (opcao) => { campoPaisCodigo.value = opcao.iso3; },
      });

      // se o usuário editar o texto manualmente sem escolher uma opção da
      // lista, o código fica desatualizado — melhor limpar do que mandar
      // um valor que não corresponde mais ao texto exibido.
      campoPais.addEventListener("input", () => { campoPaisCodigo.value = ""; });
    })();

    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      mostrarMensagem(formLogin, "", "info");
      definirCarregando(formLogin, true, t("auth.login.botao"));
      try {
        const dados = await enviarJson("/auth/login", {
          email: document.getElementById("login-email").value,
          senha: document.getElementById("login-senha").value,
        });
        salvarSessao(dados);
        window.location.href = "inicial.html";
      } catch (erro) {
        mostrarMensagem(formLogin, erro.message, "erro");
        definirCarregando(formLogin, false, t("auth.login.botao"));
      }
    });

    formCadastro.addEventListener("submit", async (e) => {
      e.preventDefault();
      const senha = document.getElementById("cad-senha").value;
      const confirmar = document.getElementById("cad-confirmar").value;
      if (senha !== confirmar) {
        mostrarMensagem(formCadastro, t("auth.validacao.senhas_nao_conferem"), "erro");
        return;
      }
      mostrarMensagem(formCadastro, "", "info");
      definirCarregando(formCadastro, true, t("auth.cadastro.botao"));
      try {
        const dados = await enviarJson("/auth/registrar", {
          nome: document.getElementById("cad-nome").value,
          email: document.getElementById("cad-email").value,
          senha,
          confirmar,
          pais: document.getElementById("cad-pais-codigo").value || null,
        });
        salvarSessao(dados);
        window.location.href = "inicial.html";
      } catch (erro) {
        mostrarMensagem(formCadastro, erro.message, "erro");
        definirCarregando(formCadastro, false, t("auth.cadastro.botao"));
      }
    });
  });
})();

/* =========================================================
   CARBONO CONSCIENTE — auth.js
   Login e cadastro conectados à API (front end/js/config.js
   define API_BASE). Substitui o antigo script inline de
   login.html, que só dava e.preventDefault() sem enviar nada.
   ========================================================= */
(function () {
  "use strict";

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
        mostrarMensagem(botao.closest("form"), "Login com o Google em breve.", "info");
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
      botao.textContent = carregando ? "enviando..." : rotuloNormal;
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
        throw new Error("Não foi possível falar com o servidor. Ele está rodando?");
      }
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível completar a operação.");
      return dados;
    }

    function salvarSessao(dados) {
      localStorage.setItem("carbono-token", dados.token);
      localStorage.setItem("carbono-usuario", JSON.stringify(dados.usuario));
    }

    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      mostrarMensagem(formLogin, "", "info");
      definirCarregando(formLogin, true, "entrar");
      try {
        const dados = await enviarJson("/auth/login", {
          email: document.getElementById("login-email").value,
          senha: document.getElementById("login-senha").value,
        });
        salvarSessao(dados);
        window.location.href = "inicial.html";
      } catch (erro) {
        mostrarMensagem(formLogin, erro.message, "erro");
        definirCarregando(formLogin, false, "entrar");
      }
    });

    formCadastro.addEventListener("submit", async (e) => {
      e.preventDefault();
      const senha = document.getElementById("cad-senha").value;
      const confirmar = document.getElementById("cad-confirmar").value;
      if (senha !== confirmar) {
        mostrarMensagem(formCadastro, "As senhas não conferem.", "erro");
        return;
      }
      mostrarMensagem(formCadastro, "", "info");
      definirCarregando(formCadastro, true, "cadastrar");
      try {
        const dados = await enviarJson("/auth/registrar", {
          nome: document.getElementById("cad-nome").value,
          email: document.getElementById("cad-email").value,
          senha,
          confirmar,
        });
        salvarSessao(dados);
        window.location.href = "inicial.html";
      } catch (erro) {
        mostrarMensagem(formCadastro, erro.message, "erro");
        definirCarregando(formCadastro, false, "cadastrar");
      }
    });
  });
})();

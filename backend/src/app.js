const express = require("express");
const cors = require("cors");

const rotas = require("./rotas");
const tratadorErros = require("./intermediarios/tratadorErros");

const app = express();

// Só o site publicado (e o Live Server local) podem chamar a API pelo navegador.
app.use(
  cors({
    origin: [
      "https://lvlv83863-oss.github.io/projeto-carbono-consciente/", // troque se o seu site tiver outro domínio
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ nome: "API Carbono Consciente", status: "ok" });
});

app.use("/api", rotas);

app.use((_req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

app.use(tratadorErros);

module.exports = app;
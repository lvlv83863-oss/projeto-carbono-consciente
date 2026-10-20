const express = require("express");
const cors = require("cors");

const rotas = require("./rotas");
const tratadorErros = require("./intermediarios/tratadorErros");

const app = express();

// Só o site publicado (e o front-end local, em qualquer porta) podem chamar
// a API pelo navegador. Importante: 5432 é a porta do PostgreSQL (ver
// backend/src/config/env.js), não a de um servidor web — nenhum navegador
// serve HTML por ali. O front-end local costuma rodar numa porta variável
// (Live Server, "npx serve", etc.), então aceitamos qualquer origem
// localhost/127.0.0.1 independente da porta, e fixamos só o domínio de
// produção de verdade.
app.use(
  cors({
    origin: [
      "https://lvlv83863-oss.github.io", // troque se o seu site tiver outro domínio
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
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
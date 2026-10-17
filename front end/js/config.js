/* =========================================================
   CARBONO CONSCIENTE — config.js
   Endereço da API do backend.

   Escolhido automaticamente pelo hostname da página: quando o
   front-end é aberto em localhost/127.0.0.1 (VS Code Live
   Server, Live Preview, "npx serve", etc.), usa o backend local
   — assim testar localmente sempre reflete o código que está
   no seu computador agora, sem precisar lembrar de trocar essa
   linha na mão (e sem risco de esquecer e publicar apontando
   pro servidor local por engano). Em qualquer outro hostname
   (o site publicado de verdade), usa a API em produção no Render.
   ========================================================= */
const API_BASE = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "http://localhost:4321/api"
  : "https://projeto-carbono-consciente.onrender.com/api";

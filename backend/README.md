# Backend — Carbono Consciente

API para as funcionalidades do site que hoje dependiam de backend: login/cadastro, notícias reais, curiosidades, estatísticas em tempo real e o painel de hábitos de deslocamento.

## Como rodar

```bash
cd backend
npm install
cp .env.example .env   # opcional — sem isso, os valores padrão de dev já funcionam
npm start
```

O servidor sobe em `http://localhost:4321` (ou na porta definida em `PORTA` no `.env`) — a porta padrão foi escolhida para não colidir com portas comumente ocupadas por outras ferramentas (VS Code, Live Server/Live Preview em 3000/3001/5500, etc.). O front-end estático (`front end/`) aponta para essa URL através de `front end/js/config.js`. Se `4321` também estiver ocupada na sua máquina, veja o que está usando a porta (`ss -ltnp | grep 4321` no Linux) e troque `PORTA` no `.env` — lembrando de atualizar `front end/js/config.js` para o mesmo número.

## Banco de dados: MySQL (porta 3307)

`usuarios`, `meios_transporte` e `habitos` ficam no MySQL, usando o schema de `sql/schema.sql`. No nosso ambiente o MySQL roda num container Docker com a porta **3307** do PC mapeada para a 3306 do container (`-p 3307:3306`).

Configuração (arquivo `.env`, copiado de `.env.example`):

```
DB_HOST=127.0.0.1
DB_PORTA=3307
DB_USUARIO=root
DB_SENHA=root123
DB_NOME=carbono_consciente
```

Primeira vez (ou depois de recriar o container):

```bash
cd backend
npm install
copy .env.example .env      # Windows (no Linux/Mac: cp)
npm run db:setup            # cria o banco, as tabelas, o trigger e os 8 meios de transporte
npm start
```

`npm run db:setup` pode ser repetido sem problema. Ao iniciar, o servidor imprime `Banco de dados conectado em ...` ou o motivo da falha. Se o banco estiver fora do ar, as rotas que dependem dele respondem `503`.

A estrutura em camadas continua a mesma — `rotas → controladores → servicos → repositorios → banco`. Só os repositórios (`src/repositorios/`) falam SQL, usando o pool de `src/config/bancoDados.js`.

`noticias`, `curiosidades` e os dados de países do globo continuam em arquivos JSON/RSS (`src/dados/`); `usuarios.json` e `habitos.json` não são mais usados.

## Modelo de dados

### `usuarios`
| campo | tipo | observação |
|---|---|---|
| id | número | `id_usuario` (AUTO_INCREMENT) |
| nome | string | |
| email | string | único |
| senhaHash | string | bcrypt, nunca devolvido pela API |
| provedor | `"local"` \| `"google"` | hoje só "local" é usado de verdade |
| googleId | string \| null | reservado para o login com Google |
| criadoEm | timestamp ISO | |

### `noticias`
| campo | tipo | observação |
|---|---|---|
| id | string | hash do link (estável enquanto o item estiver no cache) |
| categoria | string | atribuída por palavra-chave no título (`clima`, `energia`, `reciclagem`, ou `sustentabilidade` como padrão) |
| emoji | string | |
| corClasse | string | classe CSS já existente no front (`bg-clima`, `bg-energia`, `bg-reciclagem-n`, `bg-sustentabilidade`) |
| titulo | string | manchete real, vinda do RSS |
| fonte | string | nome do veículo, vindo do RSS |
| data | timestamp ISO | data de publicação real |
| linkExterno | string \| null | link da matéria original (abre em nova aba) |

**Fonte principal: RSS real do Google Notícias** (`src/servicos/noticiasFonteServico.js`), filtrado por termos ambientais, sem precisar de chave de API — cacheado em memória por 30 min. `noticiasRepositorio.js`/`noticias.json` só entram como **fallback** se essa busca externa falhar (sem internet, Google fora do ar). O RSS não fornece um resumo de verdade (só repete o título), por isso a API não inventa uma descrição — o front mostra título + fonte + data reais, com link pra matéria completa.

### `estatisticas`
Não é mais uma lista fixa — `GET /api/estatisticas` **calcula na hora**, combinando os dados de país/CO₂ do globo (`src/dados/emissoesPaises.json`, cópia de `front end/data/emissoes.json`) com os hábitos do usuário logado (quando houver token). Resposta:

```json
{ "logado": true, "itens": [ { "chave": "...", "valor": "...", "descricao": "..." }, ... ], "saudePlanta": 97 }
```

- **Sem login**: CO₂ médio mundial por pessoa, maior emissor, menor emissor, países monitorados. Sem `saudePlanta`.
- **Logado**: seu CO₂ nesta semana (via `habitosServico.resumo`), comparação % com a média semanal dos países, posição estimada no ranking mundial, países monitorados, mais `saudePlanta` (0-100 — 50 é a média dos países, 100 é bem abaixo/ótimo, 0 é bem acima/ruim), usado pela planta animada da home (`front end/js/planta.js`).

`estatisticas.json`/`estatisticasRepositorio.listar()` só existem como último fallback, caso `emissoesPaises.json` não possa ser lido.

### `curiosidades`
| campo | tipo | observação |
|---|---|---|
| id | número | |
| texto | string | fato ambiental real e verificável |

Somente leitura. O front mostra uma curiosidade por vez (escolhida pelo dia do ano, muda sozinha a cada dia) com um botão que cicla pela lista já carregada.

### `meios_transporte`
| campo | tipo | observação |
|---|---|---|
| id | número | equivalente a `id_meio` no `schema.sql` |
| nome | string | ex.: "Carro (gasolina)" |
| fatorEmissao | número | kg de CO₂ por km percorrido |
| icone | string | emoji usado no formulário/lista do painel |

Somente leitura, semeado com os mesmos 8 meios do `INSERT` em `backend/sql/schema.sql`.

### `habitos`
| campo | tipo | observação |
|---|---|---|
| id | número | equivalente a `id_habito` |
| idUsuario | número | dono do registro (`id_usuario`) |
| idMeio | número | referência a `meios_transporte.id` |
| data | data ISO (`AAAA-MM-DD`) | data do deslocamento |
| distanciaKm | número | |
| co2 | número | calculado no serviço como `distanciaKm * fatorEmissao` — mesma regra do trigger `trg_habitos_calcula_co2` do `schema.sql` |
| observacao | string \| null | |
| criadoEm | timestamp ISO | |

Criado e removido pelo próprio usuário logado, pela tela `front end/html/painel.html`.

## Rotas

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/api/auth/registrar` | não | cria conta (nome, email, senha, confirmar) |
| POST | `/api/auth/login` | não | autentica (email, senha), devolve `{ usuario, token }` |
| GET | `/api/auth/me` | sim (`Authorization: Bearer <token>`) | dados do usuário logado |
| POST | `/api/auth/google` | não | **não implementado** — responde 501. Exige credenciais OAuth (Client ID/Secret) que só o dono do projeto pode criar no Google Cloud Console. Ver comentário em `src/controladores/autenticacaoControlador.js`. |
| GET | `/api/noticias` | não | notícias reais (RSS), mais recentes primeiro |
| GET | `/api/noticias/:id` | não | uma notícia (dentro da leva cacheada atual) |
| GET | `/api/estatisticas` | opcional | calculado; personalizado se vier `Authorization: Bearer <token>`, global se não vier |
| GET | `/api/curiosidades` | não | lista de fatos ambientais reais |
| GET | `/api/meios-transporte` | não | lista os meios de transporte e seus fatores de emissão |
| GET | `/api/habitos` | sim | lista os registros de deslocamento do usuário logado |
| POST | `/api/habitos` | sim | cria um registro (`idMeio`, `data`, `distanciaKm`, `observacao` opcional) |
| DELETE | `/api/habitos/:id` | sim | remove um registro — só se for do próprio usuário |
| GET | `/api/habitos/resumo` | sim | totais de CO₂: hoje, ontem, semana atual/anterior, mês atual/anterior |
| GET | `/api/habitos/serie` | sim | CO₂ por dia nos últimos 14 dias (0 nos dias sem registro) — usado pelo gráfico do painel |

Erros sempre voltam como `{ "erro": "mensagem" }` com o status HTTP correspondente (400 dado inválido, 401 não autenticado, 404 não encontrado, 409 conflito, 501 não implementado, 500 erro inesperado).

## CORS

Liberado para qualquer origem (`cors()` sem restrição) — adequado para desenvolvimento local. Antes de qualquer publicação real, restrinja para o domínio do front-end em `src/app.js`.

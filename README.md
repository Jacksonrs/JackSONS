# JacksSONS — Music Player

Player de música que toca faixas direto do YouTube. Você cola um link, ele entra na fila e começa a tocar na hora.

---

## 1. A ideia

A ideia nasceu de um problema simples: guardar música no celular ocupa muito espaço, e manter uma lista de reprodução favoriteitos em qualquer plataforma exige conta, login e assinatura.

A proposta foi inverter a lógica — em vez de *armazenar* arquivos, **guardar apenas referências**. O app não hospeda nenhum áudio: ele mantém uma fila de links do YouTube e toca cada vídeo pelo player embutido do próprio YouTube.

Isso traz uma consequência boa e uma ruim, e vale ser honesto sobre as duas:

- **Bom:** a biblioteca é infinita e grátis, sem upload, sem servidor, sem custo de armazenamento. Adicionar uma música é copiar e colar.
- **Ruim:** funciona sob as regras do YouTube. Vídeos com embedding desabilitado ou bloqueados na sua região não tocam, e o app não pode contornar isso — o fallback para `youtube-nocookie` é o máximo que dá para fazer dentro das regras da plataforma.

O escopo foi mantida propositalmente pequeno: **um arquivo HTML, um CSS e um JS, zero build, zero dependência instalada**. Abrir o `index.html` e tocar. Se precisar de `npm install` pra rodar, a ideia já perdeu.

## 2. O que foi criado

| | |
| --- | --- |
| **`index.html`** | Markup completo: sidebar de fila, formulário de adicionar, capa, barra de progresso, controles e atalhos |
| **`style.css`** | Tema dark, fundo aurora animado, layout responsivo, microinterações e animações da capa girando |
| **`app.js`** | Toda a lógica: player, extração de ID, metadata, fila, persistência, atalhos |
| **`README.md`** | Este documento |

### Funcionalidades

- **Adicionar por link** — aceita URL completa do YouTube ou só o ID do vídeo
- **Fila persistente** — a queue, o volume e o estado são salvos no `localStorage` e restaurados ao reabrir
- **Shuffle** e **Repeat** — repete a fila inteira ou só a faixa atual
- **Seek e volume por clique ou arraste**, com barra de buffer e preview de tempo no hover
- **Metadata automática** — título, artista e thumbnail da oEmbed API do YouTube
- **Fallback automático** — se um vídeo estiver bloqueado para embed, tenta automaticamente o domínio `youtube-nocookie`
- **Watchdog de autoplay** — detecta quando o player é bloqueado pelo navegador e reage em vez de travar em silêncio
- **Atalhos de teclado** para tudo, sem precisar tirar a mão do teclado

### Atalhos

| Tecla | Ação |
| --- | --- |
| `Espaço` | Play / pause |
| `←` / `→` | Voltar / avançar 5s |
| `↑` / `↓` | Volume + / − |
| `M` | Mudo |
| `S` | Shuffle |
| `R` | Repeat |
| `Enter` | Foca o campo de link |

## 3. Quais mídias foram usadas

O projeto **não contém nenhum arquivo de mídia binário** — nenhum `.mp3`, `.mp4`, `.png` ou `.svg` versionado. Tudo é resolvido em tempo de execução:

| Mídia | Origem | Tipo |
| --- | --- | --- |
| **Áudio** | YouTube IFrame Player API | Stream do vídeo, entregue pelo player do YouTube via CDN |
| **Thumbnails / capa** | `i.ytimg.com` | JPEG `hqdefault` de cada vídeo |
| **Metadados** (título, autor) | YouTube oEmbed API | JSON |
| **Ícones** | SVG inline no `index.html` | Play, pause, next, prev, shuffle, repeat, volume — desenhados à mão em `<svg>`, sem fonte de ícones |
| **Tipografia** | Google Fonts — **Inter** (400/500/600/700/800) | WOFF2 |
| **Fonte de áudio (demo)** | 4 vídeos do YouTube | IDs de exemplo que pré-populam a fila no primeiro acesso |

O fundo aurora e a capa girando são **gerados por CSS puro** — gradientes, `blur` e `@keyframes`. Nenhuma imagem de fundo.

Sobre a fonte de áudio: o app não distribui música. As faixas de demonstração são apenas IDs públicos de vídeo, e o conteúdo obedece ao que o YouTube disponibilizar via embed.

## 4. Qual IA foi usada

**opencode rodando o modelo `big-pickle`.**

O código foi **majoritariamente gerado por IA**. O papel humano foi definir a ideia, escolher a abordagem técnica sem build, revisar o resultado contra o comportamento esperado do player e dirigir as correções.

A IA foi responsável por:

- Estruturar o arquivo único de JS com o estado do player, a fila e a persistência separados
- Implementar a extração de ID a partir dos formatos de URL do YouTube (`watch?v=`, `youtu.be/`, `shorts/`, `embed/`, ID cru)
- Escrever a camada de metadata com a oEmbed API e o fallback de thumbnail
- Codificar a lógica de autoplay com watchdog, que é a parte mais sutil do app
- Gerar o CSS completo — tema, layout responsivo, animações e as microinterações
- Documentar o projeto (incluindo este README)

## 5. Quais ferramentas foram usadas

| Ferramenta | Para quê |
| --- | --- |
| **HTML5** | Estrutura da página |
| **CSS3** | Estilização — grid, flexbox, custom properties, `@keyframes`, `backdrop-filter` |
| **JavaScript (ES2022)** | Toda a lógica, sem framework |
| **`yt-player` v3.6.1** | Única dependência. Biblioteca que faz a ponte com a YouTube IFrame Player API. Carregada via CDN `esm.sh` |
| **YouTube IFrame Player API** | Player real — decode, buffering, volume |
| **YouTube oEmbed API** | Título, autor e thumbnail |
| **`localStorage`** | Persistência da fila e das preferências |
| **Git** | Versionamento |
| **GitHub** | Hospedagem do repositório |
| **opencode + `big-pickle`** | Geração do código e da documentação |

**O que *não* foi usado:** npm, bundler, framework (React/Vue), Node.js, backend, banco de dados. Zero build step — é por isso que o projeto tem três arquivos.

## 6. O que aprendemos no desenvolvimento

**A YouTube IFrame API não é uma API de música — é um player de vídeo com esquisitos.** Tratar todo vídeo como faixa obrigou a resolver uma pilha de casos que só aparecem em produção: vídeo sem embed, região bloqueada, autoplay bloqueado pelo navegador, thumbnail 404, `onError` disparando com `error.code` em vez de mensagem. Nenhuma dessas regras está documentada de forma útil na doc oficial — foram descobertas testando.

**Políticas de autoplay são a principal fonte de "bug invisível" em player web.** O navegador bloqueia autoplay com som sem interação do usuário, e a API reporta isso de forma obscura. Um player que não trata isso simplesmente *fica parado sem explicar por quê*. O watchdog existe porque isso foi o bug mais difícil de diagnosticar do projeto inteiro.

**`localStorage` é sincrono e pequeno, mas é mais que suficiente aqui.** Serializar a fila inteira a cada mudança de faixa resolve o problema de persistência com duas linhas. A restrição real (5MB, ser síncrono no main thread) só importa quando o app cresce — e ele não vai.

**Fallback não é o mesmo que resiliência.** Trocar `youtube.com` por `youtube-nocookie.com` parece cosmético, mas muda o contexto de embedding e resolve uma classe inteira de falhas. A tentativa é barata e o ganho é desproporcional — vale fazer mesmo sem saber se vai precisar.

**Zero build não é minimalismo, é simplicidade operacional.** A decisão de não usar framework eliminou um `package.json`, um `node_modules` e um pipeline inteiro de deploy. Para um app de uma tela, o custo de não ter build é praticamente zero e o benefício é o projeto inteiro caber em três arquivos que dá pra ler de ponta a ponta.

**IA gera a implementação; o humano julga o comportamento.** O código de um player é curto e parece trivial — até o navegador começar a recusar tocar. A parte difícil nunca foi escrever as linhas, foi saber quais linhas importam. Gerar o código acelerou muito; decidir o que *precisava* existir foi o trabalho de verdade.

## 7. O que faríamos diferente se continuássemos

O app funciona, mas ele foi construído como prova de conceito — e as decisões que fazem ele ser pequeno também são as que limitam ele. Continuando, a prioridade não seria adicionar features, seria **corrigir os pontos onde o comportamento atual é silenciosamente errado**.

### Correções que têm prioridade sobre qualquer feature nova

**1. O shuffle está errado.** Hoje ele sorteia um índice aleatório a cada `next()`, sem memória do que já tocou. Na prática isso faz o app **repetir faixas e pular outras** — o oposto do que se espera de um modo aleatório. O certo é gerar uma *ordem* embaralhada uma vez (estilo "bag of tracks") e consumi-la até o fim, re-embaralhando só quando acaba. É uma troca de cinco linhas que muda completamente a sensação do recurso.

**2. O `innerHTML` recebe dado de terceiro.** Em `renderQueue()`, título e artista usam `textContent` — correto — mas a thumbnail é interpolada direto no template de `innerHTML`. A thumbnail vem da resposta da oEmbed API, ou seja, de uma fonte externa, e a fila inteira é reidratada do `localStorage`. Um valor malicioso ali quebra o HTML. O certo é montar o `<img>` e setar `src` por propriedade, como já é feito na capa. É inconsistência dentro do próprio arquivo, o que é pior que o bug.

**3. Falha de faixa não é tratada.** Se um vídeo não puder ser embutido, o estado de `playing` continua ligado e a UI mostra que está tocando quando não está tocando nada. Faltaria um handler de erro por faixa que marca a faixa como indisponível, mostra o motivo na lista e avança sozinha.

**4. A fila inteira é recriada a cada render.** `renderQueue()` zera `innerHTML` e reconstrói todos os `<li>` sempre que qualquer coisa muda. Com uma fila grande isso destrói o scroll, o hover e o estado de foco a cada mudança de faixa. O certo é reaproveitar nós existentes e só alterar o que mudou.

### Melhorias de produto

**Media Session API** seria a maior mudança perceptível. Hoje o app é invisível para o sistema: as teclas de mídia do teclado, o controle do lock screen e o controle do dock do macOS não aparecem. Como é um player de música, o sistema *espera* que ele se anuncie. São ~20 linhas de `navigator.mediaSession` e o app passa a se comportar como todo player nativo — e isso é justamente o que diferencia um app de música de uma página com um player.

**Busca e playlists.** Adicionar por link funciona, mas colar 30 URLs é tedioso. A busca exigiria sair do modelo atual de "só o ID", provavelmente passando a usar a Data API com uma chave de API — o que traz a questão de chave exposta no client, e aí o trade-off de zero backend começa a cobrar.

**Separação real dos arquivos.** `app.js` hoje concentra estado, player, fila, persistência e render. Em ~600 linhas ainda é legível, mas a próxima feature não cabe. Separar em `player.js`, `queue.js`, `store.js` e `ui.js` é mecânico e não muda o comportamento — por isso deveria ser feito *antes* de adicionar qualquer coisa, não depois.

**Inicialização sob demanda.** O `YTPlayer` é construído no load da página, o que faz o iframe e a API do YouTube carregarem antes de o usuário pedir qualquer música. Adiar a criação do player até o primeiro `addTrack` ou o primeiro play deixaria o primeiro carregamento bem mais leve.

**Testes.** Não existe nenhum. O que é testável sem browser — `extractId()` (que aceita cinco formatos de URL diferentes) e a lógica de navegação da fila — é exatamente onde bugs passam despercebidos. Um arquivo de teste para o parsing de URL já teria pego metade dos erros do shuffle.

### O que *não* mudaríamos

A decisão de não ter build, não usar framework e não ter backend foi a melhor do projeto. Um passo na direção de "colocar isso num framework" ia transformar três arquivos legíveis num build, um `node_modules` e um deploy pipeline, pra resolver um problema que o app não tem. Se algum dia a complexidade exigir, que seja por necessidade concreta e não por Pura tendência de moda — esses três arquivos funcionam, e funcionam bem.

## Estrutura

```
index.html   # markup e layout
style.css    # estilos, tema e animações
app.js       # lógica do player, fila e persistência
README.md    # documentação
```

## Como rodar

Não tem build, não tem dependência instalada, não tem servidor. Só abra o `index.html`:

```bash
open index.html
```

Se preferir servir via HTTP (alguns navegadores restringem recursos em `file://`):

```bash
python3 -m http.server 8080
# abre em http://localhost:8080
```

## Limitações conhecidas

- Os streams vêm do YouTube. Faixas com embedding desabilitado ou indisponíveis na região não tocam.
- A busca de metadata depende da oEmbed API estar acessível — offline, cai no fallback com ID e thumbnail padrão.
- A demo é só um exemplo inicial e pode ser limpa pelo botão de limpar a fila.
- Não há busca, nem login, nem sincronização entre dispositivos — a fila é local por design.

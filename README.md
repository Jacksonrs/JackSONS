# JacksSONS — Music Player

Player de música que toca faixas direto do YouTube. Você cola um link, ele entra na fila e começa a tocar na hora.

## Como rodar

Não tem build, não tem dependência, não tem servidor. Só abra o `index.html` no navegador.

```bash
open index.html
```

Se preferir servir via HTTP (alguns navegadores restringem recursos em `file://`):

```bash
python3 -m http.server 8080
# abre em http://localhost:8080
```

## Funcionalidades

- **Adicionar por link** — aceita URL completa do YouTube ou só o ID do vídeo
- **Fila persistente** — a queue e o volume ficam salvos no `localStorage`
- **Shuffle** e **Repeat** (repete a fila toda ou só a faixa atual)
- **Seek e volume por clique/arraste**, com barra de buffer e preview de tempo
- **Metadata automática** — título, artista e thumbnail vêm da oEmbed API
- **Atalhos de teclado** para tudo
- **Fallback automático** — se o vídeo estiver bloqueado para embed, tenta o `youtube-nocookie`

## Atalhos

| Tecla | Ação |
| --- | --- |
| `Espaço` | Play / pause |
| `←` / `→` | Voltar / avançar 5s |
| `↑` / `↓` | Volume + / − |
| `M` | Mudo |
| `S` | Shuffle |
| `R` | Repeat |
| `Enter` | Foca o campo de link |

## Estrutura

```
index.html   # markup e layout
style.css    # estilos, tema e animações
app.js       # lógica do player, fila e persistência
```

## Stack

HTML, CSS e JavaScript puro. A única dependência é o [`yt-player`](https://github.com/oyilmazhardal/yt-player) carregado via CDN (`esm.sh`), que faz a ponte com a YouTube IFrame Player API.

## Observações

- Os streams vêm do YouTube. Tracks com embedding desabilitado ou conteúdo indisponível na sua região não vão tocar.
- A pasta de demo é só um exemplo inicial e pode ser limpa pelo botão "limpar".

import YTPlayer from "https://esm.sh/yt-player@3.6.1";

const $ = (sel) => document.querySelector(sel);

const el = {
  form: $("#add-form"),
  input: $("#add-input"),
  error: $("#error"),
  list: $("#tracklist"),
  empty: $("#empty"),
  clear: $("#clear"),
  cover: $("#cover"),
  coverBox: $(".cover"),
  title: $("#title"),
  artist: $("#artist"),
  bar: $("#bar"),
  fill: $("#fill"),
  knob: $("#knob"),
  buffer: $("#buffer"),
  current: $("#current"),
  duration: $("#duration"),
  play: $("#play"),
  icoPlay: $(".ico-play"),
  icoPause: $(".ico-pause"),
  next: $("#next"),
  prev: $("#prev"),
  shuffle: $("#shuffle"),
  repeat: $("#repeat"),
  mute: $("#mute"),
  icoVol: $(".ico-vol"),
  icoMute: $(".ico-mute"),
  volBar: $("#vol-bar"),
  volFill: $("#vol-fill"),
  volKnob: $("#vol-knob"),
};

const STORE = "jacksons.queue.v1";
const DEMO = ["9bZkp7q19f0", "JGwWNGJdvx8", "kJQP7kiw5Fk", "dQw4w9WgXcQ"];
const firstRun = (() => {
  try {
    return !localStorage.getItem(STORE);
  } catch {
    return true;
  }
})();
const state = {
  queue: [],
  index: -1,
  loadedId: null,
  playing: false,
  shuffle: false,
  repeat: false,
  volume: 0.8,
  muted: false,
  seeking: false,
};

const player = new YTPlayer("#yt-player", {
  width: 2,
  height: 2,
  autoplay: true,
  controls: false,
  related: false,
  modestBranding: true,
  playsInline: true,
  timeupdateFrequency: 250,
});

const fmt = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

function extractId(input) {
  const raw = input.trim();
  if (!raw) return null;

  if (/^[\w-]{11}$/.test(raw)) return raw;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, "");
  const isYouTube = /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/.test(host);
  if (!isYouTube) return null;

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[\w-]{11}$/.test(id) ? id : null;
  }

  if (url.pathname === "/watch") {
    const v = url.searchParams.get("v");
    return v && /^[\w-]{11}$/.test(v) ? v : null;
  }

  const m = url.pathname.match(/\/(?:embed|v|shorts|live)\/([\w-]{11})/);
  return m ? m[1] : null;
}

async function fetchMeta(id) {
  const fallback = { id, title: `Vídeo ${id}`, artist: "YouTube", thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`
    );
    if (!res.ok) return fallback;
    const data = await res.json();
    return {
      id,
      title: data.title || fallback.title,
      artist: data.author_name || fallback.artist,
      thumb: data.thumbnail_url || fallback.thumb,
    };
  } catch {
    return fallback;
  }
}

function persist() {
  try {
    localStorage.setItem(
      STORE,
      JSON.stringify({
        queue: state.queue,
        index: state.index,
        volume: state.volume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat,
      })
    );
  } catch {}
}

function restore() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.queue)) state.queue = data.queue;
    if (Number.isInteger(data.index)) state.index = data.index;
    if (typeof data.volume === "number") state.volume = data.volume;
    if (typeof data.muted === "boolean") state.muted = data.muted;
    if (typeof data.shuffle === "boolean") state.shuffle = data.shuffle;
    if (typeof data.repeat === "boolean") state.repeat = data.repeat;
  } catch {}
}

function showError(msg) {
  el.error.textContent = msg;
  el.error.hidden = false;
  clearTimeout(showError.timer);
  showError.timer = setTimeout(() => (el.error.hidden = true), 4200);
}

function renderQueue() {
  el.list.innerHTML = "";
  el.empty.hidden = state.queue.length > 0;

  state.queue.forEach((track, i) => {
    const li = document.createElement("li");
    li.className = "item" + (i === state.index ? " is-active" : "");
    const active = i === state.index && state.playing;

    li.innerHTML = `
      <span class="item__num">${i + 1}</span>
      ${
        active
          ? `<span class="item__eq"><i></i><i></i><i></i></span>`
          : `<img class="item__thumb" src="${track.thumb}" alt="" loading="lazy" />`
      }
      <div class="item__info">
        <div class="item__title"></div>
        <div class="item__artist"></div>
      </div>
      <button class="item__del" title="Remover">
        <svg viewBox="0 0 24 24" width="15" height="15"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    `;
    li.querySelector(".item__title").textContent = track.title;
    li.querySelector(".item__artist").textContent = track.artist;

    li.addEventListener("click", (e) => {
      if (e.target.closest(".item__del")) return removeAt(i);
      playAt(i);
    });
    li.querySelector(".item__del").addEventListener("click", (e) => {
      e.stopPropagation();
      removeAt(i);
    });

    el.list.appendChild(li);
  });
}

function renderNowPlaying() {
  const track = state.queue[state.index];
  const has = Boolean(track);
  el.play.disabled = !has;
  el.next.disabled = !has;
  el.prev.disabled = !has;

  if (!track) {
    el.title.textContent = "Nada tocando";
    el.artist.textContent = "Adicione uma música para começar";
    el.cover.classList.remove("has-image");
    return;
  }
  el.title.textContent = track.title;
  el.artist.textContent = track.artist;
  el.cover.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
  el.cover.classList.add("has-image");
}

function addTrack(input) {
  const id = extractId(input);
  if (!id) {
    showError("Link inválido. Use um link do YouTube (watch, youtu.be, shorts ou embed).");
    return false;
  }

  const dupe = state.queue.findIndex((t) => t.id === id);
  if (dupe >= 0) {
    showError("Essa música já está na fila.");
    playAt(dupe);
    return false;
  }

  const track = {
    id,
    title: "Carregando…",
    artist: "YouTube",
    thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };

  state.queue.push(track);
  const at = state.index = state.queue.length - 1;
  state.loadedId = id;
  renderQueue();
  renderNowPlaying();
  persist();

  player.load(id, true);
  armAutoplayWatchdog();

  fetchMeta(id).then((meta) => {
    Object.assign(track, meta);
    renderQueue();
    if (state.index === at) renderNowPlaying();
  });

  return true;
}

function armAutoplayWatchdog() {
  clearTimeout(armAutoplayWatchdog.t);
  armAutoplayWatchdog.t = setTimeout(() => {
    if (!state.playing) {
      showError("O navegador segurou o autoplay. Aperte ▶ para começar a tocar.");
    }
  }, 2600);
}

function playAt(i) {
  if (i < 0 || i >= state.queue.length) return;
  state.index = i;
  state.loadedId = state.queue[i].id;
  renderQueue();
  renderNowPlaying();
  persist();
  player.load(state.loadedId, true);
}

function removeAt(i) {
  const wasCurrent = i === state.index;
  state.queue.splice(i, 1);

  if (state.queue.length === 0) {
    state.index = -1;
    player.stop();
    renderNowPlaying();
  } else if (wasCurrent) {
    state.index = Math.min(i, state.queue.length - 1);
    state.loadedId = state.queue[state.index].id;
    player.load(state.loadedId, true);
    renderNowPlaying();
  } else if (i < state.index) {
    state.index -= 1;
  }

  persist();
  renderQueue();
}

function next({ auto = false } = {}) {
  if (!state.queue.length) return;

  if (state.shuffle && state.queue.length > 1) {
    let r;
    do {
      r = Math.floor(Math.random() * state.queue.length);
    } while (r === state.index);
    return playAt(r);
  }

  if (state.index < state.queue.length - 1) return playAt(state.index + 1);
  if (state.repeat) return playAt(0);

  if (auto) {
    state.playing = false;
    setPlayingIcon(false);
    renderQueue();
    el.fill.style.width = "100%";
    el.knob.style.left = "100%";
    el.current.textContent = el.duration.textContent;
    return;
  }

  playAt(0);
}

function prev() {
  if (!state.queue.length) return;
  if (player.getCurrentTime() > 4) return player.seek(0);
  playAt(state.index > 0 ? state.index - 1 : state.queue.length - 1);
}

function togglePlay() {
  if (state.index < 0) return el.input.focus();
  if (state.loadedId !== state.queue[state.index].id) return playAt(state.index);
  state.playing ? player.pause() : player.play();
}

function setPlayingIcon(playing) {
  el.icoPlay.hidden = playing;
  el.icoPause.hidden = !playing;
  el.coverBox.classList.toggle("is-playing", playing);
  el.play.title = playing ? "Pausar (Espaço)" : "Tocar (Espaço)";
}

function ratioFromEvent(node, clientX) {
  const rect = node.getBoundingClientRect();
  return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
}

function bindBar(node, { onSeek, onPreview, getValue }) {
  let dragging = false;

  const move = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    onPreview(ratioFromEvent(node, x));
  };

  const up = (e) => {
    if (!dragging) return;
    dragging = false;
    node.classList.remove("is-dragging");
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    onSeek(ratioFromEvent(node, x));
  };

  node.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragging = true;
    node.classList.add("is-dragging");
    move(e);
  });
  node.addEventListener("mousemove", (e) => dragging && move(e));
  window.addEventListener("mouseup", up);
  node.addEventListener("touchstart", move, { passive: true });
  node.addEventListener("touchmove", (e) => {
    e.preventDefault();
    move(e);
  }, { passive: false });
  window.addEventListener("touchend", up);
  node.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === "ArrowRight") onSeek(Math.min(1, getValue() + step));
    else if (e.key === "ArrowLeft") onSeek(Math.max(0, getValue() - step));
    else return;
    e.preventDefault();
    e.stopPropagation();
  });
}

function paintBar(fill, knob, percent) {
  const p = Math.min(100, Math.max(0, percent * 100));
  fill.style.width = `${p}%`;
  knob.style.left = `${p}%`;
}

function updateProgress(force = false) {
  const duration = player.getDuration();
  const current = player.getCurrentTime();
  const progress = duration ? player.getProgress() : 0;

  if (!state.seeking || force) {
    const ratio = duration ? current / duration : 0;
    paintBar(el.fill, el.knob, ratio);
    el.bar.setAttribute("aria-valuenow", Math.round(ratio * 100));
    el.current.textContent = fmt(current);
  }

  el.buffer.style.width = `${Math.min(100, progress * 100)}%`;
  if (duration) el.duration.textContent = fmt(duration);
}

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = el.input.value;
  if (!value.trim()) return;
  el.input.value = "";
  addTrack(value);
  el.input.focus();
});

el.clear.addEventListener("click", () => {
  state.queue = [];
  state.index = -1;
  state.loadedId = null;
  state.playing = false;
  player.stop();
  setPlayingIcon(false);
  renderQueue();
  renderNowPlaying();
  updateProgress(true);
  persist();
});

el.play.addEventListener("click", togglePlay);
el.next.addEventListener("click", () => next());
el.prev.addEventListener("click", prev);

el.shuffle.addEventListener("click", () => {
  state.shuffle = !state.shuffle;
  el.shuffle.classList.toggle("is-on", state.shuffle);
  persist();
});

el.repeat.addEventListener("click", () => {
  state.repeat = !state.repeat;
  el.repeat.classList.toggle("is-on", state.repeat);
  persist();
});

function applyVolume() {
  player.setVolume(state.muted ? 0 : Math.round(state.volume * 100));
  paintBar(el.volFill, el.volKnob, state.muted ? 0 : state.volume);
  el.icoVol.hidden = state.muted;
  el.icoMute.hidden = !state.muted;
  el.volBar.setAttribute("aria-valuenow", Math.round((state.muted ? 0 : state.volume) * 100));
  persist();
}

el.mute.addEventListener("click", () => {
  state.muted = !state.muted;
  applyVolume();
});

bindBar(el.bar, {
  getValue: () => {
    const d = player.getDuration();
    return d ? player.getCurrentTime() / d : 0;
  },
  onPreview: (r) => {
    state.seeking = true;
    paintBar(el.fill, el.knob, r);
    el.current.textContent = fmt(r * player.getDuration());
  },
  onSeek: (r) => {
    state.seeking = false;
    const d = player.getDuration();
    if (d) player.seek(r * d);
    updateProgress(true);
  },
});

bindBar(el.volBar, {
  getValue: () => state.volume,
  onPreview: (r) => {
    state.volume = r;
    state.muted = r === 0;
    applyVolume();
  },
  onSeek: (r) => {
    state.volume = r;
    state.muted = r === 0;
    applyVolume();
  },
});

player.on("playing", () => {
  state.playing = true;
  clearTimeout(armAutoplayWatchdog.t);
  setPlayingIcon(true);
  el.coverBox.classList.remove("is-buffering");
  renderQueue();
  updateProgress(true);
});

player.on("paused", () => {
  state.playing = false;
  setPlayingIcon(false);
  el.coverBox.classList.remove("is-buffering");
  renderQueue();
});

player.on("buffering", () => el.coverBox.classList.add("is-buffering"));

player.on("timeupdate", () => updateProgress());

player.on("ended", () => {
  state.playing = false;
  next({ auto: true });
});

player.on("error", (err) => {
  showError(err?.message || "Falha ao carregar o player do YouTube.");
});

player.on("unplayable", (id) => {
  state.playing = false;
  setPlayingIcon(false);

  const i = state.queue.findIndex((t) => t.id === id);
  if (i !== state.index || state.queue.length < 2) {
    showError("Esse vídeo não pode ser reproduzido (privado, removido ou bloqueado).");
    return;
  }

  const others = state.queue.filter((_, k) => k !== i);
  const pick = state.shuffle
    ? others[Math.floor(Math.random() * others.length)]
    : others[Math.min(i, others.length - 1)];

  showError("Essa música não pôde tocar. Seguindo para a próxima...");
  playAt(state.queue.indexOf(pick));
});

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;

  switch (e.key) {    case " ":
      e.preventDefault();
      togglePlay();
      break;
    case "ArrowRight":
      e.preventDefault();
      e.shiftKey ? player.seek(player.getCurrentTime() + 10) : player.seek(player.getCurrentTime() + 5);
      break;
    case "ArrowLeft":
      e.preventDefault();
      e.shiftKey ? player.seek(player.getCurrentTime() - 10) : player.seek(player.getCurrentTime() - 5);
      break;
    case "ArrowUp":
      e.preventDefault();
      state.volume = Math.min(1, state.volume + 0.05);
      state.muted = state.volume === 0;
      applyVolume();
      break;
    case "ArrowDown":
      e.preventDefault();
      state.volume = Math.max(0, state.volume - 0.05);
      state.muted = state.volume === 0;
      applyVolume();
      break;
    case "m":
    case "M":
      state.muted = !state.muted;
      applyVolume();
      break;
    case "s":
    case "S":
      el.shuffle.click();
      break;
    case "r":
    case "R":
      el.repeat.click();
      break;
  }
});

async function preloadDemo() {
  const tracks = await Promise.all(DEMO.map(fetchMeta));
  state.queue = tracks;
  state.index = 0;
  renderQueue();
  renderNowPlaying();
  persist();
}

restore();
el.shuffle.classList.toggle("is-on", state.shuffle);
el.repeat.classList.toggle("is-on", state.repeat);
renderQueue();
renderNowPlaying();
applyVolume();
updateProgress(true);
setPlayingIcon(false);

if (location.protocol === "file:") {
  showError(
    "Você abriu via file://. O player do YouTube não funciona assim — rode `python3 -m http.server 8000` na pasta e abra http://localhost:8000"
  );
  el.input.disabled = true;
} else if (firstRun) {
  preloadDemo();
}

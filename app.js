const FALLBACK_COURSES = [
  { id: "twilight-chapter-01", title: "Twilight · Chapter 1", path: "courses/twilight-chapter-01/course.json" },
  { id: "twilight-chapter-02", title: "Twilight · Chapter 2", path: "courses/twilight-chapter-02/course.json" },
  { id: "twilight-chapter-03", title: "Twilight · Chapter 3", path: "courses/twilight-chapter-03/course.json" },
  { id: "twilight-chapter-04", title: "Twilight · Chapter 4", path: "courses/twilight-chapter-04/course.json" },
  { id: "twilight-chapter-05", title: "Twilight · Chapter 5", path: "courses/twilight-chapter-05/course.json" },
  { id: "twilight-chapter-06", title: "Twilight · Chapter 6", path: "courses/twilight-chapter-06/course.json" },
  { id: "twilight-chapter-07", title: "Twilight · Chapter 7", path: "courses/twilight-chapter-07/course.json" },
  { id: "twilight-chapter-08", title: "Twilight · Chapter 8", path: "courses/twilight-chapter-08/course.json" },
  { id: "twilight-chapter-09", title: "Twilight · Chapter 9", path: "courses/twilight-chapter-09/course.json" },
  { id: "twilight-chapter-10", title: "Twilight · Chapter 10", path: "courses/twilight-chapter-10/course.json" },
  { id: "twilight-chapter-11", title: "Twilight · Chapter 11", path: "courses/twilight-chapter-11/course.json" },
  { id: "twilight-chapter-12", title: "Twilight · Chapter 12", path: "courses/twilight-chapter-12/course.json" },
  { id: "twilight-chapter-13", title: "Twilight · Chapter 13", path: "courses/twilight-chapter-13/course.json" },
  { id: "twilight-chapter-14", title: "Twilight · Chapter 14", path: "courses/twilight-chapter-14/course.json" },
  { id: "twilight-chapter-15", title: "Twilight · Chapter 15", path: "courses/twilight-chapter-15/course.json" },
  { id: "twilight-chapter-16", title: "Twilight · Chapter 16", path: "courses/twilight-chapter-16/course.json" },
  { id: "voa", title: "VOA Daily English", path: "courses/voa/course.json" },
  { id: "friends", title: "Friends Dialogues", path: "courses/friends/course.json" },
  { id: "ted", title: "TED Ideas", path: "courses/ted/course.json" },
  { id: "shunbin-august-2026", title: "2026年8月 Shunbin 会议跟读", path: "courses/shunbin-august-2026/course.json?v=44" }
];

let COURSES = FALLBACK_COURSES;

const STORAGE_KEY = "elaine-shadowing-studio:v1";
const AUDIO_ACCESS_KEY = "elaine-shadowing-studio:r2-audio-token";

const els = {
  root: document.documentElement,
  body: document.body,
  courseTitle: document.querySelector("#courseTitle"),
  courseSelect: document.querySelector("#courseSelect"),
  sentenceSearch: document.querySelector("#sentenceSearch"),
  searchButton: document.querySelector("#searchButton"),
  searchFeedback: document.querySelector("#searchFeedback"),
  searchStatus: document.querySelector("#searchStatus"),
  searchResults: document.querySelector("#searchResults"),
  studyFilter: document.querySelector("#studyFilter"),
  filterStatus: document.querySelector("#filterStatus"),
  sentenceJump: document.querySelector("#sentenceJump"),
  sentenceTotal: document.querySelector("#sentenceTotal"),
  masteredCount: document.querySelector("#masteredCount"),
  courseProgress: document.querySelector("#courseProgress"),
  tagRow: document.querySelector("#tagRow"),
  englishText: document.querySelector("#englishText"),
  chineseText: document.querySelector("#chineseText"),
  shadowingText: document.querySelector("#shadowingText"),
  vocabularyBox: document.querySelector("#vocabularyBox"),
  rateSelect: document.querySelector("#rateSelect"),
  rate06Button: document.querySelector("#rate06Button"),
  rate075Button: document.querySelector("#rate075Button"),
  rate1Button: document.querySelector("#rate1Button"),
  loopToggle: document.querySelector("#loopToggle"),
  loopButton: document.querySelector("#loopButton"),
  stopButton: document.querySelector("#stopButton"),
  translationToggle: document.querySelector("#translationToggle"),
  prevButton: document.querySelector("#prevButton"),
  playButton: document.querySelector("#playButton"),
  nextButton: document.querySelector("#nextButton"),
  favoriteButton: document.querySelector("#favoriteButton"),
  masteredButton: document.querySelector("#masteredButton"),
  bigTextToggle: document.querySelector("#bigTextToggle"),
  recordButton: document.querySelector("#recordButton"),
  playRecordingButton: document.querySelector("#playRecordingButton"),
  compareButton: document.querySelector("#compareButton"),
  recordingStatus: document.querySelector("#recordingStatus"),
  recordingTimer: document.querySelector("#recordingTimer")
};

const state = {
  courseId: "twilight-chapter-01",
  course: null,
  index: 0,
  audio: new Audio(),
  mediaRecorder: null,
  recordingChunks: [],
  recordingUrl: "",
  recordingStartedAt: 0,
  timerId: 0,
  compareAbort: false,
  compareRunning: false,
  studyFilter: "all",
  storage: loadStorage()
};

init();

async function init() {
  await loadCourseCatalog();
  restorePreferences();
  renderCourseOptions();
  bindEvents();
  const requested = getRequestedLocation();
  await loadCourse(
    requested.courseId || state.storage.lastCourseId || "twilight-chapter-01",
    requested.index ?? state.storage.lastIndex ?? 0
  );
  registerServiceWorker();
}

function getRequestedLocation() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("course") || "";
  const sentenceNumber = Number(params.get("sentence"));
  const index = Number.isInteger(sentenceNumber) && sentenceNumber > 0 ? sentenceNumber - 1 : null;
  return { courseId, index };
}

async function loadCourseCatalog() {
  try {
    const response = await fetch("courses/catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Course catalog unavailable");
    const catalog = await response.json();
    if (Array.isArray(catalog.courses) && catalog.courses.length) {
      COURSES = catalog.courses;
    }
  } catch {
    COURSES = FALLBACK_COURSES;
  }
}

function renderCourseOptions() {
  els.courseSelect.innerHTML = COURSES.map((course) => {
    return `<option value="${course.id}">${course.title}</option>`;
  }).join("");
}

function bindEvents() {
  els.courseSelect.addEventListener("change", async (event) => {
    await loadCourse(event.target.value, 0);
  });

  els.sentenceJump.addEventListener("change", (event) => {
    goToSentence(Number(event.target.value) - 1);
  });

  els.searchButton.addEventListener("click", runSentenceSearch);
  els.sentenceSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runSentenceSearch();
  });
  els.sentenceSearch.addEventListener("input", () => {
    if (!els.sentenceSearch.value.trim()) clearSentenceSearch();
  });
  els.searchResults.addEventListener("change", (event) => {
    goToSentence(Number(event.target.value));
  });
  els.studyFilter.addEventListener("change", (event) => {
    applyStudyFilter(event.target.value);
  });

  els.rate06Button.addEventListener("click", () => setPlaybackRate(0.6));
  els.rate075Button.addEventListener("click", () => setPlaybackRate(0.75));
  els.rate1Button.addEventListener("click", () => setPlaybackRate(1));

  els.loopToggle.addEventListener("change", () => {
    state.storage.loop = els.loopToggle.checked;
    saveStorage();
    renderLoopState();
  });

  els.loopButton.addEventListener("click", () => {
    els.loopToggle.checked = !els.loopToggle.checked;
    state.storage.loop = els.loopToggle.checked;
    saveStorage();
    renderLoopState();
  });

  els.translationToggle.addEventListener("change", () => {
    state.storage.showTranslation = els.translationToggle.checked;
    saveStorage();
    renderSentence();
  });

  els.bigTextToggle.addEventListener("click", () => {
    state.storage.bigText = !state.storage.bigText;
    saveStorage();
    applyPreferences();
  });

  els.prevButton.addEventListener("click", () => goToAdjacentSentence(-1));
  els.nextButton.addEventListener("click", () => goToAdjacentSentence(1));
  els.playButton.addEventListener("click", () => playCurrentSentence());
  els.stopButton.addEventListener("click", () => stopPlayback());
  els.favoriteButton.addEventListener("click", () => toggleSentenceState("favorites"));
  els.masteredButton.addEventListener("click", () => toggleSentenceState("mastered"));
  els.recordButton.addEventListener("click", () => toggleRecording());
  els.playRecordingButton.addEventListener("click", () => playRecording());
  els.compareButton.addEventListener("click", () => playComparison());

  state.audio.addEventListener("ended", () => {
    if (els.loopToggle.checked && !state.compareRunning) {
      playCurrentSentence();
    } else {
      els.playButton.textContent = "▶ 播放真人原声";
    }
  });
}

async function loadCourse(courseId, preferredIndex) {
  const meta = COURSES.find((course) => course.id === courseId) || COURSES[0];
  const response = await fetch(meta.path, { cache: "no-cache" });
  clearRecording();
  state.course = await response.json();
  state.courseId = meta.id;
  state.studyFilter = "all";
  state.index = clamp(preferredIndex, 0, state.course.sentences.length - 1);
  state.storage.lastCourseId = state.courseId;
  state.storage.lastIndex = state.index;
  saveStorage();
  els.courseSelect.value = state.courseId;
  renderStudyFilter();
  renderSentenceJumpOptions();
  clearSentenceSearch();
  updateLocation();
  renderSentence();
}

function renderSentenceJumpOptions() {
  const indexes = getStudyIndexes();
  els.sentenceJump.innerHTML = indexes.map((index) => {
    const number = index + 1;
    return `<option value="${number}">${number}</option>`;
  }).join("");
  els.sentenceJump.disabled = indexes.length === 0;
  els.sentenceTotal.textContent = `/ ${indexes.length} 句`;
}

function getStudyIndexes() {
  if (!state.course) return [];
  const favorites = getStateSet("favorites");
  const mastered = getStateSet("mastered");
  return state.course.sentences.flatMap((sentence, index) => {
    if (state.studyFilter === "favorites" && !favorites.has(sentence.id)) return [];
    if (state.studyFilter === "unmastered" && mastered.has(sentence.id)) return [];
    return [index];
  });
}

function renderStudyFilter(message = "") {
  const favorites = getStateSet("favorites").size;
  const mastered = getStateSet("mastered").size;
  const total = state.course?.sentences.length || 0;
  els.studyFilter.value = state.studyFilter;
  els.studyFilter.querySelector('option[value="all"]').textContent = `全部句子 (${total})`;
  els.studyFilter.querySelector('option[value="unmastered"]').textContent = `未掌握 (${Math.max(total - mastered, 0)})`;
  els.studyFilter.querySelector('option[value="favorites"]').textContent = `已收藏 (${favorites})`;
  els.filterStatus.textContent = message;
}

function applyStudyFilter(filter) {
  state.studyFilter = ["all", "unmastered", "favorites"].includes(filter) ? filter : "all";
  let indexes = getStudyIndexes();
  if (!indexes.length) {
    state.studyFilter = "all";
    indexes = getStudyIndexes();
    renderStudyFilter("该分类暂时没有句子，已显示全部");
  } else {
    renderStudyFilter(`当前分类共 ${indexes.length} 句`);
  }
  renderSentenceJumpOptions();
  clearSentenceSearch();
  goToSentence(indexes.includes(state.index) ? state.index : indexes[0]);
}

function runSentenceSearch() {
  const query = els.sentenceSearch.value.trim().toLocaleLowerCase();
  if (!query || !state.course) return;

  const matches = getStudyIndexes().flatMap((index) => {
    const sentence = state.course.sentences[index];
    const searchable = [sentence.english, sentence.chinese, sentence.shadowing]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(query) ? [{ sentence, index }] : [];
  });

  els.searchFeedback.hidden = false;
  if (!matches.length) {
    els.searchStatus.textContent = "没有找到匹配句子";
    els.searchResults.hidden = true;
    return;
  }

  els.searchStatus.textContent = `找到 ${matches.length} 句`;
  els.searchResults.hidden = false;
  els.searchResults.innerHTML = matches.map(({ sentence, index }) => {
    const preview = String(sentence.english || sentence.chinese || "").slice(0, 72);
    return `<option value="${index}">${index + 1}. ${escapeHtml(preview)}</option>`;
  }).join("");
  els.searchResults.value = String(matches[0].index);
  goToSentence(matches[0].index);
}

function clearSentenceSearch() {
  els.sentenceSearch.value = "";
  els.searchFeedback.hidden = true;
  els.searchStatus.textContent = "";
  els.searchResults.innerHTML = "";
}

function renderSentence() {
  const sentence = getCurrentSentence();
  if (!sentence) return;
  const hasAudio = Boolean(sentence.audioPath);

  const progress = getCourseProgress();
  els.courseTitle.textContent = state.course.title;
  els.sentenceJump.value = String(state.index + 1);
  els.masteredCount.textContent = progress.mastered;
  els.courseProgress.value = progress.percent;
  els.englishText.textContent = sentence.english;
  els.chineseText.textContent = sentence.chinese;
  els.shadowingText.textContent = sentence.shadowing || sentence.english;
  els.chineseText.classList.toggle("hidden", !els.translationToggle.checked);
  els.tagRow.innerHTML = (sentence.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  els.vocabularyBox.innerHTML = (sentence.vocabulary || []).map((item) => {
    return `<span class="vocab-pill">${escapeHtml(item.word)} · ${escapeHtml(item.meaning)}</span>`;
  }).join("");

  els.favoriteButton.classList.toggle("active", hasSentenceState("favorites"));
  els.masteredButton.classList.toggle("active", hasSentenceState("mastered"));
  els.favoriteButton.textContent = hasSentenceState("favorites") ? "已收藏" : "收藏";
  els.masteredButton.textContent = hasSentenceState("mastered") ? "已掌握" : "已掌握";
  const studyIndexes = getStudyIndexes();
  const studyPosition = studyIndexes.indexOf(state.index);
  els.prevButton.disabled = studyPosition <= 0;
  els.nextButton.disabled = studyPosition < 0 || studyPosition === studyIndexes.length - 1;
  els.playButton.disabled = !hasAudio;
  els.playButton.textContent = hasAudio ? "▶ 播放真人原声" : "本句无音频";
  els.stopButton.disabled = !hasAudio;
  els.loopButton.disabled = !hasAudio;
  els.loopToggle.disabled = !hasAudio;
  els.rate06Button.disabled = !hasAudio;
  els.rate075Button.disabled = !hasAudio;
  els.rate1Button.disabled = !hasAudio;

  resetRecordingUi();
}

function getCourseProgress() {
  const masteredSet = getStateSet("mastered");
  const mastered = state.course.sentences.filter((sentence) => masteredSet.has(sentence.id)).length;
  const percent = state.course.sentences.length ? Math.round((mastered / state.course.sentences.length) * 100) : 0;
  return { mastered, percent };
}

function goToSentence(index) {
  state.audio.pause();
  clearRecording();
  state.index = clamp(index, 0, state.course.sentences.length - 1);
  state.storage.lastIndex = state.index;
  saveStorage();
  updateLocation();
  renderSentence();
}

function goToAdjacentSentence(direction) {
  const indexes = getStudyIndexes();
  const position = indexes.indexOf(state.index);
  const target = indexes[position + direction];
  if (target !== undefined) goToSentence(target);
}

function updateLocation() {
  const url = new URL(window.location.href);
  url.searchParams.set("course", state.courseId);
  url.searchParams.set("sentence", String(state.index + 1));
  history.replaceState(null, "", url);
}

async function playCurrentSentence() {
  const sentence = getCurrentSentence();
  if (!sentence) return;

  els.playButton.textContent = "❚❚ 播放中";
  state.audio.pause();
  state.audio.currentTime = 0;

  try {
    if (!sentence.audioPath) throw new Error("Missing human audio");
    const audioUrl = resolveAudioUrl(sentence.audioPath);
    if (state.audio.src !== audioUrl) {
      state.audio.src = audioUrl;
      await waitForAudioReady(state.audio);
    }
    const selectedRate = normalizePlaybackRate(state.storage.rate);
    state.audio.defaultPlaybackRate = selectedRate;
    state.audio.playbackRate = selectedRate;
    state.audio.preservesPitch = true;
    state.audio.currentTime = sentence.startTime || 0;
    const ended = waitForAudioEnd(state.audio);
    await state.audio.play();
    if (Number.isFinite(sentence.endTime) && sentence.endTime > sentence.startTime) {
      stopAtEndTime(sentence.endTime);
    }
    return ended;
  } catch {
    els.playButton.textContent = "▶ 播放真人原声";
    if (state.course.protectedAudio) {
      localStorage.removeItem(AUDIO_ACCESS_KEY);
      els.recordingStatus.textContent = "音频密码或网络有误，请重新播放";
    } else {
      els.recordingStatus.textContent = "真人原声无法加载";
    }
    return Promise.resolve();
  }
}

function resolveAudioUrl(path) {
  const url = new URL(path, window.location.href);
  if (!state.course.protectedAudio) return url.href;
  let token = localStorage.getItem(AUDIO_ACCESS_KEY);
  if (!token) {
    token = window.prompt("请输入私人音频密码");
    if (!token) throw new Error("Audio password required");
    localStorage.setItem(AUDIO_ACCESS_KEY, token.trim());
  }
  url.searchParams.set("token", token.trim());
  return url.href;
}

function stopPlayback() {
  state.audio.pause();
  state.audio.currentTime = 0;
  els.playButton.textContent = "▶ 播放真人原声";
  els.recordingStatus.textContent = "已停止";
}

function setPlaybackRate(rate) {
  const selectedRate = normalizePlaybackRate(rate);
  state.storage.rate = selectedRate;
  els.rateSelect.value = String(selectedRate);
  state.audio.defaultPlaybackRate = selectedRate;
  state.audio.playbackRate = selectedRate;
  saveStorage();
  renderRateButtons();
}

function renderRateButtons() {
  const rate = normalizePlaybackRate(state.storage.rate);
  els.rate06Button.classList.toggle("active", rate === 0.6);
  els.rate075Button.classList.toggle("active", rate === 0.75);
  els.rate1Button.classList.toggle("active", rate === 1);
  els.rate06Button.setAttribute("aria-pressed", String(rate === 0.6));
  els.rate075Button.setAttribute("aria-pressed", String(rate === 0.75));
  els.rate1Button.setAttribute("aria-pressed", String(rate === 1));
}

function normalizePlaybackRate(rate) {
  const numericRate = Number(rate);
  return [0.6, 0.75, 1].includes(numericRate) ? numericRate : 1;
}

function renderLoopState() {
  const enabled = els.loopToggle.checked;
  els.loopButton.classList.toggle("active", enabled);
  els.loopButton.textContent = `↻ 单句循环：${enabled ? "开" : "关"}`;
}

function stopAtEndTime(endTime) {
  const check = () => {
    if (state.audio.paused) return;
    if (state.audio.currentTime >= endTime) {
      state.audio.pause();
      state.audio.currentTime = 0;
      state.audio.dispatchEvent(new Event("ended"));
      return;
    }
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

function toggleSentenceState(type) {
  const sentence = getCurrentSentence();
  const set = getStateSet(type);
  if (set.has(sentence.id)) {
    set.delete(sentence.id);
  } else {
    set.add(sentence.id);
  }
  state.storage.courses[state.courseId][type] = [...set];
  saveStorage();
  const indexes = getStudyIndexes();
  renderStudyFilter();
  renderSentenceJumpOptions();
  if (indexes.length && !indexes.includes(state.index)) {
    goToSentence(indexes.find((index) => index > state.index) ?? indexes[indexes.length - 1]);
  } else if (!indexes.length && state.studyFilter !== "all") {
    applyStudyFilter("all");
  } else {
    renderSentence();
  }
}

async function toggleRecording() {
  if (state.mediaRecorder?.state === "recording") {
    stopRecording();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    els.recordingStatus.textContent = "当前浏览器不支持录音";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recordingChunks = [];
    state.mediaRecorder = new MediaRecorder(stream);
    state.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) state.recordingChunks.push(event.data);
    });
    state.mediaRecorder.addEventListener("stop", () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(state.recordingChunks, { type: state.mediaRecorder.mimeType || "audio/webm" });
      if (state.recordingUrl) URL.revokeObjectURL(state.recordingUrl);
      state.recordingUrl = URL.createObjectURL(blob);
      els.playRecordingButton.disabled = false;
      els.compareButton.disabled = !getCurrentSentence()?.audioPath;
      els.recordingStatus.textContent = "录音已保存到本次会话";
    });
    state.mediaRecorder.start();
    startTimer();
    els.recordButton.textContent = "停止录音";
    els.recordButton.classList.add("recording");
    els.recordingStatus.textContent = "正在录音";
  } catch {
    els.recordingStatus.textContent = "请允许麦克风权限后再试";
  }
}

function stopRecording() {
  state.mediaRecorder?.stop();
  clearInterval(state.timerId);
  els.recordButton.textContent = "开始录音";
  els.recordButton.classList.remove("recording");
}

function startTimer() {
  state.recordingStartedAt = Date.now();
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    const seconds = Math.floor((Date.now() - state.recordingStartedAt) / 1000);
    els.recordingTimer.textContent = formatTime(seconds);
  }, 250);
}

function playRecording() {
  if (!state.recordingUrl) return Promise.resolve();
  const recording = new Audio(state.recordingUrl);
  return new Promise((resolve) => {
    recording.addEventListener("ended", resolve, { once: true });
    recording.addEventListener("error", resolve, { once: true });
    recording.play().catch(resolve);
  });
}

async function playComparison() {
  if (!state.recordingUrl || !getCurrentSentence()?.audioPath) return;
  state.compareAbort = false;
  state.compareRunning = true;
  els.compareButton.disabled = true;
  els.compareButton.textContent = "播放原声…";
  await playCurrentSentence();
  els.compareButton.textContent = "播放录音…";
  await playRecording();
  state.compareRunning = false;
  els.compareButton.textContent = "原声 / 录音";
  els.compareButton.disabled = false;
}

function waitForAudioReady(audio) {
  if (audio.readyState >= 1) return Promise.resolve();
  return new Promise((resolve, reject) => {
    audio.addEventListener("loadedmetadata", resolve, { once: true });
    audio.addEventListener("error", reject, { once: true });
    audio.load();
  });
}

function waitForAudioEnd(audio) {
  return new Promise((resolve) => {
    audio.addEventListener("ended", resolve, { once: true });
    audio.addEventListener("error", resolve, { once: true });
  });
}

function resetRecordingUi() {
  clearInterval(state.timerId);
  els.recordingTimer.textContent = "00:00";
  els.recordButton.textContent = "开始录音";
  els.recordButton.classList.remove("recording");
  els.recordingStatus.textContent = "准备录音";
  els.playRecordingButton.disabled = !state.recordingUrl;
  els.compareButton.disabled = !state.recordingUrl || !getCurrentSentence()?.audioPath;
}

function clearRecording() {
  if (state.recordingUrl) {
    URL.revokeObjectURL(state.recordingUrl);
  }
  state.recordingUrl = "";
  state.recordingChunks = [];
}

function getCurrentSentence() {
  return state.course?.sentences[state.index];
}

function getStateSet(type) {
  ensureCourseStorage();
  return new Set(state.storage.courses[state.courseId][type] || []);
}

function hasSentenceState(type) {
  const sentence = getCurrentSentence();
  return sentence ? getStateSet(type).has(sentence.id) : false;
}

function ensureCourseStorage() {
  state.storage.courses[state.courseId] ||= { favorites: [], mastered: [] };
  state.storage.courses[state.courseId].favorites ||= [];
  state.storage.courses[state.courseId].mastered ||= [];
}

function restorePreferences() {
  state.storage.rate = normalizePlaybackRate(state.storage.rate);
  els.rateSelect.value = String(state.storage.rate);
  els.loopToggle.checked = Boolean(state.storage.loop);
  els.translationToggle.checked = state.storage.showTranslation !== false;
  applyPreferences();
  renderRateButtons();
  renderLoopState();
}

function applyPreferences() {
  els.body.classList.toggle("big-text", Boolean(state.storage.bigText));
  els.bigTextToggle.classList.toggle("active", Boolean(state.storage.bigText));
}

function loadStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed || { courses: {} };
  } catch {
    return { courses: {} };
  }
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.storage));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

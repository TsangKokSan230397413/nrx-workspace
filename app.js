const categories = window.exerciseCategories;
const tags = window.exerciseTags;
const exercises = window.exerciseDatabase;

let currentLang = localStorage.getItem("rx-lang") || "zh";

// 依照目前語言，取得某個動作物件的某個欄位的翻譯文字（找不到翻譯就用中文原文）
function tr(exercise, field) {
  if (currentLang === "en") {
    const en = window.translationsEN && window.translationsEN.exercises[exercise.id];
    if (en && en[field] !== undefined) return en[field];
  }
  return exercise[field];
}

function trCategory(zhCategory) {
  if (currentLang === "en" && window.translationsEN) {
    return window.translationsEN.categoryLabels[zhCategory] || zhCategory;
  }
  return zhCategory;
}

function trTag(zhTag) {
  if (currentLang === "en" && window.translationsEN) {
    return window.translationsEN.tagLabels[zhTag] || zhTag;
  }
  return zhTag;
}

function trGoal(zhGoal) {
  if (currentLang === "en" && window.translationsEN) {
    return window.translationsEN.goals[zhGoal] || zhGoal;
  }
  return zhGoal;
}

// 取得畫面上固定文字（按鈕、標籤等）的翻譯，第二個參數是找不到翻譯時的中文備用文字
function ui(key, fallbackZh) {
  if (currentLang === "en" && window.translationsEN && window.translationsEN.ui[key]) {
    return window.translationsEN.ui[key];
  }
  return fallbackZh;
}

function applyUiLanguage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const text = ui(key, el.dataset.i18nZh || el.textContent);
    if (!el.dataset.i18nZh) el.dataset.i18nZh = el.textContent;
    el.textContent = text;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (!el.dataset.i18nZh) el.dataset.i18nZh = el.placeholder;
    el.placeholder = ui(key, el.dataset.i18nZh);
  });
  const goalOptions = goalSelect ? Array.from(goalSelect.options) : [];
  goalOptions.forEach(option => {
    if (option.value === "__custom__") return;
    if (!option.dataset.zhLabel) option.dataset.zhLabel = option.textContent;
    option.textContent = trGoal(option.dataset.zhLabel);
  });
  if (langToggleBtn) langToggleBtn.textContent = currentLang === "en" ? "中文" : "EN";
  document.documentElement.lang = currentLang === "en" ? "en" : "zh-Hant";
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("rx-lang", lang);
  applyUiLanguage();
  initFilters();
  renderExercises();
  renderPreview();
}

const state = {
  category: "全部",
  tags: new Set(),
  selected: new Map()
};

const grid = document.querySelector("#exerciseGrid");
const libraryCount = document.querySelector("#libraryCount");
const categoryFilters = document.querySelector("#categoryFilters");
const tagFilters = document.querySelector("#tagFilters");
const searchInput = document.querySelector("#searchInput");
const selectedList = document.querySelector("#selectedList");
const emptyState = document.querySelector("#emptyState");
const downloadPdfBtn = document.querySelector("#downloadPdfBtn");
const mobileDownloadPdfBtn = document.querySelector("#mobileDownloadPdfBtn");
const downloadStatus = document.querySelector("#downloadStatus");

const clientName = document.querySelector("#clientName");
const prescriptionDate = document.querySelector("#prescriptionDate");
const therapistName = document.querySelector("#therapistName");
const goalSelect = document.querySelector("#goalSelect");
const customGoalField = document.querySelector("#customGoalField");
const customGoalInput = document.querySelector("#customGoalInput");

const themeToggleBtn = document.querySelector("#themeToggleBtn");
const langToggleBtn = document.querySelector("#langToggleBtn");
const fontDecreaseBtn = document.querySelector("#fontDecreaseBtn");
const fontIncreaseBtn = document.querySelector("#fontIncreaseBtn");

const saveHistoryBtn = document.querySelector("#saveHistoryBtn");
const qrShareBtn = document.querySelector("#qrShareBtn");
const qrModal = document.querySelector("#qrModal");
const qrImage = document.querySelector("#qrImage");
const qrLinkInput = document.querySelector("#qrLinkInput");
const closeQrModalBtn = document.querySelector("#closeQrModal");
const copyQrLinkBtn = document.querySelector("#copyQrLinkBtn");

const videoModal = document.querySelector("#videoModal");
const modalVideo = document.querySelector("#modalVideo");
const closeVideoModalBtn = document.querySelector("#closeVideoModal");

const loginModal = document.querySelector("#loginModal");
const loginBtn = document.querySelector("#loginBtn");
const closeLoginModalBtn = document.querySelector("#closeLoginModal");
const loginForm = document.querySelector("#loginForm");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginError = document.querySelector("#loginError");
const mainWorkspace = document.querySelector("#mainWorkspace");
const authStatus = document.querySelector("#authStatus");
const logoutBtn = document.querySelector("#logoutBtn");
const historyBtn = document.querySelector("#historyBtn");
const historyModal = document.querySelector("#historyModal");
const historyList = document.querySelector("#historyList");
const closeHistoryModalBtn = document.querySelector("#closeHistoryModal");
const saveTemplateBtn = document.querySelector("#saveTemplateBtn");
const templateBtn = document.querySelector("#templateBtn");
const templateModal = document.querySelector("#templateModal");
const templateList = document.querySelector("#templateList");
const closeTemplateModalBtn = document.querySelector("#closeTemplateModal");
const statsBtn = document.querySelector("#statsBtn");
const statsModal = document.querySelector("#statsModal");
const statsContent = document.querySelector("#statsContent");
const closeStatsModalBtn = document.querySelector("#closeStatsModal");
const lineShareBtn = document.querySelector("#lineShareBtn");
const googleLoginBtn = document.querySelector("#googleLoginBtn");

const clientNotes = document.querySelector("#clientNotes");
const aiFabBtn = document.querySelector("#aiFabBtn");
const aiModal = document.querySelector("#aiModal");
const closeAiModalBtn = document.querySelector("#closeAiModal");
const aiMessages = document.querySelector("#aiMessages");
const aiSuggestBtn = document.querySelector("#aiSuggestBtn");
const aiChatForm = document.querySelector("#aiChatForm");
const aiChatInput = document.querySelector("#aiChatInput");

// Google 這幾個月密集汰換 Gemini 模型代號，舊版型號常常無預警下架。
// 這裡改用官方維護、「永遠指向目前最新穩定版」的別名，並準備一份備援清單，
// 如果哪天連這個別名都打不通，程式會自動往下一個試，不用每次都回來改程式碼。
const AI_MODEL_CANDIDATES = ["gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.6-flash"];
let aiWorkingModel = null;
// 重要：Gemini API 金鑰不再放在這個檔案裡了！
// 因為這個檔案會上傳到「公開」的 GitHub repo，任何金鑰寫在這裡都會被搜尋引擎、
// GitHub 的自動掃描機制發現並且很快被 Google 停用。
// 改成呼叫你自己架設的 Cloudflare Worker 代理伺服器，金鑰安全地存放在那邊，
// 這個網站只跟你自己的 Worker 講話，Worker 才會用金鑰去跟 Google 講話。
// 請把下面這個網址換成你自己的 Worker 網址（設定步驟見說明文件）。
const AI_PROXY_URL = "https://advmeds-ai-proxy.wilson20030102.workers.dev";
let aiConversation = [];

let currentUser = null;
let isAdmin = false;
let isPatientView = false;
let lastShareUrl = "";

const DRAFT_KEY = "rx-draft-v1";
const FONT_SIZES = ["normal", "large", "xlarge"];

const today = new Date().toISOString().slice(0, 10);
prescriptionDate.value = today;

const PDF_PAGE_WIDTH = 1240;
const PDF_PAGE_HEIGHT = 1754;
const PDF_SCALE = 2;

let isDownloadingPdf = false;

function initFilters() {
  categoryFilters.innerHTML = categories.map(category => (
    `<button class="segment-button ${category === state.category ? "active" : ""}" data-category="${category}" type="button">${category === "全部" ? ui("all-category", "全部") : trCategory(category)}</button>`
  )).join("");

  tagFilters.innerHTML = tags.map(tag => (
    `<label class="check-pill"><input type="checkbox" value="${tag}" ${state.tags.has(tag) ? "checked" : ""} />${trTag(tag)}</label>`
  )).join("");
}

function syncCustomGoalVisibility() {
  if (!customGoalField) return;
  customGoalField.hidden = goalSelect.value !== "__custom__";
}

function getGoalText() {
  if (goalSelect.value === "__custom__") {
    return customGoalInput.value.trim() || trGoal("自訂目標");
  }
  return trGoal(goalSelect.value);
}

function filteredExercises() {
  const term = searchInput.value.trim().toLowerCase();
  return exercises.filter(exercise => {
    const categoryMatch = state.category === "全部" || exercise.category === state.category;
    const tagMatch = state.tags.size === 0 || [...state.tags].every(tag => exercise.tags.includes(tag));
    const haystack = `${exercise.name} ${tr(exercise, "name")} ${exercise.category} ${exercise.tags.join(" ")} ${exercise.description} ${tr(exercise, "description")} ${exercise.steps}`.toLowerCase();
    return categoryMatch && tagMatch && haystack.includes(term);
  });
}

function renderExercises() {
  const visible = filteredExercises();
  libraryCount.textContent = currentLang === "en" ? `${visible.length} items` : `${visible.length} 個項目`;
  grid.innerHTML = visible.map(exercise => {
    const selected = state.selected.get(exercise.id);
    const videoSrc = window.exerciseVideos && window.exerciseVideos[exercise.id];
    const name = tr(exercise, "name");
    const tagList = tr(exercise, "tags");
    return `
      <article class="exercise-card ${selected ? "selected" : ""}">
        <div class="exercise-visual">
          <img src="${exercise.image}" alt="${name}" loading="lazy" />
          ${videoSrc ? `<button type="button" class="video-play-btn" data-video="${videoSrc}">▶ ${ui("video-badge", "示範影片")}</button>` : ""}
        </div>
        <div class="exercise-body">
          <h3>${name}</h3>
          <p>${tr(exercise, "description")}</p>
          <div class="exercise-meta">
            <span class="tag">${trCategory(exercise.category)}</span>
            ${tagList.slice(0, 3).map(tagText => `<span class="tag">${tagText}</span>`).join("")}
          </div>
          <div class="card-actions">
            <label><input type="checkbox" data-select="${exercise.id}" ${selected ? "checked" : ""} />${ui("add-to-rx", "加入處方箋")}</label>
          </div>
          <div class="dose-inputs">
            <label>${ui("reps-label", "次數")}<input data-dose="reps" data-id="${exercise.id}" value="${selected?.reps || tr(exercise, "defaultReps")}" /></label>
            <label>${ui("sets-label", "組數")}<input data-dose="sets" data-id="${exercise.id}" value="${selected?.sets || tr(exercise, "defaultSets")}" /></label>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function prescriptionItems() {
  return [...state.selected.values()];
}

function renderPreview() {
  document.querySelector("#previewClient").textContent = clientName.value || ui("not-filled", "未填寫");
  document.querySelector("#previewDate").textContent = prescriptionDate.value || "-";
  document.querySelector("#previewTherapist").textContent = therapistName.value || ui("not-filled", "未填寫");
  document.querySelector("#previewGoal").textContent = getGoalText();

  const items = prescriptionItems();
  emptyState.hidden = items.length > 0;
  selectedList.innerHTML = items.map((item, index) => {
    const videoSrc = window.exerciseVideos && window.exerciseVideos[item.id];
    const name = tr(item, "name");
    return `
    <section class="rx-item">
      <img src="${item.image}" alt="${name}" />
      <div>
        <h3>${index + 1}. ${name}</h3>
        <p>${tr(item, "steps")}</p>
        ${videoSrc ? `<button type="button" class="rx-video-link" data-video="${videoSrc}">▶ ${ui("video-link", "觀看示範影片")}</button>` : ""}
        <div class="rx-dose">
          <span>${ui("reps-label", "次數")}：${item.reps}</span>
          <span>${ui("sets-label", "組數")}：${item.sets}</span>
          <span>${ui("frequency-label", "頻率")}：${ui("frequency-value", "每週 3-5 天")}</span>
        </div>
        <p>${ui("caution-label", "注意事項")}：${tr(item, "caution")}</p>
      </div>
    </section>
  `;
  }).join("");
}

function upsertSelection(id, patch = {}) {
  const exercise = exercises.find(item => item.id === id);
  if (!exercise) return;
  const current = state.selected.get(id) || {
    ...exercise,
    reps: exercise.defaultReps,
    sets: exercise.defaultSets
  };
  state.selected.set(id, { ...current, ...patch });
}

function textPrescription() {
  const lines = [
    ui("rx-title", "居家復健復能處方箋"),
    `${ui("rx-client", "個案")}：${clientName.value || ui("not-filled", "未填寫")}`,
    `${ui("rx-date", "日期")}：${prescriptionDate.value || "-"}`,
    `${ui("rx-therapist", "治療師")}：${therapistName.value || ui("not-filled", "未填寫")}`,
    `${ui("rx-goal", "主要目標")}：${getGoalText()}`,
    "",
    currentLang === "en" ? "Prescription:" : "處方內容："
  ];

  prescriptionItems().forEach((item, index) => {
    lines.push(`${index + 1}. ${tr(item, "name")}`);
    lines.push(`   ${currentLang === "en" ? "Instructions" : "說明"}：${tr(item, "steps")}`);
    lines.push(`   ${currentLang === "en" ? "Dosage" : "劑量"}：${item.reps}，${item.sets}，${ui("frequency-value", "每週 3-5 天")}`);
    lines.push(`   ${ui("caution-label", "注意事項")}：${tr(item, "caution")}`);
  });

  lines.push("");
  lines.push(`${ui("safety-note-title", "安全提醒")}：${ui("safety-note-body", "動作過程若出現胸悶、暈眩、明顯疼痛、呼吸困難或不穩跌倒風險，請立即停止並聯絡治療師或醫療人員。")}`);
  return lines.join("\n");
}

function safeFileName(value) {
  return (value || "未命名").replace(/[\\/:*?"<>|]/g, "-").trim() || "未命名";
}

function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    anchor.remove();
  }, 60000);
}

async function copyText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-999px";
  textarea.style.left = "-999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

function prefersShareSheet() {
  return Boolean(navigator.share) && (window.matchMedia("(max-width: 760px)").matches || navigator.maxTouchPoints > 0);
}

async function shareOrCopyTextPrescription() {
  const text = textPrescription();
  const title = "居家復健復能處方箋";

  if (prefersShareSheet()) {
    try {
      await copyText(text);
      await navigator.share({ title, text });
      setDownloadStatus("文字已複製並開啟分享", "success");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        setDownloadStatus("文字已複製", "success");
        return;
      }
    }
  }

  try {
    await copyText(text);
    setDownloadStatus("文字已複製", "success");
  } catch (error) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    triggerBlobDownload(blob, `復健復能處方箋-${safeFileName(clientName.value)}.txt`);
    setDownloadStatus("文字檔已送出下載", "success");
  }
}

function setDownloadStatus(message, type = "info") {
  if (!downloadStatus) return;
  downloadStatus.textContent = message;
  downloadStatus.dataset.type = type;
}

function nextFrame() {
  return new Promise(resolve => {
    window.requestAnimationFrame(() => resolve());
  });
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let current = "";
  for (const char of text) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function loadImage(src) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawContainedImage(ctx, image, x, y, width, height) {
  ctx.fillStyle = "#f3f6fb";
  ctx.fillRect(x, y, width, height);
  if (!image) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function canEmbedImagesInPdf() {
  return window.location.protocol !== "file:";
}

function makePageCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_PAGE_WIDTH * PDF_SCALE;
  canvas.height = PDF_PAGE_HEIGHT * PDF_SCALE;
  return canvas;
}

function newPdfPage() {
  const canvas = makePageCanvas();
  const ctx = canvas.getContext("2d");
  ctx.scale(PDF_SCALE, PDF_SCALE);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);
  ctx.fillStyle = "#101828";
  ctx.textBaseline = "top";
  return { canvas, ctx };
}

function drawPdfHeader(ctx) {
  const gradient = ctx.createLinearGradient(72, 0, 1168, 0);
  gradient.addColorStop(0, "#2454ff");
  gradient.addColorStop(1, "#00c2b8");

  ctx.fillStyle = "#94a3c0";
  ctx.font = "700 16px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText("ADVMEDS · REABLEMENT CARE PLATFORM", 72, 40);

  ctx.fillStyle = "#101828";
  ctx.font = "800 46px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText("居家復健復能處方箋", 72, 66);

  ctx.fillStyle = gradient;
  ctx.fillRect(72, 152, 1096, 6);

  ctx.fillStyle = gradient;
  roundRect(ctx, 1060, 40, 88, 88, 18);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 40px Georgia, serif";
  ctx.fillText("Rx", 1080, 66);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawPdfFooter(ctx, pageNumber, pageCount) {
  ctx.strokeStyle = "#e2e7f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(72, 1610);
  ctx.lineTo(1168, 1610);
  ctx.stroke();

  ctx.fillStyle = "#94a3c0";
  ctx.font = "600 17px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText("AdvMeds 復健復能處方箋系統", 72, 1626);
  const pageLabel = `第 ${pageNumber} / ${pageCount} 頁`;
  const labelWidth = ctx.measureText(pageLabel).width;
  ctx.fillText(pageLabel, 1168 - labelWidth, 1626);
}

function drawMetaBox(ctx, label, value, x, y, width) {
  ctx.fillStyle = "#f3f6fb";
  ctx.strokeStyle = "#e2e7f0";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, 76, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.font = "800 18px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText(label, x + 18, y + 12);
  ctx.fillStyle = "#101828";
  ctx.font = "800 24px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  drawWrappedText(ctx, value, x + 18, y + 38, width - 36, 28, 1);
}

function drawPdfMeta(ctx) {
  const values = [
    ["個案", clientName.value || "未填寫"],
    ["日期", prescriptionDate.value || "-"],
    ["治療師", therapistName.value || "未填寫"],
    ["目標", getGoalText()]
  ];
  drawMetaBox(ctx, values[0][0], values[0][1], 72, 220, 520);
  drawMetaBox(ctx, values[1][0], values[1][1], 620, 220, 548);
  drawMetaBox(ctx, values[2][0], values[2][1], 72, 316, 520);
  drawMetaBox(ctx, values[3][0], values[3][1], 620, 316, 548);
}

function canvasToJpegBinary(canvas) {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBinaryString(bytes) {
  let result = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    result += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return result;
}

function buildPdfFromCanvases(canvases) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const pageCount = canvases.length;
  const imageStart = 1;
  const contentStart = imageStart + pageCount;
  const pageStart = contentStart + pageCount;
  const pagesObjectNumber = pageStart + pageCount;
  const catalogObjectNumber = pagesObjectNumber + 1;
  const objects = new Array(catalogObjectNumber);

  canvases.forEach((canvas, index) => {
    const imageObjectNumber = imageStart + index;
    const contentObjectNumber = contentStart + index;
    const pageObjectNumber = pageStart + index;
    const imageBytes = canvasToJpegBinary(canvas);
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${imageObjectNumber} Do\nQ`;

    objects[imageObjectNumber - 1] = `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n${bytesToBinaryString(imageBytes)}\nendstream`;
    objects[contentObjectNumber - 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    objects[pageObjectNumber - 1] = `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${imageObjectNumber} ${imageObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
  });

  const kids = Array.from({ length: pageCount }, (_, index) => `${pageStart + index} 0 R`).join(" ");
  objects[pagesObjectNumber - 1] = `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`;
  objects[catalogObjectNumber - 1] = `<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectNumber} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

async function createPrescriptionPdfBlob(options = {}) {
  const includeImages = options.includeImages ?? canEmbedImagesInPdf();
  const items = prescriptionItems();
  const pages = [];
  let { canvas, ctx } = newPdfPage();
  drawPdfHeader(ctx);
  drawPdfMeta(ctx);

  let y = 420;
  const bottom = 1560;
  const left = 72;
  const right = 1168;
  const imageSize = { width: 180, height: 120 };

  if (items.length === 0) {
    ctx.fillStyle = "#64748b";
    ctx.font = "500 24px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    drawWrappedText(ctx, "尚未選擇動作。請先從動作資料庫勾選處方項目。", left, y, right - left, 34);
  }

  const loadedImages = includeImages ? await Promise.all(items.map(item => loadImage(item.image))) : items.map(() => null);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const estimatedHeight = 206;
    if (y + estimatedHeight > bottom) {
      pages.push(canvas);
      ({ canvas, ctx } = newPdfPage());
      y = 72;
    }

    const rowTop = y;
    ctx.strokeStyle = "#e2e7f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    y += 24;
    drawContainedImage(ctx, loadedImages[index], left, y, imageSize.width, imageSize.height);
    ctx.strokeStyle = "#e2e7f0";
    ctx.strokeRect(left, y, imageSize.width, imageSize.height);

    // 圓形編號徽章，取代原本純文字的「1.」
    const badgeGradient = ctx.createLinearGradient(left - 16, y - 16, left + 24, y + 24);
    badgeGradient.addColorStop(0, "#2454ff");
    badgeGradient.addColorStop(1, "#00c2b8");
    ctx.fillStyle = badgeGradient;
    ctx.beginPath();
    ctx.arc(left + 4, y + 4, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 18px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    const numberLabel = String(index + 1);
    const numberWidth = ctx.measureText(numberLabel).width;
    ctx.fillText(numberLabel, left + 4 - numberWidth / 2, y + 4 - 9);

    const textX = left + imageSize.width + 28;
    const textWidth = right - textX;
    ctx.fillStyle = "#101828";
    ctx.font = "800 25px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    y = drawWrappedText(ctx, item.name, textX, y, textWidth, 32, 2);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    y = drawWrappedText(ctx, item.steps, textX, y + 8, textWidth, 28, 3);

    ctx.fillStyle = "#17389f";
    ctx.font = "800 19px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    y = drawWrappedText(ctx, `次數：${item.reps}　組數：${item.sets}　頻率：每週 3-5 天`, textX, y + 10, textWidth, 26, 2);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    y = Math.max(y, rowTop + 24 + imageSize.height);
    y = drawWrappedText(ctx, `注意事項：${item.caution}`, textX, y + 10, textWidth, 26, 2);
    y += 22;
  }

  if (y + 150 > bottom) {
    pages.push(canvas);
    ({ canvas, ctx } = newPdfPage());
    y = 72;
  }

  ctx.fillStyle = "#fff7ed";
  roundRect(ctx, left, y + 20, right - left, 112, 10);
  ctx.fill();
  ctx.strokeStyle = "#fbd8a8";
  ctx.lineWidth = 2;
  roundRect(ctx, left, y + 20, right - left, 112, 10);
  ctx.stroke();
  ctx.fillStyle = "#d97706";
  ctx.font = "800 22px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText("安全提醒", left + 22, y + 40);
  ctx.fillStyle = "#64748b";
  ctx.font = "500 19px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  drawWrappedText(ctx, "動作過程若出現胸悶、暈眩、明顯疼痛、呼吸困難或不穩跌倒風險，請立即停止並聯絡治療師或醫療人員。", left + 22, y + 72, right - left - 44, 28, 2);

  pages.push(canvas);
  pages.forEach((pageCanvas, index) => {
    drawPdfFooter(pageCanvas.getContext("2d"), index + 1, pages.length);
  });
  return buildPdfFromCanvases(pages);
}

async function downloadPdf() {
  if (isDownloadingPdf) return;
  isDownloadingPdf = true;
  const buttons = [downloadPdfBtn, mobileDownloadPdfBtn].filter(Boolean);
  buttons.forEach(button => {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = "產生中...";
  });
  setDownloadStatus("PDF 產生中...", "info");

  try {
    await nextFrame();
    const blob = await createPrescriptionPdfBlob();
    triggerBlobDownload(blob, `復健復能處方箋-${safeFileName(clientName.value)}.pdf`);
    setDownloadStatus(canEmbedImagesInPdf() ? "PDF 已送出下載" : "PDF 已送出下載（無圖片版）", "success");
  } catch (error) {
    try {
      const fallbackBlob = await createPrescriptionPdfBlob({ includeImages: false });
      triggerBlobDownload(fallbackBlob, `復健復能處方箋-${safeFileName(clientName.value)}.pdf`);
      setDownloadStatus("PDF 已送出下載（無圖片版）", "success");
    } catch (fallbackError) {
      console.error("PDF download failed", error, fallbackError);
      setDownloadStatus("PDF 產生失敗，請改用 localhost 開啟", "error");
    }
  } finally {
    isDownloadingPdf = false;
    buttons.forEach(button => {
      button.disabled = false;
      button.textContent = button.dataset.originalText;
    });
  }
}

/* ---------- 瀏覽器暫存草稿（下次回來還記得上次填過的資料） ---------- */

function saveDraftToStorage() {
  const draft = {
    clientName: clientName.value,
    prescriptionDate: prescriptionDate.value,
    therapistName: therapistName.value,
    goal: goalSelect.value,
    customGoal: customGoalInput.value,
    selected: prescriptionItems().map(item => ({ id: item.id, reps: item.reps, sets: item.sets }))
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn("暫存草稿失敗", error);
  }
}

function restoreDraftFromStorage() {
  let draft;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    draft = JSON.parse(raw);
  } catch (error) {
    return;
  }

  clientName.value = draft.clientName || "";
  if (draft.prescriptionDate) prescriptionDate.value = draft.prescriptionDate;
  therapistName.value = draft.therapistName || "";
  if (draft.goal) goalSelect.value = draft.goal;
  customGoalInput.value = draft.customGoal || "";

  (draft.selected || []).forEach(entry => {
    if (exercises.some(exercise => exercise.id === entry.id)) {
      upsertSelection(entry.id, { reps: entry.reps, sets: entry.sets });
    }
  });
}

/* ---------- 深色模式 ---------- */

function applyStoredTheme() {
  const saved = localStorage.getItem("rx-theme");
  if (saved === "dark") {
    document.documentElement.dataset.theme = "dark";
    if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
  }
}

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === "dark";
  if (isDark) {
    delete document.documentElement.dataset.theme;
    localStorage.setItem("rx-theme", "light");
    themeToggleBtn.textContent = "🌙";
  } else {
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("rx-theme", "dark");
    themeToggleBtn.textContent = "☀️";
  }
}

/* ---------- 字級調整（無障礙） ---------- */

function applyStoredFontSize() {
  const saved = localStorage.getItem("rx-font-size");
  if (saved && FONT_SIZES.includes(saved) && saved !== "normal") {
    document.documentElement.dataset.fontSize = saved;
  }
}

function changeFontSize(step) {
  const current = document.documentElement.dataset.fontSize || "normal";
  const currentIndex = FONT_SIZES.indexOf(current);
  const nextIndex = Math.min(Math.max(currentIndex + step, 0), FONT_SIZES.length - 1);
  const next = FONT_SIZES[nextIndex];
  if (next === "normal") delete document.documentElement.dataset.fontSize;
  else document.documentElement.dataset.fontSize = next;
  localStorage.setItem("rx-font-size", next);
}

/* ---------- 示範影片彈出視窗 ---------- */

function openVideoModal(src) {
  if (!videoModal || !modalVideo) return;
  modalVideo.src = src;
  videoModal.hidden = false;
  modalVideo.play().catch(() => {});
}

function closeVideoModal() {
  if (!videoModal || !modalVideo) return;
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
  videoModal.hidden = true;
}

/* ---------- QR Code 分享（方案 B：病患掃碼開啟網頁版處方箋） ---------- */
/* 資料改存進 Firestore 雲端資料庫，QR Code／連結裡只放一組短代碼，
   不會再把完整處方內容或個案姓名放進網址本身。 */

let patientShareId = null;

function buildSharedSnapshot() {
  return {
    c: clientName.value || "",
    d: prescriptionDate.value || "",
    t: therapistName.value || "",
    g: getGoalText(),
    items: prescriptionItems().map(item => ({
      id: item.id,
      name: item.name,
      steps: item.steps,
      caution: item.caution,
      image: item.image,
      reps: item.reps,
      sets: item.sets
    })),
    completions: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}

function buildShareUrl(shareId) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?rx=${shareId}`;
}

async function savePrescriptionRecord() {
  const sharedSnapshot = buildSharedSnapshot();
  const sharedRef = await db.collection("shared_prescriptions").add(sharedSnapshot);

  await db.collection("prescriptions").add({
    therapistUid: currentUser.uid,
    therapistName: therapistName.value || currentUser.email,
    clientName: clientName.value || "未填寫",
    date: prescriptionDate.value || "",
    goal: getGoalText(),
    itemCount: prescriptionItems().length,
    itemIds: prescriptionItems().map(item => item.id),
    shareId: sharedRef.id,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  const url = buildShareUrl(sharedRef.id);
  lastShareUrl = url;
  return { shareId: sharedRef.id, url };
}

function checkCanSaveRecord() {
  if (prescriptionItems().length === 0) {
    setDownloadStatus("請先勾選至少一個動作再存檔", "error");
    return false;
  }
  if (!currentUser) {
    setDownloadStatus("請先登入才能存入我的處方箋紀錄", "error");
    openLoginModal();
    return false;
  }
  if (typeof db === "undefined" || !db) {
    setDownloadStatus("Firebase 資料庫沒有初始化成功，請確認 firebase-init.js 是否已上傳且金鑰正確", "error");
    return false;
  }
  return true;
}

/* ---------- 處方箋範本／收藏 ---------- */

async function handleSaveTemplate() {
  if (prescriptionItems().length === 0) {
    setDownloadStatus("請先勾選至少一個動作再存成範本", "error");
    return;
  }
  if (!currentUser) {
    setDownloadStatus("請先登入才能儲存範本", "error");
    openLoginModal();
    return;
  }

  const templateName = window.prompt("幫這個範本取個名字（例如：膝關節術後初期）：", getGoalText());
  if (!templateName) return;

  try {
    await db.collection("templates").add({
      therapistUid: currentUser.uid,
      name: templateName.trim(),
      goal: getGoalText(),
      items: prescriptionItems().map(item => ({
        id: item.id,
        name: item.name,
        steps: item.steps,
        caution: item.caution,
        image: item.image,
        reps: item.reps,
        sets: item.sets
      })),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    setDownloadStatus("範本已儲存 ✓", "success");
  } catch (error) {
    console.error("儲存範本失敗", error);
    setDownloadStatus(`儲存範本失敗：${error.code || ""} ${error.message || error}`, "error");
  }
}

async function openTemplateModal() {
  if (!currentUser) {
    setDownloadStatus("請先登入才能使用範本功能", "error");
    openLoginModal();
    return;
  }

  templateModal.hidden = false;
  templateList.innerHTML = `<p class="modal-hint"><span class="spinner"></span>載入中...</p>`;

  try {
    const snapshot = await db.collection("templates")
      .where("therapistUid", "==", currentUser.uid)
      .limit(50)
      .get();

    if (snapshot.empty) {
      templateList.innerHTML = `<p class="modal-hint">目前還沒有任何範本，開好處方箋後按「存成範本」就可以在這裡看到。</p>`;
      return;
    }

    templateList.innerHTML = snapshot.docs.map(docSnap => {
      const record = docSnap.data();
      return `
        <div class="history-item">
          <div>
            <h3>${record.name}</h3>
            <p>目標：${record.goal}　動作數：${(record.items || []).length}</p>
          </div>
          <div class="template-actions">
            <button type="button" class="secondary-button" data-apply-template="${docSnap.id}">套用</button>
            <button type="button" class="icon-button" data-delete-template="${docSnap.id}" title="刪除範本">🗑</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("讀取範本失敗", error);
    templateList.innerHTML = `<p class="modal-hint">讀取失敗：${error.message || error}</p>`;
  }
}

function closeTemplateModal() {
  templateModal.hidden = true;
}

async function applyTemplate(templateId) {
  try {
    const doc = await db.collection("templates").doc(templateId).get();
    if (!doc.exists) return;
    const record = doc.data();

    state.selected.clear();
    (record.items || []).forEach(entry => {
      state.selected.set(entry.id, {
        id: entry.id,
        name: entry.name,
        steps: entry.steps,
        caution: entry.caution,
        image: entry.image,
        category: "",
        tags: [],
        reps: entry.reps,
        sets: entry.sets
      });
    });

    renderExercises();
    renderPreview();
    saveDraftToStorage();
    closeTemplateModal();
    setDownloadStatus(`已套用範本「${record.name}」✓`, "success");
  } catch (error) {
    console.error("套用範本失敗", error);
    setDownloadStatus(`套用範本失敗：${error.message || error}`, "error");
  }
}

async function deleteTemplate(templateId) {
  if (!window.confirm("確定要刪除這個範本嗎？")) return;
  try {
    await db.collection("templates").doc(templateId).delete();
    openTemplateModal();
  } catch (error) {
    console.error("刪除範本失敗", error);
    setDownloadStatus(`刪除範本失敗：${error.message || error}`, "error");
  }
}

async function handleSaveToHistory() {
  if (!checkCanSaveRecord()) return;

  saveHistoryBtn.disabled = true;
  saveHistoryBtn.innerHTML = `<span class="spinner"></span>儲存中...`;

  try {
    await savePrescriptionRecord();
    setDownloadStatus("已存入我的處方箋紀錄 ✓", "success");
  } catch (error) {
    console.error("存入紀錄失敗", error);
    setDownloadStatus(`存入紀錄失敗：${error.code || ""} ${error.message || error}`, "error");
  } finally {
    saveHistoryBtn.disabled = false;
    saveHistoryBtn.textContent = "💾 存入我的處方箋紀錄";
  }
}

async function openQrModal() {
  if (!checkCanSaveRecord()) return;
  if (typeof QRCode === "undefined") {
    setDownloadStatus("QR Code 函式庫沒有載入成功，請確認網路連線正常後重新整理頁面", "error");
    return;
  }

  qrShareBtn.disabled = true;
  qrShareBtn.innerHTML = `<span class="spinner"></span>產生中...`;

  try {
    const { url } = await savePrescriptionRecord();
    qrLinkInput.value = url;
    qrImage.src = await QRCode.toDataURL(url, { width: 240, margin: 1 });
    qrModal.hidden = false;
  } catch (error) {
    console.error("產生 QR Code 失敗", error);
    setDownloadStatus(`產生 QR Code 失敗：${error.code || ""} ${error.message || error}`, "error");
  } finally {
    qrShareBtn.disabled = false;
    qrShareBtn.textContent = "QR 分享";
  }
}

function closeQrModal() {
  qrModal.hidden = true;
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function shareViaLine() {
  if (!lastShareUrl) return;
  const text = `居家復健復能處方箋\n${lastShareUrl}`;

  if (isMobileDevice()) {
    // 手機瀏覽器打開這個網址時，作業系統會自動接手轉進 LINE App 的分享畫面，這是LINE官方支援的做法。
    window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, "_blank");
    return;
  }

  // LINE官方文件明確說明：LINE桌面版（Windows／Mac）不支援用網址直接叫出分享畫面，
  // 勉強嘗試只會出現「是否開啟LINE」卻沒有任何反應，體驗更差。
  // 電腦上改成：直接複製連結，請使用者自己貼到LINE聊天室，這是唯一在電腦上100%可靠的做法。
  try {
    await copyText(text);
    setDownloadStatus("已複製訊息內容，請切換到 LINE 貼上（Ctrl+V）傳送給病患", "success");
  } catch (error) {
    qrLinkInput.value = text;
    qrLinkInput.select();
    setDownloadStatus("請手動複製上方文字，貼到 LINE 傳送", "error");
  }
}

/* ---------- 病患唯讀檢視模式（打開 QR Code 連結時進入） ---------- */

function enterPatientView(data, shareId) {
  isPatientView = true;
  patientShareId = shareId;
  document.body.classList.add("patient-view");
  loginModal.hidden = true;
  loginBtn.hidden = true;

  const banner = document.createElement("div");
  banner.className = "patient-view-banner";
  banner.innerHTML = `<span>這是治療師為您開立的居家復健處方箋（唯讀）</span>`;
  const completeBtn = document.createElement("button");
  completeBtn.type = "button";
  completeBtn.className = "secondary-button";
  completeBtn.id = "reportCompleteBtn";
  completeBtn.textContent = "✅ 今天完成了";
  banner.appendChild(completeBtn);
  document.querySelector(".app-header").insertAdjacentElement("afterend", banner);

  completeBtn.addEventListener("click", reportCompletionToday);

  clientName.value = data.c || "";
  prescriptionDate.value = data.d || "";
  therapistName.value = data.t || "";

  const presetGoals = Array.from(goalSelect.options).map(option => option.value);
  if (presetGoals.includes(data.g)) {
    goalSelect.value = data.g;
  } else {
    goalSelect.value = "__custom__";
    customGoalInput.value = data.g || "";
  }

  state.selected.clear();
  (data.items || []).forEach(entry => {
    state.selected.set(entry.id, {
      id: entry.id,
      name: entry.name,
      steps: entry.steps,
      caution: entry.caution,
      image: entry.image,
      category: "",
      tags: [],
      reps: entry.reps,
      sets: entry.sets
    });
  });

  [clientName, prescriptionDate, therapistName, goalSelect, customGoalInput].forEach(field => {
    field.disabled = true;
  });

  syncCustomGoalVisibility();
  renderPreview();
}

async function reportCompletionToday() {
  if (!patientShareId) return;
  const btn = document.querySelector("#reportCompleteBtn");
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "回報中...";
    }
    await db.collection("shared_prescriptions").doc(patientShareId).update({
      completions: firebase.firestore.FieldValue.arrayUnion(todayStr)
    });
    if (btn) btn.textContent = "✅ 已回報今天完成";
  } catch (error) {
    console.error("回報完成失敗", error);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "✅ 今天完成了（重試）";
    }
  }
}

async function loadFromShareParamIfPresent() {
  const rxParam = new URLSearchParams(window.location.search).get("rx");
  if (!rxParam) return false;
  isPatientView = true;
  loginBtn.hidden = true;
  try {
    const doc = await db.collection("shared_prescriptions").doc(rxParam).get();
    if (!doc.exists) {
      setDownloadStatus("找不到這份處方箋，連結可能已失效", "error");
      return false;
    }
    enterPatientView(doc.data(), rxParam);
    return true;
  } catch (error) {
    console.error("讀取 QR Code 分享連結失敗", error);
    setDownloadStatus("讀取處方箋失敗，請確認網路連線", "error");
    return false;
  }
}

/* ---------- 治療師登入 ---------- */

function openLoginModal() {
  loginError.hidden = true;
  loginModal.hidden = false;
}

function closeLoginModal() {
  loginModal.hidden = true;
}

function showLoggedOutUi() {
  loginBtn.hidden = false;
  authStatus.hidden = true;
  historyBtn.hidden = true;
  logoutBtn.hidden = true;
  if (statsBtn) statsBtn.hidden = true;
}

function showLoggedInUi(user) {
  loginBtn.hidden = true;
  closeLoginModal();
  authStatus.hidden = false;
  authStatus.textContent = user.email;
  historyBtn.hidden = false;
  historyBtn.textContent = "我的處方箋紀錄";
  logoutBtn.hidden = false;
}

function handleAuthStateChanged(user) {
  currentUser = user;
  isAdmin = false;
  if (isPatientView) return; // 病患檢視模式永遠不受登入狀態影響
  if (user) {
    showLoggedInUi(user);
    db.collection("roles").doc(user.uid).get()
      .then(doc => {
        isAdmin = doc.exists && doc.data().role === "admin";
        if (isAdmin) {
          if (historyBtn) historyBtn.textContent = "📋 診所處方箋紀錄（管理者）";
          if (statsBtn) statsBtn.hidden = false;
        }
      })
      .catch(() => {
        isAdmin = false;
      });
  } else {
    showLoggedOutUi();
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  loginError.hidden = true;
  try {
    await auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value);
    loginPassword.value = "";
  } catch (error) {
    loginError.textContent = describeAuthError(error);
    loginError.hidden = false;
  }
}

async function handleGoogleLogin() {
  loginError.hidden = true;
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    loginError.textContent = describeAuthError(error);
    loginError.hidden = false;
  }
}

function describeAuthError(error) {
  const map = {
    "auth/user-not-found": "查無此帳號，請確認 email 是否正確，或請管理員先幫你建立帳號。",
    "auth/wrong-password": "密碼不正確，請再試一次。",
    "auth/invalid-email": "電子郵件格式不正確。",
    "auth/invalid-credential": "帳號或密碼不正確，請再確認一次。",
    "auth/too-many-requests": "嘗試次數過多，請稍後再試。",
    "auth/operation-not-allowed": "這個登入方式尚未在 Firebase 主控台啟用，請聯絡管理員。",
    "auth/unauthorized-domain": "這個網址尚未被加入 Firebase 的「已授權網域」清單，請聯絡管理員設定。",
    "auth/popup-closed-by-user": "登入視窗被關閉了，請再試一次。"
  };
  return map[error.code] || `登入失敗（${error.code || error.message}）`;
}

/* ---------- 我的處方箋紀錄 ---------- */

async function openHistoryModal() {
  if (!currentUser) return;
  historyModal.hidden = false;
  historyList.innerHTML = `<p class="modal-hint"><span class="spinner"></span>載入中...</p>`;

  try {
    const baseQuery = isAdmin
      ? db.collection("prescriptions") // 管理者：看全診所所有治療師的紀錄
      : db.collection("prescriptions").where("therapistUid", "==", currentUser.uid); // 一般治療師：只看自己的

    const snapshot = await baseQuery.limit(100).get();

    if (snapshot.empty) {
      historyList.innerHTML = `<p class="modal-hint">目前還沒有任何紀錄。</p>`;
      return;
    }

    // 不用 Firestore 的 orderBy（那個需要額外手動建立索引），
    // 改成先把資料抓回來，再用 JavaScript 自己依日期排序。
    const docsSortedByDate = snapshot.docs.slice().sort((a, b) => {
      const dateA = a.data().date || "";
      const dateB = b.data().date || "";
      return dateB.localeCompare(dateA);
    });

    const rows = await Promise.all(docsSortedByDate.map(async docSnap => {
      const record = docSnap.data();
      let completedCount = 0;
      try {
        const sharedDoc = await db.collection("shared_prescriptions").doc(record.shareId).get();
        if (sharedDoc.exists) completedCount = (sharedDoc.data().completions || []).length;
      } catch (error) {
        // 找不到分享紀錄就顯示 0，不中斷整個列表
      }
      const therapistLine = isAdmin ? `　治療師：${record.therapistName || "未填寫"}` : "";
      return `
        <div class="history-item">
          <div>
            <h3>${record.clientName}｜${record.date}</h3>
            <p>目標：${record.goal}　動作數：${record.itemCount}　完成回報次數：${completedCount}${therapistLine}</p>
          </div>
        </div>
      `;
    }));

    historyList.innerHTML = rows.join("");
  } catch (error) {
    console.error("讀取紀錄失敗", error);
    historyList.innerHTML = `<p class="modal-hint">讀取失敗（${error.code || error.message}）。若是 failed-precondition，請按 F12 打開瀏覽器 Console，點裡面出現的建立索引連結。</p>`;
  }
}

function closeHistoryModal() {
  historyModal.hidden = true;
}

/* ---------- 管理者儀表板 ---------- */

async function openStatsModal() {
  if (!isAdmin) return;
  statsModal.hidden = false;
  statsContent.innerHTML = `<p class="modal-hint"><span class="spinner"></span>載入中...</p>`;

  try {
    const snapshot = await db.collection("prescriptions").limit(300).get();

    if (snapshot.empty) {
      statsContent.innerHTML = `<p class="modal-hint">目前還沒有任何資料可以統計。</p>`;
      return;
    }

    const records = snapshot.docs.map(doc => doc.data());

    // 統計每個動作被開立的次數
    const exerciseCount = {};
    records.forEach(record => {
      (record.itemIds || []).forEach(id => {
        exerciseCount[id] = (exerciseCount[id] || 0) + 1;
      });
    });
    const topExercises = Object.entries(exerciseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const maxCount = topExercises.length ? topExercises[0][1] : 1;

    // 統計平均完成回報次數（需要額外去 shared_prescriptions 撈 completions）
    const completionCounts = await Promise.all(records.map(async record => {
      try {
        const sharedDoc = await db.collection("shared_prescriptions").doc(record.shareId).get();
        return sharedDoc.exists ? (sharedDoc.data().completions || []).length : 0;
      } catch (error) {
        return 0;
      }
    }));
    const totalCompletions = completionCounts.reduce((sum, n) => sum + n, 0);
    const avgCompletions = records.length ? (totalCompletions / records.length).toFixed(1) : "0";

    const barsHtml = topExercises.map(([id, count]) => {
      const exercise = exercises.find(e => e.id === id);
      const label = exercise ? exercise.name : id;
      const widthPct = Math.round((count / maxCount) * 100);
      return `
        <div class="stat-bar-row">
          <span class="stat-bar-label">${label}</span>
          <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${widthPct}%"></div></div>
          <span class="stat-bar-value">${count}</span>
        </div>
      `;
    }).join("");

    statsContent.innerHTML = `
      <div class="stats-summary">
        <div class="stats-summary-card">
          <span class="stats-summary-number">${records.length}</span>
          <span class="stats-summary-label">累積開立處方箋數</span>
        </div>
        <div class="stats-summary-card">
          <span class="stats-summary-number">${avgCompletions}</span>
          <span class="stats-summary-label">平均每份完成回報次數</span>
        </div>
      </div>
      <h3 class="stats-subtitle">最常開立的動作 Top 10</h3>
      ${barsHtml || `<p class="modal-hint">目前還沒有動作資料。</p>`}
    `;
  } catch (error) {
    console.error("讀取儀表板失敗", error);
    statsContent.innerHTML = `<p class="modal-hint">讀取失敗：${error.message || error}</p>`;
  }
}

function closeStatsModal() {
  statsModal.hidden = true;
}

/* ---------- AI 建議助理 ---------- */
/* 使用 Google Gemini API 免費額度，但金鑰不放在這個網站的程式碼裡（會被公開看到），
   而是安全地存放在你自己架設的 Cloudflare Worker 代理伺服器裡，
   這個網站只跟你的 Worker 講話，Worker 才會用金鑰去跟 Google 講話（設定步驟見說明文件）。 */

function appendAiMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `ai-message ai-message--${role}`;
  bubble.innerHTML = text.replace(/\n/g, "<br />");
  aiMessages.appendChild(bubble);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function buildExerciseCatalogForAi() {
  return exercises.map(exercise => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    tags: exercise.tags,
    description: (exercise.description || "").slice(0, 60),
    caution: (exercise.caution || "").slice(0, 60),
    defaultReps: exercise.defaultReps,
    defaultSets: exercise.defaultSets
  }));
}

function buildAiSystemInstruction() {
  return [
    "你是 AdvMeds 復健復能處方箋開立系統裡的 AI 建議助理，協助治療師從動作資料庫挑選合適的居家復健動作。",
    "你不能取代治療師的專業判斷，所有建議都只是草案，最終內容必須由治療師確認與調整。",
    "挑選動作時請依照以下邏輯思考：",
    "1. 對照「個案主要目標」與「個案補充說明」，優先挑選 tags／category 與目標相符的動作。",
    "2. 仔細比對每個動作的 caution（注意事項）欄位，如果補充說明裡提到的狀況（例如關節炎、術後、平衡不佳、心肺功能不佳等）跟某個動作的 caution 明顯衝突，就不要選那個動作。",
    "3. 動作組合盡量涵蓋不同 category（例如兼顧肌力、平衡、關節活動度），不要全部集中在同一類。",
    "4. reps／sets 請參考每個動作的 defaultReps／defaultSets 欄位，可依個案狀況（例如容易疲倦、體力較差）酌量調整成更保守的次數。",
    "5. summary 欄位請用 2-3 句話說明你的挑選邏輯與需要治療師特別留意的地方，用繁體中文回覆。",
    "個案主要目標：" + getGoalText(),
    "個案補充說明：" + (clientNotes.value.trim() || "（無）"),
    "目前已勾選的動作：" + (prescriptionItems().map(item => item.name).join("、") || "（尚未勾選）"),
    "可選動作資料庫（JSON，只能從這裡面挑選 id，不可以自己編造 id）：",
    JSON.stringify(buildExerciseCatalogForAi())
  ].join("\n");
}

async function callGeminiOnce(model, body) {
  const response = await fetch(
    `${AI_PROXY_URL}/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );
  return response;
}

async function callGeminiApi(userText, { structured = false } = {}) {
  if (!AI_PROXY_URL || AI_PROXY_URL.includes("請換成")) {
    throw Object.assign(new Error("尚未設定 AI 代理伺服器網址"), { code: "NO_PROXY" });
  }

  aiConversation.push({ role: "user", parts: [{ text: userText }] });

  const body = {
    systemInstruction: { parts: [{ text: buildAiSystemInstruction() }] },
    contents: aiConversation
  };

  if (structured) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                reps: { type: "string" },
                sets: { type: "string" }
              },
              required: ["id"]
            }
          }
        },
        required: ["summary", "exercises"]
      }
    };
  }

  // 先試上次成功用過的模型，沒有的話從清單第一個開始試，
  // 遇到「模型已下架」的錯誤就自動換下一個，全部試完才真的算失敗。
  const modelsToTry = aiWorkingModel
    ? [aiWorkingModel, ...AI_MODEL_CANDIDATES.filter(m => m !== aiWorkingModel)]
    : AI_MODEL_CANDIDATES;

  let response;
  let lastErrorText = "";
  let succeededModel = null;

  for (const model of modelsToTry) {
    response = await callGeminiOnce(model, body);
    if (response.ok) {
      succeededModel = model;
      break;
    }
    lastErrorText = await response.text();
    const isRetiredModel = response.status === 404 || /no longer available|not found/i.test(lastErrorText);
    if (!isRetiredModel) break; // 不是「模型下架」的問題，換模型也沒用，直接停止
  }

  if (!response.ok) {
    throw new Error(`Gemini API 錯誤（${response.status}）：${lastErrorText.slice(0, 200)}`);
  }

  aiWorkingModel = succeededModel;

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI 沒有回傳任何內容，請再試一次。");

  aiConversation.push({ role: "model", parts: [{ text }] });
  return text;
}

async function handleAiChatSubmit(event) {
  event.preventDefault();
  const text = aiChatInput.value.trim();
  if (!text) return;
  aiChatInput.value = "";
  appendAiMessage("user", text);

  try {
    const reply = await callGeminiApi(text);
    appendAiMessage("assistant", reply);
  } catch (error) {
    handleAiError(error);
  }
}

async function handleAiSuggest() {
  aiSuggestBtn.disabled = true;
  aiSuggestBtn.textContent = "AI 思考中...";
  appendAiMessage("user", "請根據以上個案資訊，從動作資料庫建議合適的居家復健動作組合。");

  try {
    const raw = await callGeminiApi(
      "請根據個案目標與補充說明，從動作資料庫中挑選 5-8 個合適的動作，並給出每個動作建議的次數與組數。只能使用資料庫裡真實存在的 id。",
      { structured: true }
    );
    const parsed = JSON.parse(raw);
    let appliedCount = 0;

    (parsed.exercises || []).forEach(item => {
      const exists = exercises.some(exercise => exercise.id === item.id);
      if (exists) {
        upsertSelection(item.id, {
          reps: item.reps || undefined,
          sets: item.sets || undefined
        });
        appliedCount++;
      }
    });

    renderExercises();
    renderPreview();
    saveDraftToStorage();

    appendAiMessage(
      "assistant",
      `${parsed.summary || ""}\n\n已自動勾選 ${appliedCount} 個建議動作，你可以在左側資料庫再自行調整或增減。`
    );
  } catch (error) {
    handleAiError(error);
  } finally {
    aiSuggestBtn.disabled = false;
    aiSuggestBtn.textContent = "✨ 請 AI 建議動作組合";
  }
}

function handleAiError(error) {
  console.error("AI 助理錯誤", error);
  if (error.code === "NO_PROXY") {
    appendAiMessage(
      "error",
      "AI 代理伺服器還沒設定好。請照說明文件把 app.js 裡的 AI_PROXY_URL 換成你自己的 Cloudflare Worker 網址。"
    );
    return;
  }
  const msg = error.message || "";
  if (/API key not valid|API_KEY_INVALID|400/i.test(msg)) {
    appendAiMessage(
      "error",
      `發生錯誤：${msg}\n\n這通常代表金鑰有問題（可能已過期或設定不正確），請到 Cloudflare Worker 的 Settings 確認 GEMINI_API_KEY 是否正確。`
    );
    return;
  }
  if (/Forbidden origin|403/i.test(msg)) {
    appendAiMessage(
      "error",
      `發生錯誤：${msg}\n\n這通常代表 Cloudflare Worker 裡設定的允許網域跟目前網站網址不一致，請確認 Worker 程式碼裡的網域字串完全正確。`
    );
    return;
  }
  appendAiMessage("error", `發生錯誤：${msg}`);
}

function openAiModal() {
  aiModal.hidden = false;
}

function closeAiModal() {
  aiModal.hidden = true;
}

categoryFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  initFilters();
  renderExercises();
});

tagFilters.addEventListener("change", event => {
  const checkbox = event.target;
  if (!checkbox.value) return;
  if (checkbox.checked) state.tags.add(checkbox.value);
  else state.tags.delete(checkbox.value);
  renderExercises();
});

searchInput.addEventListener("input", renderExercises);

grid.addEventListener("change", event => {
  const selectId = event.target.dataset.select;
  const doseField = event.target.dataset.dose;
  const doseId = event.target.dataset.id;

  if (selectId) {
    if (event.target.checked) upsertSelection(selectId);
    else state.selected.delete(selectId);
    renderExercises();
    renderPreview();
    saveDraftToStorage();
  }

  if (doseField && doseId) {
    upsertSelection(doseId, { [doseField]: event.target.value });
    renderPreview();
    renderExercises();
    saveDraftToStorage();
  }
});

grid.addEventListener("click", event => {
  const videoBtn = event.target.closest("[data-video]");
  if (!videoBtn) return;
  event.preventDefault();
  openVideoModal(videoBtn.dataset.video);
});

selectedList.addEventListener("click", event => {
  const videoBtn = event.target.closest("[data-video]");
  if (!videoBtn) return;
  event.preventDefault();
  openVideoModal(videoBtn.dataset.video);
});

[clientName, prescriptionDate, therapistName, goalSelect, customGoalInput].forEach(input => {
  input.addEventListener("input", () => {
    renderPreview();
    saveDraftToStorage();
  });
});

goalSelect.addEventListener("change", () => {
  syncCustomGoalVisibility();
  renderPreview();
  saveDraftToStorage();
});

document.querySelector("#clearSelectionBtn").addEventListener("click", () => {
  state.selected.clear();
  renderExercises();
  renderPreview();
  saveDraftToStorage();
});

downloadPdfBtn.addEventListener("click", downloadPdf);
if (mobileDownloadPdfBtn) mobileDownloadPdfBtn.addEventListener("click", downloadPdf);

document.querySelector("#downloadTextBtn").addEventListener("click", () => {
  shareOrCopyTextPrescription();
});

if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
if (fontIncreaseBtn) fontIncreaseBtn.addEventListener("click", () => changeFontSize(1));
if (fontDecreaseBtn) fontDecreaseBtn.addEventListener("click", () => changeFontSize(-1));

if (closeVideoModalBtn) closeVideoModalBtn.addEventListener("click", closeVideoModal);
if (videoModal) {
  videoModal.addEventListener("click", event => {
    if (event.target === videoModal) closeVideoModal();
  });
}

if (saveHistoryBtn) saveHistoryBtn.addEventListener("click", handleSaveToHistory);
if (qrShareBtn) qrShareBtn.addEventListener("click", openQrModal);
if (closeQrModalBtn) closeQrModalBtn.addEventListener("click", closeQrModal);
if (qrModal) {
  qrModal.addEventListener("click", event => {
    if (event.target === qrModal) closeQrModal();
  });
}
if (copyQrLinkBtn) {
  copyQrLinkBtn.addEventListener("click", async () => {
    try {
      await copyText(qrLinkInput.value);
      setDownloadStatus("連結已複製", "success");
    } catch (error) {
      qrLinkInput.select();
    }
  });
}
if (lineShareBtn) lineShareBtn.addEventListener("click", shareViaLine);

loginForm.addEventListener("submit", handleLoginSubmit);
if (googleLoginBtn) googleLoginBtn.addEventListener("click", handleGoogleLogin);
logoutBtn.addEventListener("click", () => auth.signOut());
historyBtn.addEventListener("click", openHistoryModal);
closeHistoryModalBtn.addEventListener("click", closeHistoryModal);
historyModal.addEventListener("click", event => {
  if (event.target === historyModal) closeHistoryModal();
});

if (saveTemplateBtn) saveTemplateBtn.addEventListener("click", handleSaveTemplate);
if (templateBtn) templateBtn.addEventListener("click", openTemplateModal);
if (closeTemplateModalBtn) closeTemplateModalBtn.addEventListener("click", closeTemplateModal);
if (templateModal) {
  templateModal.addEventListener("click", event => {
    if (event.target === templateModal) closeTemplateModal();
    const applyBtn = event.target.closest("[data-apply-template]");
    if (applyBtn) applyTemplate(applyBtn.dataset.applyTemplate);
    const deleteBtn = event.target.closest("[data-delete-template]");
    if (deleteBtn) deleteTemplate(deleteBtn.dataset.deleteTemplate);
  });
}

if (statsBtn) statsBtn.addEventListener("click", openStatsModal);
if (closeStatsModalBtn) closeStatsModalBtn.addEventListener("click", closeStatsModal);
if (statsModal) {
  statsModal.addEventListener("click", event => {
    if (event.target === statsModal) closeStatsModal();
  });
}

loginBtn.addEventListener("click", openLoginModal);
closeLoginModalBtn.addEventListener("click", closeLoginModal);
loginModal.addEventListener("click", event => {
  if (event.target === loginModal) closeLoginModal();
});

if (aiFabBtn) aiFabBtn.addEventListener("click", openAiModal);
if (closeAiModalBtn) closeAiModalBtn.addEventListener("click", closeAiModal);
if (aiModal) {
  aiModal.addEventListener("click", event => {
    if (event.target === aiModal) closeAiModal();
  });
}
if (aiSuggestBtn) aiSuggestBtn.addEventListener("click", handleAiSuggest);
if (aiChatForm) aiChatForm.addEventListener("submit", handleAiChatSubmit);

if (langToggleBtn) {
  langToggleBtn.addEventListener("click", () => {
    setLanguage(currentLang === "en" ? "zh" : "en");
  });
}

applyStoredTheme();
applyStoredFontSize();
applyUiLanguage();
syncCustomGoalVisibility();
initFilters();
renderExercises();
renderPreview();

loadFromShareParamIfPresent().then(foundPatientView => {
  if (!foundPatientView) {
    // 不是病患檢視模式：主要功能不需要登入即可直接使用，
    // 登入狀態只用來決定要不要顯示「QR分享／我的處方箋紀錄」相關按鈕
    restoreDraftFromStorage();
    syncCustomGoalVisibility();
    renderExercises();
    renderPreview();
    auth.onAuthStateChanged(handleAuthStateChanged);
  }
});
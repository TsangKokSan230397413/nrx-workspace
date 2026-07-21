const categories = window.exerciseCategories;
const tags = window.exerciseTags;
const exercises = window.exerciseDatabase;

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
const fontDecreaseBtn = document.querySelector("#fontDecreaseBtn");
const fontIncreaseBtn = document.querySelector("#fontIncreaseBtn");

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
const lineShareBtn = document.querySelector("#lineShareBtn");
const googleLoginBtn = document.querySelector("#googleLoginBtn");

let currentUser = null;
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
    `<button class="segment-button ${category === state.category ? "active" : ""}" data-category="${category}" type="button">${category}</button>`
  )).join("");

  tagFilters.innerHTML = tags.map(tag => (
    `<label class="check-pill"><input type="checkbox" value="${tag}" ${state.tags.has(tag) ? "checked" : ""} />${tag}</label>`
  )).join("");
}

function syncCustomGoalVisibility() {
  if (!customGoalField) return;
  customGoalField.hidden = goalSelect.value !== "__custom__";
}

function getGoalText() {
  if (goalSelect.value === "__custom__") {
    return customGoalInput.value.trim() || "自訂目標";
  }
  return goalSelect.value;
}

function filteredExercises() {
  const term = searchInput.value.trim().toLowerCase();
  return exercises.filter(exercise => {
    const categoryMatch = state.category === "全部" || exercise.category === state.category;
    const tagMatch = state.tags.size === 0 || [...state.tags].every(tag => exercise.tags.includes(tag));
    const haystack = `${exercise.name} ${exercise.category} ${exercise.tags.join(" ")} ${exercise.description} ${exercise.steps}`.toLowerCase();
    return categoryMatch && tagMatch && haystack.includes(term);
  });
}

function renderExercises() {
  const visible = filteredExercises();
  libraryCount.textContent = `${visible.length} 個項目`;
  grid.innerHTML = visible.map(exercise => {
    const selected = state.selected.get(exercise.id);
    const videoSrc = window.exerciseVideos && window.exerciseVideos[exercise.id];
    return `
      <article class="exercise-card ${selected ? "selected" : ""}">
        <div class="exercise-visual">
          <img src="${exercise.image}" alt="${exercise.name}示意圖" loading="lazy" />
          ${videoSrc ? `<button type="button" class="video-play-btn" data-video="${videoSrc}">▶ 示範影片</button>` : ""}
        </div>
        <div class="exercise-body">
          <h3>${exercise.name}</h3>
          <p>${exercise.description}</p>
          <div class="exercise-meta">
            <span class="tag">${exercise.category}</span>
            ${exercise.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <div class="card-actions">
            <label><input type="checkbox" data-select="${exercise.id}" ${selected ? "checked" : ""} />加入處方箋</label>
          </div>
          <div class="dose-inputs">
            <label>次數<input data-dose="reps" data-id="${exercise.id}" value="${selected?.reps || exercise.defaultReps}" /></label>
            <label>組數<input data-dose="sets" data-id="${exercise.id}" value="${selected?.sets || exercise.defaultSets}" /></label>
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
  document.querySelector("#previewClient").textContent = clientName.value || "未填寫";
  document.querySelector("#previewDate").textContent = prescriptionDate.value || "-";
  document.querySelector("#previewTherapist").textContent = therapistName.value || "未填寫";
  document.querySelector("#previewGoal").textContent = getGoalText();

  const items = prescriptionItems();
  emptyState.hidden = items.length > 0;
  selectedList.innerHTML = items.map((item, index) => {
    const videoSrc = window.exerciseVideos && window.exerciseVideos[item.id];
    return `
    <section class="rx-item">
      <img src="${item.image}" alt="${item.name}示意圖" />
      <div>
        <h3>${index + 1}. ${item.name}</h3>
        <p>${item.steps}</p>
        ${videoSrc ? `<button type="button" class="rx-video-link" data-video="${videoSrc}">▶ 觀看示範影片</button>` : ""}
        <div class="rx-dose">
          <span>次數：${item.reps}</span>
          <span>組數：${item.sets}</span>
          <span>頻率：每週 3-5 天</span>
        </div>
        <p>注意事項：${item.caution}</p>
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
    "居家復健復能處方箋",
    `個案：${clientName.value || "未填寫"}`,
    `日期：${prescriptionDate.value || "-"}`,
    `治療師：${therapistName.value || "未填寫"}`,
    `主要目標：${getGoalText()}`,
    "",
    "處方內容："
  ];

  prescriptionItems().forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`);
    lines.push(`   說明：${item.steps}`);
    lines.push(`   劑量：${item.reps}，${item.sets}，每週 3-5 天`);
    lines.push(`   注意事項：${item.caution}`);
  });

  lines.push("");
  lines.push("安全提醒：動作過程若出現胸悶、暈眩、明顯疼痛、呼吸困難或不穩跌倒風險，請立即停止並聯絡治療師或醫療人員。");
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
  ctx.fillStyle = "#f1f6f3";
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
  ctx.fillStyle = "#1c2730";
  ctx.textBaseline = "top";
  return { canvas, ctx };
}

function drawPdfHeader(ctx) {
  ctx.fillStyle = "#0f766e";
  ctx.font = "700 24px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText("Home Program", 72, 64);
  ctx.fillStyle = "#1c2730";
  ctx.font = "800 46px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText("居家復健復能處方箋", 72, 100);
  ctx.fillStyle = "#0f766e";
  ctx.fillRect(72, 178, 1096, 6);

  ctx.fillStyle = "#0f766e";
  ctx.fillRect(1060, 72, 88, 88);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 42px Georgia, serif";
  ctx.fillText("Rx", 1080, 96);
}

function drawMetaBox(ctx, label, value, x, y, width) {
  ctx.fillStyle = "#f7faf8";
  ctx.strokeStyle = "#d9e2e4";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, 76);
  ctx.strokeRect(x, y, width, 76);
  ctx.fillStyle = "#60717d";
  ctx.font = "800 18px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText(label, x + 18, y + 12);
  ctx.fillStyle = "#1c2730";
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

  let y = 440;
  const bottom = 1580;
  const left = 72;
  const right = 1168;
  const imageSize = { width: 180, height: 120 };

  ctx.font = "700 26px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillStyle = "#1c2730";

  if (items.length === 0) {
    ctx.fillStyle = "#60717d";
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
    ctx.strokeStyle = "#d9e2e4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    y += 24;
    drawContainedImage(ctx, loadedImages[index], left, y, imageSize.width, imageSize.height);
    ctx.strokeStyle = "#d9e2e4";
    ctx.strokeRect(left, y, imageSize.width, imageSize.height);

    const textX = left + imageSize.width + 28;
    const textWidth = right - textX;
    ctx.fillStyle = "#1c2730";
    ctx.font = "800 25px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    y = drawWrappedText(ctx, `${index + 1}. ${item.name}`, textX, y, textWidth, 32, 2);

    ctx.fillStyle = "#60717d";
    ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    y = drawWrappedText(ctx, item.steps, textX, y + 8, textWidth, 28, 3);

    ctx.fillStyle = "#0b554f";
    ctx.font = "800 19px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
    y = drawWrappedText(ctx, `次數：${item.reps}　組數：${item.sets}　頻率：每週 3-5 天`, textX, y + 10, textWidth, 26, 2);

    ctx.fillStyle = "#60717d";
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

  ctx.fillStyle = "#fff8ea";
  ctx.fillRect(left, y + 20, right - left, 112);
  ctx.strokeStyle = "#ead29f";
  ctx.strokeRect(left, y + 20, right - left, 112);
  ctx.fillStyle = "#b7791f";
  ctx.font = "800 22px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  ctx.fillText("安全提醒", left + 22, y + 40);
  ctx.fillStyle = "#60717d";
  ctx.font = "500 19px -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif";
  drawWrappedText(ctx, "動作過程若出現胸悶、暈眩、明顯疼痛、呼吸困難或不穩跌倒風險，請立即停止並聯絡治療師或醫療人員。", left + 22, y + 72, right - left - 44, 28, 2);

  pages.push(canvas);
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

async function openQrModal() {
  if (prescriptionItems().length === 0) {
    setDownloadStatus("請先勾選至少一個動作再產生 QR Code", "error");
    return;
  }
  if (!currentUser) {
    setDownloadStatus("請先登入才能產生 QR Code", "error");
    openLoginModal();
    return;
  }

  qrShareBtn.disabled = true;
  qrShareBtn.textContent = "產生中...";

  try {
    const sharedSnapshot = buildSharedSnapshot();
    const sharedRef = await db.collection("shared_prescriptions").add(sharedSnapshot);

    await db.collection("prescriptions").add({
      therapistUid: currentUser.uid,
      therapistName: therapistName.value || currentUser.email,
      clientName: clientName.value || "未填寫",
      date: prescriptionDate.value || "",
      goal: getGoalText(),
      itemCount: prescriptionItems().length,
      shareId: sharedRef.id,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    const url = buildShareUrl(sharedRef.id);
    lastShareUrl = url;
    qrLinkInput.value = url;
    qrImage.src = await QRCode.toDataURL(url, { width: 240, margin: 1 });
    qrModal.hidden = false;
  } catch (error) {
    console.error("產生 QR Code 失敗", error);
    setDownloadStatus("產生 QR Code 失敗，請確認網路連線與 Firebase 設定", "error");
  } finally {
    qrShareBtn.disabled = false;
    qrShareBtn.textContent = "QR 分享";
  }
}

function closeQrModal() {
  qrModal.hidden = true;
}

function shareViaLine() {
  if (!lastShareUrl) return;
  const text = `居家復健復能處方箋\n${lastShareUrl}`;
  window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, "_blank");
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
}

function showLoggedInUi(user) {
  loginBtn.hidden = true;
  closeLoginModal();
  authStatus.hidden = false;
  authStatus.textContent = user.email;
  historyBtn.hidden = false;
  logoutBtn.hidden = false;
}

function handleAuthStateChanged(user) {
  currentUser = user;
  if (isPatientView) return; // 病患檢視模式永遠不受登入狀態影響
  if (user) {
    showLoggedInUi(user);
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
  historyList.innerHTML = `<p class="modal-hint">載入中...</p>`;

  try {
    const snapshot = await db.collection("prescriptions")
      .where("therapistUid", "==", currentUser.uid)
      .orderBy("date", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      historyList.innerHTML = `<p class="modal-hint">目前還沒有任何紀錄。</p>`;
      return;
    }

    const rows = await Promise.all(snapshot.docs.map(async docSnap => {
      const record = docSnap.data();
      let completedCount = 0;
      try {
        const sharedDoc = await db.collection("shared_prescriptions").doc(record.shareId).get();
        if (sharedDoc.exists) completedCount = (sharedDoc.data().completions || []).length;
      } catch (error) {
        // 找不到分享紀錄就顯示 0，不中斷整個列表
      }
      return `
        <div class="history-item">
          <div>
            <h3>${record.clientName}｜${record.date}</h3>
            <p>目標：${record.goal}　動作數：${record.itemCount}　完成回報次數：${completedCount}</p>
          </div>
        </div>
      `;
    }));

    historyList.innerHTML = rows.join("");
  } catch (error) {
    console.error("讀取紀錄失敗", error);
    historyList.innerHTML = `<p class="modal-hint">讀取失敗，請確認 Firestore 是否已設定「date」欄位的索引（第一次查詢時 Firebase 主控台通常會跳出建立索引的連結）。</p>`;
  }
}

function closeHistoryModal() {
  historyModal.hidden = true;
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

loginBtn.addEventListener("click", openLoginModal);
closeLoginModalBtn.addEventListener("click", closeLoginModal);
loginModal.addEventListener("click", event => {
  if (event.target === loginModal) closeLoginModal();
});

applyStoredTheme();
applyStoredFontSize();
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
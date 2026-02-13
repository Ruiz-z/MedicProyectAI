// /Front/Javascript/ia.js
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/hXaNbPfHD/";

let model = null;
let webcam = null;
let camRunning = false;
let rafId = null;
let busy = false;

const btnFile = document.getElementById("btnFile");
const btnCam = document.getElementById("btnCam");
const fileInput = document.getElementById("fileInput");

const heroPreview = document.getElementById("hero-preview");

const rightTitle = document.getElementById("right-title");
const rightText = document.getElementById("right-text");
const rightResults = document.getElementById("right-results");
const rightConfFill = document.getElementById("right-conf-fill");

function setRightStatus(title, text) {
  if (rightTitle) rightTitle.textContent = title;
  if (rightText) rightText.textContent = text;

  if (rightResults) {
    rightResults.style.display = "none";
    rightResults.innerHTML = "";
  }
  if (rightConfFill) rightConfFill.style.width = "0%";
}

function showRightResults(topName, topProb) {
  
  if (rightTitle) rightTitle.textContent = topName;


  const pctText = `${(topProb * 100).toFixed(1)}%`;
  if (rightText) rightText.textContent = `Confianza: ${pctText}`;

  if (rightConfFill) {
    const pct = Math.max(0, Math.min(100, topProb * 100));
    rightConfFill.style.width = `${pct}%`;
  }


  if (rightResults) {
    rightResults.style.display = "none";
    rightResults.innerHTML = "";
  }
}


function clearHeroPreview() {
  if (!heroPreview) return null;
  heroPreview.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "media-wrap";
  heroPreview.appendChild(wrap);
  return wrap;
}

async function loadModelIfNeeded() {
  if (model) return;
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
}

async function stopCamera() {
  camRunning = false;

  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (webcam) {
    try { webcam.stop(); } catch (_) {}
  }
  webcam = null;
}

async function loop() {
  if (!camRunning || !webcam || !model) return;

  webcam.update();
  try {
    const prediction = await model.predict(webcam.canvas);
    renderPredictions(prediction);
  } catch (err) {
    console.error(err);
    setRightStatus("Error", `predict() falló: ${err?.message || err}`);
  }

  rafId = requestAnimationFrame(loop);
}

async function startCamera() {
  if (camRunning || busy) return;
  busy = true;

  try {
    setRightStatus("Iniciando cámara...", "Otorgue permisos para acceder a la cámara.");
    await loadModelIfNeeded();

    const wrap = clearHeroPreview();
    if (!wrap) throw new Error("No existe #hero-preview");

    const flip = true;
    webcam = new tmImage.Webcam(720, 420, flip);
    await webcam.setup();
    await webcam.play();

    camRunning = true;
    if (btnCam) btnCam.textContent = "Cerrar Cámara";

    wrap.appendChild(webcam.canvas);
    rafId = requestAnimationFrame(loop);

  } catch (err) {
    console.error(err);
    camRunning = false;
    if (btnCam) btnCam.textContent = "Abrir Cámara";
    setRightStatus("Cámara no disponible", `${err?.message || err}`);
  } finally {
    busy = false;
  }
}

function drawContain(ctx, img, size) {
  const r = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const nw = img.naturalWidth * r;
  const nh = img.naturalHeight * r;
  const dx = (size - nw) / 2;
  const dy = (size - nh) / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, dx, dy, nw, nh);
}

function renderPredictions(prediction) {
  if (!prediction || !prediction.length) return;

  const sorted = [...prediction].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];

  showRightResults(top.className, top.probability);
}

async function predictFromFile(file) {
  await stopCamera();
  if (btnCam) btnCam.textContent = "Abrir Cámara";

  setRightStatus("Analizando imagen...", "Procesando archivo cargado.");

  const wrap = clearHeroPreview();
  if (!wrap) throw new Error("No existe #hero-preview");

  const img = document.createElement("img");
  img.alt = "Vista previa";
  img.crossOrigin = "anonymous";


  const objectUrl = window.URL.createObjectURL(file);
  img.src = objectUrl;

  wrap.appendChild(img);

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        await loadModelIfNeeded();

        const size = 224;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;

        const ctx = c.getContext("2d");
        drawContain(ctx, img, size);

        const prediction = await model.predict(c);
        renderPredictions(prediction);

        resolve(true);
      } catch (err) {
        reject(err);
      } finally {
        window.URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      window.URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar/decodificar la imagen."));
    };
  });
}

btnFile?.addEventListener("click", () => fileInput?.click());

fileInput?.addEventListener("change", async (e) => {
  if (busy) return;
  busy = true;

  const file = e.target.files?.[0];
  if (!file) { busy = false; return; }

  try {
    if (!file.type.startsWith("image/")) {
      setRightStatus("Archivo no compatible", "Suba una imagen .jpg/.png. Para DICOM necesita visor DICOM.");
      return;
    }

    await predictFromFile(file);
  } catch (err) {
    console.error(err);
    setRightStatus("Error", `No se pudo analizar: ${err?.message || err}`);
  } finally {
    fileInput.value = ""; 
    busy = false;
  }
});

btnCam?.addEventListener("click", async () => {
  if (camRunning) {
    await stopCamera();
    btnCam.textContent = "Abrir Cámara";
    setRightStatus("Esperando Datos", "Cargue una imagen o active la cámara para analizar.");
    return;
  }
  await startCamera();
});

setRightStatus("Esperando Datos", "Cargue una imagen o active la cámara para analizar.");

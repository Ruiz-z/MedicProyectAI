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

const step1El = document.getElementById("step-1");
const step2El = document.getElementById("step-2");
const protocolTextEl = document.getElementById("protocol-text");
const protocolLinkEl = document.getElementById("protocol-link");


function normalizeKey(s) {
    return (s || "")
        .toString()
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


const DISEASE_CONTENT = {
    "atelectasis": {
        displayName: "Atelectasia",
        steps: [
            "1) Maximizar la tos y la respiración profunda (tos dirigida y ejercicios de respiración profunda; en ambulatorio, favorecer ejercicio como caminar).",
            "2) Si se sospecha obstrucción (tumor, cuerpo extraño, tapón mucoso persistente) → realizar broncoscopia; tratar siempre la causa subyacente."
        ],
        protocol:
            "Se recomiendan fisioterapia respiratoria y técnicas de expansión pulmonar (tos dirigida, respiración profunda y espirómetro incentivador). En pacientes intubados, usar PEEP y volúmenes corrientes bajos para reducir lesión pulmonar. En no intubados, considerar CPAP. Evitar sedación excesiva y antitusivos; controlar adecuadamente el dolor para permitir tos efectiva. Tratar siempre la causa subyacente. En tapón mucoso persistente, considerar dornasa alfa, broncodilatadores y, si no hay respuesta o se sospecha otra obstrucción, realizar broncoscopia.",

        guideUrl: "https://www.msdmanuals.com/es/professional/trastornos-pulmonares/bronquiectasias-y-atelectasias/atelectasias#Tratamiento_v8594204_es"
    },
    "cardiomegaly": {
        displayName: "Cardiomegalia",
        steps: [
            "1) Identificar y tratar la causa subyacente (valvulopatía, enfermedad coronaria, hipertensión, etc.).",
            "2) Iniciar manejo médico y valorar procedimientos (stent/bypass, cirugía valvular, marcapasos/desfibrilador) si no hay control."
        ],
        protocol:
            "La cardiomegalia no se trata de forma directa: se trata la afección que agranda el corazón. Opciones farmacológicas según causa: antiarrítmicos, inhibidores ECA/ARA II, betabloqueadores, anticoagulantes y diuréticos; además, control de comorbilidades (diabetes, obesidad). Si la medicación no es suficiente, considerar intervenciones: reparación o reemplazo valvular, colocación de stent o bypass, marcapasos o desfibrilador implantable; en casos avanzados, asistencia ventricular izquierda o trasplante. Medidas de estilo de vida: dieta cardiosaludable (reducir alcohol, cafeína, sal, grasas y azúcar), actividad física según indicación médica, control de presión arterial/colesterol y manejo del peso.",
        guideUrl: "https://www.massgeneralbrigham.org/en/patient-care/services-and-specialties/heart/conditions/cardiomegaly/treatment#accordion-c3ff378d6d-item-a2e7c35f6e"
    },

    "derrame pleural": {
        displayName: "Derrame Pleural",
        steps: [
            "1) Tratar el trastorno subyacente y controlar síntomas (analgésicos; AINEs u opioides si es necesario).",
            "2) Si es sintomático o complicado → toracentesis terapéutica; considerar drenaje con tubo, pleurodesis o catéter permanente según evolución."
        ],
        protocol:
            "Los derrames pequeños y asintomáticos pueden no requerir tratamiento y reabsorberse al tratar la causa base. En derrames sintomáticos, la toracentesis terapéutica suele ser suficiente y puede repetirse. En casos crónicos o recidivantes, considerar pleurodesis o drenaje con catéter permanente. Los derrames paraneumónicos complicados o empiemas (pH bajo, glucosa baja, cultivo positivo o tabicaciones) requieren drenaje completo con toracostomía; si falla, fibrinolíticos intrapleurales o cirugía torácica. En derrame pleural maligno, si reaparece la disnea, indicar pleurodesis o drenaje crónico. Valorar intervención quirúrgica en pulmón atrapado con buen estado funcional.",
        guideUrl: "https://www.msdmanuals.com/es/professional/trastornos-pulmonares/trastornos-mediast%C3%ADnicos-y-pleurales/derrame-pleural"
    },

    "infiltration": {
        displayName: "Enfermedad Pulmonar Intersticial",
        steps: [
            "1) Confirmar diagnóstico y evaluar progresión mediante estudios de imagen y función pulmonar.",
            "2) Iniciar tratamiento sintomático y considerar terapias antifibróticas o ensayos clínicos según el caso."
        ],
        protocol:
            "La cicatrización pulmonar no es reversible y el tratamiento no siempre detiene la progresión. El manejo se enfoca en aliviar síntomas, retrasar el avance de la enfermedad y mantener la calidad de vida. Algunas terapias pueden ofrecer mejoría temporal. En ausencia de tratamientos definitivos, los ensayos clínicos pueden ser una opción terapéutica.",
        guideUrl: "https://www.mayoclinic.org/es/diseases-conditions/interstitial-lung-disease/diagnosis-treatment/drc-20353113"
    },


    "mass": {
        displayName: "Masa Pulmonar (Sospecha de Cáncer)",
        steps: [
            "1) Confirmar diagnóstico y estadificación (biopsia, TC, PET si está indicado).",
            "2) Definir plan terapéutico según etapa: cirugía, quimioterapia, radioterapia o combinación."
        ],
        protocol:
            "El tratamiento suele iniciar con cirugía para extirpar el tumor cuando es posible. Si el cáncer es grande o está diseminado, se utilizan medicamentos (quimioterapia, terapias dirigidas o inmunoterapia) y radioterapia. El plan depende del tipo, etapa del cáncer, estado general del paciente y sus preferencias. En algunos casos puede optarse por cuidados paliativos enfocados únicamente en el control de síntomas.",
        guideUrl: "https://www.mayoclinic.org/es/diseases-conditions/lung-cancer/diagnosis-treatment/drc-20374627"
    },


    "nodule": {
        displayName: "Nódulo Pulmonar",
        steps: [
            "1) Evaluar tamaño, antecedentes clínicos y riesgo; indicar vigilancia activa con estudios de imagen cada 6–12 meses.",
            "2) Si el nódulo crece, causa síntomas o presenta características sospechosas → considerar biopsia o cirugía."
        ],
        protocol:
            "Los nódulos pulmonares pequeños y no cancerosos generalmente no requieren tratamiento inmediato. Si son secundarios a infección, pueden tratarse con antibióticos o antimicóticos. La vigilancia activa mediante estudios de imagen seriados es el enfoque habitual; los nódulos que permanecen estables durante dos años tienen baja probabilidad de malignidad. Si aumentan de tamaño o generan síntomas, puede requerirse intervención quirúrgica.",
        guideUrl: "https://my.clevelandclinic.org/health/diseases/14799-pulmonary-nodules"
    },


    "pneumonia": {
        displayName: "Neumonía",
        steps: [
            "1) Iniciar tratamiento según etiología (antibióticos si es bacteriana) y manejo sintomático.",
            "2) Valorar criterios de hospitalización según edad, signos vitales, confusión o insuficiencia respiratoria."
        ],
        protocol:
            "El tratamiento busca eliminar la infección y prevenir complicaciones. La neumonía bacteriana se trata con antibióticos, ajustados según evolución. Pueden indicarse antipiréticos y analgésicos para fiebre y malestar, y supresores de tos en dosis mínimas si es necesario para el descanso. La mayoría de los casos adquiridos en la comunidad pueden tratarse en casa, aunque la fatiga puede persistir varias semanas. Se requiere hospitalización en pacientes mayores de 65 años, con alteraciones del estado mental, inestabilidad hemodinámica, insuficiencia respiratoria, alteración renal o necesidad de soporte ventilatorio. Los niños pequeños, con dificultad respiratoria o deshidratación también pueden requerir ingreso hospitalario.",
        guideUrl: "https://www.mayoclinic.org/es/diseases-conditions/pneumonia/diagnosis-treatment/drc-20354210"
    },


    "pneumothorax": {
        displayName: "Neumotórax",
        steps: [
            "1) Si es a tensión → descompresión inmediata con aguja (emergencia médica).",
            "2) Según tipo: observación en primario asintomático; aspiración con catéter en primario sintomático; toracostomía con tubo en secundarios o traumáticos."
        ],
        protocol:
            "El manejo depende del tipo y gravedad. El neumotórax espontáneo primario asintomático puede observarse con radiografías de control si el paciente está estable. El primario sintomático requiere evacuación mediante aspiración con catéter o dispositivos ambulatorios (válvula de Heimlich); si no hay reexpansión, colocar tubo de tórax. Los neumotórax secundarios o traumáticos se manejan con toracostomía con tubo. El neumotórax a tensión es una emergencia clínica y requiere descompresión inmediata con aguja seguida de colocación de tubo torácico.",

        guideUrl: "https://www.msdmanuals.com/es/professional/trastornos-pulmonares/trastornos-mediast%C3%ADnicos-y-pleurales/neumot%C3%B3rax#Diagn%C3%B3stico_v923270_es"
    },

    "normal": {
        displayName: "Estudio sin Hallazgos Patológicos",
        steps: [
            "1) Correlacionar con clínica del paciente.",
            "2) Seguimiento rutinario si está indicado."
        ],
        protocol:
            "No se identifican alteraciones radiológicas significativas. Continuar evaluación clínica habitual.",
        guideUrl: "#"
    }
};

function renderDiseaseInfo(predictedClassName) {
    const key = normalizeKey(predictedClassName);

    const data = DISEASE_CONTENT[key];

    if (!data) {
        if (step1El) step1El.textContent = "";
        if (step2El) step2El.textContent = "";
        if (protocolTextEl) protocolTextEl.textContent =
            "Sin protocolo cargado para esta clase. Agregue su guía en el diccionario DISEASE_CONTENT.";
        if (protocolLinkEl) {
            protocolLinkEl.href = "#";
            protocolLinkEl.style.pointerEvents = "none";
            protocolLinkEl.style.opacity = "0.6";
        }
        return;
    }

    if (step1El) step1El.textContent = data.steps?.[0] || "";
    if (step2El) step2El.textContent = data.steps?.[1] || "";

    if (protocolTextEl) protocolTextEl.textContent = data.protocol || "";

    if (protocolLinkEl) {
        protocolLinkEl.href = data.guideUrl || "#";
        protocolLinkEl.style.pointerEvents = "auto";
        protocolLinkEl.style.opacity = "1";
    }
}

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
    renderDiseaseInfo(topName);
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
        try { webcam.stop(); } catch (_) { }
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

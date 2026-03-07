/**
 * localImageValidator.js
 *
 * Purely client-side image validation — NO API KEY required.
 * Runs 100% in the browser using canvas pixel analysis + TensorFlow.js COCO-SSD.
 *
 * Two-stage pipeline:
 *
 *   Stage 1 — REJECTION gate (canvas pixel analysis)
 *     Quickly rejects images that are obviously not a genuine outdoor issue:
 *     blank, screenshot, indoor-dominant colour palette, sky-only, green field, etc.
 *
 *   Stage 2 — ISSUE-SPECIFIC scene scoring (canvas + optional COCO-SSD)
 *     Each issue type has a custom scorer that analyses the pixel statistics
 *     of the image (dominant hues, saturation, brightness, edge density,
 *     surface texture) to decide whether the scene is plausible.
 *
 * Why not rely solely on COCO-SSD?
 *   COCO-SSD's 80 classes do not include "pothole", "sewage", "water leak",
 *   etc.  Using road-vehicles as a proxy is unreliable — a clean road also
 *   has cars.  Pixel-level scene analysis gives us far better signal.
 */

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

// ─── Model singleton ──────────────────────────────────────────────────────────
let _model = null;
let _loadPromise = null;

export function loadModel() {
  if (_model) return Promise.resolve(_model);
  if (_loadPromise) return _loadPromise;
  _loadPromise = cocoSsd.load({ base: 'lite_mobilenet_v2' }).then((m) => {
    _model = m;
    return m;
  });
  return _loadPromise;
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
const SAMPLE_SIZE = 256; // resize every image to 256×256 for analysis

/** Draw image onto an off-screen canvas and return the pixel data array. */
function getPixels(imgEl) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data; // Uint8ClampedArray RGBA
}

/**
 * Convert RGBA pixel array to per-pixel HSV array.
 * Returns Float32Array of length n*3: [h0,s0,v0, h1,s1,v1, ...]
 *   h ∈ [0,360), s ∈ [0,1], v ∈ [0,1]
 */
function rgbaToHSV(data) {
  const n = data.length / 4;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    out[i * 3] = h;
    out[i * 3 + 1] = max === 0 ? 0 : d / max;
    out[i * 3 + 2] = max;
  }
  return out;
}

/**
 * Compute aggregate statistics from HSV array.
 * Returns { meanH, meanS, meanV, varS, varV, lowSatFrac, darkFrac,
 *           greenFrac, skyBlueFrac, asphaltFrac, waterFrac, redFrac }
 */
function sceneStats(hsv) {
  const n = hsv.length / 3;
  let sumS = 0, sumV = 0, sqSumS = 0, sqSumV = 0;
  let lowSat = 0, dark = 0, green = 0, skyBlue = 0, asphalt = 0, water = 0, red = 0;

  for (let i = 0; i < n; i++) {
    const h = hsv[i * 3];
    const s = hsv[i * 3 + 1];
    const v = hsv[i * 3 + 2];

    sumS += s; sumV += v;
    sqSumS += s * s; sqSumV += v * v;

    if (s < 0.15) lowSat++;                            // near-grey / asphalt
    if (v < 0.25) dark++;                              // very dark pixel
    // Green vegetation: hue 80–160, sat > 0.25
    if (h >= 80 && h <= 160 && s > 0.25) green++;
    // Sky blue: hue 185–240, sat > 0.2, bright
    if (h >= 185 && h <= 240 && s > 0.2 && v > 0.45) skyBlue++;
    // Asphalt/concrete: low sat, mid brightness 0.15–0.6
    if (s < 0.18 && v >= 0.15 && v <= 0.65) asphalt++;
    // Muddy water / sewage: brownish hue 15–45, moderate sat
    if (h >= 15 && h <= 45 && s > 0.2 && v < 0.6) water++;
    // Red/orange: hue < 20 or > 340, sat > 0.4 (fire, warning signs)
    if ((h < 20 || h > 340) && s > 0.4) red++;
  }

  return {
    meanS: sumS / n,
    meanV: sumV / n,
    varS: sqSumS / n - (sumS / n) ** 2,
    varV: sqSumV / n - (sumV / n) ** 2,
    lowSatFrac: lowSat / n,
    darkFrac: dark / n,
    greenFrac: green / n,
    skyBlueFrac: skyBlue / n,
    asphaltFrac: asphalt / n,
    waterFrac: water / n,
    redFrac: red / n,
  };
}

/**
 * Measure edge density using a simple Sobel approximation on the luma channel.
 * Returns a value in [0, 1]; higher = more edges / texture.
 */
function edgeDensity(data) {
  const W = SAMPLE_SIZE;
  const luma = new Float32Array(W * W);
  for (let i = 0; i < W * W; i++) {
    luma[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
  }
  let edgeSum = 0;
  for (let y = 1; y < W - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -luma[(y - 1) * W + (x - 1)] - 2 * luma[y * W + (x - 1)] - luma[(y + 1) * W + (x - 1)] +
         luma[(y - 1) * W + (x + 1)] + 2 * luma[y * W + (x + 1)] + luma[(y + 1) * W + (x + 1)];
      const gy =
        -luma[(y - 1) * W + (x - 1)] - 2 * luma[(y - 1) * W + x] - luma[(y - 1) * W + (x + 1)] +
         luma[(y + 1) * W + (x - 1)] + 2 * luma[(y + 1) * W + x] + luma[(y + 1) * W + (x + 1)];
      edgeSum += Math.sqrt(gx * gx + gy * gy);
    }
  }
  return edgeSum / ((W - 2) * (W - 2)); // normalised [0,~1.4]; typical photos 0.05–0.35
}

// ─── Stage 1: Universal rejection gate ───────────────────────────────────────
/**
 * Returns { reject: true, reason, detectedContent } if the image is
 * clearly not a real outdoor municipal issue photo.
 * Returns { reject: false } otherwise.
 */
function universalRejectionGate(stats, edges, data) {
  const n = SAMPLE_SIZE * SAMPLE_SIZE;

  // 1. Blank / solid colour
  if (stats.varV < 0.003 && stats.varS < 0.003) {
    return {
      reject: true,
      detectedContent: 'Blank or solid-colour image detected.',
      reason: 'The image appears to be blank or a solid colour. Please upload a real photograph.',
      whatToFix: 'Take a real photo at the issue site using your camera.',
    };
  }

  // 2. Very low variance overall — screenshot, text document, etc.
  if (stats.varV < 0.012 && stats.meanS < 0.08) {
    return {
      reject: true,
      detectedContent: 'Low-detail image (possible screenshot or document scan).',
      reason: 'The image looks like a screenshot, document, or graphic rather than a real photograph.',
      whatToFix: 'Upload an actual photo taken at the issue location.',
    };
  }

  // 3. Sky-only image (> 55% sky-blue pixels, very bright)
  if (stats.skyBlueFrac > 0.55 && stats.meanV > 0.6) {
    return {
      reject: true,
      detectedContent: `Sky scene detected (${Math.round(stats.skyBlueFrac * 100)}% sky-blue pixels).`,
      reason: 'The image appears to show only sky. Please photograph the actual issue on the ground.',
      whatToFix: 'Point your camera downward toward the issue.',
    };
  }

  // 4. Predominantly green field / vegetation (selfie in park, etc.)
  if (stats.greenFrac > 0.55) {
    return {
      reject: true,
      detectedContent: `Vegetation/green scene detected (${Math.round(stats.greenFrac * 100)}% green pixels).`,
      reason: 'The image is mostly vegetation or a green field, not a municipal infrastructure issue.',
      whatToFix: 'Photograph the actual infrastructure problem (road, drain, pipe, etc.).',
    };
  }

  // 5. Very bright, saturated, colourful image — likely a food photo or selfie
  if (stats.meanS > 0.55 && stats.meanV > 0.70 && edges < 0.08) {
    return {
      reject: true,
      detectedContent: `Bright, saturated image (avg saturation ${Math.round(stats.meanS * 100)}%).`,
      reason: 'The image looks like a food photo, graphic, or selfie rather than an outdoor issue.',
      whatToFix: 'Upload a clear photo of the actual issue at the site.',
    };
  }

  return { reject: false };
}

// ─── Stage 2: Issue-specific scorers ─────────────────────────────────────────
/**
 * Each scorer receives (stats, edges, cocoClasses) and returns
 * { pass: boolean, confidence: number, detectedContent: string,
 *   approvalMessage?: string, mismatchReason?: string, whatToFix?: string }
 */

const SCORERS = {
  /**
   * POTHOLE
   * Signal: image is mostly road surface (asphalt-grey, low-sat, mid-bright),
   * has meaningful texture/edges (the hole disrupts the surface), and is NOT
   * a clear sky or vegetation scene.
   *
   * Key metrics:
   *   asphaltFrac > 0.30   — at least 30% of pixels look like road/concrete
   *   edges > 0.04         — some surface texture present (not a flat wall)
   *   greenFrac < 0.35     — not a garden / park
   *   skyBlueFrac < 0.40   — not a sky shot
   */
  Pothole(stats, edges, cocoClasses) {
    const roadSurface = stats.asphaltFrac > 0.28;
    const hasTexture  = edges > 0.04;
    const notGreen    = stats.greenFrac < 0.35;
    const notSky      = stats.skyBlueFrac < 0.40;
    const notBright   = stats.meanV < 0.78; // potholes are dark

    // Bonus: COCO detected road vehicles (strong corroborating signal)
    const vehicleClasses = ['car', 'truck', 'motorcycle', 'bus', 'bicycle'];
    const vehicleBonus = cocoClasses.some((c) => vehicleClasses.includes(c));

    const score =
      (roadSurface ? 35 : 0) +
      (hasTexture  ? 20 : 0) +
      (notGreen    ? 15 : 0) +
      (notSky      ? 15 : 0) +
      (notBright   ? 10 : 0) +
      (vehicleBonus ? 10 : 0);

    const confidence = Math.min(93, score);
    const pass = score >= 55; // threshold

    const surfPct = Math.round(stats.asphaltFrac * 100);

    if (pass) {
      return {
        pass: true,
        confidence,
        detectedContent: `Road/asphalt surface: ${surfPct}% of frame. Edge texture: ${edges.toFixed(3)}.${vehicleBonus ? ' Road vehicles also detected.' : ''}`,
        approvalMessage: 'Image shows a plausible road surface with surface disruption consistent with a pothole.',
      };
    }

    // Build a specific rejection reason
    const reasons = [];
    if (!roadSurface) reasons.push(`only ${surfPct}% of the image looks like road/concrete (need ≥28%)`);
    if (!hasTexture)  reasons.push('the surface appears too smooth or flat');
    if (!notGreen)    reasons.push(`too much vegetation (${Math.round(stats.greenFrac * 100)}%)`);
    if (!notSky)      reasons.push(`too much sky (${Math.round(stats.skyBlueFrac * 100)}%)`);

    return {
      pass: false,
      confidence: 80,
      detectedContent: `Road surface: ${surfPct}%. Edge density: ${edges.toFixed(3)}. Green: ${Math.round(stats.greenFrac * 100)}%.`,
      mismatchReason: `The image does not appear to show a road surface with a pothole: ${reasons.join('; ')}.`,
      whatToFix: 'Take a close-up photo of the pothole from directly above or at a low angle so the damaged road surface fills most of the frame.',
    };
  },

  /**
   * WASTE OVERFLOW
   * Signal: scattered objects, varied colours, outdoor context.
   * Litter scenes typically have high colour variance and multiple small objects.
   *
   * Key metrics:
   *   varS > 0.03   — varied saturation (mixed colours from different items)
   *   edges > 0.06  — multiple object edges
   *   COCO: bottle, cup, backpack, suitcase, etc.
   */
  'Waste Overflow'(stats, edges, cocoClasses) {
    const wasteObjects = ['bottle', 'cup', 'bowl', 'suitcase', 'backpack', 'handbag', 'sports ball', 'chair'];
    const wasteHits = cocoClasses.filter((c) => wasteObjects.includes(c));

    const hasColorVariety = stats.varS > 0.025;
    const hasEdges = edges > 0.055;
    const notSky = stats.skyBlueFrac < 0.45;
    const notPureGrass = stats.greenFrac < 0.60;

    const score =
      (wasteHits.length > 0   ? 40 : 0) +
      (wasteHits.length > 1   ? 15 : 0) +
      (hasColorVariety         ? 20 : 0) +
      (hasEdges                ? 15 : 0) +
      (notSky                  ? 10 : 0) +
      (notPureGrass            ? 10 : 0);

    const pass = score >= 45;
    const confidence = Math.min(92, score);

    if (pass) {
      const found = wasteHits.length ? ` Waste-related objects: ${wasteHits.join(', ')}.` : '';
      return {
        pass: true,
        confidence,
        detectedContent: `Colour variety: ${Math.round(stats.varS * 1000) / 10}. Edge density: ${edges.toFixed(3)}.${found}`,
        approvalMessage: 'Image shows a scene consistent with waste overflow (multiple objects, colour variety).',
      };
    }

    return {
      pass: false,
      confidence: 78,
      detectedContent: `Colour variety: ${Math.round(stats.varS * 1000) / 10}. Waste objects detected: ${wasteHits.join(', ') || 'none'}.`,
      mismatchReason: wasteHits.length === 0
        ? 'No waste or litter objects were detected in the image.'
        : 'The image does not appear to show a waste overflow scene.',
      whatToFix: 'Photograph the overflowing bin or littered area clearly, showing the waste and surroundings.',
    };
  },

  /**
   * WATER LEAKAGE
   * Signal: water has a specific dark-blue/teal or reflective appearance,
   * and often creates wet dark patches on road/ground (very dark, low-sat).
   *
   * Key metrics:
   *   darkFrac > 0.20    — wet patches are dark
   *   asphaltFrac > 0.20 — road/ground context
   *   waterFrac > 0.05   — brownish wet-ground or water hue
   *   COCO: fire hydrant is a strong signal
   */
  'Water Leakage'(stats, edges, cocoClasses) {
    const hydrantPresent = cocoClasses.includes('fire hydrant');
    const hasDarkPatches = stats.darkFrac > 0.18;
    const hasGround = stats.asphaltFrac > 0.18;
    const hasWaterHue = stats.waterFrac > 0.04;
    const hasEdges = edges > 0.04;

    const score =
      (hydrantPresent  ? 50 : 0) +
      (hasDarkPatches  ? 20 : 0) +
      (hasGround       ? 15 : 0) +
      (hasWaterHue     ? 15 : 0) +
      (hasEdges        ? 10 : 0);

    const pass = score >= 40;
    const confidence = Math.min(90, score);

    if (pass) {
      return {
        pass: true,
        confidence,
        detectedContent: `Dark patches: ${Math.round(stats.darkFrac * 100)}%. Ground surface: ${Math.round(stats.asphaltFrac * 100)}%.${hydrantPresent ? ' Fire hydrant detected.' : ''}`,
        approvalMessage: 'Image shows a scene consistent with water leakage (dark wet patches on ground).',
      };
    }

    return {
      pass: false,
      confidence: 78,
      detectedContent: `Dark patches: ${Math.round(stats.darkFrac * 100)}%. Ground: ${Math.round(stats.asphaltFrac * 100)}%.`,
      mismatchReason: 'The image does not clearly show water leakage or wet ground patches.',
      whatToFix: 'Photograph the leaking pipe, burst fitting, or wet road surface directly. Include the source of the leak if visible.',
    };
  },

  /**
   * ELECTRICITY FAULT
   * Signal: street lighting or electrical infrastructure.
   * These scenes are typically outdoor, contain poles/wires (high-edge vertical
   * structures), and often have sky in background.
   *
   * Key metrics:
   *   COCO: traffic light is strong signal (street infrastructure)
   *   edges > 0.06   — wires, poles create many edges
   *   skyBlueFrac or bright background (photographed upward)
   */
  'Electricity Fault'(stats, edges, cocoClasses) {
    const infraObjects = ['traffic light', 'stop sign', 'parking meter'];
    const infraHits = cocoClasses.filter((c) => infraObjects.includes(c));

    const hasInfra = infraHits.length > 0;
    const hasEdges = edges > 0.055;
    const hasOutdoorContext = stats.skyBlueFrac > 0.08 || stats.asphaltFrac > 0.15;
    const notIndoor = stats.meanS < 0.45 || stats.meanV < 0.80;

    const score =
      (hasInfra         ? 45 : 0) +
      (hasEdges         ? 20 : 0) +
      (hasOutdoorContext ? 20 : 0) +
      (notIndoor        ? 15 : 0);

    const pass = score >= 45;
    const confidence = Math.min(91, score);

    if (pass) {
      return {
        pass: true,
        confidence,
        detectedContent: `Edge density: ${edges.toFixed(3)}. Sky: ${Math.round(stats.skyBlueFrac * 100)}%.${infraHits.length ? ` Infrastructure: ${infraHits.join(', ')}.` : ''}`,
        approvalMessage: 'Image shows outdoor electrical/street infrastructure context.',
      };
    }

    return {
      pass: false,
      confidence: 78,
      detectedContent: `Edge density: ${edges.toFixed(3)}. Outdoor context: ${hasOutdoorContext ? 'yes' : 'no'}.`,
      mismatchReason: 'No electrical infrastructure or outdoor scene detected in the image.',
      whatToFix: 'Photograph the faulty street light, broken electrical pole, or exposed wiring at the site.',
    };
  },

  /**
   * SEWAGE BLOCKAGE
   * Signal: drain/sewer context — dark openings, wet ground, brownish hues,
   * road surface with a visible drain or overflow.
   *
   * Key metrics:
   *   darkFrac > 0.22   — dark drain opening or sewage
   *   asphaltFrac > 0.22 — road/footpath context
   *   waterFrac > 0.05   — brownish sewage hue
   *   edges > 0.05      — grate, cracks, debris edges
   */
  'Sewage Blockage'(stats, edges, cocoClasses) {
    const hasDarkDrain = stats.darkFrac > 0.20;
    const hasGround    = stats.asphaltFrac > 0.20;
    const hasSewageHue = stats.waterFrac > 0.05;
    const hasEdges     = edges > 0.05;
    const notSky       = stats.skyBlueFrac < 0.40;

    const score =
      (hasDarkDrain  ? 30 : 0) +
      (hasGround     ? 25 : 0) +
      (hasSewageHue  ? 20 : 0) +
      (hasEdges      ? 15 : 0) +
      (notSky        ? 10 : 0);

    const pass = score >= 50;
    const confidence = Math.min(90, score);

    if (pass) {
      return {
        pass: true,
        confidence,
        detectedContent: `Dark areas: ${Math.round(stats.darkFrac * 100)}%. Ground: ${Math.round(stats.asphaltFrac * 100)}%. Sewage hue: ${Math.round(stats.waterFrac * 100)}%.`,
        approvalMessage: 'Image shows a scene consistent with a sewage blockage (dark drain, ground context).',
      };
    }

    return {
      pass: false,
      confidence: 78,
      detectedContent: `Dark areas: ${Math.round(stats.darkFrac * 100)}%. Ground: ${Math.round(stats.asphaltFrac * 100)}%.`,
      mismatchReason: 'The image does not show a drain, sewer opening, or sewage overflow scene.',
      whatToFix: 'Photograph the blocked drain, manhole, or sewage overflow directly from above so the blockage is visible.',
    };
  },
};

// ─── Load image element from File ────────────────────────────────────────────
function fileToImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Validate whether `imageFile` genuinely shows `issueType`.
 *
 * Returns:
 * {
 *   imageMatchesIssue: boolean,
 *   detectedContent:   string,
 *   confidence:        number,   // 0–100
 *   mismatchReason:    string | null,
 *   approvalMessage:   string | null,
 *   whatToFix:         string | null,
 * }
 */
export async function validateImageLocally(imageFile, issueType) {
  const scorer = SCORERS[issueType];
  if (!scorer) {
    // Unknown issue type — pass through without blocking
    return {
      imageMatchesIssue: true,
      detectedContent: 'Issue type not covered by local validator.',
      confidence: 50,
      mismatchReason: null,
      approvalMessage: 'Image accepted.',
      whatToFix: null,
    };
  }

  // ── Load image into DOM ────────────────────────────────────────────────────
  const imgEl = await fileToImageElement(imageFile);
  const data  = getPixels(imgEl);
  const hsv   = rgbaToHSV(data);
  const stats = sceneStats(hsv);
  const edges = edgeDensity(data);

  // ── Stage 1: Universal rejection gate ─────────────────────────────────────
  const gate = universalRejectionGate(stats, edges, data);
  if (gate.reject) {
    return {
      imageMatchesIssue: false,
      detectedContent: gate.detectedContent,
      confidence: 92,
      mismatchReason: gate.reason,
      approvalMessage: null,
      whatToFix: gate.whatToFix,
    };
  }

  // ── Stage 2: Run COCO-SSD for object labels (best-effort) ─────────────────
  let cocoClasses = [];
  try {
    const model = await loadModel();
    const preds = await model.detect(imgEl, 8);
    cocoClasses = preds
      .filter((p) => p.score >= 0.30)
      .map((p) => p.class.toLowerCase());
  } catch {
    // COCO failure is non-fatal — scorers degrade gracefully without object labels
  }

  // ── Stage 2 reject: obvious indoor / food COCO labels ─────────────────────
  const HARD_INDOOR = new Set([
    'tv', 'laptop', 'mouse', 'keyboard', 'remote', 'cell phone',
    'microwave', 'oven', 'toaster', 'refrigerator', 'couch', 'bed',
    'dining table', 'toilet', 'sink', 'toothbrush', 'hair drier',
  ]);
  const FOOD = new Set([
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
    'hot dog', 'pizza', 'donut', 'cake',
  ]);
  const indoorHits = cocoClasses.filter((c) => HARD_INDOOR.has(c));
  const foodHits   = cocoClasses.filter((c) => FOOD.has(c));
  if (indoorHits.length >= 2 || foodHits.length >= 1) {
    const found = [...indoorHits, ...foodHits].join(', ');
    return {
      imageMatchesIssue: false,
      detectedContent: `Indoor/food objects detected: ${found}.`,
      confidence: 90,
      mismatchReason: `The image contains indoor or food objects (${found}), not a municipal issue scene.`,
      approvalMessage: null,
      whatToFix: `Upload a photo taken outdoors at the site of the ${issueType}.`,
    };
  }

  // ── Stage 3: Issue-specific scorer ────────────────────────────────────────
  const result = scorer(stats, edges, cocoClasses);

  return {
    imageMatchesIssue: result.pass,
    detectedContent:   result.detectedContent,
    confidence:        result.confidence,
    mismatchReason:    result.mismatchReason   ?? null,
    approvalMessage:   result.approvalMessage  ?? null,
    whatToFix:         result.whatToFix        ?? null,
  };
}

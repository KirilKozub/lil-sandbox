import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * @typedef {"card"|"responsive"|"all"} Mode
 *
 * @typedef {Object} Density
 * @property {string} suffix
 * @property {number} scale
 *
 * @typedef {Object} Preset
 * @property {number} [quality]
 * @property {boolean} [progressive]
 * @property {boolean} [mozjpeg]
 *
 * @typedef {Object} GeneratedFile
 * @property {string} path - Path relative to dist/images (e.g. "avif/foo.avif")
 * @property {number} width
 * @property {number} height
 * @property {number} size - bytes
 */

const INPUT_DIR = 'src/images/original';
const OUTPUT_DIR = 'dist/images';
const ALLOWED_EXT = /\.(png|jpe?g)$/i;

/** @type {Record<"avif"|"webp"|"jpeg", Preset>} */
const PRESETS = {
  avif: { quality: 50 },
  webp: { quality: 80 },
  jpeg: { quality: 82, progressive: true, mozjpeg: true },
};

/** @type {Density[]} */
const DENSITIES = [
  { suffix: '', scale: 1 },
  { suffix: '@2x', scale: 2 },
  { suffix: '@3x', scale: 3 },
];

const CARD = {
  width: 810,
  height: 300,
  fit: 'cover',
  position: 'centre',
};

const RESPONSIVE_BASE_WIDTHS = [320, 480, 640, 810, 960, 1280, 1600];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function getImageSize(filePath) {
  const meta = await sharp(filePath).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

function parseMode(argv) {
  const arg = argv.find((a) => a.startsWith('--mode='));
  if (!arg) return 'all';
  const value = arg.split('=')[1];
  if (value === 'card' || value === 'responsive' || value === 'all') return value;
  return 'all';
}

function capBySource(target, source) {
  return Math.min(target, source);
}

function canCover(targetW, targetH, srcW, srcH) {
  return srcW >= targetW && srcH >= targetH;
}

function getDensityKey(suffix) {
  if (suffix === '@2x') return '2x';
  if (suffix === '@3x') return '3x';
  return '1x';
}

function buildOutFileName(baseName, variantName, format) {
  return `${baseName}__${variantName}.${format}`;
}

function buildRelPath(format, fileName) {
  return `${format}/${fileName}`;
}

/**
 * Writes file and returns metadata for manifest.
 * Uses pipeline.clone() to avoid reusing consumed pipeline.
 *
 * @param {sharp.Sharp} pipeline
 * @param {"avif"|"webp"|"jpeg"} format
 * @param {Preset} preset
 * @param {string} absOutputPath
 * @param {string} relPath
 * @returns {Promise<GeneratedFile>}
 */
async function writeFormatWithInfo(pipeline, format, preset, absOutputPath, relPath) {
  /** @type {any} */
  let info;

  if (format === 'jpeg') {
    info = await pipeline.clone().jpeg(preset).toFile(absOutputPath);
  } else if (format === 'webp') {
    info = await pipeline.clone().webp(preset).toFile(absOutputPath);
  } else {
    info = await pipeline.clone().avif(preset).toFile(absOutputPath);
  }

  const width = Number(info.width || 0);
  const height = Number(info.height || 0);
  const size = Number(info.size || fs.statSync(absOutputPath).size);

  return { path: relPath, width, height, size };
}

function listInputFiles() {
  if (!fs.existsSync(INPUT_DIR)) return [];
  return fs.readdirSync(INPUT_DIR).filter((f) => ALLOWED_EXT.test(f));
}

/**
 * @param {Record<string, any>} manifest
 * @param {"card"|"responsive"} modeName
 * @param {string} baseName
 * @returns {any}
 */
function ensureManifestNode(manifest, modeName, baseName) {
  if (!manifest[modeName]) manifest[modeName] = {};
  if (!manifest[modeName][baseName]) {
    manifest[modeName][baseName] = {
      formats: { avif: null, webp: null, jpeg: null },
      srcset: { avif: null, webp: null, jpeg: null },
    };
  }
  return manifest[modeName][baseName];
}

/**
 * CARD mode: 810x300 + @2x/@3x, AVIF/WebP/JPEG
 */
async function generateCard({ inputPath, baseName, srcSize, manifest }) {
  const node = ensureManifestNode(manifest, 'card', baseName);

  /** @type {Record<"avif"|"webp"|"jpeg", Record<string, GeneratedFile>>} */
  const collected = { avif: {}, webp: {}, jpeg: {} };

  for (const density of DENSITIES) {
    const targetW = CARD.width * density.scale;
    const targetH = CARD.height * density.scale;

    if (!canCover(targetW, targetH, srcSize.width, srcSize.height)) continue;

    const densityKey = getDensityKey(density.suffix);
    const variantName = `card_${CARD.width}x${CARD.height}${density.suffix}`;

    const basePipeline = sharp(inputPath).resize({
      width: targetW,
      height: targetH,
      fit: CARD.fit,
      position: CARD.position,
      withoutEnlargement: true,
    });

    for (const format of /** @type {Array<"avif"|"webp"|"jpeg">} */ (Object.keys(PRESETS))) {
      const outDir = path.join(OUTPUT_DIR, format);
      ensureDir(outDir);

      const fileName = buildOutFileName(baseName, variantName, format);
      const rel = buildRelPath(format, fileName);
      const abs = path.join(outDir, fileName);

      // eslint-disable-next-line no-await-in-loop
      const info = await writeFormatWithInfo(basePipeline, format, PRESETS[format], abs, rel);
      collected[format][densityKey] = info;
    }
  }

  node.formats.avif = collected.avif;
  node.formats.webp = collected.webp;
  node.formats.jpeg = collected.jpeg;

  // Build srcset (density descriptors)
  const buildDensitySrcset = (format) => {
    const map = collected[format];
    const parts = [];
    if (map['1x']) parts.push(`${map['1x'].path} 1x`);
    if (map['2x']) parts.push(`${map['2x'].path} 2x`);
    if (map['3x']) parts.push(`${map['3x'].path} 3x`);
    return parts.join(', ');
  };

  node.srcset.avif = buildDensitySrcset('avif') || null;
  node.srcset.webp = buildDensitySrcset('webp') || null;
  node.srcset.jpeg = buildDensitySrcset('jpeg') || null;
}

/**
 * RESPONSIVE mode: widths + @2x/@3x, keep aspect ratio, AVIF/WebP/JPEG
 */
async function generateResponsive({ inputPath, baseName, srcSize, manifest }) {
  const node = ensureManifestNode(manifest, 'responsive', baseName);

  /** @type {Record<"avif"|"webp"|"jpeg", GeneratedFile[]>} */
  const collected = { avif: [], webp: [], jpeg: [] };

  // build unique widths (considering density scaling + cap)
  const planned = new Map(); // key: `${width}${suffix}` -> {width,suffix}
  for (const baseW of RESPONSIVE_BASE_WIDTHS) {
    for (const density of DENSITIES) {
      const target = baseW * density.scale;
      const finalW = capBySource(target, srcSize.width);
      if (finalW < 80) continue;
      const key = `${finalW}${density.suffix}`;
      if (!planned.has(key)) planned.set(key, { width: finalW, suffix: density.suffix });
    }
  }

  for (const { width, suffix } of planned.values()) {
    const variantName = `w${width}${suffix}`;

    const basePipeline = sharp(inputPath).resize({
      width,
      withoutEnlargement: true,
    });

    for (const format of /** @type {Array<"avif"|"webp"|"jpeg">} */ (Object.keys(PRESETS))) {
      const outDir = path.join(OUTPUT_DIR, format);
      ensureDir(outDir);

      const fileName = buildOutFileName(baseName, variantName, format);
      const rel = buildRelPath(format, fileName);
      const abs = path.join(outDir, fileName);

      // eslint-disable-next-line no-await-in-loop
      const info = await writeFormatWithInfo(basePipeline, format, PRESETS[format], abs, rel);
      collected[format].push(info);
    }
  }

  // sort by width asc for nice srcset
  for (const format of Object.keys(collected)) {
    collected[format].sort((a, b) => a.width - b.width);
  }

  node.formats.avif = collected.avif;
  node.formats.webp = collected.webp;
  node.formats.jpeg = collected.jpeg;

  // Build srcset (width descriptors)
  const buildWidthSrcset = (arr) => arr.map((x) => `${x.path} ${x.width}w`).join(', ');

  node.srcset.avif = buildWidthSrcset(collected.avif) || null;
  node.srcset.webp = buildWidthSrcset(collected.webp) || null;
  node.srcset.jpeg = buildWidthSrcset(collected.jpeg) || null;
}

async function run(mode) {
  ensureDir(OUTPUT_DIR);

  /** @type {Record<string, any>} */
  const manifest = {
    generatedAt: new Date().toISOString(),
    inputDir: INPUT_DIR,
    outputDir: OUTPUT_DIR,
    card: {},
    responsive: {},
  };

  const files = listInputFiles();
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const baseName = path.parse(file).name;

    // eslint-disable-next-line no-await-in-loop
    const srcSize = await getImageSize(inputPath);
    if (!srcSize.width || !srcSize.height) continue;

    if (mode === 'card' || mode === 'all') {
      // eslint-disable-next-line no-await-in-loop
      await generateCard({ inputPath, baseName, srcSize, manifest });
    }

    if (mode === 'responsive' || mode === 'all') {
      // eslint-disable-next-line no-await-in-loop
      await generateResponsive({ inputPath, baseName, srcSize, manifest });
    }
  }

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');

  console.log(`Done. Output: ${OUTPUT_DIR}`);
  console.log(`Manifest: ${manifestPath}`);
}

const mode = parseMode(process.argv);
run(mode);




{
  "name": "image-optimizer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "images:card": "node scripts/optimize-images.js --mode=card",
    "images:responsive": "node scripts/optimize-images.js --mode=responsive",
    "images:all": "node scripts/optimize-images.js --mode=all"
  },
  "dependencies": {
    "sharp": "^0.33.0"
  }
}
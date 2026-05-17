const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "assets", "art-library", "ui", "title-kit");
const publicDir = path.join(root, "demo", "public", "assets", "art-library", "ui", "title-kit");
const previewDir = path.join(root, "ai-kitchen-previews");
const tempDir = path.join(root, "tmp", "title-kit-render");

for (const dir of [outDir, publicDir, previewDir, tempDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) {
  throw new Error("Chrome or Edge executable was not found for PNG rendering.");
}

const palette = {
  ink: "#2e2a27",
  dark: "#5b331e",
  woodDeep: "#7a4427",
  wood: "#a8663b",
  woodLight: "#d48b50",
  cream: "#fff6d8",
  creamLight: "#fffdf2",
  gold: "#f6bd4f",
  goldLight: "#ffe59a",
  coral: "#ef7762",
  red: "#b94b38",
  green: "#6f8d4f",
  greenDeep: "#49643a",
  mint: "#97d8b2",
  blue: "#d7ecf5",
};

function styleBlock(extra = "") {
  return `
    <style>
      .pixel { shape-rendering: crispEdges; }
      .label {
        font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
        font-weight: 900;
        paint-order: stroke fill;
        stroke-linejoin: round;
      }
      .small {
        font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
        font-weight: 800;
      }
      ${extra}
    </style>`;
}

function svg({ width, height, body, extraStyle = "" }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${styleBlock(extraStyle)}
  ${body}
</svg>
`;
}

function textShadow(x, y, text, opts = {}) {
  const {
    size = 72,
    fill = palette.creamLight,
    stroke = palette.ink,
    strokeWidth = 8,
    anchor = "middle",
    family = "Noto Sans SC",
    weight = 900,
    spacing = 0,
  } = opts;
  const common = `x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}, Microsoft YaHei, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}"`;
  return `
    <text ${common} fill="${palette.dark}" opacity="0.35" transform="translate(7 7)">${text}</text>
    <text ${common} fill="${palette.coral}" opacity="0.72" transform="translate(3 4)" stroke="${stroke}" stroke-width="${Math.max(2, strokeWidth - 3)}" paint-order="stroke fill" stroke-linejoin="round">${text}</text>
    <text ${common} fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke fill" stroke-linejoin="round">${text}</text>`;
}

function playfulText(cx, y, text, opts = {}) {
  const {
    size = 72,
    gap = size * 0.88,
    fills = [palette.creamLight, palette.goldLight],
    stroke = palette.ink,
    strokeWidth = 8,
    rotations = [-4, 2, -2, 4, -3],
  } = opts;
  const start = cx - ((text.length - 1) * gap) / 2;
  return text.split("").map((char, index) => {
    const x = start + index * gap;
    const fill = fills[index % fills.length];
    const rotation = rotations[index % rotations.length];
    const common = `x="${x}" y="${y}" text-anchor="middle" font-family="Noto Sans SC, Microsoft YaHei, sans-serif" font-size="${size}" font-weight="1000" letter-spacing="0"`;
    const rotate = `rotate(${rotation} ${x} ${y - size / 3})`;
    return `
      <text ${common} fill="${palette.dark}" opacity="0.28" transform="${rotate} translate(7 8)">${char}</text>
      <text ${common} fill="${palette.coral}" stroke="${stroke}" stroke-width="${Math.max(3, strokeWidth - 3)}" paint-order="stroke fill" stroke-linejoin="round" transform="${rotate} translate(3 4)">${char}</text>
      <text ${common} fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke fill" stroke-linejoin="round" transform="${rotate}">${char}</text>
      <rect class="pixel" x="${x - size * 0.13}" y="${y - size * 0.72}" width="${size * 0.26}" height="${size * 0.07}" fill="${palette.creamLight}" opacity="0.42" transform="${rotate}"/>
    `;
  }).join("");
}

function sparkle(x, y, s = 1, fill = palette.goldLight) {
  return `<path class="pixel" d="M${x} ${y - 16 * s} L${x + 5 * s} ${y - 5 * s} L${x + 16 * s} ${y} L${x + 5 * s} ${y + 5 * s} L${x} ${y + 16 * s} L${x - 5 * s} ${y + 5 * s} L${x - 16 * s} ${y} L${x - 5 * s} ${y - 5 * s} Z" fill="${fill}" stroke="${palette.ink}" stroke-width="${2 * s}"/>`;
}

function leafPair(x, y, scale = 1, flip = 1) {
  return `
    <g transform="translate(${x} ${y}) scale(${flip * scale} ${scale})">
      <path d="M0 0 C-20 -22 -42 -24 -50 -5 C-31 -4 -17 5 0 0Z" fill="${palette.green}" stroke="${palette.ink}" stroke-width="3"/>
      <path d="M-6 18 C-28 3 -49 7 -52 28 C-33 23 -17 28 -6 18Z" fill="${palette.greenDeep}" stroke="${palette.ink}" stroke-width="3"/>
      <path d="M0 0 C-9 9 -19 17 -34 23" fill="none" stroke="${palette.cream}" stroke-width="2" opacity="0.35"/>
    </g>`;
}

function pot(x, y, scale = 1, happy = false) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <ellipse cx="120" cy="188" rx="74" ry="14" fill="${palette.ink}" opacity="0.18"/>
      <path d="M63 96 C35 91 25 130 53 146 C65 153 75 148 80 136 L77 104 Z" fill="#d96f5c" stroke="${palette.ink}" stroke-width="8"/>
      <path d="M177 96 C205 91 215 130 187 146 C175 153 165 148 160 136 L163 104 Z" fill="#d96f5c" stroke="${palette.ink}" stroke-width="8"/>
      <path d="M45 91 C48 66 71 54 120 54 C169 54 192 66 195 91 L180 164 C174 190 66 190 60 164 Z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="9" stroke-linejoin="round"/>
      <path d="M68 108 C82 91 159 91 174 108 L164 158 C151 172 89 172 76 158 Z" fill="#ffb39e" opacity="0.76"/>
      <rect x="48" y="70" width="144" height="42" rx="18" fill="${palette.woodDeep}" stroke="${palette.ink}" stroke-width="9"/>
      <path d="M63 80 H177 V96 H63Z" fill="${palette.goldLight}" opacity="0.92"/>
      <circle cx="88" cy="83" r="7" fill="${palette.creamLight}" opacity="0.8"/>
      <circle cx="115" cy="75" r="5" fill="${palette.creamLight}" opacity="0.85"/>
      <circle cx="151" cy="84" r="6" fill="${palette.creamLight}" opacity="0.75"/>
      <rect x="90" y="44" width="60" height="31" rx="10" fill="${palette.gold}" stroke="${palette.ink}" stroke-width="7"/>
      <path d="M83 42 C73 16 100 8 116 24 C132 1 165 14 158 43 C176 42 186 58 171 72 H70 C54 59 63 42 83 42Z" fill="${palette.creamLight}" stroke="${palette.ink}" stroke-width="7"/>
      <path d="M91 48 C102 61 143 61 155 48" fill="none" stroke="#e7c99f" stroke-width="3"/>
      ${happy ? `<rect x="83" y="126" width="13" height="13" rx="2" fill="${palette.ink}"/><rect x="144" y="126" width="13" height="13" rx="2" fill="${palette.ink}"/><rect x="67" y="143" width="22" height="10" rx="5" fill="#f39a8a" opacity="0.82"/><rect x="152" y="143" width="22" height="10" rx="5" fill="#f39a8a" opacity="0.82"/><path d="M104 147 C111 156 130 156 137 147" fill="none" stroke="${palette.ink}" stroke-width="6" stroke-linecap="round"/>` : ""}
      <path d="M71 117 H99" stroke="${palette.creamLight}" stroke-width="5" opacity="0.26"/>
      <path d="M78 174 H98 V188 H70 Z" fill="${palette.woodDeep}" stroke="${palette.ink}" stroke-width="4"/>
      <path d="M142 174 H162 L170 188 H142 Z" fill="${palette.woodDeep}" stroke="${palette.ink}" stroke-width="4"/>
    </g>`;
}

function roundedPanel(x, y, w, h, r = 30) {
  return `
    <rect x="${x + 7}" y="${y + 9}" width="${w}" height="${h}" rx="${r}" fill="${palette.ink}" opacity="0.26"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${palette.woodDeep}" stroke="${palette.ink}" stroke-width="6"/>
    <rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" rx="${Math.max(4, r - 12)}" fill="${palette.wood}" stroke="${palette.woodLight}" stroke-width="4"/>
    <rect x="${x + 24}" y="${y + 24}" width="${w - 48}" height="${h - 48}" rx="${Math.max(4, r - 22)}" fill="${palette.cream}" stroke="${palette.ink}" stroke-width="4"/>
    <path class="pixel" d="M${x + 44} ${y + 38} H${x + 78} V${y + 45} H${x + 51} V${y + 72} H${x + 44} Z" fill="${palette.coral}" opacity="0.55"/>
    <path class="pixel" d="M${x + w - 44} ${y + h - 38} H${x + w - 78} V${y + h - 45} H${x + w - 51} V${y + h - 72} H${x + w - 44} Z" fill="${palette.coral}" opacity="0.55"/>`;
}

const assets = [
  {
    name: "title-lockup-large",
    width: 960,
    height: 360,
    svg: svg({
      width: 960,
      height: 360,
      body: `
        ${roundedPanel(54, 52, 852, 246, 40)}
        <path d="M146 70 C179 20 274 24 314 70" fill="${palette.cream}" stroke="${palette.ink}" stroke-width="6"/>
        ${pot(64, 22, 0.84, true)}
        ${sparkle(793, 76, 1.08)}
        ${sparkle(848, 126, 0.62, palette.mint)}
        ${sparkle(281, 61, 0.5, palette.goldLight)}
        ${leafPair(149, 250, 0.74, 1)}
        ${leafPair(812, 251, 0.74, -1)}
        ${playfulText(570, 156, "料理厨神", { size: 82, gap: 78, fills: [palette.creamLight, palette.creamLight, palette.goldLight, palette.creamLight], strokeWidth: 9 })}
        ${playfulText(570, 235, "只剩个锅", { size: 68, gap: 74, fills: [palette.goldLight, palette.creamLight, palette.goldLight, palette.creamLight], strokeWidth: 8, rotations: [3, -4, 2, -2] })}
        <text x="570" y="279" text-anchor="middle" class="small" font-size="22" fill="${palette.dark}">把情绪下锅，把想象端上桌</text>
      `,
    }),
  },
  {
    name: "title-logo-mascot",
    width: 900,
    height: 480,
    svg: svg({
      width: 900,
      height: 480,
      body: `
        <ellipse cx="452" cy="402" rx="292" ry="38" fill="${palette.ink}" opacity="0.16"/>
        <path d="M160 204 C198 89 343 84 422 147 C487 61 656 88 700 198 C777 213 802 297 733 346 C662 397 242 397 169 348 C96 300 92 222 160 204Z" fill="${palette.cream}" stroke="${palette.ink}" stroke-width="10" stroke-linejoin="round"/>
        <path d="M190 219 C232 125 357 124 423 176 C491 115 629 127 670 218 C729 231 744 289 694 323 C626 365 286 365 210 327 C154 299 147 238 190 219Z" fill="${palette.creamLight}" opacity="0.72"/>
        ${sparkle(187, 170, 0.9)}
        ${sparkle(731, 177, 0.78, palette.mint)}
        ${sparkle(708, 328, 0.52, palette.goldLight)}
        ${leafPair(214, 347, 0.64, 1)}
        ${leafPair(704, 349, 0.64, -1)}
        ${pot(364, 28, 0.72, true)}
        ${playfulText(452, 252, "料理厨神", { size: 82, gap: 80, fills: [palette.creamLight, palette.goldLight, palette.creamLight, palette.goldLight], strokeWidth: 10 })}
        ${playfulText(452, 337, "只剩个锅", { size: 72, gap: 78, fills: [palette.goldLight, palette.creamLight], strokeWidth: 9, rotations: [4, -3, 3, -4] })}
        <path d="M300 386 H604 L634 420 L604 454 H300 L270 420 Z" fill="${palette.coral}" stroke="${palette.ink}" stroke-width="7" stroke-linejoin="round"/>
        <text x="452" y="430" text-anchor="middle" class="small" font-size="27" fill="${palette.creamLight}" stroke="${palette.dark}" stroke-width="3" paint-order="stroke fill">情绪入锅 · 想象上菜</text>
      `,
    }),
  },
  {
    name: "title-lockup-compact",
    width: 720,
    height: 260,
    svg: svg({
      width: 720,
      height: 260,
      body: `
        ${roundedPanel(42, 42, 636, 172, 30)}
        ${pot(48, 12, 0.52, true)}
        ${sparkle(604, 55, 0.78)}
        ${leafPair(141, 196, 0.55, 1)}
        ${leafPair(594, 195, 0.55, -1)}
        ${playfulText(402, 121, "料理厨神", { size: 58, gap: 56, fills: [palette.creamLight, palette.goldLight], strokeWidth: 7 })}
        ${playfulText(402, 180, "只剩个锅", { size: 49, gap: 54, fills: [palette.goldLight, palette.creamLight], strokeWidth: 6, rotations: [3, -3, 2, -2] })}
      `,
    }),
  },
  {
    name: "pot-mark",
    width: 512,
    height: 512,
    svg: svg({
      width: 512,
      height: 512,
      body: `
        <ellipse cx="258" cy="420" rx="152" ry="30" fill="${palette.ink}" opacity="0.22"/>
        ${sparkle(100, 132, 1.2)}
        ${sparkle(406, 152, 0.9, palette.mint)}
        ${sparkle(386, 326, 0.58)}
        ${pot(106, 84, 1.24, true)}
      `,
    }),
  },
  {
    name: "only-pot-badge",
    width: 480,
    height: 180,
    svg: svg({
      width: 480,
      height: 180,
      body: `
        <path d="M70 42 H410 L440 90 L410 138 H70 L40 90 Z" fill="${palette.woodDeep}" stroke="${palette.ink}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M86 56 H394 L417 90 L394 124 H86 L63 90 Z" fill="${palette.cream}" stroke="${palette.woodLight}" stroke-width="4"/>
        ${pot(30, 20, 0.38, true)}
        ${playfulText(278, 108, "只剩个锅", { size: 44, gap: 50, fills: [palette.goldLight, palette.creamLight], strokeWidth: 6, rotations: [3, -3, 2, -2] })}
        ${sparkle(419, 46, 0.55, palette.mint)}
      `,
    }),
  },
  {
    name: "start-cauldron-button",
    width: 560,
    height: 190,
    svg: svg({
      width: 560,
      height: 190,
      body: `
        <rect x="58" y="46" width="444" height="88" rx="18" fill="${palette.ink}" opacity="0.28"/>
        <rect x="48" y="36" width="444" height="88" rx="18" fill="${palette.red}" stroke="${palette.ink}" stroke-width="6"/>
        <rect x="62" y="47" width="416" height="58" rx="11" fill="${palette.coral}" stroke="${palette.woodDeep}" stroke-width="4"/>
        <path d="M82 58 H198 V65 H82Z" fill="${palette.creamLight}" opacity="0.36"/>
        ${pot(358, 0, 0.5, true)}
        ${sparkle(72, 36, 0.65, palette.goldLight)}
        ${playfulText(254, 94, "开锅营业", { size: 46, gap: 54, fills: [palette.creamLight, palette.goldLight], stroke: palette.dark, strokeWidth: 5, rotations: [-2, 2, -2, 2] })}
        <text x="254" y="150" text-anchor="middle" class="small" font-size="19" fill="${palette.dark}">今日锅气：满格</text>
      `,
    }),
  },
  {
    name: "service-ribbon",
    width: 540,
    height: 150,
    svg: svg({
      width: 540,
      height: 150,
      body: `
        <path d="M52 42 H488 L450 76 L488 110 H52 L90 76 Z" fill="${palette.greenDeep}" stroke="${palette.ink}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M98 52 H442 V100 H98Z" fill="${palette.mint}" stroke="${palette.ink}" stroke-width="5"/>
        ${sparkle(112, 38, 0.5)}
        ${sparkle(428, 112, 0.5)}
        ${textShadow(270, 88, "灵感下锅", { size: 45, fill: palette.dark, stroke: palette.creamLight, strokeWidth: 6 })}
      `,
    }),
  },
  {
    name: "kitchen-ticket",
    width: 440,
    height: 260,
    svg: svg({
      width: 440,
      height: 260,
      body: `
        <path d="M54 28 H386 V222 H54 C74 202 74 178 54 158 C74 138 74 112 54 92 C74 72 74 48 54 28Z" fill="${palette.cream}" stroke="${palette.ink}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M78 52 H362 V199 H78Z" fill="none" stroke="${palette.coral}" stroke-width="4" stroke-dasharray="12 8" opacity="0.7"/>
        ${leafPair(103, 198, 0.45, 1)}
        ${leafPair(344, 72, 0.45, -1)}
        ${textShadow(220, 100, "本店只剩锅", { size: 39, fill: palette.dark, stroke: palette.creamLight, strokeWidth: 5 })}
        <text x="220" y="148" text-anchor="middle" class="small" font-size="24" fill="${palette.dark}">食材靠想象</text>
        <text x="220" y="180" text-anchor="middle" class="small" font-size="19" fill="${palette.woodDeep}">情绪需求 · AI 料理 · 像素上菜</text>
      `,
    }),
  },
  {
    name: "steam-sparkles",
    width: 360,
    height: 240,
    svg: svg({
      width: 360,
      height: 240,
      body: `
        <path d="M98 202 C54 160 114 132 82 94 C61 68 78 44 106 28" fill="none" stroke="${palette.creamLight}" stroke-width="18" stroke-linecap="round" opacity="0.66"/>
        <path d="M176 214 C128 176 204 143 164 100 C136 70 158 43 196 28" fill="none" stroke="${palette.creamLight}" stroke-width="20" stroke-linecap="round" opacity="0.76"/>
        <path d="M250 205 C216 167 276 143 250 106 C226 72 248 46 286 32" fill="none" stroke="${palette.creamLight}" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
        ${sparkle(65, 78, 0.72, palette.goldLight)}
        ${sparkle(303, 82, 0.62, palette.mint)}
        ${sparkle(224, 42, 0.45, palette.goldLight)}
        ${sparkle(118, 178, 0.42, palette.coral)}
      `,
    }),
  },
];

function fileUrl(file) {
  return `file:///${file.replace(/\\/g, "/").replace(/#/g, "%23")}`;
}

function renderPng(svgPath, pngPath, width, height) {
  const htmlPath = path.join(tempDir, `${path.basename(svgPath, ".svg")}.html`);
  const html = `<!doctype html>
<meta charset="utf-8">
<style>
  html, body {
    width: ${width}px;
    height: ${height}px;
    margin: 0;
    overflow: hidden;
    background: transparent;
  }
  img {
    display: block;
    width: ${width}px;
    height: ${height}px;
  }
</style>
<img src="${fileUrl(svgPath)}" alt="">`;
  fs.writeFileSync(htmlPath, html, "utf8");
  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--disable-extensions",
    "--default-background-color=00000000",
    `--window-size=${width},${height}`,
    `--screenshot=${pngPath}`,
    fileUrl(htmlPath),
  ], { stdio: "ignore" });
}

for (const asset of assets) {
  const svgPath = path.join(outDir, `${asset.name}.svg`);
  const pngPath = path.join(outDir, `${asset.name}.png`);
  fs.writeFileSync(svgPath, asset.svg, "utf8");
  renderPng(svgPath, pngPath, asset.width, asset.height);
  fs.copyFileSync(svgPath, path.join(publicDir, `${asset.name}.svg`));
  fs.copyFileSync(pngPath, path.join(publicDir, `${asset.name}.png`));
}

const readmePath = path.join(outDir, "README.md");
if (fs.existsSync(readmePath)) {
  fs.copyFileSync(readmePath, path.join(publicDir, "README.md"));
}

const previewItems = assets.map((asset) => {
  const rowHeight = 300;
  const scale = Math.min(0.74, 760 / asset.width, 220 / asset.height);
  const w = Math.round(asset.width * scale);
  const h = Math.round(asset.height * scale);
  return `
    <section class="item">
      <div class="checker" style="width:${w}px;height:${h}px">
        <img src="${fileUrl(path.join(outDir, `${asset.name}.png`))}" style="width:${w}px;height:${h}px" />
      </div>
      <p>${asset.name}</p>
    </section>`;
}).join("");

const previewHtml = `<!doctype html>
<meta charset="utf-8">
<style>
  html, body {
    width: 1400px;
    height: 1600px;
    margin: 0;
    overflow: hidden;
    background: #fff8ea;
    font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
  }
  body {
    padding: 38px;
  }
  h1 {
    margin: 0 0 24px;
    color: ${palette.ink};
    font-size: 44px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px;
  }
  .item {
    min-height: 300px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 12px;
    border: 3px solid rgba(46, 42, 39, 0.25);
    border-radius: 10px;
    background: rgba(255, 253, 245, 0.82);
  }
  .checker {
    display: grid;
    place-items: center;
    background:
      linear-gradient(45deg, #e7d3b3 25%, transparent 25%),
      linear-gradient(-45deg, #e7d3b3 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e7d3b3 75%),
      linear-gradient(-45deg, transparent 75%, #e7d3b3 75%);
    background-color: #fffaf0;
    background-size: 24px 24px;
    background-position: 0 0, 0 12px, 12px -12px, -12px 0;
  }
  p {
    margin: 0;
    color: ${palette.dark};
    font-weight: 900;
    font-size: 20px;
  }
</style>
<h1>料理厨神，只剩个锅 · title-kit transparent UI assets</h1>
<div class="grid">${previewItems}</div>`;

const previewHtmlPath = path.join(tempDir, "preview.html");
const previewPngPath = path.join(previewDir, "title-kit-preview.png");
fs.writeFileSync(previewHtmlPath, previewHtml, "utf8");
execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--disable-extensions",
  "--default-background-color=fff8eaff",
  "--window-size=1400,1600",
  `--screenshot=${previewPngPath}`,
  fileUrl(previewHtmlPath),
], { stdio: "ignore" });

console.log(`Generated ${assets.length} SVG/PNG assets in ${outDir}`);
console.log(`Copied web-ready assets to ${publicDir}`);
console.log(`Preview: ${previewPngPath}`);

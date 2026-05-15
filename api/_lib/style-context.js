const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const sources = [
  {
    name: '美术风格定义',
    path: path.join(root, 'docs', '美术风格定义.md'),
  },
  {
    name: '美术实现规范',
    path: path.join(root, 'docs', '美术实现规范.md'),
  },
  {
    name: '素材库 Manifest',
    path: path.join(root, 'assets', 'art-library', 'manifest.json'),
  },
];

let cachedContext;

function readSource(source) {
  if (!fs.existsSync(source.path)) return '';
  return fs.readFileSync(source.path, 'utf8').trim();
}

function compactText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n...[truncated for prompt budget]`;
}

function getStyleContext() {
  if (cachedContext) return cachedContext;

  const sections = sources.map((source) => ({
    name: source.name,
    content: readSource(source),
  }));

  cachedContext = {
    sources: sections.map((section) => section.name),
    text: sections
      .map((section) => `## ${section.name}\n${compactText(section.content, 4200)}`)
      .join('\n\n'),
  };

  return cachedContext;
}

module.exports = {
  getStyleContext,
};

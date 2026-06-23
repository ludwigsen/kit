/**
 * KIT — TOOL MANIFEST
 * This is the only file you need to edit to add or update a tool.
 *
 * badge: 'new'  → live, linked card
 *        'wip'  → live, linked card (shows WIP badge)
 *        'soon' → non-interactive placeholder
 *
 * color: 'icon-blue' | 'icon-green' | 'icon-yellow' | 'icon-red'
 * icon:  any Lucide icon name → https://lucide.dev/icons/
 */
const TOOLS = [
  {
    id:    'md-converter',
    name:  'File → Markdown',
    desc:  'Convert .txt, .html, .csv, .json, .pdf, and .docx files to .md for use with LLMs.',
    icon:  'file-text',
    color: 'icon-blue',
    path:  './tools/md-converter/index.html',
    tags:  ['llm', 'files', 'markdown'],
    badge: 'new',
  },
  {
    id:    'json-formatter',
    name:  'JSON Formatter',
    desc:  'Format, validate, and explore JSON. Collapsible tree view with path copying.',
    icon:  'braces',
    color: 'icon-green',
    path:  './tools/json-formatter/index.html',
    tags:  ['json', 'format'],
    badge: 'soon',
  },
  {
    id:    'colors',
    name:  'Color Converter',
    desc:  'Convert between hex, rgb, hsl, and oklch. Pick, preview, and copy any format.',
    icon:  'pipette',
    color: 'icon-yellow',
    path:  './tools/colors/index.html',
    tags:  ['color', 'css', 'design'],
    badge: 'new',
  },
  {
    id:    'base64',
    name:  'Base64 Image Encoder',
    desc:  'Convert images to Base64 strings for embedding in HTML and CSS.',
    icon:  'image',
    color: 'icon-blue',
    path:  './tools/base64/index.html',
    tags:  ['encode', 'decode', 'base64', 'image'],
    badge: 'new',
  },
  {
    id:    'text-diff',
    name:  'Text Diff',
    desc:  'Side-by-side or inline diff of two blocks of text. Line and word level.',
    icon:  'diff',
    color: 'icon-green',
    path:  './tools/text-diff/index.html',
    tags:  ['diff', 'compare', 'text'],
    badge: 'soon',
  },
  {
    id:    'lorem',
    name:  'Lorem / Placeholder',
    desc:  'Generate Lorem Ipsum, random user data, and placeholder image URLs.',
    icon:  'text-cursor-input',
    color: 'icon-blue',
    path:  './tools/lorem/index.html',
    tags:  ['placeholder', 'lorem', 'gen'],
    badge: 'soon',
  },
  {
    id:    'animal-generator',
    name:  'Animal Generator',
    desc:  'Generate random animal names, facts, and images.',
    icon:  'paw-print',
    color: 'icon-green',
    path:  './tools/animal-generator/index.html',
    tags:  ['animals', 'generator', 'fun'],
    badge: 'new',
  },
  {
    id:    'uuid-generator',
    name:  'UUID Generator',
    desc:  'Generate random UUIDs of any version with copy and format options.',
    icon:  'hash',
    color: 'icon-yellow',
    path:  './tools/uuid-generator/index.html',
    tags:  ['uuid', 'generator', 'random'],
    badge: 'soon',
  },
];

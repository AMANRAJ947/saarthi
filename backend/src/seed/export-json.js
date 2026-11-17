// Writes data/schemes.json (array) so the dataset can also be loaded with mongoimport / Atlas UI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchemesFromExcel } from './excel.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const { schemes, errors } = await loadSchemesFromExcel(path.resolve(here, '../../data/Saarthi_MP_Schemes_Dataset.xlsx'));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const out = path.resolve(here, '../../data/schemes.json');
fs.writeFileSync(out, JSON.stringify(schemes, null, 2));
console.log(`Wrote ${schemes.length} schemes to ${out}`);

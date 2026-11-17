import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Scheme } from '../models/Scheme.js';
import { User } from '../models/User.js';
import { loadSchemesFromExcel } from './excel.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const fileArg = args.find((a) => a.endsWith('.xlsx'));
const file = fileArg ? path.resolve(fileArg) : path.resolve(here, '../../data/Saarthi_MP_Schemes_Dataset.xlsx');

async function run() {
  const { schemes, errors } = await loadSchemesFromExcel(file);
  const bySector = schemes.reduce((a, s) => ({ ...a, [s.sector]: (a[s.sector] || 0) + 1 }), {});
  console.log(`Read ${schemes.length} schemes from ${path.basename(file)}`, bySector);
  if (errors.length) { console.error('Fix these rows in the Excel file:\n - ' + errors.join('\n - ')); process.exit(1); }
  if (dry) { console.log('Dry run OK - nothing written to the database.'); return; }

  await connectDB();
  for (const s of schemes) {
    await Scheme.updateOne({ schemeCode: s.schemeCode }, { $set: s }, { upsert: true });
  }
  console.log(`Upserted ${schemes.length} schemes`);

  if (!(await User.findOne({ email: env.adminEmail }))) {
    await User.create({ name: 'Admin', email: env.adminEmail, role: 'admin', passwordHash: await User.hash(env.adminPassword) });
    console.log(`Admin created: ${env.adminEmail}`);
  }
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });

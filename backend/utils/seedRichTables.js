import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import Restaurant from '../models/Restaurant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_RICH_TABLES = [
  { tableId: 'Table 01', capacity: 2, section: 'Window', isAvailable: true },
  { tableId: 'Table 02', capacity: 2, section: 'Indoor', isAvailable: true },
  { tableId: 'Table 03', capacity: 4, section: 'Window', isAvailable: true },
  { tableId: 'Table 04', capacity: 4, section: 'Indoor', isAvailable: true },
  { tableId: 'Table 05', capacity: 4, section: 'AC', isAvailable: true },
  { tableId: 'Table 06', capacity: 6, section: 'Family', isAvailable: true },
  { tableId: 'Table 07', capacity: 6, section: 'AC', isAvailable: true },
  { tableId: 'Table 08', capacity: 8, section: 'Family', isAvailable: true },
  { tableId: 'Table 09', capacity: 4, section: 'Rooftop', isAvailable: true },
  { tableId: 'Table 10', capacity: 4, section: 'Outdoor', isAvailable: true },
];

async function run() {
  await connectDB();
  const restaurants = await Restaurant.find({});
  console.log(`Updating tables for ${restaurants.length} restaurants...`);

  for (const r of restaurants) {
    r.tables = DEFAULT_RICH_TABLES.map(t => ({ ...t }));
    await r.save();
    console.log(`[Tables Updated] ${r.name} -> 10 rich tables configured.`);
  }

  console.log('Successfully seeded rich tables for all restaurants!');
  process.exit(0);
}

run().catch(err => {
  console.error('[Error seeding tables]', err);
  process.exit(1);
});

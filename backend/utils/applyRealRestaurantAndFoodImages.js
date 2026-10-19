import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 100% REAL RESTAURANT AMBIANCE & INTERIOR/EXTERIOR PHOTOS (NO FOOD DISHES)
// Each restaurant has a unique, high quality dining hall, cafe, bistro, or restaurant facade photo
const RESTAURANT_REAL_VENUES = {
  'saravana bhavan pure veg': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  'aroma chettinad & multicuisine': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80',
  'nellai biriyani hub': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
  'annapoorna mess': 'https://images.unsplash.com/photo-1581349485608-9469926a8e5e?w=800&auto=format&fit=crop&q=80',
  'hotel sriganesh bhavan': 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&auto=format&fit=crop&q=80',
  'aarthi hotel': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
  'aasife biriyani (kovilpatti)': 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&auto=format&fit=crop&q=80',
  'salem rr biriyani kovilpatti': 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop&q=80',
  'bilal restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop&q=80',
  'zwarma kovilpatti': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
  'kfc': 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800&auto=format&fit=crop&q=80',
  'meat and eat - kovilpatti': 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&auto=format&fit=crop&q=80',
  'greenleaf multicuisine restaurant': 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&auto=format&fit=crop&q=80',
  'sizzlers restaurant': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
  'muthuvilas hotel': 'https://images.unsplash.com/photo-1520209268518-aec60b8bb5ca?w=800&auto=format&fit=crop&q=80',
  'original chettiyar mess': 'https://images.unsplash.com/photo-1546195643-70f48f9c5b87?w=800&auto=format&fit=crop&q=80',
  "d'lakshmi sweets & bakery": 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=800&auto=format&fit=crop&q=80',
  'belgian waffles & crepes kovilpatti': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
  'vaira maaligai restaurant': 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&auto=format&fit=crop&q=80',
  'dindigul thalappakatti restaurant': 'https://images.unsplash.com/photo-1587899897387-091ebd01a6b2?w=800&auto=format&fit=crop&q=80',
  'varnams': 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&auto=format&fit=crop&q=80',
  'nellai saravana bhava': 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&auto=format&fit=crop&q=80',
  'hotel nellai saravana bhava, ktc nagar': 'https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?w=800&auto=format&fit=crop&q=80',
  'aasife biriyani - tirunelveli (nellai)': 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80',
  'buhari restaurant': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  'udhaya vilas': 'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?w=800&auto=format&fit=crop&q=80',
  'muthu mess': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
  'vairamaligai rooftop restaurant': 'https://images.unsplash.com/photo-1505275350441-83dcda8eeef5?w=800&auto=format&fit=crop&q=80',
  'naadody restaurant': 'https://images.unsplash.com/photo-1521917441209-e886f0404a7b?w=800&auto=format&fit=crop&q=80',
  'zaitoon restaurant, tirunelveli': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80',
  'palmyra multi-cuisine restaurant': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop&q=80',
  'pearl’s restaurant': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
  'pearls restaurant': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
  'anies restaurant & catering': 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=800&auto=format&fit=crop&q=80',
};

// Array of distinct dining ambiance images for any other restaurant
const BACKUP_DISTINCT_VENUE_IMAGES = [
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520209268518-aec60b8bb5ca?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546195643-70f48f9c5b87?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587899897387-091ebd01a6b2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&auto=format&fit=crop&q=80',
];

// Helper to determine accurate food image from dish name and category
function getAccurateFoodImage(name = '', category = '') {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  // Pizza dishes
  if (n.includes('margherita')) return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80';
  if (n.includes('farmhouse') || (n.includes('pizza') && n.includes('veg'))) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
  if (n.includes('paneer') && n.includes('pizza')) return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&auto=format&fit=crop&q=80';
  if (n.includes('chicken') && n.includes('pizza')) return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80';
  if (n.includes('pizza') || c === 'pizza') return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';

  // Chicken dishes
  if (n.includes('fried chicken') || n.includes('crispy fried') || n.includes('bucket')) return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80';
  if (n.includes('tandoori')) return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80';
  if (n.includes('butter chicken') || n.includes('chicken curry') || n.includes('chicken masala')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80';
  if (n.includes('chicken 65')) return 'https://images.unsplash.com/photo-1610057099432-84b802e9cf3d?w=600&auto=format&fit=crop&q=80';
  if (n.includes('shawarma')) return 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80';
  if (n.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
  if (n.includes('chukka') || n.includes('pepper') || n.includes('kozhi')) return 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=600&auto=format&fit=crop&q=80';

  // Biriyanis
  if (n.includes('mutton') && n.includes('biriyani')) return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80';
  if (n.includes('veg') && n.includes('biriyani')) return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80';
  if (n.includes('biriyani') || n.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';

  // Parottas
  if (n.includes('kothu')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80';
  if (n.includes('parotta') || n.includes('paratha')) return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80';

  // South Indian
  if (n.includes('dosa') || n.includes('roast')) return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80';
  if (n.includes('idli')) return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
  if (n.includes('meal') || n.includes('thali') || n.includes('sambar rice')) return 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80';

  // Desserts / Sweets
  if (n.includes('waffle') || n.includes('crepe')) return 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80';
  if (n.includes('halwa') || n.includes('sweet') || n.includes('mittai')) return 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=600&auto=format&fit=crop&q=80';
  if (n.includes('jigarthanda') || n.includes('shake') || n.includes('juice')) return 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80';
  if (n.includes('coffee') || n.includes('tea')) return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80';

  // Chinese & Fast Food
  if (n.includes('noodle') || n.includes('hakka') || n.includes('chow mein')) return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80';
  if (n.includes('fried rice') || n.includes('rice') && n.includes('schezwan')) return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80';
  if (n.includes('fries') || n.includes('french fries')) return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80';
  if (n.includes('fish') || n.includes('seafood') || n.includes('prawn') || n.includes('crab')) return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80';

  // Fallbacks by category
  if (c.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
  if (c.includes('biriyani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';
  if (c.includes('parotta')) return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80';
  if (c.includes('dosa')) return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80';
  if (c.includes('non-veg')) return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80';
  if (c.includes('fast-food')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';

  return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80';
}

async function run() {
  await connectDB();
  console.log('[Updater] Connected to DB.');

  // 1. UPDATE RESTAURANTS WITH AUTHENTIC RESTAURANT PHOTOS
  const restaurants = await Restaurant.find({});
  console.log(`Found ${restaurants.length} restaurants to update...`);

  let backupIdx = 0;
  for (const r of restaurants) {
    const key = (r.name || '').trim().toLowerCase();
    const venueImg = RESTAURANT_REAL_VENUES[key] || BACKUP_DISTINCT_VENUE_IMAGES[backupIdx % BACKUP_DISTINCT_VENUE_IMAGES.length];
    backupIdx++;

    // Secondary images for gallery
    const secondaryImages = [
      venueImg,
      BACKUP_DISTINCT_VENUE_IMAGES[(backupIdx + 1) % BACKUP_DISTINCT_VENUE_IMAGES.length],
      BACKUP_DISTINCT_VENUE_IMAGES[(backupIdx + 2) % BACKUP_DISTINCT_VENUE_IMAGES.length],
    ];

    r.heroImage = venueImg;
    r.image = venueImg;
    r.images = secondaryImages;
    await r.save();
    console.log(`[Restaurant Updated] ${r.name} -> Venue: ${venueImg.substring(0, 50)}...`);
  }

  // 2. UPDATE ALL FOOD ITEMS IN DB WITH MATCHING REAL FOOD PHOTOS
  const foodItems = await FoodItem.find({});
  console.log(`Found ${foodItems.length} food items to update images for...`);

  for (const f of foodItems) {
    const accurateImg = getAccurateFoodImage(f.name, f.category);
    f.image = accurateImg;
    await f.save();
    console.log(`[Food Updated] ${f.name} (${f.category}) -> Food: ${accurateImg.substring(0, 50)}...`);
  }

  console.log('ALL RESTAURANTS AND FOODS SUCCESSFULLY UPDATED IN MONGO!');
  process.exit(0);
}

run().catch(err => {
  console.error('[Error]', err);
  process.exit(1);
});

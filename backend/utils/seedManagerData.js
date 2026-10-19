import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import TableBooking from '../models/TableBooking.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const seedManagerData = async () => {
  try {
    await connectDB();

    console.log('[SeedManager] Initializing Manager data & scoping to Nellai Biriyani Hub...');

    // 1. Find or verify Nellai Biriyani Hub
    let restaurant = await Restaurant.findOne({ slug: 'nellai-biriyani-hub' });
    if (!restaurant) {
      restaurant = await Restaurant.findOne();
    }

    if (!restaurant) {
      console.error('[SeedManager] No restaurant found in database to associate manager with.');
      return;
    }

    const restaurantId = restaurant._id.toString();
    console.log(`[SeedManager] Target Restaurant: ${restaurant.name} (${restaurantId})`);

    // Ensure restaurant has proper table layout
    if (!restaurant.tables || restaurant.tables.length === 0) {
      restaurant.tables = [
        { tableId: 'Table 01', capacity: 2, section: 'Indoor', isAvailable: true },
        { tableId: 'Table 02', capacity: 4, section: 'AC', isAvailable: true },
        { tableId: 'Table 03', capacity: 4, section: 'Window', isAvailable: false },
        { tableId: 'Table 04', capacity: 6, section: 'Family', isAvailable: true },
        { tableId: 'Table 05', capacity: 8, section: 'Family', isAvailable: true },
        { tableId: 'Table 06', capacity: 4, section: 'AC', isAvailable: true },
      ];
      await restaurant.save();
    }

    // 2. Associate manager@zestro.com with this restaurant
    const managerUser = await User.findOne({ email: 'manager@zestro.com' });
    if (managerUser) {
      managerUser.name = 'Dheiva (Manager)';
      managerUser.fullName = 'Dheiva';
      managerUser.restaurantId = restaurantId;
      managerUser.role = 'restaurantManager';
      await managerUser.save();
      console.log(`[SeedManager] Assigned manager ${managerUser.email} (Dheiva) to restaurant ${restaurant.name}`);
    }

    // 3. Seed menu items for this restaurant if less than 8 items
    const existingFoods = await FoodItem.find({ restaurantId: restaurant._id });
    if (existingFoods.length < 8) {
      const dishesToSeed = [
        {
          name: 'Seeraga Samba Chicken Biriyani',
          slug: 'seeraga-samba-chicken-biriyani',
          category: 'Biriyani',
          price: 260,
          originalPrice: 290,
          description: 'Aromatic short-grain Seeraga Samba rice slow-cooked with tender country chicken & native spices.',
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
          isVeg: false,
          isBestseller: true,
          isAvailable: true,
          rating: 4.9,
          calories: 550,
        },
        {
          name: 'Nellai Special Mutton Dum Biriyani',
          slug: 'nellai-special-mutton-dum-biriyani',
          category: 'Biriyani',
          price: 360,
          originalPrice: 400,
          description: 'Authentic Tirunelveli spiced tender mutton cooked on charcoal dum with golden ghee essence.',
          image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
          isVeg: false,
          isBestseller: true,
          isAvailable: true,
          rating: 5.0,
          calories: 680,
        },
        {
          name: 'Kovilpatti Bun Parotta (2 Pcs)',
          slug: 'kovilpatti-bun-parotta',
          category: 'Breads & Tiffin',
          price: 70,
          originalPrice: 85,
          description: 'Crispy flaky puffed multi-layered bun parotta served with spicy empty salna.',
          image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80',
          isVeg: true,
          isBestseller: true,
          isAvailable: true,
          rating: 4.8,
          calories: 380,
        },
        {
          name: 'Nattu Kozhi Pepper Chukka',
          slug: 'nattu-kozhi-pepper-chukka',
          category: 'Starters',
          price: 240,
          originalPrice: 270,
          description: 'Free-range country chicken stir-fried with freshly crushed black peppercorns and curry leaves.',
          image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=80',
          isVeg: false,
          isBestseller: false,
          isAvailable: true,
          rating: 4.7,
          calories: 420,
        },
        {
          name: 'Crispy Chicken 65 Boneless',
          slug: 'crispy-chicken-65-boneless',
          category: 'Starters',
          price: 190,
          originalPrice: 220,
          description: 'Deep-fried golden chicken bites marinated in ginger, garlic, Kashmiri chilli, and lemon.',
          image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80',
          isVeg: false,
          isBestseller: true,
          isAvailable: true,
          rating: 4.8,
          calories: 450,
        },
        {
          name: 'Ghee Podi Roast Dosa',
          slug: 'ghee-podi-roast-dosa',
          category: 'Breads & Tiffin',
          price: 110,
          originalPrice: 130,
          description: 'Crispy fermented rice-lentil crepe smeared with artisanal gunpowder spices and pure melted ghee.',
          image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80',
          isVeg: true,
          isBestseller: false,
          isAvailable: true,
          rating: 4.6,
          calories: 340,
        },
        {
          name: 'Tirunelveli Wheat Halwa (250g)',
          slug: 'tirunelveli-wheat-halwa',
          category: 'Desserts',
          price: 140,
          originalPrice: 160,
          description: 'World-famous authentic fermented wheat milk halwa cooked with pure cow ghee and cashews.',
          image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
          isVeg: true,
          isBestseller: true,
          isAvailable: true,
          rating: 5.0,
          calories: 490,
        },
        {
          name: 'Traditional Jigarthanda Special',
          slug: 'traditional-jigarthanda-special',
          category: 'Beverages',
          price: 90,
          originalPrice: 100,
          description: 'Cooling royal beverage crafted with badam pisin, nannari syrup, basundi milk and ice cream.',
          image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80',
          isVeg: true,
          isBestseller: false,
          isAvailable: false, // Set one unavailable so manager can test toggle!
          rating: 4.8,
          calories: 310,
        },
      ];

      for (const item of dishesToSeed) {
        const exists = await FoodItem.findOne({ slug: item.slug, restaurantId: restaurant._id });
        if (!exists) {
          await FoodItem.create({
            ...item,
            restaurantId: restaurant._id,
          });
          console.log(`[SeedManager] Created dish: ${item.name}`);
        }
      }
    }

    // 4. Seed real orders for Nellai Biriyani Hub if less than 5 orders
    const existingOrders = await Order.find({ restaurantId });
    if (existingOrders.length < 5) {
      const sampleOrders = [
        {
          orderNumber: 'ORD-781290-341',
          customerName: 'Priya Sharma',
          customerPhone: '+91 98451 23456',
          customerEmail: 'priya@example.com',
          restaurantId,
          deliveryAddress: {
            addressLine: '12B Green Valley, 100ft Road',
            city: 'Kovilpatti',
            pincode: '628501',
          },
          items: [
            { name: 'Seeraga Samba Chicken Biriyani', price: 260, quantity: 2 },
            { name: 'Crispy Chicken 65 Boneless', price: 190, quantity: 1 },
          ],
          subtotal: 710,
          deliveryFee: 0,
          tax: 36,
          discount: 50,
          totalAmount: 696,
          paymentMethod: 'UPI',
          paymentStatus: 'Completed',
          orderStatus: 'Preparing',
          kitchenStatus: 'Preparing',
          createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
        },
        {
          orderNumber: 'ORD-781304-892',
          customerName: 'Karthik Raja',
          customerPhone: '+91 98234 56789',
          customerEmail: 'karthik@example.com',
          restaurantId,
          deliveryAddress: {
            addressLine: '88 Diamond District, Main Bazaar',
            city: 'Kovilpatti',
            pincode: '628502',
          },
          items: [
            { name: 'Nellai Special Mutton Dum Biriyani', price: 360, quantity: 1 },
            { name: 'Kovilpatti Bun Parotta (2 Pcs)', price: 70, quantity: 2 },
          ],
          subtotal: 500,
          deliveryFee: 0,
          tax: 25,
          discount: 0,
          totalAmount: 525,
          paymentMethod: 'Card',
          paymentStatus: 'Completed',
          orderStatus: 'Ready',
          kitchenStatus: 'Ready',
          createdAt: new Date(Date.now() - 40 * 60 * 1000), // 40 mins ago
        },
        {
          orderNumber: 'ORD-781318-105',
          customerName: 'Rahul Verma',
          customerPhone: '+91 98765 43210',
          customerEmail: 'rahul@example.com',
          restaurantId,
          deliveryAddress: {
            addressLine: 'Flat 4A, Orchid Towers, New Colony',
            city: 'Kovilpatti',
            pincode: '628501',
          },
          items: [
            { name: 'Nattu Kozhi Pepper Chukka', price: 240, quantity: 1 },
            { name: 'Kovilpatti Bun Parotta (2 Pcs)', price: 70, quantity: 3 },
            { name: 'Tirunelveli Wheat Halwa (250g)', price: 140, quantity: 1 },
          ],
          subtotal: 590,
          deliveryFee: 0,
          tax: 30,
          discount: 40,
          totalAmount: 580,
          paymentMethod: 'UPI',
          paymentStatus: 'Completed',
          orderStatus: 'Delivered',
          kitchenStatus: 'Ready',
          createdAt: new Date(Date.now() - 110 * 60 * 1000), // 1.8 hrs ago
        },
        {
          orderNumber: 'ORD-781329-712',
          customerName: 'Ananya Patel',
          customerPhone: '+91 97123 45678',
          customerEmail: 'ananya@example.com',
          restaurantId,
          deliveryAddress: {
            addressLine: 'Lake View Residency, Gandhi Road',
            city: 'Kovilpatti',
            pincode: '628503',
          },
          items: [
            { name: 'Seeraga Samba Chicken Biriyani', price: 260, quantity: 1 },
            { name: 'Ghee Podi Roast Dosa', price: 110, quantity: 1 },
          ],
          subtotal: 370,
          deliveryFee: 30,
          tax: 19,
          discount: 0,
          totalAmount: 419,
          paymentMethod: 'UPI',
          paymentStatus: 'Completed',
          orderStatus: 'Confirmed',
          kitchenStatus: 'Waiting',
          createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
        },
        {
          orderNumber: 'ORD-781335-950',
          customerName: 'Vikram Singh',
          customerPhone: '+91 99887 76655',
          customerEmail: 'vikram@example.com',
          restaurantId,
          deliveryAddress: {
            addressLine: 'Heritage Enclave, Railway Feeder Road',
            city: 'Kovilpatti',
            pincode: '628501',
          },
          items: [
            { name: 'Nellai Special Mutton Dum Biriyani', price: 360, quantity: 2 },
          ],
          subtotal: 720,
          deliveryFee: 0,
          tax: 36,
          discount: 70,
          totalAmount: 686,
          paymentMethod: 'COD',
          paymentStatus: 'Pending',
          orderStatus: 'Placed',
          kitchenStatus: 'Waiting',
          createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3 mins ago
        },
      ];

      // Insert customer ID from existing user or fallback
      const cust = await User.findOne({ role: 'customer' });
      for (const ord of sampleOrders) {
        ord.customerId = cust?._id || new mongoose.Types.ObjectId();
        await Order.create(ord);
        console.log(`[SeedManager] Created real order: ${ord.orderNumber} (₹${ord.totalAmount})`);
      }
    }

    // 5. Seed genuine customer reviews for Nellai Biriyani Hub
    const existingReviews = await Review.find({ restaurantId: { $in: [restaurant._id, restaurantId] } });
    if (existingReviews.length < 3) {
      const cust = await User.findOne({ role: 'customer' });
      const sampleReviews = [
        {
          userId: cust?._id || new mongoose.Types.ObjectId(),
          userName: 'Priya Sharma',
          restaurantId: restaurant._id,
          rating: 5,
          comment: 'The Seeraga Samba Biriyani is unbelievable! Super authentic aroma, perfectly cooked tender chicken pieces, and the salna pairing was unmatched. Best dining in town!',
          isVerifiedPurchase: true,
          createdAt: new Date(Date.now() - 2 * 86400 * 1000),
        },
        {
          userId: cust?._id || new mongoose.Types.ObjectId(),
          userName: 'Karthik Raja',
          restaurantId: restaurant._id,
          rating: 5,
          comment: 'Bun parotta is piping hot and flaky crisp. Mutton dum biriyani had rich flavors without being overly oily. Quick table service and spotless ambiance.',
          isVerifiedPurchase: true,
          createdAt: new Date(Date.now() - 4 * 86400 * 1000),
          managerReply: {
            comment: 'Thank you Karthik! Delighted that you relished our traditional firewood dum biriyani and bun parottas. Looking forward to welcoming you back!',
            repliedAt: new Date(Date.now() - 3 * 86400 * 1000),
            repliedBy: 'Dheiva (Manager)',
          },
        },
        {
          userId: cust?._id || new mongoose.Types.ObjectId(),
          userName: 'Ananya Patel',
          restaurantId: restaurant._id,
          rating: 4,
          comment: 'Delicious food and generous portions. The Tirunelveli wheat halwa was mouthwatering. Peak dinner rush had a 10 min table wait, but worth it.',
          isVerifiedPurchase: true,
          createdAt: new Date(Date.now() - 1 * 86400 * 1000),
        },
      ];

      for (const rev of sampleReviews) {
        await Review.create(rev);
        console.log(`[SeedManager] Created customer review by ${rev.userName}`);
      }
    }

    console.log('[SeedManager] Completed! All Manager database dependencies successfully prepared.');
  } catch (error) {
    console.error('[SeedManager] Error:', error.message);
  }
};

if (process.argv[1]?.endsWith('seedManagerData.js')) {
  (async () => {
    await seedManagerData();
    process.exit(0);
  })();
}

export default seedManagerData;

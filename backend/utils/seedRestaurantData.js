import Restaurant from '../models/Restaurant.js';
import Category from '../models/Category.js';
import FoodItem from '../models/FoodItem.js';
import Coupon from '../models/Coupon.js';

export const seedRestaurantData = async () => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const categories = [
        { name: 'South Indian', slug: 'south-indian', icon: '🍛', displayOrder: 1 },
        { name: 'Biriyani', slug: 'biriyani', icon: '🍚', displayOrder: 2 },
        { name: 'Parotta', slug: 'parotta', icon: '🫓', displayOrder: 3 },
        { name: 'Dosa Specials', slug: 'dosa', icon: '🥞', displayOrder: 4 },
        { name: 'Chinese & Fast Food', slug: 'chinese', icon: '🥡', displayOrder: 5 },
        { name: 'Desserts & Juices', slug: 'desserts', icon: '🍮', displayOrder: 6 },
      ];
      await Category.insertMany(categories);
      console.log('[Seed] Categories seeded successfully');
    }

    const restaurantCount = await Restaurant.countDocuments();
    if (restaurantCount === 0) {
      const restaurants = [
        {
          name: 'Aroma Chettinad & Multicuisine',
          slug: 'aroma-chettinad',
          tagline: 'Authentic Kovilpatti & Chettinad flavours',
          cuisineType: ['Chettinad', 'South Indian', 'Biriyani'],
          address: { street: 'Main Road', area: 'Gandhi Nagar', city: 'Kovilpatti', state: 'Tamil Nadu', pincode: '628501' },
          phone: '+91 94431 22334',
          email: 'aroma@zestro.com',
          rating: 4.8,
          totalReviews: 124,
          priceRange: '₹₹',
          isPureVeg: false,
          isFeatured: true,
          tables: [
            { tableId: 'Table 01', capacity: 2, section: 'Indoor', isAvailable: true },
            { tableId: 'Table 02', capacity: 4, section: 'Family', isAvailable: true },
            { tableId: 'Table 03', capacity: 6, section: 'AC', isAvailable: true },
            { tableId: 'Table 04', capacity: 4, section: 'Rooftop', isAvailable: true },
          ],
        },
        {
          name: 'Saravana Bhavan Pure Veg',
          slug: 'saravana-bhavan-veg',
          tagline: 'Pure ghee roasts and filter coffee',
          cuisineType: ['South Indian', 'Pure Veg', 'Tiffin'],
          address: { street: 'Bazaar Street', area: 'Old Bus Stand', city: 'Kovilpatti', state: 'Tamil Nadu', pincode: '628501' },
          phone: '+91 94432 55667',
          email: 'saravana@zestro.com',
          rating: 4.7,
          totalReviews: 89,
          priceRange: '₹',
          isPureVeg: true,
          isFeatured: true,
          tables: [
            { tableId: 'Table 01', capacity: 2, section: 'Indoor', isAvailable: true },
            { tableId: 'Table 02', capacity: 4, section: 'Indoor', isAvailable: true },
            { tableId: 'Table 03', capacity: 6, section: 'Family', isAvailable: true },
          ],
        },
        {
          name: 'Nellai Biriyani Hub',
          slug: 'nellai-biriyani-hub',
          tagline: 'Seeraga Samba Mutton & Chicken Biriyani',
          cuisineType: ['Biriyani', 'Mughlai', 'Starters'],
          address: { street: 'Trivandrum Road', area: 'Vannarpettai', city: 'Tirunelveli', state: 'Tamil Nadu', pincode: '627003' },
          phone: '+91 94861 99001',
          email: 'nellai.biriyani@zestro.com',
          rating: 4.9,
          totalReviews: 210,
          priceRange: '₹₹₹',
          isPureVeg: false,
          isFeatured: true,
          tables: [
            { tableId: 'Table 01', capacity: 4, section: 'AC', isAvailable: true },
            { tableId: 'Table 02', capacity: 4, section: 'Indoor', isAvailable: true },
            { tableId: 'Table 03', capacity: 8, section: 'Family', isAvailable: true },
          ],
        },
      ];

      const inserted = await Restaurant.insertMany(restaurants);
      console.log('[Seed] Sample restaurants seeded successfully');

      // Seed food items linked to restaurants
      const foodItems = [
        {
          name: 'Kovilpatti Special Bun Parotta',
          slug: 'bun-parotta',
          price: 60,
          originalPrice: 70,
          category: 'Parotta',
          restaurantId: inserted[0]._id,
          isVeg: false,
          isBestseller: true,
          description: 'Fluffy layered bun parotta served with spicy salna.',
        },
        {
          name: 'Seeraga Samba Chicken Biriyani',
          slug: 'seeraga-samba-chicken-biriyani',
          price: 240,
          originalPrice: 280,
          category: 'Biriyani',
          restaurantId: inserted[2]._id,
          isVeg: false,
          isBestseller: true,
          description: 'Authentic fragrant Seeraga Samba rice with tender chicken, boiled egg, and onion raita.',
        },
        {
          name: 'Ghee Roast Dosa',
          slug: 'ghee-roast-dosa',
          price: 90,
          originalPrice: 100,
          category: 'South Indian',
          restaurantId: inserted[1]._id,
          isVeg: true,
          isBestseller: true,
          description: 'Crispy golden crepe roasted in pure cow ghee with 3 chutneys & sambar.',
        },
        {
          name: 'Chettinad Chicken Chukka',
          slug: 'chettinad-chicken-chukka',
          price: 190,
          originalPrice: 220,
          category: 'South Indian',
          restaurantId: inserted[0]._id,
          isVeg: false,
          isBestseller: true,
          description: 'Dry roasted chicken with freshly ground pepper and shallots.',
        },
      ];
      await FoodItem.insertMany(foodItems);
      console.log('[Seed] Sample food items seeded successfully');
    }

    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      await Coupon.create({
        code: 'ZESTRO50',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        minOrderAmount: 200,
        maxDiscount: 100,
        validUntil: new Date('2028-12-31'),
        isActive: true,
      });
      await Coupon.create({
        code: 'FLAT100',
        discountType: 'FLAT',
        discountValue: 100,
        minOrderAmount: 499,
        validUntil: new Date('2028-12-31'),
        isActive: true,
      });
      console.log('[Seed] Default coupons seeded successfully');
    }
  } catch (error) {
    console.warn('[Seed] Restaurant data seed skipped:', error.message);
  }
};

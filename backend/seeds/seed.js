require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../src/config/db");

const CATS = [
  { name:"Electronics",   slug:"electronics",  emoji:"💻", sort:1 },
  { name:"Clothing",      slug:"clothing",     emoji:"👕", sort:2 },
  { name:"Home & Living", slug:"home-living",  emoji:"🏠", sort:3 },
  { name:"Sports",        slug:"sports",       emoji:"⚽", sort:4 },
  { name:"Books",         slug:"books",        emoji:"📚", sort:5 },
  { name:"Beauty",        slug:"beauty",       emoji:"✨", sort:6 },
];

const USERS = [
  { email:"alici@demo.com",  name:"Demo Buyer",  role:"customer", pwd:"Demo1234" },
  { email:"satici@demo.com", name:"Demo Seller", role:"seller",   pwd:"Demo1234" },
];

// [name, slug, price, disc, stock, emoji, tag, rating, reviews, desc]
const PRODS = [
  ["Wireless Earbuds Pro","electronics",1299,0,45,"🎧","Best Seller",4.8,234,"40-hour battery, noise cancellation"],
  ["Smart Watch Series 5","electronics",2499,0,30,"⌚","New",4.6,187,"GPS, heart rate, sleep tracking"],
  ["Bluetooth Speaker","electronics",799,15,80,"🔊",null,4.5,312,"360° sound, IPX7 waterproof"],
  ["Tablet 10.9-inch","electronics",5999,20,20,"📱","Sale",4.7,98,"2K display, 8-core processor"],
  ["Mechanical Keyboard RGB","electronics",1599,0,60,"⌨️","Best Seller",4.9,445,"Cherry MX switches, full RGB lighting"],
  ["Gaming Mouse 16000 DPI","electronics",649,0,75,"🖱️",null,4.7,278,"6 buttons, 16000 DPI"],
  ["USB-C Hub 7-in-1","electronics",449,10,120,"🔌",null,4.4,156,"4K HDMI, 3x USB-A, SD card reader"],
  ["Webcam 4K Ultra HD","electronics",1199,0,35,"📸","New",4.6,89,"Automatic light correction"],
  ["Power Bank 20000mAh","electronics",599,0,200,"🔋",null,4.5,523,"65W PD fast charging"],
  ["Smart Bulb Set of 4","electronics",349,0,150,"💡",null,4.3,201,"16M colors, voice control"],
  ["Premium Cotton T-Shirt","clothing",299,0,300,"👕",null,4.5,567,"100% organic cotton"],
  ["Slim Fit Jeans","clothing",799,0,180,"👖","Best Seller",4.6,342,"High-waisted with elastane"],
  ["Oversized Fleece Sweatshirt","clothing",549,0,140,"🧥",null,4.7,234,"Unisex, brushed interior"],
  ["Classic Oxford Shirt","clothing",699,15,100,"👔",null,4.8,189,"Non-iron fabric"],
  ["Compression Running Tights","clothing",449,0,160,"🩱",null,4.4,312,"UV protection"],
  ["Linen Summer Dress","clothing",849,0,90,"👗","New",4.6,178,"Breathable linen"],
  ["Unisex Bomber Jacket","clothing",1299,0,70,"🧶",null,4.7,145,"Water-repellent, 2 inner pockets"],
  ["Quick-Dry Sports Shorts","clothing",329,20,250,"🩳",null,4.3,423,"4-way stretch"],
  ["Premium Beige Trench Coat","clothing",2499,0,40,"🪡","Premium",4.9,87,"Cashmere blend"],
  ["Cashmere Sweater","clothing",1199,0,55,"🧣",null,4.7,156,"100% Mongolian cashmere"],
  ["Wooden Coffee Table","home-living",1899,0,25,"🪑",null,4.8,123,"Solid oak, Scandinavian design"],
  ["Bamboo Kitchen Utensil Set","home-living",649,0,110,"🥄","Best Seller",4.6,234,"6 pieces, natural bamboo"],
  ["Decorative Candle Set of 6","home-living",249,0,200,"🕯️",null,4.7,456,"Soy-based, 40 hours"],
  ["Ceramic Coffee Cup Set","home-living",499,0,80,"☕","Premium",4.9,312,"Handmade, set of 6"],
  ["Macrame Wall Decor","home-living",399,0,60,"🎨","New",4.5,178,"Handwoven, 60x40cm"],
  ["Steel Pot Set, 5 Pieces","home-living",2199,10,30,"🥘",null,4.8,89,"18/10 stainless steel"],
  ["Organic Cotton Duvet Cover","home-living",899,0,70,"🛏️",null,4.7,201,"OEKO-TEX certified"],
  ["Glass Jar Set of 12","home-living",349,0,180,"🫙",null,4.4,345,"Airtight lid"],
  ["Wall Shelving System","home-living",1499,0,0,"📐",null,4.6,67,"Modular, 30 kg capacity"],
  ["Aroma Diffuser + 3 Oils","home-living",699,0,90,"🌿","Best Seller",4.8,289,"Ultrasonic, 500ml"],
  ["Yoga Mat 6mm Pro","sports",599,0,130,"🧘","Best Seller",4.7,456,"TPE, non-slip"],
  ["Dumbbell Set 5-20kg","sports",2999,0,15,"🏋️",null,4.8,123,"Rubber coating"],
  ["Lightweight Running Shoes","sports",1899,0,85,"👟","New",4.6,234,"React foam sole"],
  ["Lightweight Bike Helmet","sports",799,15,50,"🚴",null,4.7,167,"MIPS protection, 250g"],
  ["Protein Shaker 700ml","sports",199,0,400,"🥤",null,4.5,678,"Leak-proof, BPA free"],
  ["Resistance Band Set of 5","sports",349,25,220,"💪","Sale",4.6,345,"5 resistance levels"],
  ["Carbon Tennis Racket","sports",1299,0,40,"🎾",null,4.8,89,"Carbon fiber, 300g"],
  ["Sports Bag 40L","sports",699,0,75,"🎒",null,4.5,234,"Waterproof base"],
  ["Smart Wi-Fi Scale","sports",499,0,60,"⚖️",null,4.4,312,"13 measurements, Wi-Fi"],
  ["Speed Jump Rope","sports",249,0,300,"🪢","Best Seller",4.7,523,"Steel cable, ball bearings"],
  ["Atomic Habits","books",149,0,500,"📖","Bestseller",4.9,1234,"James Clear"],
  ["Deep Work","books",129,0,350,"📕",null,4.8,876,"Cal Newport"],
  ["Sapiens","books",159,0,600,"📗","Bestseller",4.9,2341,"Yuval Noah Harari"],
  ["The Art of War","books",99,0,280,"📘",null,4.7,567,"Sun Tzu"],
  ["The Little Prince","books",79,0,800,"📙",null,4.9,3456,"Antoine de Saint-Exupéry"],
  ["The Power of Your Subconscious Mind","books",139,0,420,"📚","Best Seller",4.8,1678,"Joseph Murphy"],
  ["Natural Argan Oil Serum","beauty",449,0,120,"✨","Organic",4.8,234,"Cold-pressed, 100% pure"],
  ["Collagen Moisturizing Cream","beauty",599,0,90,"🧴",null,4.7,178,"Marine collagen, hyaluronic acid"],
  ["Sunscreen SPF50+","beauty",299,0,200,"☀️","Best Seller",4.9,456,"PA++++, lightweight texture"],
  ["Hair Care Set of 4","beauty",849,0,65,"💆","New",4.6,123,"Shampoo + conditioner + mask + serum"],
  ["Electric Facial Cleanser","beauty",1299,20,40,"🫧",null,4.7,89,"Silicone bristles, 3 modes"],
  ["Lip Care Collection","beauty",199,0,310,"💋",null,4.5,312,"6-shade lipstick set"],
  ["Eau de Parfum 50ml","beauty",1599,0,35,"🌹","Premium",4.8,167,"Woody-floral"],
  ["Body Lotion Set of 3","beauty",399,0,160,"🧼",null,4.6,234,"Shea butter based"],
];

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const catMap = {};
    for (const c of CATS) {
      const { rows } = await client.query(
        `INSERT INTO categories(name,slug,emoji,sort_order)
         VALUES($1,$2,$3,$4)
         ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name
         RETURNING id`,
        [c.name, c.slug, c.emoji, c.sort]
      );
      catMap[c.slug] = rows[0].id;
    }
    console.log("✅ Categories added");

    for (const u of USERS) {
      const hash = await bcrypt.hash(u.pwd, 12);
      await client.query(
        `INSERT INTO users(email,name,password_hash,role)
         VALUES($1,$2,$3,$4)
         ON CONFLICT(email) DO UPDATE SET role=EXCLUDED.role`,
        [u.email, u.name, hash, u.role]
      );
      console.log(`✅ User (${u.role}): ${u.email}`);
    }

    let n = 0;
    for (const [name, slug, price, disc, stock, emoji, tag, rating, reviews, desc] of PRODS) {
      await client.query(
        `INSERT INTO products(category_id,name,description,price,discount,stock,emoji,tag,rating,review_count)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT DO NOTHING`,
        [catMap[slug], name, desc, price, disc, stock, emoji, tag, rating, reviews]
      );
      n++;
    }
    console.log(`✅ ${n} products added`);

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete!");
    console.log("   Buyer : alici@demo.com  / Demo1234");
    console.log("   Seller: satici@demo.com / Demo1234");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ Seed error:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();

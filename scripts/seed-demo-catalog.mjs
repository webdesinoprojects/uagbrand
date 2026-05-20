import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env");
const env = loadEnv(envPath);
const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

if (process.env.NODE_ENV === "production" && env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Refusing to seed demo catalog while NODE_ENV=production.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const brandSeeds = [
  ["oneplus", "OnePlus", "Premium audio", "/assets/brand-logos/oneplus-logo.svg"],
  ["boat", "boAt", "Bass favorites", "/assets/brand-logos/boat-logo.svg"],
  ["redmi", "Redmi", "Value picks", "/assets/brand-logos/redmi-logo.svg"],
  ["realme", "Realme", "Youth deals", "/assets/brand-logos/realme-logo.svg"],
  ["noise", "Noise", "Watch and audio", "/assets/brand-logos/noise-logo.svg"],
  ["ptron", "PTron", "Budget audio", "/assets/brand-logos/ptron-logo.svg"],
  ["ubon", "Ubon", "Accessories", "/assets/brand-logos/ubon-logo.svg"],
  ["go-boult", "Go Boult", "Audio picks", "/assets/brand-logos/go-boult-logo.svg"],
  ["boult-audio", "Boult Audio", "TWS deals", "/assets/brand-logos/boult-audio-logo.svg"],
  ["jbl", "JBL", "Speakers", "/assets/brand-logos/jbl-logo.svg"],
  ["zebronics", "Zebronics", "Daily tech", "/assets/brand-logos/zebronics-logo.svg"],
  ["motorola", "Motorola", "Mobile gear", "/assets/brand-logos/motorola-logo.svg"],
  ["sony", "Sony", "Audio quality", "/assets/brand-logos/sony-logo.svg"],
  ["ambrane", "Ambrane", "Power deals", "/assets/brand-logos/ambrane-logo.svg"],
  ["urbn", "URBN", "Chargers", "/assets/brand-logos/urbn-logo.svg"],
  ["syska", "SYSKA", "Daily electronics", "/assets/brand-logos/syska-logo.svg"],
  ["philips", "Philips", "Audio basics", "/assets/brand-logos/philips-logo.svg"],
  ["amazon-basics", "Amazon Basics", "Essentials", "/assets/brand-logos/amazon-basics-logo.svg"],
].map(([slug, name, deal, logo], index) => ({
  slug,
  name,
  deal,
  logo,
  sortOrder: index + 1,
}));

const categorySeeds = [
  {
    slug: "earbuds",
    name: "True Wireless Earbuds",
    shortName: "Earbuds",
    description: "Compact TWS picks for calls, music and daily travel.",
    image: "/assets/category-icons/earbuds.svg",
    gif: "/assets/category-gifs/earbuds.gif",
    products: [
      ["boat-airdopes-131", "boAt Airdopes 131", "boat", "New Launch", "60H Playback", 899, 2990],
      ["redmi-buds-6-active", "Redmi Buds 6 Active", "redmi", "Top Pick", "30H Playback", 1299, 2999],
      ["realme-buds-air-6", "realme Buds Air 6", "realme", "Fresh Drop", "ANC Ready", 2799, 5999],
    ],
  },
  {
    slug: "neckband",
    name: "Neckband",
    shortName: "Neckband",
    description: "Long battery audio for work and commute.",
    image: "/assets/category-icons/neckband.svg",
    gif: "/assets/category-gifs/neckband.gif",
    products: [
      ["boat-rockerz-245-v2-pro", "boAt Rockerz 245 V2 Pro", "boat", "Deal live", "30H Battery", 1599, 3490],
      ["oneplus-bullets-z3", "OnePlus Bullets Z3", "oneplus", "Top Deal", "44H Battery", 1999, 3999],
      ["ptron-neckwave-pro", "PTron Neckwave Pro", "ptron", "Budget Pick", "Fast Charge", 799, 1999],
    ],
  },
  {
    slug: "power-bank",
    name: "Power Bank",
    shortName: "Power Bank",
    description: "Backup charging for phones and accessories.",
    image: "/assets/category-icons/power-bank.svg",
    gif: "/assets/category-gifs/watch.gif",
    products: [
      ["ambrane-powerlit-10000", "Ambrane Powerlit 10000", "ambrane", "Fast Delivery", "10000mAh Battery", 1599, 2999],
      ["urbn-nano-10000", "URBN Nano 10000", "urbn", "Pocket Size", "22.5W Output", 1299, 2499],
      ["syska-power-core", "SYSKA Power Core", "syska", "Daily Power", "Dual Output", 999, 1999],
    ],
  },
  {
    slug: "smart-watch",
    name: "Smart Watch",
    shortName: "Watch",
    description: "Fitness, calls and daily notifications on wrist.",
    image: "/assets/category-icons/smart-watch.svg",
    gif: "/assets/category-gifs/watch.gif",
    products: [
      ["boat-wave-sigma", "boAt Wave Sigma", "boat", "New Launch", "Bluetooth Calling", 1999, 7499],
      ["noise-colorfit-pro-daily", "Noise ColorFit Pro Daily", "noise", "Watch Deal", "AMOLED Display", 2799, 6999],
      ["fire-track-fit-watch", "Track Fit Calling Watch", "realme", "Fitness Pick", "7 Day Battery", 2499, 5999],
    ],
  },
  {
    slug: "wireless-headphones",
    name: "Wireless Headphones",
    shortName: "Headphones",
    description: "Over-ear comfort with larger drivers.",
    image: "/assets/category-icons/wireless-headphones.svg",
    gif: "/assets/category-gifs/neckband.gif",
    products: [
      ["sony-wh-ch520", "Sony WH-CH520", "sony", "Premium Pick", "50H Battery", 3999, 5990],
      ["jbl-tune-520bt", "JBL Tune 520BT", "jbl", "Room Sound", "Pure Bass", 3499, 5499],
      ["boult-crown-headphones", "Boult Crown Headphones", "boult-audio", "Bass Pick", "Low Latency", 2199, 4999],
    ],
  },
  {
    slug: "wired-earphones",
    name: "Wired Earphones",
    shortName: "Wired",
    description: "Reliable plug-in audio without battery concern.",
    image: "/assets/category-icons/wired-earphones.svg",
    gif: "/assets/category-gifs/earbuds.gif",
    products: [
      ["boat-bassheads-100", "boAt BassHeads 100", "boat", "Classic", "10mm Drivers", 399, 999],
      ["philips-wired-daily", "Philips Wired Daily", "philips", "Clear Calls", "Inline Mic", 499, 1299],
      ["zebronics-zeb-bro", "Zebronics Zeb Bro", "zebronics", "Daily Deal", "Tangle Free", 299, 799],
    ],
  },
  {
    slug: "speaker",
    name: "Speaker",
    shortName: "Speaker",
    description: "Portable sound for rooms, travel and desks.",
    image: "/assets/category-icons/speaker.svg",
    gif: "/assets/category-gifs/neckband.gif",
    products: [
      ["jbl-go-desk-speaker", "JBL Go Desk Speaker", "jbl", "Room Sound", "Portable Sound", 1999, 3999],
      ["boat-stone-ignite", "boAt Stone Ignite", "boat", "Outdoor Pick", "12H Playback", 1499, 3499],
      ["zebronics-party-cube", "Zebronics Party Cube", "zebronics", "Party Ready", "RGB Lights", 1299, 2999],
    ],
  },
  {
    slug: "mobile-accessories",
    name: "Laptop and Mobile Accessories",
    shortName: "Accessories",
    description: "Cables, adapters, stands and daily add-ons.",
    image: "/assets/category-icons/mobile-accessories.svg",
    gif: "/assets/category-gifs/watch.gif",
    products: [
      ["amazon-basics-type-c-hub", "Amazon Basics Type-C Hub", "amazon-basics", "Work Desk", "Multi Port", 1199, 2499],
      ["motorola-phone-stand", "Motorola Phone Stand", "motorola", "Desk Ready", "Foldable", 699, 1499],
      ["ubon-mobile-kit", "Ubon Mobile Kit", "ubon", "Travel Pack", "Daily Add-ons", 499, 999],
    ],
  },
  {
    slug: "charging-accessories",
    name: "Charging Accessories",
    shortName: "Charging",
    description: "Chargers and cables for fast top-ups.",
    image: "/assets/category-icons/charging-accessories.svg",
    gif: "/assets/category-gifs/watch.gif",
    products: [
      ["urbn-gan-charger-33w", "URBN GaN Charger 33W", "urbn", "Fast Charge", "33W Output", 899, 1999],
      ["syska-c-to-c-cable", "SYSKA C to C Cable", "syska", "Cable Deal", "60W Ready", 349, 799],
      ["oneplus-supervooc-adapter", "OnePlus SuperVOOC Adapter", "oneplus", "Quick Top-up", "65W Output", 1499, 2999],
    ],
  },
].map((category, index) => ({ ...category, sortOrder: index + 1 }));

const heroSlides = [
  ["festival-earbuds", "Sale live now", "Earbud deals that move fast", "Curated TWS, neckbands and charging gear with quick filters by brand, category and price range.", "Up to 55% off selected audio", "Shop audio deals", "/products?category=earbuds", "/assets/hero-carousel/hero-earbuds-sale.svg"],
  ["smart-wearables", "Wearables week", "Smart watches under control", "Shop daily wear watches, fitness bands and accessories from trusted brands.", "Starting from Rs. 899", "Explore watches", "/products?category=smart-watch", "/assets/hero-carousel/hero-smartwatch-sale.svg"],
  ["power-accessories", "Daily tech essentials", "Chargers, speakers and power banks", "Fast moving accessories organized for easy discovery across mobile and desktop.", "New drops every week", "Shop accessories", "/products?category=mobile-accessories", "/assets/hero-carousel/hero-accessories-sale.svg"],
  ["neckband-audio", "Neckband picks", "All-day audio that stays light", "Wireless neckbands for calls, commutes and workout playlists from daily-use brands.", "Battery picks from Rs. 699", "Shop neckbands", "/products?category=neckband", "/assets/hero-carousel/hero-neckband-sale.svg"],
  ["speaker-week", "Room-filling sound", "Bluetooth speakers for every desk", "Portable speakers, compact party audio and everyday sound bars organized by brand and price.", "Speaker deals refreshed weekly", "Shop speakers", "/products?category=speaker", "/assets/hero-carousel/hero-speaker-sale.svg"],
  ["power-bank-week", "Charge anywhere", "Power banks and charging gear", "Fast chargers, cables and backup power options for travel, work and daily carry.", "Charging gear from Rs. 499", "Shop power gear", "/products?category=power-bank", "/assets/hero-carousel/hero-powerbank-sale.svg"],
];

const warehouseSlides = [
  ["warehouse-rack", "Warehouse stock wall", "Live stock and sorting area", "/about", "/assets/collab-carousel/warehouse/warehouse-stock-wall.svg"],
  ["packing-desk", "Packing and dispatch", "Orders packed for quick handoff", "/shipping-policy", "/assets/collab-carousel/warehouse/warehouse-packing-desk.svg"],
  ["delivery-counter", "Fast delivery counter", "Daily dispatch proof", "/products?delivery=fast", "/assets/collab-carousel/warehouse/delivery-counter.svg"],
  ["accessories-wall", "Accessories wall", "Accessories arranged by category", "/products?category=mobile-accessories", "/assets/collab-carousel/warehouse/accessories-wall.svg"],
];

const brandCollabs = [
  ["collab-oneplus", "oneplus", "OnePlus audio week", "Branded product banner slot", "/assets/collab-carousel/brand-banners/collab-oneplus-products.svg"],
  ["collab-boat", "boat", "boAt bass collection", "Auto/manual carousel image", "/assets/collab-carousel/brand-banners/collab-boat-products.svg"],
  ["collab-noise", "noise", "Noise watch and audio", "Brand focused full-width graphic", "/assets/collab-carousel/brand-banners/collab-noise-products.svg"],
  ["collab-jbl", "jbl", "JBL speaker spotlight", "Product showcase banner", "/assets/collab-carousel/brand-banners/collab-jbl-products.svg"],
  ["redmi-realme", "redmi", "Redmi and Realme value picks", "Budget product banner slot", "/assets/collab-carousel/brand-banners/collab-redmi-realme-products.svg"],
  ["sony-premium", "sony", "Sony premium audio", "Premium product banner slot", "/assets/collab-carousel/brand-banners/collab-sony-products.svg"],
];

const trustCards = [
  ["fast-delivery", "Fast delivery", "Delivery filters and stock-aware browsing fit into the homepage flow.", "24-72h"],
  ["verified-catalog", "Verified catalog", "Brand and category pages are prepared for fast product browsing.", "Curated"],
  ["support-flow", "Support flow", "Footer and account entry points are ready for orders, warranty and returns.", "7 days"],
];

const footerColumns = [
  {
    key: "support",
    title: "Support",
    links: [
      ["Support center", "/support"],
      ["Shipping policy", "/shipping-policy"],
      ["Return policy", "/return-policy"],
      ["Warranty", "/warranty"],
    ],
  },
  {
    key: "policy",
    title: "Policy",
    links: [
      ["Privacy policy", "/privacy-policy"],
      ["Terms", "/terms"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
    ],
  },
];

const created = {
  media: 0,
  brands: 0,
  categories: 0,
  products: 0,
  variants: 0,
  productMedia: 0,
  specs: 0,
  stock: 0,
  homepage: 0,
};

const mediaByUrl = new Map();
const brandIds = new Map();
const categoryIds = new Map();
const productIds = new Map();
const variantIds = new Map();

await seedMedia();
await seedBrands();
await seedCategories();
await seedProducts();
await seedOffersAndCollections();
await seedHomepageCms();
await seedFooter();

console.log(
  JSON.stringify(
    {
      ok: true,
      pushedTo: supabaseUrl,
      counts: created,
      tables: [
        "media_assets",
        "brands",
        "categories",
        "products",
        "product_variants",
        "product_media",
        "product_specifications",
        "offers",
        "product_offer_links",
        "inventory_locations",
        "inventory_stock",
        "home_collections",
        "collection_items",
        "hero_slides",
        "warehouse_slides",
        "brand_collabs",
        "trust_cards",
        "footer_columns",
        "footer_links",
      ],
      note: "Demo seed is idempotent and updates the same rows on repeat runs.",
    },
    null,
    2,
  ),
);

async function seedMedia() {
  const urls = new Set();

  for (const brand of brandSeeds) urls.add(brand.logo);
  for (const category of categorySeeds) {
    urls.add(category.image);
    urls.add(category.gif);
  }
  for (const slide of heroSlides) urls.add(slide[7]);
  for (const slide of warehouseSlides) urls.add(slide[4]);
  for (const collab of brandCollabs) urls.add(collab[4]);

  for (const url of urls) {
    const media = await upsertMedia(url);
    mediaByUrl.set(url, media.id);
    created.media += 1;
  }
}

async function seedBrands() {
  for (const brand of brandSeeds) {
    const row = await upsertByNaturalKey("brands", "slug", brand.slug, {
      id: uuid(`brand:${brand.slug}`),
      slug: brand.slug,
      name: brand.name,
      deal: brand.deal,
      logo_media_id: mediaByUrl.get(brand.logo) ?? null,
      status: "published",
      sort_order: brand.sortOrder,
      seo_title: `${brand.name} products at AllEarbuds`,
      seo_description: `Shop ${brand.name} audio, wearable and accessory deals on AllEarbuds.`,
    });
    brandIds.set(brand.slug, row.id);
    created.brands += 1;
  }
}

async function seedCategories() {
  for (const category of categorySeeds) {
    const row = await upsertByNaturalKey("categories", "slug", category.slug, {
      id: uuid(`category:${category.slug}`),
      slug: category.slug,
      name: category.name,
      short_name: category.shortName,
      description: category.description,
      image_media_id: mediaByUrl.get(category.image) ?? null,
      hover_media_id: mediaByUrl.get(category.gif) ?? null,
      status: "published",
      sort_order: category.sortOrder,
      seo_title: `${category.name} at AllEarbuds`,
      seo_description: category.description,
    });
    categoryIds.set(category.slug, row.id);
    created.categories += 1;
  }
}

async function seedProducts() {
  const location = await upsertByNaturalKey("inventory_locations", "name", "Demo Warehouse", {
    id: uuid("inventory-location:demo-warehouse"),
    name: "Demo Warehouse",
    pincode: "122008",
    is_active: true,
  });

  let sort = 0;

  for (const category of categorySeeds) {
    for (const [slug, title, brandSlug, badge, feature, price, compareAt] of category.products) {
      sort += 1;
      const product = await upsertByNaturalKey("products", "slug", slug, {
        id: uuid(`product:${slug}`),
        slug,
        brand_id: mustGet(brandIds, brandSlug, "brand"),
        category_id: mustGet(categoryIds, category.slug, "category"),
        title,
        badge,
        feature,
        tagline: `${feature} ${category.shortName.toLowerCase()} for daily use.`,
        description: `${title} is seeded demo content for ${category.name}. Replace it from the admin dashboard when client data is ready.`,
        rating: Number((4.2 + (sort % 7) / 10).toFixed(1)),
        rating_count: 300 + sort * 47,
        status: "published",
        seo_title: `${title} | AllEarbuds`,
        seo_description: `Shop ${title} with demo pricing and category media on AllEarbuds.`,
      });
      productIds.set(slug, product.id);
      created.products += 1;

      const variant = await upsertByNaturalKey("product_variants", "sku", sku(slug), {
        id: uuid(`variant:${slug}:default`),
        product_id: product.id,
        sku: sku(slug),
        color_name: "Black",
        color_swatch: "#111318",
        is_available: price !== 1599 || slug !== "ambrane-powerlit-10000",
        price_amount: price,
        compare_at_amount: compareAt,
        currency: "INR",
        selected_by_default: true,
      });
      variantIds.set(slug, variant.id);
      created.variants += 1;

      await upsertById("product_media", uuid(`product-media:${slug}:primary`), {
        product_id: product.id,
        media_id: mustGet(mediaByUrl, category.image, "media"),
        role: "primary",
        sort_order: 1,
      });
      created.productMedia += 1;

      await upsertById("product_media", uuid(`product-media:${slug}:gif`), {
        product_id: product.id,
        media_id: mustGet(mediaByUrl, category.gif, "media"),
        role: "gallery",
        sort_order: 2,
      });
      created.productMedia += 1;

      const specs = [
        ["Category", category.name],
        ["Feature", feature],
        ["Country Of Origin", "India"],
        ["Warranty", "Demo warranty slot"],
      ];

      for (const [index, [label, value]] of specs.entries()) {
        await upsertById("product_specifications", uuid(`spec:${slug}:${label}`), {
          product_id: product.id,
          label,
          value,
          group_name: "Demo specs",
          sort_order: index + 1,
        });
        created.specs += 1;
      }

      await upsertById("inventory_stock", null, {
        variant_id: variant.id,
        location_id: location.id,
        quantity_available: 25 + sort,
        quantity_reserved: 0,
      }, ["variant_id", "location_id"]);
      created.stock += 1;
    }
  }
}

async function seedOffersAndCollections() {
  const offer = await upsertById("offers", uuid("offer:demo-launch"), {
    label: "Most popular",
    title: "Buy 2 or more",
    value: "Get 6% Off",
    code: "DEMO6",
    min_quantity: 2,
    discount_percent: 6,
    status: "published",
  });

  const featuredSlugs = [
    "boat-airdopes-131",
    "oneplus-bullets-z3",
    "boat-wave-sigma",
    "jbl-go-desk-speaker",
    "sony-wh-ch520",
    "ambrane-powerlit-10000",
  ];

  for (const productSlug of featuredSlugs) {
    await upsertComposite("product_offer_links", ["product_id", "offer_id"], {
      product_id: mustGet(productIds, productSlug, "product"),
      offer_id: offer.id,
    });
  }

  const collection = await upsertByNaturalKey("home_collections", "key", "top-deals", {
    id: uuid("home-collection:top-deals"),
    key: "top-deals",
    title: "Top Deals & New Drops",
    description: "Demo product cards seeded for the homepage.",
    status: "published",
    sort_order: 1,
  });

  for (const [index, productSlug] of featuredSlugs.entries()) {
    const category = categorySeeds.find((item) =>
      item.products.some((product) => product[0] === productSlug),
    );
    const product = category?.products.find((item) => item[0] === productSlug);

    await upsertById("collection_items", uuid(`collection-item:top-deals:${productSlug}`), {
      collection_id: collection.id,
      product_id: mustGet(productIds, productSlug, "product"),
      title: product?.[1] ?? "Demo product",
      badge: product?.[3] ?? "Deal live",
      feature: product?.[4] ?? "Featured",
      href: `/products/${productSlug}`,
      media_id: category ? mediaByUrl.get(category.image) ?? null : null,
      payload: {
        price: product ? `Rs. ${product[5].toLocaleString("en-IN")}` : "",
        compareAt: product ? `Rs. ${product[6].toLocaleString("en-IN")}` : "",
        discount: product ? `${Math.round(((product[6] - product[5]) / product[6]) * 100)}% off` : "",
      },
      status: "published",
      sort_order: index + 1,
    });
    created.homepage += 1;
  }
}

async function seedHomepageCms() {
  for (const [index, [key, eyebrow, title, description, offer, ctaLabel, href, image]] of heroSlides.entries()) {
    await upsertById("hero_slides", uuid(`hero:${key}`), {
      title,
      eyebrow,
      description,
      offer,
      cta_label: ctaLabel,
      href,
      media_id: mediaByUrl.get(image) ?? null,
      status: "published",
      sort_order: index + 1,
      starts_at: null,
      ends_at: null,
    });
    created.homepage += 1;
  }

  for (const [index, [key, title, subtitle, href, image]] of warehouseSlides.entries()) {
    await upsertById("warehouse_slides", uuid(`warehouse:${key}`), {
      title,
      subtitle,
      href,
      media_id: mediaByUrl.get(image) ?? null,
      status: "published",
      sort_order: index + 1,
    });
    created.homepage += 1;
  }

  for (const [index, [key, brandSlug, title, subtitle, image]] of brandCollabs.entries()) {
    await upsertById("brand_collabs", uuid(`brand-collab:${key}`), {
      brand_id: brandIds.get(brandSlug) ?? null,
      title,
      subtitle,
      media_id: mediaByUrl.get(image) ?? null,
      status: "published",
      sort_order: index + 1,
    });
    created.homepage += 1;
  }

  for (const [index, [key, title, description, metric]] of trustCards.entries()) {
    await upsertById("trust_cards", uuid(`trust:${key}`), {
      title,
      description,
      metric,
      status: "published",
      sort_order: index + 1,
    });
    created.homepage += 1;
  }
}

async function seedFooter() {
  for (const [columnIndex, column] of footerColumns.entries()) {
    const columnRow = await upsertById("footer_columns", uuid(`footer-column:${column.key}`), {
      title: column.title,
      status: "published",
      sort_order: columnIndex + 1,
    });

    for (const [linkIndex, [label, href]] of column.links.entries()) {
      await upsertById("footer_links", uuid(`footer-link:${column.key}:${label}`), {
        column_id: columnRow.id,
        label,
        href,
        status: "published",
        sort_order: linkIndex + 1,
      });
    }
  }
}

async function upsertMedia(url) {
  const existing = await maybeSingle(
    supabase.from("media_assets").select("id").eq("url", url).limit(1),
  );
  const id = existing?.id ?? uuid(`media:${url}`);
  const isGif = url.endsWith(".gif");
  const isSvg = url.endsWith(".svg");

  return upsertById("media_assets", id, {
    provider: "seed",
    provider_file_id: `seed:${url}`,
    url,
    thumbnail_url: isGif ? null : url,
    resource_type: isGif ? "image" : "image",
    alt_text: labelFromUrl(url),
    width: isSvg ? 1440 : 640,
    height: isSvg ? 620 : 480,
    mime_type: isGif ? "image/gif" : "image/svg+xml",
    folder: "demo-seed",
    metadata: { seeded: true, source: "scripts/seed-demo-catalog.mjs" },
  });
}

async function upsertByNaturalKey(table, keyColumn, keyValue, row) {
  const existing = await maybeSingle(
    supabase.from(table).select("id").eq(keyColumn, keyValue).limit(1),
  );

  if (existing?.id) {
    const updates = { ...row };
    delete updates.id;
    const result = await supabase
      .from(table)
      .update(updates)
      .eq("id", existing.id)
      .select("id")
      .single();
    throwIfError(result, `update ${table}`);
    return result.data;
  }

  const result = await supabase.from(table).insert(row).select("id").single();
  throwIfError(result, `insert ${table}`);
  return result.data;
}

async function upsertById(table, id, row, compositeKeys = null) {
  if (compositeKeys) {
    return upsertComposite(table, compositeKeys, row);
  }

  const result = await supabase
    .from(table)
    .upsert({ id, ...row }, { onConflict: "id" })
    .select("id")
    .single();
  throwIfError(result, `upsert ${table}`);
  return result.data;
}

async function upsertComposite(table, keys, row) {
  const result = await supabase
    .from(table)
    .upsert(row, { onConflict: keys.join(",") })
    .select(keys.join(","));
  throwIfError(result, `upsert ${table}`);
  return result.data;
}

async function maybeSingle(query) {
  const result = await query.maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

function throwIfError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
}

function mustGet(map, key, label) {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing ${label}: ${key}`);
  }
  return value;
}

function sku(slug) {
  return `AE-${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

function uuid(key) {
  const bytes = createHash("sha1").update(`allearbuds-demo:${key}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex").slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function labelFromUrl(url) {
  return url
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? "Demo media";
}

function loadEnv(path) {
  if (!existsSync(path)) {
    return {};
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = unquote(value);
    process.env[key] ??= values[key];
  }

  return values;
}

function readEnv(key) {
  const value = process.env[key] || env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

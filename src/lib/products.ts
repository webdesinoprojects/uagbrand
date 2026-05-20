import type { ImageAsset, Product, ProductSpecification } from "@/types";

export type ProductFilter = {
  brand?: string;
  category?: string;
  q?: string;
  sort?: string;
  delivery?: string;
  warranty?: string;
};

const image = (
  src: ImageAsset["src"],
  alt: string,
  label: string,
  width = 640,
  height = 480,
): ImageAsset => ({ src, alt, width, height, label });

const commonColors = [
  { name: "Black", swatch: "#111318", available: true },
  { name: "Blue", swatch: "#526b84", available: true },
  { name: "White", swatch: "#f2f2ed", available: true },
  { name: "Green", swatch: "#879487", available: false },
  { name: "Rose", swatch: "#d7a2a2", available: false },
];

const specs = (
  category: string,
  driver: string,
  battery: string,
  charging: string,
  ipx: string,
): ProductSpecification[] => [
  { label: "Category", value: category },
  { label: "Net Quantity", value: "1 Unit" },
  { label: "Driver Size", value: driver },
  { label: "Bluetooth", value: "V5.3" },
  { label: "Playback", value: battery },
  { label: "Charging Time", value: charging },
  { label: "IPX Rating", value: ipx },
  { label: "Country Of Origin", value: "India" },
  {
    label: "Marketed By",
    value:
      "AllEarbuds Commerce Pvt. Ltd., Mumbai, Maharashtra, India - 400093",
  },
  {
    label: "Customer Care",
    value: "support@allearbuds.com | 022-6918-1920",
  },
];

const offers = [
  {
    label: "Most popular",
    title: "Buy 2 or more",
    value: "Get 6% Off",
    code: "BOAT6",
  },
  {
    label: "Best value",
    title: "Buy 5 or more",
    value: "Get 8% Off",
    code: "BOAT8",
  },
  {
    label: "Most savings",
    title: "Buy 10 or more",
    value: "Get 10% Off",
    code: "BOAT10",
  },
];

const earbudMedia = [
  image("/assets/category-icons/earbuds.svg", "Earbuds product render", "earbuds.svg"),
  image(
    "/assets/hero-carousel/hero-earbuds-sale.svg",
    "Earbuds lifestyle banner",
    "hero-earbuds-sale.svg",
    1120,
    560,
  ),
  image(
    "/assets/collab-carousel/brand-banners/collab-boat-products.svg",
    "Audio product campaign",
    "collab-boat-products.svg",
    1440,
    620,
  ),
  image("/assets/category-icons/wired-earphones.svg", "Earbud detail render", "wired-earphones.svg"),
  image("/assets/category-icons/mobile-accessories.svg", "Accessory detail render", "mobile-accessories.svg"),
];

const watchMedia = [
  image("/assets/category-icons/smart-watch.svg", "Smart watch product render", "smart-watch.svg"),
  image(
    "/assets/hero-carousel/hero-smartwatch-sale.svg",
    "Smart watch lifestyle banner",
    "hero-smartwatch-sale.svg",
    1120,
    560,
  ),
  image(
    "/assets/collab-carousel/brand-banners/collab-noise-products.svg",
    "Watch campaign banner",
    "collab-noise-products.svg",
    1440,
    620,
  ),
  image("/assets/category-icons/mobile-accessories.svg", "Watch accessory render", "mobile-accessories.svg"),
  image("/assets/category-icons/charging-accessories.svg", "Charging accessory render", "charging-accessories.svg"),
];

const neckbandMedia = [
  image("/assets/category-icons/neckband.svg", "Neckband product render", "neckband.svg"),
  image(
    "/assets/hero-carousel/hero-neckband-sale.svg",
    "Neckband lifestyle banner",
    "hero-neckband-sale.svg",
    1120,
    560,
  ),
  image("/assets/category-icons/earbuds.svg", "Audio driver render", "earbuds.svg"),
  image("/assets/category-icons/charging-accessories.svg", "Charging cable render", "charging-accessories.svg"),
  image(
    "/assets/collab-carousel/brand-banners/collab-boat-products.svg",
    "Neckband campaign banner",
    "collab-boat-products.svg",
    1440,
    620,
  ),
];

const productCatalog = [
  {
    slug: "boat-airdopes-131",
    title: "boAt Airdopes 131",
    brandSlug: "boat",
    categorySlug: "earbuds",
    badge: "New Launch",
    feature: "60H Playback",
    tagline: "Wireless Earbuds with upto 60 Hours Playback, 13mm Drivers, IWP Technology and 650mAh Charging Case",
    description:
      "Daily wireless earbuds with a pocketable case, quick pairing and reliable battery for calls, music and travel.",
    price: "Rs. 899",
    compareAt: "Rs. 2,990",
    discount: "70% off",
    rating: "4.8",
    ratingCount: "1466",
    availability: "in-stock",
    selectedColor: "Black",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | By tomorrow",
    usersLove: "75 Lacs+ units sold on Flipkart. 8 Lacs+ 5 star reviews.",
    rewardText: "Earn upto 44 reward points on this product",
    activeOffers: offers,
    images: earbudMedia,
    specifications: specs("Wireless Earbuds", "13mm*2", "Up to 60 hours", "2 hours", "IPX4"),
  },
  {
    slug: "boat-airdopes-170",
    title: "boAt Airdopes 170",
    brandSlug: "boat",
    categorySlug: "earbuds",
    badge: "Extra Rs. 100 off",
    feature: "50H Playback",
    tagline: "Gaming ready earbuds with low latency mode, ENx calling and compact charging case",
    description:
      "A lightweight pair for calls and games, tuned for punchy bass and quick device switching.",
    price: "Rs. 1,599",
    compareAt: "Rs. 3,490",
    discount: "54% off",
    rating: "4.7",
    ratingCount: "982",
    availability: "in-stock",
    selectedColor: "Blue",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | 2 days",
    usersLove: "12 Lacs+ units sold across marketplaces. 95k+ verified reviews.",
    rewardText: "Earn upto 78 reward points on this product",
    activeOffers: offers,
    images: earbudMedia,
    specifications: specs("Wireless Earbuds", "10mm*2", "Up to 50 hours", "1.5 hours", "IPX5"),
  },
  {
    slug: "boat-nirvana-ion-anc",
    title: "boAt Nirvana Ion ANC",
    brandSlug: "boat",
    categorySlug: "earbuds",
    badge: "Best Value",
    feature: "ANC + 120H",
    tagline: "Premium earbuds with active noise cancellation, app control and extended case battery",
    description:
      "A higher battery earbud for long listening sessions, commute noise control and custom EQ.",
    price: "Rs. 1,799",
    compareAt: "Rs. 9,990",
    discount: "82% off",
    rating: "4.9",
    ratingCount: "2140",
    availability: "in-stock",
    selectedColor: "White",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | By tomorrow",
    usersLove: "8 Lacs+ happy buyers with strong ratings for battery and ANC.",
    rewardText: "Earn upto 88 reward points on this product",
    activeOffers: offers,
    images: earbudMedia,
    specifications: specs("Wireless Earbuds", "10mm*2", "Up to 120 hours", "2 hours", "IPX4"),
  },
  {
    slug: "boat-rockerz-245-v2-pro",
    title: "boAt Rockerz 245 V2 Pro",
    brandSlug: "boat",
    categorySlug: "neckband",
    badge: "Deal live",
    feature: "30H Battery",
    tagline: "Wireless neckband with ASAP charge, dual pairing and magnetic earbuds",
    description:
      "A flexible neckband for calls, runs and daily commute with quick top-up charging.",
    price: "Rs. 1,599",
    compareAt: "Rs. 3,490",
    discount: "54% off",
    rating: "4.6",
    ratingCount: "744",
    availability: "in-stock",
    selectedColor: "Green",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | 2 days",
    usersLove: "3 Lacs+ commute users picked this for long battery and comfort.",
    rewardText: "Earn upto 78 reward points on this product",
    activeOffers: offers,
    images: neckbandMedia,
    specifications: specs("Neckband", "10mm*2", "Up to 30 hours", "1 hour", "IPX5"),
  },
  {
    slug: "boat-wave-sigma",
    title: "boAt Wave Sigma",
    brandSlug: "boat",
    categorySlug: "smart-watch",
    badge: "New Launch",
    feature: "Bluetooth Calling",
    tagline: "Smartwatch with calling, health tracking, bright display and daily activity modes",
    description:
      "A daily smartwatch for notifications, health stats and Bluetooth calls from the wrist.",
    price: "Rs. 1,999",
    compareAt: "Rs. 7,499",
    discount: "73% off",
    rating: "4.5",
    ratingCount: "521",
    availability: "in-stock",
    selectedColor: "Black",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | By tomorrow",
    usersLove: "2 Lacs+ users track fitness and calls with this watch.",
    rewardText: "Earn upto 98 reward points on this product",
    activeOffers: offers,
    images: watchMedia,
    specifications: specs("Smart Watch", "Display speaker", "Up to 7 days", "2 hours", "IP68"),
  },
  {
    slug: "redmi-buds-6-active",
    title: "Redmi Buds 6 Active",
    brandSlug: "redmi",
    categorySlug: "earbuds",
    badge: "Top Pick",
    feature: "30H Playback",
    tagline: "Lightweight earbuds with fast pairing, bass mode and compact travel case",
    description:
      "Value earbuds for music, reels and calls with everyday tuning and stable pairing.",
    price: "Rs. 1,299",
    compareAt: "Rs. 2,999",
    discount: "57% off",
    rating: "4.4",
    ratingCount: "870",
    availability: "in-stock",
    selectedColor: "Black",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | 2 days",
    usersLove: "4 Lacs+ value buyers chose this for calls and battery.",
    rewardText: "Earn upto 64 reward points on this product",
    activeOffers: offers,
    images: earbudMedia,
    specifications: specs("Wireless Earbuds", "12mm*2", "Up to 30 hours", "1.5 hours", "IPX4"),
  },
  {
    slug: "realme-buds-air-6",
    title: "realme Buds Air 6",
    brandSlug: "realme",
    categorySlug: "earbuds",
    badge: "Fresh Drop",
    feature: "ANC Ready",
    tagline: "ANC earbuds with low latency audio, fast charging and app-based sound profiles",
    description:
      "A balanced pair for commute, calls and gaming with cleaner voice pickup and punchy bass.",
    price: "Rs. 2,799",
    compareAt: "Rs. 5,999",
    discount: "53% off",
    rating: "4.7",
    ratingCount: "1134",
    availability: "in-stock",
    selectedColor: "White",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | By tomorrow",
    usersLove: "6 Lacs+ audio buyers rated this highly for ANC and comfort.",
    rewardText: "Earn upto 138 reward points on this product",
    activeOffers: offers,
    images: earbudMedia,
    specifications: specs("Wireless Earbuds", "12.4mm*2", "Up to 40 hours", "1 hour", "IP55"),
  },
  {
    slug: "oneplus-bullets-z3",
    title: "OnePlus Bullets Z3",
    brandSlug: "oneplus",
    categorySlug: "neckband",
    badge: "Top Deal",
    feature: "44H Battery",
    tagline: "Neckband with fast charge, punchy bass and smooth phone pairing",
    description:
      "Workday neckband with reliable mic quality, quick top-up and comfortable silicone tips.",
    price: "Rs. 1,999",
    compareAt: "Rs. 3,999",
    discount: "50% off",
    rating: "4.6",
    ratingCount: "650",
    availability: "in-stock",
    selectedColor: "Black",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | 3 days",
    usersLove: "1 Lac+ buyers picked it for stable calls and quick charge.",
    rewardText: "Earn upto 98 reward points on this product",
    activeOffers: offers,
    images: neckbandMedia,
    specifications: specs("Neckband", "12.4mm*2", "Up to 44 hours", "1 hour", "IP55"),
  },
  {
    slug: "jbl-go-desk-speaker",
    title: "JBL Go Desk Speaker",
    brandSlug: "jbl",
    categorySlug: "speaker",
    badge: "Room Sound",
    feature: "Portable Sound",
    tagline: "Compact Bluetooth speaker with clear voice, punchy output and travel-friendly build",
    description:
      "A small speaker for rooms, desks and trips with dependable wireless playback.",
    price: "Rs. 1,999",
    compareAt: "Rs. 3,999",
    discount: "50% off",
    rating: "4.8",
    ratingCount: "1290",
    availability: "in-stock",
    selectedColor: "Blue",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | 2 days",
    usersLove: "5 Lacs+ compact speaker buyers use it for rooms and travel.",
    rewardText: "Earn upto 98 reward points on this product",
    activeOffers: offers,
    images: [
      image("/assets/category-icons/speaker.svg", "JBL speaker render", "speaker.svg"),
      image("/assets/hero-carousel/hero-speaker-sale.svg", "Speaker banner", "hero-speaker-sale.svg", 1120, 560),
      image("/assets/collab-carousel/brand-banners/collab-jbl-products.svg", "JBL campaign", "collab-jbl-products.svg", 1440, 620),
      image("/assets/category-icons/mobile-accessories.svg", "Speaker accessory", "mobile-accessories.svg"),
      image("/assets/category-icons/charging-accessories.svg", "Charging accessory", "charging-accessories.svg"),
    ],
    specifications: specs("Speaker", "45mm full-range", "Up to 12 hours", "2.5 hours", "IPX7"),
  },
  {
    slug: "sony-wh-ch520",
    title: "Sony WH-CH520",
    brandSlug: "sony",
    categorySlug: "wireless-headphones",
    badge: "Premium Pick",
    feature: "50H Battery",
    tagline: "Wireless on-ear headphones with long battery, balanced sound and lightweight cushions",
    description:
      "A comfortable headphone for office calls, music and long playback sessions.",
    price: "Rs. 3,999",
    compareAt: "Rs. 5,990",
    discount: "33% off",
    rating: "4.8",
    ratingCount: "1580",
    availability: "in-stock",
    selectedColor: "Black",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | 2 days",
    usersLove: "Headphone buyers rate this highly for comfort and clean sound.",
    rewardText: "Earn upto 198 reward points on this product",
    activeOffers: offers,
    images: [
      image("/assets/category-icons/wireless-headphones.svg", "Sony headphone render", "wireless-headphones.svg"),
      image("/assets/collab-carousel/brand-banners/collab-sony-products.svg", "Sony campaign", "collab-sony-products.svg", 1440, 620),
      image("/assets/category-icons/mobile-accessories.svg", "Headphone accessory", "mobile-accessories.svg"),
      image("/assets/category-icons/charging-accessories.svg", "Charging cable", "charging-accessories.svg"),
      image("/assets/category-icons/speaker.svg", "Audio detail", "speaker.svg"),
    ],
    specifications: specs("Wireless Headphones", "30mm dynamic", "Up to 50 hours", "3 hours", "NA"),
  },
  {
    slug: "noise-colorfit-pro-daily",
    title: "Noise ColorFit Pro Daily",
    brandSlug: "noise",
    categorySlug: "smart-watch",
    badge: "Watch Deal",
    feature: "AMOLED Display",
    tagline: "Calling smartwatch with activity tracking, bright screen and daily health metrics",
    description:
      "A simple everyday watch for fitness stats, notifications and quick Bluetooth calling.",
    price: "Rs. 2,799",
    compareAt: "Rs. 6,999",
    discount: "60% off",
    rating: "4.5",
    ratingCount: "980",
    availability: "in-stock",
    selectedColor: "Rose",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Free delivery | By tomorrow",
    usersLove: "3 Lacs+ watch users like its calling and display clarity.",
    rewardText: "Earn upto 138 reward points on this product",
    activeOffers: offers,
    images: watchMedia,
    specifications: specs("Smart Watch", "1.78 inch display", "Up to 7 days", "2 hours", "IP68"),
  },
  {
    slug: "ambrane-powerlit-10000",
    title: "Ambrane Powerlit 10000",
    brandSlug: "ambrane",
    categorySlug: "power-bank",
    badge: "Fast Delivery",
    feature: "10000mAh Battery",
    tagline: "Slim power bank with dual output, fast top-up support and travel-safe design",
    description:
      "Backup power for phones, earbuds and travel essentials with a slim pocketable body.",
    price: "Rs. 1,599",
    compareAt: "Rs. 2,999",
    discount: "47% off",
    rating: "4.3",
    ratingCount: "430",
    availability: "out-of-stock",
    selectedColor: "Black",
    colors: commonColors,
    deliveryPincode: "122008",
    deliveryPromise: "Notify me when stock returns",
    usersLove: "Frequent travellers use this for phone and audio backup power.",
    rewardText: "Reward points resume when this product is back in stock",
    activeOffers: offers,
    images: [
      image("/assets/category-icons/power-bank.svg", "Power bank render", "power-bank.svg"),
      image("/assets/hero-carousel/hero-powerbank-sale.svg", "Power bank banner", "hero-powerbank-sale.svg", 1120, 560),
      image("/assets/category-icons/charging-accessories.svg", "Charging accessory", "charging-accessories.svg"),
      image("/assets/category-icons/mobile-accessories.svg", "Mobile accessory", "mobile-accessories.svg"),
      image("/assets/hero-carousel/hero-accessories-sale.svg", "Accessories banner", "hero-accessories-sale.svg", 1120, 560),
    ],
    specifications: specs("Power Bank", "10000mAh cell", "10000mAh", "4 hours", "NA"),
  },
] satisfies Product[];

export function getProducts() {
  return productCatalog;
}

export function getProductBySlug(slug: string) {
  return productCatalog.find((product) => product.slug === slug);
}

export function getFilteredProducts(filters: ProductFilter) {
  const query = filters.q?.trim().toLowerCase();

  const filteredProducts = productCatalog.filter((product) => {
    if (filters.brand && product.brandSlug !== filters.brand) {
      return false;
    }

    if (filters.category && product.categorySlug !== filters.category) {
      return false;
    }

    if (query) {
      const haystack = [
        product.title,
        product.tagline,
        product.description,
        product.brandSlug,
        product.categorySlug,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.delivery === "fast" && !product.deliveryPromise.includes("tomorrow")) {
      return false;
    }

    return true;
  });

  if (filters.sort === "deals") {
    return [...filteredProducts].sort(
      (a, b) => parseDiscount(b.discount) - parseDiscount(a.discount),
    );
  }

  if (filters.sort === "new") {
    return [...filteredProducts].sort((a, b) =>
      b.badge.localeCompare(a.badge),
    );
  }

  return filteredProducts;
}

export function getRelatedProducts(product: Product) {
  return productCatalog
    .filter(
      (item) =>
        item.slug !== product.slug &&
        (item.categorySlug === product.categorySlug ||
          item.brandSlug === product.brandSlug),
    )
    .slice(0, 4);
}

function parseDiscount(value: string) {
  return Number.parseInt(value, 10) || 0;
}

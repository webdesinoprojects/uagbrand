import type { BreadcrumbItem } from "@/components/navigation/breadcrumbs";

export type StaticPageIcon =
  | "badge"
  | "book"
  | "box"
  | "building"
  | "cart"
  | "clock"
  | "card"
  | "file"
  | "headphones"
  | "lock"
  | "mail"
  | "map"
  | "package"
  | "phone"
  | "refresh"
  | "shield"
  | "spark"
  | "truck"
  | "user";

export type StaticPageCard = {
  title: string;
  description: string;
  icon: StaticPageIcon;
  href?: string;
  meta?: string;
};

export type StaticPageSection = {
  eyebrow?: string;
  title: string;
  body: string;
  icon: StaticPageIcon;
  bullets?: string[];
};

export type StaticPageFaq = {
  question: string;
  answer: string;
};

export type StaticPagePost = {
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  href: string;
};

export type StaticPageField = {
  label: string;
  value: string;
};

export type StaticPageContent = {
  title: string;
  eyebrow: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  stats: StaticPageCard[];
  sections: StaticPageSection[];
  cards?: StaticPageCard[];
  faqs?: StaticPageFaq[];
  posts?: StaticPagePost[];
  fields?: StaticPageField[];
  primaryAction?: {
    label: string;
    href: string;
  };
};

const supportCrumbs: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Support", href: "/support" },
];

const legalCrumbs: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Legal", href: "/legal" },
];

export const staticPages = {
  about: {
    title: "Built For Fast Everyday Tech Shopping",
    eyebrow: "About AllEarbuds",
    description:
      "AllEarbuds is a focused storefront for audio, wearables, charging gear and mobile accessories from trusted everyday brands.",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Company" },
      { label: "About us" },
    ],
    stats: [
      {
        title: "Focused catalog",
        description: "Earbuds, watches, power banks, speakers and accessories.",
        icon: "headphones",
        meta: "9 categories",
      },
      {
        title: "Brand-first browsing",
        description: "Logo tiles and filters take shoppers straight to brand lists.",
        icon: "badge",
        meta: "18 brands",
      },
      {
        title: "Dispatch mindset",
        description: "Pages are structured around stock, delivery and support clarity.",
        icon: "truck",
        meta: "24-72h",
      },
    ],
    sections: [
      {
        eyebrow: "What we sell",
        title: "Daily-use tech without catalog noise",
        body: "The store is organized around products people search for repeatedly: TWS earbuds, neckbands, watches, chargers, speakers and mobile add-ons.",
        icon: "cart",
        bullets: [
          "Simple category paths for quick mobile browsing",
          "Brand paths for shoppers who already know what they want",
          "Offer banners reserved for campaigns and stock pushes",
        ],
      },
      {
        eyebrow: "How we organize",
        title: "Navigation comes before decoration",
        body: "The homepage keeps product discovery high on the page, then follows with brand deals, category tiles, warehouse proof, collabs and support links.",
        icon: "spark",
        bullets: [
          "No oversized marketing-only page before shopping starts",
          "Clickable carousels for launches and brand campaigns",
          "Footer links grouped for policy and account tasks",
        ],
      },
    ],
    cards: [
      {
        title: "Our warehouse",
        description: "Packing, dispatch and inventory proof sit in their own carousel.",
        icon: "building",
        href: "/about",
      },
      {
        title: "Brand collabs",
        description: "Campaign banners open matching brand pages.",
        icon: "badge",
        href: "/products?sort=deals",
      },
      {
        title: "Help flow",
        description: "Returns, shipping, FAQ and order tracking are available from footer and bottom nav.",
        icon: "headphones",
        href: "/support",
      },
    ],
    primaryAction: { label: "Explore products", href: "/products" },
  },
  support: {
    title: "Support That Gets Shoppers Moving",
    eyebrow: "Support center",
    description:
      "Quick paths for order tracking, returns, delivery questions, warranty help and account support.",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Support" },
    ],
    stats: [
      {
        title: "Track orders",
        description: "Check dispatch and delivery status in one place.",
        icon: "package",
        href: "/track-order",
        meta: "Live path",
      },
      {
        title: "Return help",
        description: "Understand return windows and refund steps before raising a request.",
        icon: "refresh",
        href: "/return-policy",
        meta: "7 days",
      },
      {
        title: "Contact team",
        description: "Reach support for orders, warranty and business queries.",
        icon: "mail",
        href: "/contact",
        meta: "10am-7pm",
      },
    ],
    sections: [
      {
        title: "Start with the task, not a ticket",
        body: "Support pages are grouped around what customers usually need: order status, returns, refunds, shipping, account access and warranty questions.",
        icon: "headphones",
        bullets: [
          "Track my order from the mobile bottom nav",
          "Policy pages use short sections and clear timelines",
          "FAQ answers cover common purchase questions",
        ],
      },
    ],
    cards: [
      {
        title: "Shipping policy",
        description: "Delivery windows, tracking and failed delivery handling.",
        icon: "truck",
        href: "/shipping-policy",
      },
      {
        title: "Return / refund policy",
        description: "Eligibility, pickup checks and refund timelines.",
        icon: "refresh",
        href: "/return-policy",
      },
      {
        title: "FAQ",
        description: "Quick answers before contacting support.",
        icon: "book",
        href: "/faq",
      },
    ],
  },
  contact: {
    title: "Talk To The Right Team",
    eyebrow: "Contact us",
    description:
      "Use this page for order help, warranty questions, return requests and partnership enquiries.",
    breadcrumbs: [...supportCrumbs, { label: "Contact us" }],
    stats: [
      {
        title: "Email",
        description: "support@allearbuds.com",
        icon: "mail",
        meta: "Order help",
      },
      {
        title: "Phone",
        description: "+91 00000 00000",
        icon: "phone",
        meta: "10am-7pm",
      },
      {
        title: "Dispatch center",
        description: "India dispatch center",
        icon: "map",
        meta: "Warehouse",
      },
    ],
    sections: [
      {
        title: "What to include in your message",
        body: "For faster handling, include your order number, mobile number used at checkout, product name and a short description of the issue.",
        icon: "mail",
        bullets: [
          "For warranty: add invoice date and product photos",
          "For returns: mention pickup address and reason",
          "For business: include company name and expected volume",
        ],
      },
    ],
    fields: [
      { label: "Name", value: "Rahul Sharma" },
      { label: "Mobile", value: "+91 98765 43210" },
      { label: "Order ID", value: "AE-2026-1048" },
      { label: "Message", value: "Need help with a replacement request." },
    ],
    primaryAction: { label: "Track order instead", href: "/track-order" },
  },
  "return-policy": {
    title: "Returns And Refunds Without Confusion",
    eyebrow: "Return / refund policy",
    description:
      "A practical policy page for return windows, product condition checks, pickup handling and refund timing.",
    breadcrumbs: [...supportCrumbs, { label: "Return / refund policy" }],
    stats: [
      {
        title: "Return window",
        description: "Raise eligible requests within the stated window from delivery.",
        icon: "refresh",
        meta: "7 days",
      },
      {
        title: "QC check",
        description: "Products are checked for serials, accessories and condition.",
        icon: "shield",
        meta: "Pickup",
      },
      {
        title: "Refund path",
        description: "Refunds move to the original payment method after approval.",
        icon: "card",
        meta: "3-7 days",
      },
    ],
    sections: [
      {
        title: "Eligible return reasons",
        body: "Returns are meant for damaged delivery, wrong item, missing accessories or product issues confirmed during the return check.",
        icon: "refresh",
        bullets: [
          "Keep the product box, invoice and accessories ready",
          "Do not remove serial labels or warranty stickers",
          "Photos may be requested before pickup is scheduled",
        ],
      },
      {
        title: "Refund timing",
        body: "Once the returned product passes inspection, the refund request is processed to the original payment method.",
        icon: "card",
        bullets: [
          "UPI and wallet refunds usually reflect faster",
          "Card and bank refunds can take a few working days",
          "Shipping fees may be handled separately for non-serviceable returns",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I return an opened product?",
        answer:
          "Opened products can be reviewed when the issue is damage, wrong item, missing accessory or a confirmed functional problem.",
      },
      {
        question: "When does the refund start?",
        answer:
          "Refund processing starts after pickup and quality check are completed.",
      },
    ],
  },
  "shipping-policy": {
    title: "Shipping Built Around Clear Timelines",
    eyebrow: "Shipping policy",
    description:
      "Delivery areas, dispatch windows, tracking updates and failed delivery handling in a clear ecommerce format.",
    breadcrumbs: [...supportCrumbs, { label: "Shipping policy" }],
    stats: [
      {
        title: "Dispatch",
        description: "Most packed orders move to dispatch after payment confirmation.",
        icon: "truck",
        meta: "24-72h",
      },
      {
        title: "Tracking",
        description: "Tracking details are shown once the shipment is handed over.",
        icon: "package",
        meta: "SMS/email",
      },
      {
        title: "Delivery attempts",
        description: "Courier partners usually attempt delivery more than once.",
        icon: "clock",
        meta: "2 attempts",
      },
    ],
    sections: [
      {
        title: "Delivery timing",
        body: "Metro and major city orders usually move faster, while remote pin codes can need extra transit time after dispatch.",
        icon: "truck",
        bullets: [
          "Metro delivery estimate: 2-5 working days",
          "Non-metro delivery estimate: 4-8 working days",
          "Festival and sale periods can add courier delays",
        ],
      },
      {
        title: "Failed delivery",
        body: "If a courier cannot reach the address, customers should respond to the delivery call or update support before the shipment returns.",
        icon: "package",
        bullets: [
          "Keep the mobile number active",
          "Use a complete address with landmark and pin code",
          "Track returned shipments from the order page",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Written For Shoppers",
    eyebrow: "Privacy policy",
    description:
      "What customer information is used, why it is needed and how the storefront avoids exposing private details.",
    breadcrumbs: [...legalCrumbs, { label: "Privacy policy" }],
    stats: [
      {
        title: "Minimal data",
        description: "Only details needed for orders, support and delivery are requested.",
        icon: "lock",
        meta: "Need-based",
      },
      {
        title: "Payment safety",
        description: "Payment handling should stay with secure payment partners.",
        icon: "card",
        meta: "No card display",
      },
      {
        title: "Support privacy",
        description: "Customer-facing errors do not expose internal system details.",
        icon: "shield",
        meta: "Protected",
      },
    ],
    sections: [
      {
        title: "Information used for orders",
        body: "Name, phone, address, order details and payment status are used to place, ship, track and support purchases.",
        icon: "file",
        bullets: [
          "Contact details are used for delivery updates",
          "Order details help with returns and warranty requests",
          "Support messages are used to resolve the reported issue",
        ],
      },
      {
        title: "How data should be protected",
        body: "The storefront should avoid logging private customer data in public UI, browser console output or shared error screens.",
        icon: "shield",
        bullets: [
          "Customer pages show clear messages without technical detail",
          "Account pages should require sign-in before order details appear",
          "Admin access should be separated from shopper access",
        ],
      },
    ],
  },
  "terms-and-conditions": {
    title: "Terms For Shopping On AllEarbuds",
    eyebrow: "Terms and conditions",
    description:
      "Store usage, product information, pricing, availability, account responsibility and policy references.",
    breadcrumbs: [...legalCrumbs, { label: "Terms and conditions" }],
    stats: [
      {
        title: "Product info",
        description: "Specs, images and prices can change as brand data updates.",
        icon: "file",
        meta: "Updated",
      },
      {
        title: "Availability",
        description: "Some brands or products may be marked unavailable.",
        icon: "box",
        meta: "Stock-led",
      },
      {
        title: "Account use",
        description: "Customers are responsible for keeping login details secure.",
        icon: "user",
        meta: "Private",
      },
    ],
    sections: [
      {
        title: "Orders and pricing",
        body: "Prices, offers and availability can change until the order is confirmed. Any obvious pricing error may require correction before fulfillment.",
        icon: "cart",
        bullets: [
          "Order confirmation depends on payment and stock availability",
          "Coupon or campaign terms can differ by product",
          "Invoice and warranty terms follow product and brand rules",
        ],
      },
      {
        title: "Use of the storefront",
        body: "The site is intended for normal shopping, account access, order tracking and support requests.",
        icon: "shield",
        bullets: [
          "Do not misuse forms, checkout or support workflows",
          "Do not attempt to access another customer account",
          "Policy pages can be updated as store operations evolve",
        ],
      },
    ],
  },
  legal: {
    title: "Legal And Policy Center",
    eyebrow: "Legal",
    description:
      "A clear place for privacy, terms, shipping and return rules before a customer places an order.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Legal" }],
    stats: [
      {
        title: "Privacy",
        description: "Data usage and customer information handling.",
        icon: "lock",
        href: "/privacy-policy",
        meta: "Policy",
      },
      {
        title: "Terms",
        description: "Store usage, account and order conditions.",
        icon: "file",
        href: "/terms-and-conditions",
        meta: "Rules",
      },
      {
        title: "Returns",
        description: "Return eligibility and refund flow.",
        icon: "refresh",
        href: "/return-policy",
        meta: "Support",
      },
    ],
    sections: [
      {
        title: "Policy pages should be easy to scan",
        body: "Customers should not need to read dense legal walls before understanding delivery, return and privacy basics.",
        icon: "book",
        bullets: [
          "Short sections with concrete labels",
          "Breadcrumbs to move back through the site",
          "Support links close to policy explanations",
        ],
      },
    ],
  },
  faq: {
    title: "Quick Answers Before You Contact Support",
    eyebrow: "FAQ",
    description:
      "Straight answers for common product, delivery, warranty, return and account questions.",
    breadcrumbs: [...supportCrumbs, { label: "FAQ" }],
    stats: [
      {
        title: "Orders",
        description: "Tracking, dispatch and delivery timing.",
        icon: "package",
        meta: "Fast checks",
      },
      {
        title: "Returns",
        description: "Eligibility and refund timing.",
        icon: "refresh",
        meta: "7 days",
      },
      {
        title: "Warranty",
        description: "Invoice-led brand warranty support.",
        icon: "shield",
        meta: "Brand rules",
      },
    ],
    sections: [
      {
        title: "Most answers start with your order",
        body: "Keep your order ID and mobile number ready when checking delivery, refund or warranty details.",
        icon: "package",
      },
    ],
    faqs: [
      {
        question: "How do I track my order?",
        answer:
          "Use Track my order from the mobile bottom nav or support page, then enter the order ID and checkout mobile number.",
      },
      {
        question: "Are all brand logos clickable?",
        answer:
          "Yes. Brand logos open product listings filtered by that brand.",
      },
      {
        question: "Why do some brands show out of stock?",
        answer:
          "Unavailable brands are marked clearly so shoppers do not mistake them for loading or broken product cards.",
      },
      {
        question: "Can I change my delivery address?",
        answer:
          "Address changes can be requested before dispatch. After handoff, courier rules may limit changes.",
      },
      {
        question: "Where do I get warranty help?",
        answer:
          "Use Contact us with the invoice date, product name and issue details. Warranty handling can vary by brand.",
      },
    ],
  },
  blogs: {
    title: "Buying Guides And Product Notes",
    eyebrow: "Blogs",
    description:
      "Modern ecommerce content for audio, wearables, charging products and accessories.",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "Resources", href: "/resources" },
      { label: "Blogs" },
    ],
    stats: [
      {
        title: "Guides",
        description: "Plain-language product buying help.",
        icon: "book",
        meta: "Updated",
      },
      {
        title: "Comparisons",
        description: "Brand and category comparisons for quick decisions.",
        icon: "badge",
        meta: "Audio",
      },
      {
        title: "Care tips",
        description: "Battery, charging and warranty tips.",
        icon: "spark",
        meta: "Practical",
      },
    ],
    sections: [
      {
        title: "Content that helps shoppers choose",
        body: "Guides are designed to explain product differences without slowing the path to a product list.",
        icon: "book",
      },
    ],
    posts: [
      {
        title: "How to choose TWS earbuds under Rs. 1,999",
        category: "Earbuds",
        readTime: "4 min read",
        excerpt:
          "Battery, fit, calling quality and codec basics explained for daily use.",
        href: "/blogs",
      },
      {
        title: "Smartwatch buying checklist for everyday wear",
        category: "Watches",
        readTime: "5 min read",
        excerpt:
          "Display, straps, sensors, app support and warranty points to compare.",
        href: "/blogs",
      },
      {
        title: "Power bank safety: capacity, output and cables",
        category: "Charging",
        readTime: "3 min read",
        excerpt:
          "What to check before buying a charging accessory for daily carry.",
        href: "/blogs",
      },
    ],
  },
  resources: {
    title: "Resources For Better Purchases",
    eyebrow: "Resources",
    description:
      "Buying guides, comparisons and practical tips for choosing everyday tech.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Resources" }],
    stats: [
      {
        title: "Blogs",
        description: "Guides and comparisons for audio and accessories.",
        icon: "book",
        href: "/blogs",
        meta: "Read",
      },
      {
        title: "FAQ",
        description: "Short answers for support questions.",
        icon: "headphones",
        href: "/faq",
        meta: "Help",
      },
      {
        title: "Policies",
        description: "Shipping, return and privacy details.",
        icon: "file",
        href: "/legal",
        meta: "Rules",
      },
    ],
    sections: [
      {
        title: "Use resources before comparing products",
        body: "The resource area supports buying decisions without turning the homepage into a blog page.",
        icon: "spark",
      },
    ],
  },
  account: {
    title: "Your Account Hub",
    eyebrow: "My account",
    description:
      "A modern account landing page for sign-in, order history, saved details and warranty requests.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "My account" }],
    stats: [
      {
        title: "Orders",
        description: "View recent orders and invoices after sign-in.",
        icon: "package",
        meta: "Private",
      },
      {
        title: "Warranty",
        description: "Raise warranty requests with product and invoice details.",
        icon: "shield",
        meta: "Brand-led",
      },
      {
        title: "Saved details",
        description: "Manage addresses and contact details securely.",
        icon: "user",
        meta: "Secure",
      },
    ],
    sections: [
      {
        title: "Designed for repeat shoppers",
        body: "The account area should keep checkout faster while protecting private order and address information.",
        icon: "user",
        bullets: [
          "Order history and invoice access",
          "Saved address management",
          "Warranty and return request links",
        ],
      },
    ],
    fields: [
      { label: "Mobile number", value: "+91 98765 43210" },
      { label: "One-time code", value: "6 digit code" },
    ],
    primaryAction: { label: "Track my order", href: "/track-order" },
  },
  "track-order": {
    title: "Track My Order",
    eyebrow: "Order tracking",
    description:
      "A focused tracking page for order status, courier handoff, delivery attempts and support follow-up.",
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: "My account", href: "/account" },
      { label: "Track my order" },
    ],
    stats: [
      {
        title: "Packed",
        description: "Order is checked and packed at dispatch.",
        icon: "box",
        meta: "Step 1",
      },
      {
        title: "Shipped",
        description: "Courier pickup is complete and tracking is active.",
        icon: "truck",
        meta: "Step 2",
      },
      {
        title: "Delivered",
        description: "Shipment reaches the selected address.",
        icon: "package",
        meta: "Step 3",
      },
    ],
    sections: [
      {
        title: "Use order ID and checkout mobile",
        body: "Tracking should be simple: order ID plus mobile number used during checkout. No private order information is shown without verification.",
        icon: "package",
        bullets: [
          "Example order ID: AE-2026-1048",
          "Tracking appears after courier handoff",
          "Support can help if tracking has not moved for 48 hours",
        ],
      },
    ],
    fields: [
      { label: "Order ID", value: "AE-2026-1048" },
      { label: "Mobile number", value: "+91 98765 43210" },
    ],
    primaryAction: { label: "Need help?", href: "/contact" },
  },
  cart: {
    title: "Your Cart",
    eyebrow: "Cart",
    description:
      "A clean cart area for selected products, coupon checks, delivery estimates and checkout actions.",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Cart" }],
    stats: [
      {
        title: "No items yet",
        description: "Your cart is ready for selected products.",
        icon: "cart",
        meta: "0 items",
      },
      {
        title: "Fast checkout",
        description: "Checkout will use saved address and contact details.",
        icon: "clock",
        meta: "Ready",
      },
      {
        title: "Secure payment",
        description: "Payment should be handled through a trusted provider.",
        icon: "card",
        meta: "Protected",
      },
    ],
    sections: [
      {
        title: "Cart is empty right now",
        body: "Start with brand deals, categories or current offer banners. Selected products will appear here with quantity, price and delivery estimate.",
        icon: "cart",
        bullets: [
          "Add earbuds, watches or accessories from product lists",
          "Review delivery and coupon details before checkout",
          "Track placed orders from My account",
        ],
      },
    ],
    cards: [
      {
        title: "Shop earbuds",
        description: "Browse TWS, wired and neckband options.",
        icon: "headphones",
        href: "/products?category=earbuds",
      },
      {
        title: "Shop watches",
        description: "Browse smart watches and bands.",
        icon: "clock",
        href: "/products?category=smart-watch",
      },
      {
        title: "Shop charging",
        description: "Browse power banks and charging accessories.",
        icon: "truck",
        href: "/products?category=charging-accessories",
      },
    ],
    primaryAction: { label: "Continue shopping", href: "/products" },
  },
} satisfies Record<string, StaticPageContent>;

export type StaticPageSlug = keyof typeof staticPages;

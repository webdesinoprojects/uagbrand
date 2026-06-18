export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
  resourceType?: "image" | "video" | "gif" | "file";
};

export type VideoAsset = {
  src: `/${string}`;
  type: "video/mp4" | "video/webm";
  alt: string;
};

export type Brand = {
  name: string;
  slug: string;
  logo: ImageAsset;
  href: `/products?brand=${string}`;
  deal: string;
};

export type Category = {
  name: string;
  slug: string;
  shortName: string;
  image: ImageAsset;
  hoverMedia?: ImageAsset;
  href: `/products?category=${string}`;
  description: string;
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  offer: string;
  ctaLabel: string;
  href: string;
  image: ImageAsset;
};

export type QuickMenuIcon =
  | "badge-percent"
  | "zap"
  | "headphones"
  | "watch"
  | "truck"
  | "shield";

export type QuickMenuItem = {
  label: string;
  href: string;
  icon: QuickMenuIcon;
};

export type FeaturedDeal = {
  id: string;
  badge: string;
  feature: string;
  title: string;
  price: string;
  compareAt: string;
  discount: string;
  href: string;
  image: ImageAsset;
};

export type ProductColorOption = {
  name: string;
  swatch: string;
  available: boolean;
};

export type ProductOffer = {
  label: string;
  title: string;
  value: string;
  code: string;
};

export type ProductSpecification = {
  label: string;
  value: string;
};

export type Product = {
  id?: string;
  selectedVariantId?: string;
  slug: string;
  title: string;
  brandSlug: string;
  categorySlug: string;
  badge: string;
  feature: string;
  tagline: string;
  description: string;
  price: string;
  compareAt: string;
  discount: string;
  rating: string;
  ratingCount: string;
  availability: "in-stock" | "out-of-stock";
  selectedColor: string;
  colors: ProductColorOption[];
  deliveryPincode: string;
  deliveryPromise: string;
  usersLove: string;
  rewardText: string;
  activeOffers: ProductOffer[];
  images: ImageAsset[];
  galleryImages?: ImageAsset[];
  bentoImages?: ImageAsset[];
  productVideo?: ImageAsset;
  specifications: ProductSpecification[];
};

export type TrustItem = {
  title: string;
  description: string;
  metric: string;
};

export type CollabSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: ImageAsset;
};

export type VideoFeature = {
  title: string;
  description: string;
  poster: ImageAsset;
  video: VideoAsset;
};

export type HomePageData = {
  heroSlides: HeroSlide[];
  quickMenus: QuickMenuItem[];
  featuredDeals: FeaturedDeal[];
  brands: Brand[];
  categories: Category[];
  collabSlides: CollabSlide[];
  warehouseSlides: CollabSlide[];
  trustItems: TrustItem[];
  videoFeature: VideoFeature;
};

export type ImageAsset = {
  src: `/${string}`;
  alt: string;
  width: number;
  height: number;
  label: string;
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
  brands: Brand[];
  categories: Category[];
  collabSlides: CollabSlide[];
  warehouseSlides: CollabSlide[];
  trustItems: TrustItem[];
  videoFeature: VideoFeature;
};

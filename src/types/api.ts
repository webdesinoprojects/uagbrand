import type { Brand, Category, HomePageData, Product } from "@/types";
import type { StaticPageContent } from "@/lib/static-pages";

export type PublicDataSource = "database" | "static";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type ProductListData = {
  items: Product[];
  pagination: PaginationMeta;
  source: PublicDataSource;
};

export type ProductDetailData = {
  product: Product;
  relatedProducts: Product[];
  source: PublicDataSource;
};

export type PublicHomeData = {
  home: HomePageData;
  source: PublicDataSource;
};

export type PublicStaticPageData = {
  page: StaticPageContent;
  source: PublicDataSource;
};

export type AdminSessionRole = "support" | "editor" | "admin";

export type AdminSessionActor = {
  id: string;
  email: string;
  role: AdminSessionRole;
};

export type AdminSessionData = {
  authenticated: boolean;
  actor: AdminSessionActor | null;
  permissions: {
    canAccessAdmin: boolean;
    canManageCatalog: boolean;
    canManageOrders: boolean;
    canManageUsers: boolean;
  };
};

export type CustomerSessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
};

export type CustomerSessionData = {
  authenticated: boolean;
  user: CustomerSessionUser | null;
  pendingVerification?: boolean;
};

export type CustomerProfileData = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CartPersonalizationValue = string | number | boolean | null;

export type CartItemData = {
  id: string;
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  quantity: number;
  personalization: Record<string, CartPersonalizationValue>;
  variant: {
    sku: string;
    colorName: string | null;
    colorSwatch: string | null;
    isAvailable: boolean;
    priceAmount: number;
    compareAtAmount: number | null;
    currency: string;
  };
  lineTotalAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type CartData = {
  id: string | null;
  authenticated: boolean;
  itemCount: number;
  subtotalAmount: number;
  currency: string;
  items: CartItemData[];
};

export type CustomerAddressData = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAddressListData = {
  items: CustomerAddressData[];
};

export type WishlistItemData = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  availability: "in-stock" | "out-of-stock";
  priceAmount: number | null;
  compareAtAmount: number | null;
  currency: string;
  createdAt: string;
};

export type WishlistData = {
  items: WishlistItemData[];
};

export type CustomerOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type CustomerPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type CustomerPaymentMethod =
  | "cod"
  | "manual"
  | "razorpay"
  | "stripe";

export type CustomerOrderSummaryData = {
  id: string;
  orderNumber: string;
  status: CustomerOrderStatus;
  paymentStatus: CustomerPaymentStatus;
  paymentMethod: CustomerPaymentMethod;
  itemCount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerOrderItemData = {
  id: string;
  productId: string | null;
  variantId: string | null;
  title: string;
  sku: string | null;
  unitPriceAmount: number;
  quantity: number;
  totalAmount: number;
  personalization: Record<string, CartPersonalizationValue>;
  createdAt: string;
};

export type CustomerOrderDetailData = CustomerOrderSummaryData & {
  customerEmail: string;
  customerPhone: string | null;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  shippingAddress: unknown;
  billingAddress: unknown | null;
  items: CustomerOrderItemData[];
};

export type CustomerOrderListData = {
  items: CustomerOrderSummaryData[];
  pagination: PaginationMeta;
};

export type AdminMediaUploadSignatureData = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
};

export type MediaResourceType = "image" | "video" | "gif" | "file";
export type PublishStatus = "draft" | "published" | "archived";

export type AdminMediaReference = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  resourceType: MediaResourceType;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type AdminMediaAsset = {
  id: string;
  provider: string;
  providerFileId: string | null;
  url: string;
  thumbnailUrl: string | null;
  resourceType: MediaResourceType;
  altText: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  bytes: number | null;
  mimeType: string | null;
  folder: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type AdminMediaListData = {
  items: AdminMediaAsset[];
  pagination: PaginationMeta;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  deal: string | null;
  logoMediaId: string | null;
  logo: AdminMediaReference | null;
  status: PublishStatus;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  description: string | null;
  imageMediaId: string | null;
  hoverMediaId: string | null;
  image: AdminMediaReference | null;
  hoverMedia: AdminMediaReference | null;
  status: PublishStatus;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminBrandListData = {
  items: AdminBrand[];
  pagination: PaginationMeta;
};

export type AdminCategoryListData = {
  items: AdminCategory[];
  pagination: PaginationMeta;
};

export type AdminProductVariant = {
  id: string;
  sku: string;
  colorName: string | null;
  colorSwatch: string | null;
  isAvailable: boolean;
  priceAmount: number;
  compareAtAmount: number | null;
  currency: string;
  selectedByDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductMedia = {
  id: string;
  role: string;
  sortOrder: number;
  variantId: string | null;
  media: AdminMediaReference | null;
  createdAt: string;
};

export type AdminProductSpecification = {
  id: string;
  label: string;
  value: string;
  groupName: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  title: string;
  brandId: string;
  categoryId: string;
  brand: Pick<AdminBrand, "id" | "name" | "slug"> | null;
  category: Pick<AdminCategory, "id" | "name" | "slug" | "shortName"> | null;
  badge: string | null;
  feature: string | null;
  tagline: string | null;
  description: string | null;
  rating: number;
  ratingCount: number;
  status: PublishStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: AdminProductVariant[];
  media: AdminProductMedia[];
  specifications: AdminProductSpecification[];
  offers: AdminOffer[];
  createdAt: string;
  updatedAt: string;
};

export type AdminProductListData = {
  items: AdminProduct[];
  pagination: PaginationMeta;
};

export type AdminOffer = {
  id: string;
  label: string | null;
  title: string;
  value: string;
  code: string | null;
  minQuantity: number | null;
  discountPercent: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminOfferListData = {
  items: AdminOffer[];
  pagination: PaginationMeta;
};

export type AdminPage = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  status: PublishStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPageListData = {
  items: AdminPage[];
  pagination: PaginationMeta;
};

export type AdminNavigationItem = {
  id: string;
  location: string;
  parentId: string | null;
  label: string;
  href: string;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminNavigationListData = {
  items: AdminNavigationItem[];
  pagination: PaginationMeta;
};

export type AdminFooterColumn = {
  id: string;
  title: string;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminFooterColumnListData = {
  items: AdminFooterColumn[];
  pagination: PaginationMeta;
};

export type AdminFooterLink = {
  id: string;
  columnId: string;
  label: string;
  href: string;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminFooterLinkListData = {
  items: AdminFooterLink[];
  pagination: PaginationMeta;
};

export type AdminTrustCard = {
  id: string;
  title: string;
  description: string | null;
  metric: string | null;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminTrustCardListData = {
  items: AdminTrustCard[];
  pagination: PaginationMeta;
};

export type AdminWarehouseSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  href: string | null;
  mediaId: string | null;
  media: AdminMediaReference | null;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminWarehouseSlideListData = {
  items: AdminWarehouseSlide[];
  pagination: PaginationMeta;
};

export type AdminBrandCollab = {
  id: string;
  title: string;
  subtitle: string | null;
  brandId: string | null;
  brand: { id: string; name: string; slug: string } | null;
  mediaId: string | null;
  media: AdminMediaReference | null;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminBrandCollabListData = {
  items: AdminBrandCollab[];
  pagination: PaginationMeta;
};

export type AdminHeroSlide = {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  offer: string | null;
  ctaLabel: string | null;
  href: string | null;
  mediaId: string | null;
  media: AdminMediaReference | null;
  status: PublishStatus;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminHeroSlideListData = {
  items: AdminHeroSlide[];
  pagination: PaginationMeta;
};

export type PublicSiteSettingsData = {
  siteName: string;
  logo: AdminMediaReference | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressLabel: string | null;
  footerDescription: string | null;
  source: PublicDataSource;
};

export type AdminSiteSettings = Omit<PublicSiteSettingsData, "source"> & {
  logoMediaId: string | null;
  updatedAt: string;
};

export type AdminHomeCollection = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  status: PublishStatus;
  sortOrder: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminHomeCollectionListData = {
  items: AdminHomeCollection[];
  pagination: PaginationMeta;
};

export type AdminCollectionItem = {
  id: string;
  collectionId: string;
  productId: string | null;
  product: { id: string; slug: string; title: string } | null;
  title: string | null;
  badge: string | null;
  feature: string | null;
  href: string | null;
  mediaId: string | null;
  media: AdminMediaReference | null;
  payload: unknown;
  status: PublishStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCollectionItemListData = {
  items: AdminCollectionItem[];
  pagination: PaginationMeta;
};

export type AdminDashboardData = {
  catalog: {
    products: { total: number; published: number; draft: number; archived: number };
    brands: number;
    categories: number;
    offers: { total: number; published: number };
    media: number;
  };
  content: {
    pages: number;
    navigationItems: number;
    footerColumns: number;
    heroSlides: number;
    homeCollections: number;
    warehouseSlides: number;
    brandCollabs: number;
    trustCards: number;
  };
  customer: {
    newsletter: { total: number; pending: number; confirmed: number };
    contactMessages: { total: number; newCount: number };
    reviews: { total: number; pendingModeration: number };
    supportTickets: { total: number; openCount: number };
  };
  generatedAt: string;
};

export type PublicFormSubmitData = {
  received: true;
};

export type PublicCatalogData = {
  brands: Brand[];
  categories: Category[];
  source: PublicDataSource;
};

export type ProductReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
};

export type ProductReviewListData = {
  items: ProductReviewItem[];
  pagination: PaginationMeta;
};

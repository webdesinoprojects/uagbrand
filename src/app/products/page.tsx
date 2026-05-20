import type { Metadata } from "next";
import Link from "next/link";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/navigation/breadcrumbs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSettings } from "@/components/layout/site-header-with-settings";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import {
  BrandProductCarousel,
  type BrandProductCarouselSlide,
} from "@/components/products/brand-product-carousel";
import { ProductGrid } from "@/components/products/product-grid";
import { getHomePageDTO } from "@/server/public/home-dal";
import { getPublicProducts } from "@/server/public/products-dal";
import { toTitleCase } from "@/lib/utils";
import type { Brand, Category } from "@/types";

export const metadata: Metadata = {
  title: "Products",
  description: "Shop AllEarbuds products by brand, category and price.",
};

type ProductsSearchParams = {
  brand?: string;
  category?: string;
  price?: string;
  q?: string;
  sort?: string;
  delivery?: string;
  warranty?: string;
};

type ProductsPageProps = {
  searchParams: Promise<ProductsSearchParams>;
};

const OUT_OF_STOCK_BRANDS = new Set([
  "ambrane",
  "urbn",
  "syska",
  "philips",
  "amazon-basics",
]);
const BRAND_CAROUSEL_IMAGE_COUNT = 5;
const BRAND_CAROUSEL_VIDEO_SRC = "/assets/content/our-product-video.mp4";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  // Reads brands/categories from Supabase via the home composer with static
  // fallback, so DB-only brands/categories surface in header/footer/carousels.
  const data = await getHomePageDTO();

  const activeFilters = Object.entries(params).filter(([, value]) => value);
  const selectedBrand = data.brands.find((brand) => brand.slug === params.brand);
  const selectedCategory = data.categories.find(
    (category) => category.slug === params.category,
  );
  // Reads from Supabase when seeded; falls back to static products until then.
  // Page-size cap matches the existing static listing layout.
  const { items: products } = await getPublicProducts({ ...params, pageSize: 100 });
  const listingTitle =
    selectedBrand && selectedCategory
      ? `${selectedBrand.name} ${selectedCategory.shortName}`
      : selectedCategory
        ? `Shop ${selectedCategory.shortName}`
        : selectedBrand
          ? `Shop ${selectedBrand.name}`
          : "Shop products";
  const listingDescription =
    "Product cards now link to individual detail pages with offers, media and specifications.";
  const carouselSlides = getBrandProductCarouselSlides({
    brand: selectedBrand,
    category: selectedCategory,
    brands: data.brands,
    categories: data.categories,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderWithSettings brands={data.brands} categories={data.categories} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={getProductBreadcrumbs({
            brand: selectedBrand,
            category: selectedCategory,
          })}
        />
        {carouselSlides.length > 0 ? (
          <BrandProductCarousel slides={carouselSlides} />
        ) : (
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase text-brand">
              Product listing
            </p>
            <h1 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
              {listingTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {listingDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {activeFilters.length > 0 ? (
                activeFilters.map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-md border border-border bg-surface-soft px-3 py-2 text-sm font-bold text-foreground"
                  >
                    {toTitleCase(key)}: {toTitleCase(String(value))}
                  </span>
                ))
              ) : (
                <span className="rounded-md border border-border bg-surface-soft px-3 py-2 text-sm font-bold text-muted">
                  No filters selected
                </span>
              )}
            </div>
          </section>
        )}

        <ProductGrid products={products} />

        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5 text-sm font-bold text-foreground transition hover:border-brand hover:text-brand"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

function getBrandProductCarouselSlides({
  brand,
  category,
  brands,
  categories,
}: {
  brand: Brand | undefined;
  category: Category | undefined;
  brands: Brand[];
  categories: Category[];
}): BrandProductCarouselSlide[] {
  if (brand) {
    const imageSlides = [
      ...(category ? [category] : []),
      ...categories.filter((item) => item.slug !== category?.slug),
    ]
      .slice(0, BRAND_CAROUSEL_IMAGE_COUNT)
      .map((item) => ({
        id: `brand-carousel-${brand.slug}-${item.slug}`,
        eyebrow: `${brand.name} brand carousel`,
        title: `${brand.name} ${item.shortName}`,
        description: `${item.description} Explore ${brand.name} picks by category.`,
        href: `/products?brand=${brand.slug}&category=${item.slug}`,
        image: item.image,
      }));

    return [
      ...imageSlides,
      {
        id: `brand-carousel-${brand.slug}-video`,
        eyebrow: `${brand.name} brand video`,
        title: `${brand.name} product reel`,
        description:
          "Auto-playing brand video slot for campaign footage and product motion.",
        href: `/products?brand=${brand.slug}`,
        image: imageSlides[0]?.image ?? brand.logo,
        videoSrc: BRAND_CAROUSEL_VIDEO_SRC,
      },
    ];
  }

  if (category) {
    const imageSlides = getDisplayBrands(brands)
      .slice(0, BRAND_CAROUSEL_IMAGE_COUNT)
      .map((item) => ({
        id: `category-carousel-${category.slug}-${item.slug}`,
        eyebrow: `${category.shortName} brand carousel`,
        title: `${item.name} ${category.shortName}`,
        description: `${category.description} Browse brand options in this category.`,
        href: `/products?brand=${item.slug}&category=${category.slug}`,
        image: item.logo,
      }));

    return [
      ...imageSlides,
      {
        id: `category-carousel-${category.slug}-video`,
        eyebrow: `${category.shortName} brand video`,
        title: `${category.shortName} product reel`,
        description:
          "Auto-playing category video slot for product demos and launches.",
        href: `/products?category=${category.slug}`,
        image: imageSlides[0]?.image ?? category.image,
        videoSrc: BRAND_CAROUSEL_VIDEO_SRC,
      },
    ];
  }

  return [];
}

function getDisplayBrands(brands: Brand[]) {
  const availableBrands = brands
    .filter((item) => !isOutOfStockBrand(item))
    .slice(0, 7);
  const outOfStockBrands = brands.filter((item) => isOutOfStockBrand(item));

  return [...availableBrands, ...outOfStockBrands];
}

function isOutOfStockBrand(brand: Brand) {
  return OUT_OF_STOCK_BRANDS.has(brand.slug);
}

function getProductBreadcrumbs({
  brand,
  category,
}: {
  brand: Brand | undefined;
  category: Category | undefined;
}) {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
  ];

  if (brand) {
    items.push({ label: "Brands", href: "/#brands" });
    items.push({ label: brand.name });
  }

  if (category) {
    items.push({ label: "Categories", href: "/#categories" });
    items.push({ label: category.shortName });
  }

  if (!brand && !category) {
    items[items.length - 1] = { label: "Products" };
  }

  return items;
}

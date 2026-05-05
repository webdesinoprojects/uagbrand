import type { Metadata } from "next";
import Link from "next/link";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/navigation/breadcrumbs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import {
  ProductAvailabilityGrid,
  type ProductAvailabilityItem,
} from "@/components/products/out-of-stock-grid";
import { getHomePageData } from "@/lib/catalog";
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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const data = await getHomePageData();

  const activeFilters = Object.entries(params).filter(([, value]) => value);
  const selectedBrand = data.brands.find((brand) => brand.slug === params.brand);
  const selectedCategory = data.categories.find(
    (category) => category.slug === params.category,
  );
  const selectedBrandIsOut = selectedBrand
    ? isOutOfStockBrand(selectedBrand)
    : false;
  const listingTitle =
    selectedBrand && selectedBrandIsOut && selectedCategory
      ? `${selectedBrand.name} ${selectedCategory.shortName} is out of stock`
      : selectedBrand && selectedBrandIsOut
        ? `${selectedBrand.name} products are out of stock`
        : selectedCategory
          ? `Shop ${selectedCategory.shortName}`
          : selectedBrand
            ? `Shop ${selectedBrand.name}`
            : "Shop products";
  const listingDescription = selectedBrandIsOut
    ? "This brand is currently unavailable. Other brands will show normal product loading cards."
    : selectedCategory
      ? "Only unavailable brands are marked out of stock. Other brand cards stay in the normal loading state."
      : "Product cards are being prepared. Unavailable brands are marked out of stock.";
  const productItems = getProductAvailabilityItems({
    brand: selectedBrand,
    category: selectedCategory,
    brands: data.brands,
    categories: data.categories,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader brands={data.brands} categories={data.categories} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={getProductBreadcrumbs({
            brand: selectedBrand,
            category: selectedCategory,
          })}
        />
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

        <ProductAvailabilityGrid items={productItems} />

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

function getProductAvailabilityItems({
  brand,
  category,
  brands,
  categories,
}: {
  brand: Brand | undefined;
  category: Category | undefined;
  brands: Brand[];
  categories: Category[];
}): ProductAvailabilityItem[] {
  const makeItem = ({
    itemBrand,
    itemCategory,
  }: {
    itemBrand: Brand;
    itemCategory: Category;
  }): ProductAvailabilityItem => {
    const outOfStock = isOutOfStockBrand(itemBrand);

    return {
      id: `${itemBrand.slug}-${itemCategory.slug}`,
      title: `${itemBrand.name} ${itemCategory.shortName}`,
      description: outOfStock
        ? "This brand is currently out of stock."
        : "Product card is loading.",
      image: outOfStock ? itemCategory.image : itemBrand.logo,
      status: outOfStock ? "out-of-stock" : "loading",
    };
  };

  if (brand && category) {
    return [makeItem({ itemBrand: brand, itemCategory: category })];
  }

  if (category) {
    return getDisplayBrands(brands).map((item) =>
      makeItem({ itemBrand: item, itemCategory: category }),
    );
  }

  if (brand) {
    return categories.slice(0, 8).map((item) => ({
      id: `${brand.slug}-${item.slug}`,
      title: `${brand.name} ${item.shortName}`,
      description: isOutOfStockBrand(brand)
        ? "This brand is currently out of stock."
        : "Product card is loading.",
      image: isOutOfStockBrand(brand) ? item.image : brand.logo,
      status: isOutOfStockBrand(brand) ? "out-of-stock" : "loading",
    }));
  }

  const fallbackCategory = categories[0];

  if (!fallbackCategory) {
    return [];
  }

  return getDisplayBrands(brands).map((item) =>
    makeItem({ itemBrand: item, itemCategory: fallbackCategory }),
  );
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

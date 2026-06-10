import type { Metadata } from "next";
import { Heart, Star, Truck } from "lucide-react";
import { notFound } from "next/navigation";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/navigation/breadcrumbs";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSettings } from "@/components/layout/site-header-with-settings";
import { ProductActions } from "@/components/products/product-actions";
import {
  ProductBentoMediaGrid,
  ProductMediaGallery,
} from "@/components/products/product-media-gallery";
import { SimilarProductsCarousel } from "@/components/products/similar-products-carousel";
import { getProducts } from "@/lib/products";
import { getHomePageDTO } from "@/server/public/home-dal";
import {
  getPublicProductBySlug,
  getPublicProducts,
} from "@/server/public/products-dal";
import type { Brand, Category, Product } from "@/types";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getProducts().map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicProductBySlug(slug);

  if (!result) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: result.product.title,
    description: result.product.tagline,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const result = await getPublicProductBySlug(slug);
  // Brand/category lookup uses the DB-aware composer so DB-only brands and
  // categories resolve correctly instead of falling through to notFound().
  const data = await getHomePageDTO();

  if (!result) {
    notFound();
  }

  const { product } = result;
  const similarProductList = await getPublicProducts({
    brand: product.brandSlug,
    pageSize: 24,
  });
  const similarProducts = similarProductList.items
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  const brand = data.brands.find((item) => item.slug === product.brandSlug);
  const category = data.categories.find(
    (item) => item.slug === product.categorySlug,
  );

  if (!brand || !category || product.images.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderWithSettings brands={data.brands} categories={data.categories} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={getProductBreadcrumbs({
            product,
            brand,
            category,
          })}
        />  

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
          <ProductMediaGallery product={product} />
          <ProductSummary product={product} brand={brand} category={category} />
        </section>

        <ProductBentoMediaGrid product={product} />
        <ProductSpecifications product={product} />
        <SimilarProductsCarousel brand={brand} products={similarProducts} />
      </main>
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

function ProductSummary({
  product,
  brand,
  category,
}: {
  product: Product;
  brand: Brand;
  category: Category;
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Star size={15} className="fill-accent text-accent" />
            {product.rating}
            <span className="text-success">({product.ratingCount})</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
            {product.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {product.tagline}
          </p>
        </div>
        <button
          type="button"
          aria-label="Save product"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground transition hover:border-brand hover:text-brand"
        >
          <Heart size={18} />
        </button>
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-end gap-2">
            <p className="text-3xl font-black text-foreground">
              {product.price}
            </p>
            <p className="pb-1 text-sm text-muted line-through">
              {product.compareAt}
            </p>
            <p className="pb-1 text-sm font-black text-success">
              {product.discount}
            </p>
          </div>
          <p className="mt-1 text-xs font-bold text-muted">
            MRP inclusive of all taxes
          </p>
        </div>
        <div className="rounded-full border border-accent bg-accent/12 px-4 py-2 text-sm font-black text-foreground">
          Get a silicone case @ Rs. 29
        </div>
      </div>

      <section className="mt-7">
        <p className="text-sm font-black text-foreground">
          Choose your color:{" "}
          <span className="font-bold">{product.selectedColor}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {product.colors.map((color) => (
            <button
              key={color.name}
              type="button"
              aria-label={`${color.name}${color.available ? "" : " unavailable"}`}
              className="relative grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface transition hover:border-brand disabled:opacity-50"
              disabled={!color.available}
            >
              <span
                className="h-7 w-7 rounded-md border border-border"
                style={{ backgroundColor: color.swatch }}
              />
              {!color.available ? (
                <span className="absolute h-px w-12 rotate-[-42deg] bg-danger" />
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <InfoCards product={product} brand={brand} category={category} />
      <ProductActions product={product} />
    </section>
  );
}

function InfoCards({
  product,
  brand,
  category,
}: {
  product: Product;
  brand: Brand;
  category: Category;
}) {
  return (
    <div className="mt-7 space-y-4">
      <div className="rounded-lg bg-surface-soft p-4">
        <p className="font-black text-foreground">
          Make Your Product Personalised
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-brand">
          Add a custom engraving and make it unmistakably yours.
        </p>
      </div>

      <div className="rounded-lg bg-surface-soft p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-muted">
              Check Delivery
            </p>
            <div className="mt-3 flex items-center gap-3 border-b border-muted/40 pb-2">
              <span className="text-sm font-bold text-foreground">
                {product.deliveryPincode}
              </span>
              <button
                type="button"
                className="ml-auto rounded-md bg-foreground px-5 py-2 text-xs font-black text-background"
              >
                Change
              </button>
            </div>
            <p className="mt-2 text-sm font-black text-foreground">
              <span className="text-success">
                {product.deliveryPromise.split("|")[0]}
              </span>
              {product.deliveryPromise.includes("|")
                ? ` | ${product.deliveryPromise.split("|")[1]?.trim()}`
                : ""}
            </p>
          </div>
          <Truck size={32} className="shrink-0 text-foreground" />
        </div>
      </div>

      <div>
        <h2 className="text-base font-black text-foreground">Users&apos; Love</h2>
        <div className="mt-3 rounded-lg border border-accent bg-accent/20 p-4">
          <p className="max-w-md text-sm font-bold leading-6 text-foreground">
            {product.usersLove}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <span className="font-black text-foreground">{brand.name}</span> ships
        this {category.shortName.toLowerCase()} through the AllEarbuds catalog
        flow.
      </div>
    </div>
  );
}

function ProductSpecifications({ product }: { product: Product }) {
  return (
    <section className="mt-12 rounded-xl bg-surface-soft px-5 py-8 sm:px-8 lg:px-20">
      <h2 className="font-display text-3xl font-medium text-foreground sm:text-4xl">
        Product <span className="font-black">Specifications</span>
      </h2>
      <div className="mt-8 grid gap-x-16 gap-y-7 md:grid-cols-2">
        {product.specifications.map((spec) => (
          <div key={spec.label}>
            <p className="text-xs font-bold text-muted">{spec.label}</p>
            <p className="mt-1 text-sm font-black leading-6 text-foreground">
              {spec.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function getProductBreadcrumbs({
  product,
  brand,
  category,
}: {
  product: Product;
  brand: Brand;
  category: Category;
}) {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: brand.name, href: brand.href },
    { label: category.shortName, href: category.href },
    { label: product.title },
  ];

  return items;
}

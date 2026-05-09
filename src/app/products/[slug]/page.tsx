import type { Metadata } from "next";
import { Copy, Heart, PackageCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { notFound } from "next/navigation";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/navigation/breadcrumbs";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getHomePageData } from "@/lib/catalog";
import { getProductBySlug, getProducts } from "@/lib/products";
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
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.title,
    description: product.tagline,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  const data = await getHomePageData();

  if (!product) {
    notFound();
  }

  const brand = data.brands.find((item) => item.slug === product.brandSlug);
  const category = data.categories.find(
    (item) => item.slug === product.categorySlug,
  );

  if (!brand || !category || product.images.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader brands={data.brands} categories={data.categories} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={getProductBreadcrumbs({
            product,
            brand,
            category,
          })}
        />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
          <ProductGallery product={product} />
          <ProductSummary product={product} brand={brand} category={category} />
        </section>

        <ProductBentoGrid product={product} />
        <ProductSpecifications product={product} />
      </main>
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

function ProductGallery({ product }: { product: Product }) {
  const primaryImage = product.images[0];

  if (!primaryImage) {
    return null;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)]">
      <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:block sm:space-y-3 sm:overflow-visible sm:pb-0">
        {product.images.slice(0, 6).map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            aria-label={`Preview ${product.title} image ${index + 1}`}
            className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface transition hover:border-brand sm:h-[72px] sm:w-[72px]"
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="72px"
              wrapperClassName="h-full w-full"
              className="h-full w-full object-contain p-2"
            />
          </button>
        ))}
      </div>

      <div className="order-1 relative overflow-hidden rounded-xl bg-surface-soft sm:order-2">
        <OptimizedImage
          src={primaryImage.src}
          alt={primaryImage.alt}
          width={primaryImage.width}
          height={primaryImage.height}
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          wrapperClassName="aspect-square w-full"
          className="h-full w-full object-contain p-10 sm:p-14 lg:p-20"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-surface/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
          View similar
        </span>
      </div>
    </section>
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
      <ActiveOffers product={product} />
      <ActionBar product={product} />
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

      <div>
        <h2 className="text-base font-black text-foreground">
          Rewards and Payment Offers
        </h2>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-surface-soft p-4">
          <p className="text-sm font-bold leading-6 text-foreground">
            {product.rewardText}
          </p>
          <PackageCheck size={28} className="text-danger" />
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

function ActiveOffers({ product }: { product: Product }) {
  return (
    <section className="mt-7">
      <h2 className="text-base font-black text-foreground">Active Offers</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {product.activeOffers.map((offer) => (
          <article
            key={offer.code}
            className="relative rounded-lg border border-success bg-success/18 p-4 text-center"
          >
            <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-md bg-foreground px-3 py-1 text-[10px] font-black uppercase text-background">
              {offer.label}
            </span>
            <p className="mt-1 text-base font-bold leading-5 text-foreground">
              {offer.title}
            </p>
            <div className="my-3 border-t border-background/70" />
            <p className="text-sm font-black text-brand">{offer.value}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-black text-foreground">
              Code: {offer.code}
              <Copy size={13} />
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionBar({ product }: { product: Product }) {
  const isOutOfStock = product.availability === "out-of-stock";

  return (
    <div className="mt-7 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="bg-success px-4 py-1 text-center text-xs font-black text-white">
        Personalise your product
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isOutOfStock}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
        >
          <ShoppingCart size={17} />
          {isOutOfStock ? "Out Of Stock" : "Add To Cart"}
        </button>
        <button
          type="button"
          disabled={isOutOfStock}
          className="h-12 rounded-lg bg-success px-5 text-sm font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

function ProductBentoGrid({ product }: { product: Product }) {
  const media = product.images.slice(0, 5);

  return (
    <section className="mt-12">
      <div className="mb-5">
        <p className="text-sm font-black uppercase text-brand">
          Product images
        </p>
        <h2 className="font-display text-3xl font-black text-foreground">
          A closer look
        </h2>
      </div>
      <div className="grid auto-rows-[180px] gap-3 sm:auto-rows-[220px] md:grid-cols-4">
        {media.map((image, index) => (
          <article
            key={`${image.src}-${index}`}
            className={
              index === 0
                ? "overflow-hidden rounded-xl bg-surface-soft md:col-span-2 md:row-span-2"
                : "overflow-hidden rounded-xl bg-surface-soft"
            }
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 768px) 100vw, 50vw"
              wrapperClassName="h-full w-full"
              className="h-full w-full object-contain p-8"
            />
          </article>
        ))}
      </div>
    </section>
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

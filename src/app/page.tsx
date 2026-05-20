import { Suspense } from "react";

import { BrandDeals } from "@/components/home/brand-deals";
import { CategoryGrid } from "@/components/home/category-grid";
import { CollabsShowcase } from "@/components/home/collabs-showcase";
import { HeroSlider } from "@/components/home/hero-slider";
import { HomeSkeleton } from "@/components/home/home-skeleton";
import { QuickMenuRail } from "@/components/home/quick-menu-rail";
import { TrustCards } from "@/components/home/trust-cards";
import { WarehouseCarousel } from "@/components/home/warehouse-carousel";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSettings } from "@/components/layout/site-header-with-settings";
import { getProducts as getStaticProducts } from "@/lib/products";
import { getHomePageDTO } from "@/server/public/home-dal";
import { getPublicProducts } from "@/server/public/products-dal";
import type { Product } from "@/types";

function mergeProductsWithStaticFallback(
  primaryProducts: Product[],
  fallbackProducts: Product[],
) {
  const seen = new Set<string>();
  const products: Product[] = [];

  for (const product of [...primaryProducts, ...fallbackProducts]) {
    if (seen.has(product.slug)) {
      continue;
    }

    seen.add(product.slug);
    products.push(product);
  }

  return products;
}

export default async function Home() {
  const [data, productList] = await Promise.all([
    getHomePageDTO(),
    getPublicProducts({ pageSize: 100 }),
  ]);
  const categoryProducts = mergeProductsWithStaticFallback(
    productList.items,
    getStaticProducts(),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderWithSettings
        brands={data.brands}
        categories={data.categories}
        variant="overlay"
      />
      <Suspense fallback={<HomeSkeleton />}>
        <main>
          <HeroSlider slides={data.heroSlides} />
          <QuickMenuRail items={data.quickMenus} />
          <BrandDeals brands={data.brands} />
          <CategoryGrid
            categories={data.categories}
            products={categoryProducts}
          />
          <WarehouseCarousel slides={data.warehouseSlides} />
          <TrustCards items={data.trustItems} />
          <CollabsShowcase slides={data.collabSlides} brands={data.brands} />
        </main>
      </Suspense>
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

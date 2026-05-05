import { Suspense } from "react";

import { BrandDeals } from "@/components/home/brand-deals";
import { CategoryGrid } from "@/components/home/category-grid";
import { CollabsShowcase } from "@/components/home/collabs-showcase";
import { HeroSlider } from "@/components/home/hero-slider";
import { HomeSkeleton } from "@/components/home/home-skeleton";
import { QuickMenuRail } from "@/components/home/quick-menu-rail";
import { TrustCards } from "@/components/home/trust-cards";
import { TrustAndVideo } from "@/components/home/trust-and-video";
import { WarehouseCarousel } from "@/components/home/warehouse-carousel";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getHomePageData } from "@/lib/catalog";

export default async function Home() {
  const data = await getHomePageData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        brands={data.brands}
        categories={data.categories}
        variant="overlay"
      />
      <Suspense fallback={<HomeSkeleton />}>
        <main>
          <HeroSlider slides={data.heroSlides} />
          <QuickMenuRail items={data.quickMenus} />
          <BrandDeals brands={data.brands} />
          <CategoryGrid categories={data.categories} />
          <WarehouseCarousel slides={data.warehouseSlides} />
          <TrustCards items={data.trustItems} />
          <CollabsShowcase slides={data.collabSlides} brands={data.brands} />
          <TrustAndVideo feature={data.videoFeature} />
        </main>
      </Suspense>
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

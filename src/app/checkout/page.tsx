import { CheckoutClient } from "@/components/checkout/checkout-client";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSettings } from "@/components/layout/site-header-with-settings";
import { getHomePageDTO } from "@/server/public/home-dal";

export default async function CheckoutPage() {
  const data = await getHomePageDTO();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderWithSettings brands={data.brands} categories={data.categories} />
      <CheckoutClient />
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

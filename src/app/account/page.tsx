import { AccountClient } from "@/components/account/account-client";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSettings } from "@/components/layout/site-header-with-settings";
import { getHomePageDTO } from "@/server/public/home-dal";

export default async function AccountPage() {
  const data = await getHomePageDTO();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderWithSettings brands={data.brands} categories={data.categories} />
      <AccountClient />
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

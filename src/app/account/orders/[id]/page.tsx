import { OrderDetailClient } from "@/components/account/order-detail-client";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSettings } from "@/components/layout/site-header-with-settings";
import { getHomePageDTO } from "@/server/public/home-dal";

type AccountOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const [{ id }, data] = await Promise.all([params, getHomePageDTO()]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderWithSettings brands={data.brands} categories={data.categories} />
      <OrderDetailClient id={id} />
      <SiteFooter brands={data.brands} categories={data.categories} />
      <MobileBottomNav brands={data.brands} categories={data.categories} />
    </div>
  );
}

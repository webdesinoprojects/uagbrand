import { SiteHeader } from "@/components/layout/site-header";
import {
  getPublicNavigationItems,
  getPublicSiteSettings,
} from "@/server/public/site-chrome-dal";
import type { Brand, Category } from "@/types";

type SiteHeaderWithSettingsProps = {
  brands: Brand[];
  categories: Category[];
  variant?: "solid" | "overlay";
};

export async function SiteHeaderWithSettings({
  brands,
  categories,
  variant = "solid",
}: SiteHeaderWithSettingsProps) {
  const [settings, navigation] = await Promise.all([
    getPublicSiteSettings(),
    getPublicNavigationItems("header"),
  ]);

  return (
    <SiteHeader
      brands={brands}
      categories={categories}
      logo={settings.logo}
      navLinks={navigation.items}
      siteName={settings.siteName}
      variant={variant}
    />
  );
}

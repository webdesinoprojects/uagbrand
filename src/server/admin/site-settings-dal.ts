import "server-only";

import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  AdminMediaReference,
  AdminSiteSettings,
  MediaResourceType,
} from "@/types/api";
import type { Tables, TablesUpdate } from "@/types/supabase";

type EmbeddedMedia = Pick<
  Tables<"media_assets">,
  "alt_text" | "height" | "id" | "resource_type" | "thumbnail_url" | "url" | "width"
> | null;

type Row = Pick<
  Tables<"site_settings">,
  | "address_label"
  | "contact_email"
  | "contact_phone"
  | "footer_description"
  | "logo_media_id"
  | "site_name"
  | "updated_at"
> & {
  logo: EmbeddedMedia;
};

const MEDIA_SELECT = "id,url,thumbnail_url,resource_type,alt_text,width,height";
const SELECT = `
  site_name,
  logo_media_id,
  contact_email,
  contact_phone,
  address_label,
  footer_description,
  updated_at,
  logo:media_assets!site_settings_logo_media_id_fkey(${MEDIA_SELECT})
`;

const FALLBACK_SETTINGS: AdminSiteSettings = {
  siteName: "ALLEARBUDS.COM",
  logoMediaId: null,
  logo: null,
  contactEmail: "support@allearbuds.com",
  contactPhone: "+91 00000 00000",
  addressLabel: "India dispatch center",
  footerDescription:
    "AllEarbuds is structured as a fast ecommerce storefront for audio, wearables, charging products and daily mobile accessories.",
  updatedAt: new Date(0).toISOString(),
};

export async function getAdminSiteSettings(): Promise<AdminSiteSettings> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("site_settings")
    .select(SELECT)
    .eq("id", true)
    .maybeSingle<Row>();

  if (result.error) throw result.error;
  return result.data ? mapRow(result.data) : FALLBACK_SETTINGS;
}

export async function updateAdminSiteSettings(
  input: TablesUpdate<"site_settings">,
): Promise<AdminSiteSettings> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("site_settings")
    .upsert({ id: true, ...input }, { onConflict: "id" })
    .select(SELECT)
    .single<Row>();

  if (result.error) throw result.error;
  return mapRow(result.data);
}

function mapRow(row: Row): AdminSiteSettings {
  return {
    siteName: row.site_name,
    logoMediaId: row.logo_media_id,
    logo: mapMedia(row.logo),
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    addressLabel: row.address_label,
    footerDescription: row.footer_description,
    updatedAt: row.updated_at,
  };
}

function mapMedia(row: EmbeddedMedia): AdminMediaReference | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    resourceType: row.resource_type as MediaResourceType,
    altText: row.alt_text,
    width: row.width,
    height: row.height,
  };
}

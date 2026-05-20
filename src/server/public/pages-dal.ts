import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import {
  staticPages,
  type StaticPageContent,
  type StaticPageSlug,
} from "@/lib/static-pages";
import { hasSupabasePublicEnv } from "@/server/env";
import { createSupabasePublicClient } from "@/server/supabase/public";
import type { PublicDataSource, PublicStaticPageData } from "@/types/api";
import type { Tables } from "@/types/supabase";

type PageRow = Pick<
  Tables<"pages">,
  "body" | "excerpt" | "seo_description" | "slug" | "title"
>;

export async function getPublicStaticPage(
  slug: string,
): Promise<PublicStaticPageData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`page:${slug}`);

  if (!hasSupabasePublicEnv()) {
    return getStaticPage(slug, "static");
  }

  try {
    const supabase = createSupabasePublicClient();
    const result = await supabase
      .from("pages")
      .select("slug,title,excerpt,body,seo_description")
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle<PageRow>();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return getStaticPage(slug, "static");
    }

    return {
      page: mapPageRow(result.data),
      source: "database",
    };
  } catch (error) {
    console.error("[public:pages-dal]", error);
    return getStaticPage(slug, "static");
  }
}

function getStaticPage(
  slug: string,
  source: PublicDataSource,
): PublicStaticPageData | null {
  const page = staticPages[slug as StaticPageSlug] as StaticPageContent | undefined;

  if (!page) {
    return null;
  }

  return {
    page,
    source,
  };
}

function mapPageRow(row: PageRow): StaticPageContent {
  const description = row.excerpt ?? row.seo_description ?? row.title;

  return {
    title: row.title,
    eyebrow: "Information",
    description,
    breadcrumbs: [{ label: "Home", href: "/" }, { label: row.title }],
    stats: [],
    sections: [
      {
        title: row.title,
        body: row.body ?? description,
        icon: "file",
      },
    ],
  };
}

import "server-only";

import {
  buildPaginationMeta,
  getPagination,
  type PaginationInput,
} from "@/server/http/pagination";
import { createSupabasePublicClient } from "@/server/supabase/public";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  ProductReviewItem,
  ProductReviewListData,
} from "@/types/api";
import type { Tables } from "@/types/supabase";

type ReviewRow = Pick<
  Tables<"reviews">,
  | "id"
  | "rating"
  | "title"
  | "body"
  | "verified_purchase"
  | "created_at"
>;

const REVIEW_PUBLIC_SELECT =
  "id,rating,title,body,verified_purchase,created_at";

export type SubmitReviewInput = {
  userId: string;
  productId: string;
  rating: number;
  title?: string | null;
  body?: string | null;
};

export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  // status defaults to 'draft' per migration; never accept user-supplied status.
  const result = await supabase.from("reviews").insert({
    user_id: input.userId,
    product_id: input.productId,
    rating: input.rating,
    title: input.title ?? null,
    body: input.body ?? null,
  });

  if (result.error) {
    throw result.error;
  }
}

export async function listPublicReviewsForProductSlug(
  slug: string,
  pageInput: PaginationInput = {},
): Promise<ProductReviewListData> {
  const pagination = getPagination(pageInput);
  const supabase = createSupabasePublicClient();

  const productResult = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<{ id: string }>();

  if (productResult.error) {
    throw productResult.error;
  }

  if (!productResult.data) {
    return {
      items: [],
      pagination: buildPaginationMeta({
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: 0,
      }),
    };
  }

  const reviewsResult = await supabase
    .from("reviews")
    .select(REVIEW_PUBLIC_SELECT, { count: "exact" })
    .eq("product_id", productResult.data.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (reviewsResult.error) {
    throw reviewsResult.error;
  }

  const rows = (reviewsResult.data ?? []) as ReviewRow[];

  return {
    items: rows.map(mapReviewRow),
    pagination: buildPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: reviewsResult.count ?? rows.length,
    }),
  };
}

function mapReviewRow(row: ReviewRow): ProductReviewItem {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verifiedPurchase: row.verified_purchase,
    createdAt: row.created_at,
  };
}

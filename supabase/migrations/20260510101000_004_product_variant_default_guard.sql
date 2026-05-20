-- 004_product_variant_default_guard
-- Keep each product to one default variant so public/product detail DTOs and
-- later cart defaults are deterministic.

create unique index if not exists product_variants_one_default_per_product_idx
on public.product_variants(product_id)
where selected_by_default = true;

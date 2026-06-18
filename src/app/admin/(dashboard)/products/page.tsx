import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Products | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Catalog",
  title: "Products",
  singularLabel: "product",
  description:
    "Create complete products from New Product. This table is for quick catalog edits.",
  endpoint: "/api/admin/products",
  createHref: "/admin/products/new",
  searchPlaceholder: "Search products, slugs or descriptions",
  defaultValues: {
    status: "published",
    rating: 0,
    ratingCount: 0,
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      helpText: "Lowercase words separated by hyphens. This controls /products/...",
    },
    {
      name: "brandId",
      label: "Brand",
      type: "select",
      required: true,
      relation: {
        endpoint: "/api/admin/brands",
        labelKey: "name",
        descriptionKey: "slug",
      },
    },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      required: true,
      relation: {
        endpoint: "/api/admin/categories",
        labelKey: "name",
        descriptionKey: "slug",
      },
    },
    { name: "badge", label: "Badge", type: "text" },
    { name: "feature", label: "Feature strip", type: "text" },
    { name: "tagline", label: "Tagline", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "rating", label: "Rating", type: "number" },
    { name: "ratingCount", label: "Rating count", type: "number" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
    },
    { name: "seoTitle", label: "SEO title", type: "text" },
    { name: "seoDescription", label: "SEO description", type: "textarea" },
  ],
  columns: [
    { label: "Title", value: "title" },
    { label: "Slug", value: "slug" },
    { label: "Brand", value: "brand.name" },
    { label: "Category", value: "category.name" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Rating", value: "rating", kind: "number" },
  ],
};

export default function AdminProductsPage() {
  return <AdminResourcePage config={config} />;
}

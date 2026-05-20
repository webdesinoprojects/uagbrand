import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Brands | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Catalog",
  title: "Brands",
  singularLabel: "brand",
  description:
    "Manage brand cards used by the header, filters, footer and Only Deals In Brands section.",
  endpoint: "/api/admin/brands",
  searchPlaceholder: "Search brands",
  defaultValues: {
    status: "published",
    sortOrder: 0,
  },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      helpText: "Lowercase words separated by hyphens. This controls the product filter URL.",
    },
    { name: "deal", label: "Deal text", type: "text" },
    {
      name: "logoMediaId",
      label: "Brand logo/image",
      type: "media",
      mediaResourceTypes: ["image", "gif"],
    },
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
    { name: "sortOrder", label: "Sort order", type: "number" },
    { name: "seoTitle", label: "SEO title", type: "text" },
    { name: "seoDescription", label: "SEO description", type: "textarea" },
  ],
  columns: [
    { label: "Logo", value: "logo", kind: "media" },
    { label: "Name", value: "name" },
    { label: "Slug", value: "slug" },
    { label: "Deal", value: "deal" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminBrandsPage() {
  return <AdminResourcePage config={config} />;
}

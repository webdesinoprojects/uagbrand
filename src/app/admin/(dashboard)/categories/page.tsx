import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Categories | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Catalog",
  title: "Categories",
  singularLabel: "category",
  description:
    "Control Explore Categories order, thumbnail image, hover GIF/video and category copy.",
  endpoint: "/api/admin/categories",
  searchPlaceholder: "Search categories",
  defaultValues: {
    status: "published",
    sortOrder: 0,
  },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "shortName", label: "Short name", type: "text", required: true },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      helpText: "Lowercase words separated by hyphens. This controls /products?category=...",
    },
    { name: "description", label: "Description", type: "textarea" },
    {
      name: "imageMediaId",
      label: "Thumbnail image",
      type: "media",
      mediaResourceTypes: ["image", "gif"],
    },
    {
      name: "hoverMediaId",
      label: "Hover GIF/video",
      type: "media",
      mediaResourceTypes: ["image", "gif", "video"],
      helpText:
        "Desktop shows this on hover/focus. Mobile auto-previews category cards one by one.",
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
    { label: "Image", value: "image", kind: "media" },
    { label: "Hover", value: "hoverMedia", kind: "media" },
    { label: "Name", value: "name" },
    { label: "Slug", value: "slug" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminCategoriesPage() {
  return <AdminResourcePage config={config} />;
}

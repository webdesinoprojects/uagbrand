import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Brand Collabs | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Homepage CMS",
  title: "Brand Collabs",
  singularLabel: "collab",
  description:
    "Manage the homepage Brand Product Banners video rail. Upload one ImageKit video per card; older image records are treated only as posters/fallbacks.",
  endpoint: "/api/admin/brand-collabs",
  searchPlaceholder: "Search collabs",
  defaultValues: {
    status: "published",
    sortOrder: 0,
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "subtitle", label: "Subtitle", type: "text" },
    {
      name: "brandId",
      label: "Linked brand",
      type: "select",
      relation: {
        endpoint: "/api/admin/brands",
        labelKey: "name",
        descriptionKey: "slug",
      },
    },
    {
      name: "mediaId",
      label: "Card video",
      type: "media",
      mediaResourceTypes: ["video"],
      uploadFolder: "home/collabs",
      helpText:
        "Use MP4/WebM campaign clips. The public section auto-plays videos with no controls.",
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
  ],
  columns: [
    { label: "Video", value: "media", kind: "media" },
    { label: "Title", value: "title" },
    { label: "Brand", value: "brand.name" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminCollabsPage() {
  return <AdminResourcePage config={config} />;
}

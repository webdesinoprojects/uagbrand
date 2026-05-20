import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Warehouse Carousel | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Homepage CMS",
  title: "Warehouse Carousel",
  singularLabel: "warehouse slide",
  description:
    "Manage the warehouse carousel image, text overlay, link and ordering on the homepage.",
  endpoint: "/api/admin/warehouse-slides",
  searchPlaceholder: "Search warehouse slides",
  defaultValues: {
    status: "published",
    sortOrder: 0,
    href: "/about",
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "subtitle", label: "Overlay text", type: "textarea" },
    { name: "href", label: "Link", type: "text" },
    {
      name: "mediaId",
      label: "Slide image",
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
  ],
  columns: [
    { label: "Image", value: "media", kind: "media" },
    { label: "Title", value: "title" },
    { label: "Overlay", value: "subtitle" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminWarehousePage() {
  return <AdminResourcePage config={config} />;
}

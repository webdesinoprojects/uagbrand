import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Hero Slides | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Homepage CMS",
  title: "Hero Carousel",
  singularLabel: "hero slide",
  description:
    "Edit the homepage hero image, headline, support text, offer pill, button label, link and display order.",
  endpoint: "/api/admin/hero-slides",
  searchPlaceholder: "Search hero slides",
  defaultValues: {
    status: "published",
    sortOrder: 0,
    href: "/products",
    ctaLabel: "Shop now",
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "eyebrow", label: "Eyebrow", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "offer", label: "Second button text", type: "text" },
    { name: "ctaLabel", label: "Main button text", type: "text" },
    { name: "href", label: "Button link", type: "text" },
    {
      name: "mediaId",
      label: "Hero image",
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
    { label: "Eyebrow", value: "eyebrow" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminHeroPage() {
  return <AdminResourcePage config={config} />;
}

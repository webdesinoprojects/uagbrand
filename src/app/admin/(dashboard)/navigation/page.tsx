import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Navigation | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Content",
  title: "Header Navigation",
  singularLabel: "navigation item",
  description:
    "Manage published header/menu links. Product category and brand filters still come from catalog records.",
  endpoint: "/api/admin/navigation",
  searchPlaceholder: "Search navigation labels",
  defaultValues: {
    location: "header",
    status: "published",
    sortOrder: 0,
  },
  fields: [
    { name: "location", label: "Location", type: "text", required: true },
    { name: "label", label: "Label", type: "text", required: true },
    { name: "href", label: "Link", type: "text", required: true },
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
    { label: "Location", value: "location" },
    { label: "Label", value: "label" },
    { label: "Link", value: "href" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminNavigationPage() {
  return <AdminResourcePage config={config} />;
}

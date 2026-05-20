import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Quick Menu Cards | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Homepage CMS",
  title: "Quick Menu Cards",
  singularLabel: "quick menu card",
  description:
    "Manage the compact six-card icon rail shown directly below the hero. Add more cards only when the homepage has room for them.",
  endpoint: "/api/admin/quick-menu",
  searchPlaceholder: "Search quick menu cards",
  defaultValues: {
    status: "published",
    sortOrder: 0,
  },
  fields: [
    { name: "label", label: "Card label", type: "text", required: true },
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
    { label: "Label", value: "label" },
    { label: "Link", value: "href" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminTopDealsPage() {
  return <AdminResourcePage config={config} />;
}

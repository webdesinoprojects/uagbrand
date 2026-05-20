import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";

export const metadata = {
  title: "Footer | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Content",
  title: "Footer Columns",
  singularLabel: "footer column",
  description:
    "Manage the footer column headings and order. Link-level editing is already available through the footer link APIs and will get a richer nested editor in the next admin slice.",
  endpoint: "/api/admin/footer-columns",
  searchPlaceholder: "Search footer columns",
  defaultValues: {
    status: "published",
    sortOrder: 0,
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
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
    { label: "Title", value: "title" },
    { label: "Status", value: "status", kind: "status" },
    { label: "Order", value: "sortOrder", kind: "number" },
  ],
};

export default function AdminFooterPage() {
  return <AdminResourcePage config={config} />;
}

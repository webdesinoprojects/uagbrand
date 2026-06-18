import {
  AdminResourcePage,
  type AdminResourceConfig,
} from "@/components/admin/admin-resource-page";
import { MediaUploaderClient } from "@/components/admin/media-uploader-client";

export const metadata = {
  title: "Media | Admin",
};

const config: AdminResourceConfig = {
  eyebrow: "Media library",
  title: "Media Assets",
  singularLabel: "media asset",
  description:
    "Register ImageKit image, GIF and video URLs for use across hero, categories, brands, products, warehouse and footer.",
  endpoint: "/api/admin/media",
  searchPlaceholder: "Search media URLs, folders or alt text",
  defaultValues: {
    resourceType: "image",
    folder: "cms",
  },
  fields: [
    {
      name: "url",
      label: "ImageKit URL",
      type: "text",
      required: true,
      helpText: "Use ImageKit-hosted URLs only for production content.",
    },
    { name: "thumbnailUrl", label: "Thumbnail URL", type: "text" },
    {
      name: "resourceType",
      label: "Resource type",
      type: "select",
      options: [
        { label: "Image", value: "image" },
        { label: "GIF", value: "gif" },
        { label: "Video", value: "video" },
        { label: "File", value: "file" },
      ],
    },
    { name: "altText", label: "Alt text", type: "text" },
    { name: "folder", label: "Folder", type: "text" },
    { name: "width", label: "Width", type: "number" },
    { name: "height", label: "Height", type: "number" },
    { name: "durationSeconds", label: "Duration seconds", type: "number" },
  ],
  columns: [
    { label: "Preview", value: "", kind: "media" },
    { label: "Alt text", value: "altText" },
    { label: "Type", value: "resourceType" },
    { label: "Folder", value: "folder" },
    { label: "URL", value: "url" },
  ],
};

export default function AdminMediaPage() {
  return (
    <div className="grid gap-6">
      <MediaUploaderClient defaultFolder="cms" />
      <AdminResourcePage config={config} />
    </div>
  );
}

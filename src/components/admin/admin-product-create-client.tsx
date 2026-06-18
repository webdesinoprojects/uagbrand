"use client";

import { upload, type UploadResponse } from "@imagekit/next";
import {
  Check,
  ImageIcon,
  Loader2,
  PackageCheck,
  Plus,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type {
  AdminBrandListData,
  AdminCategoryListData,
  AdminMediaAsset,
  AdminMediaListData,
  AdminMediaUploadSignatureData,
  AdminProduct,
  MediaResourceType,
  PublishStatus,
} from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

type ProductForm = {
  title: string;
  slug: string;
  brandId: string;
  categoryId: string;
  badge: string;
  feature: string;
  tagline: string;
  description: string;
  rating: string;
  ratingCount: string;
  status: PublishStatus;
  seoTitle: string;
  seoDescription: string;
  sku: string;
  colorName: string;
  colorSwatch: string;
  priceAmount: string;
  compareAtAmount: string;
  currency: string;
};

type SpecDraft = {
  id: string;
  label: string;
  value: string;
  groupName: string;
};

type Message = {
  tone: "success" | "error" | "info";
  text: string;
};

const GALLERY_SLOT_COUNT = 5;
const DEFAULT_SPECS: SpecDraft[] = [
  { id: "driver-size", label: "Driver Size", value: "", groupName: "Audio" },
  { id: "battery", label: "Battery", value: "", groupName: "Power" },
  { id: "bluetooth", label: "Bluetooth", value: "", groupName: "Connectivity" },
  { id: "warranty", label: "Warranty", value: "", groupName: "Service" },
];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const emptyForm: ProductForm = {
  title: "",
  slug: "",
  brandId: "",
  categoryId: "",
  badge: "",
  feature: "",
  tagline: "",
  description: "",
  rating: "0",
  ratingCount: "0",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  sku: "",
  colorName: "Default",
  colorSwatch: "#111318",
  priceAmount: "",
  compareAtAmount: "",
  currency: "INR",
};

export function AdminProductCreateClient() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [brands, setBrands] = useState<AdminBrandListData["items"]>([]);
  const [categories, setCategories] = useState<AdminCategoryListData["items"]>([]);
  const [mediaItems, setMediaItems] = useState<AdminMediaAsset[]>([]);
  const [galleryMediaIds, setGalleryMediaIds] = useState<string[]>(
    Array.from({ length: GALLERY_SLOT_COUNT }, () => ""),
  );
  const [useGalleryForBento, setUseGalleryForBento] = useState(true);
  const [bentoMediaIds, setBentoMediaIds] = useState<string[]>(
    Array.from({ length: GALLERY_SLOT_COUNT }, () => ""),
  );
  const [videoMediaId, setVideoMediaId] = useState("");
  const [specs, setSpecs] = useState<SpecDraft[]>(DEFAULT_SPECS);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [createdProduct, setCreatedProduct] = useState<AdminProduct | null>(null);

  const mediaById = useMemo(
    () => new Map(mediaItems.map((item) => [item.id, item])),
    [mediaItems],
  );

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      const [brandResponse, categoryResponse, mediaResponse] = await Promise.all([
        fetch("/api/admin/brands?pageSize=200", { cache: "no-store" }),
        fetch("/api/admin/categories?pageSize=200", { cache: "no-store" }),
        fetch("/api/admin/media?pageSize=200", { cache: "no-store" }),
      ]);

      const [brandPayload, categoryPayload, mediaPayload] = await Promise.all([
        parseApi<AdminBrandListData>(brandResponse),
        parseApi<AdminCategoryListData>(categoryResponse),
        parseApi<AdminMediaListData>(mediaResponse),
      ]);

      if (!active) {
        return;
      }

      if (!brandPayload.ok || !categoryPayload.ok || !mediaPayload.ok) {
        setMessage({
          tone: "error",
          text: "Admin options could not load. Please sign in again and retry.",
        });
        setLoadingOptions(false);
        return;
      }

      setBrands(brandPayload.data.items);
      setCategories(categoryPayload.data.items);
      setMediaItems(mediaPayload.data.items);
      setLoadingOptions(false);
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  function updateForm<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => {
      if (key === "title" && !slugTouched) {
        return {
          ...current,
          title: value,
          slug: slugify(String(value)),
          sku: current.sku || slugify(String(value)).toUpperCase(),
        };
      }

      return { ...current, [key]: value };
    });
  }

  function updateGallerySlot(index: number, mediaId: string) {
    setGalleryMediaIds((current) =>
      current.map((value, itemIndex) => (itemIndex === index ? mediaId : value)),
    );
  }

  function updateBentoSlot(index: number, mediaId: string) {
    setBentoMediaIds((current) =>
      current.map((value, itemIndex) => (itemIndex === index ? mediaId : value)),
    );
  }

  function updateSpec(id: string, field: keyof Omit<SpecDraft, "id">, value: string) {
    setSpecs((current) =>
      current.map((spec) => (spec.id === id ? { ...spec, [field]: value } : spec)),
    );
  }

  function addSpec() {
    setSpecs((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: "",
        value: "",
        groupName: "",
      },
    ]);
  }

  function removeSpec(id: string) {
    setSpecs((current) => current.filter((spec) => spec.id !== id));
  }

  function resetFormForNextProduct() {
    setForm(emptyForm);
    setGalleryMediaIds(Array.from({ length: GALLERY_SLOT_COUNT }, () => ""));
    setBentoMediaIds(Array.from({ length: GALLERY_SLOT_COUNT }, () => ""));
    setUseGalleryForBento(true);
    setVideoMediaId("");
    setSpecs(DEFAULT_SPECS.map((spec) => ({ ...spec })));
    setSlugTouched(false);
  }

  async function uploadSlotFile({
    file,
    kind,
    slotKey,
    onUploaded,
  }: {
    file: File;
    kind: "image" | "video";
    slotKey: string;
    onUploaded: (asset: AdminMediaAsset) => void;
  }) {
    setMessage(null);

    const validationMessage = validateLocalFile(file, kind);
    if (validationMessage) {
      setMessage({ tone: "error", text: validationMessage });
      return;
    }

    setUploadingSlot(slotKey);

    try {
      const signatureResponse = await fetch("/api/admin/media/upload-signature", {
        method: "POST",
      });
      const signaturePayload = await parseApi<AdminMediaUploadSignatureData>(
        signatureResponse,
      );

      if (!signaturePayload.ok) {
        setMessage({ tone: "error", text: signaturePayload.message });
        return;
      }

      const uploaded = await upload({
        file,
        fileName: file.name,
        folder: normalizeImageKitFolder(`products/${form.slug || "draft"}`),
        publicKey: signaturePayload.data.publicKey,
        signature: signaturePayload.data.signature,
        expire: signaturePayload.data.expire,
        token: signaturePayload.data.token,
        useUniqueFileName: true,
        responseFields: ["metadata", "isPublished"],
      });

      if (!uploaded.url) {
        setMessage({
          tone: "error",
          text: "Image upload completed but did not return a usable URL.",
        });
        return;
      }

      const created = await createMediaAsset(file, uploaded);
      setMediaItems((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      onUploaded(created);
      setMessage({
        tone: "success",
        text: `${kind === "video" ? "Video" : "Image"} uploaded and selected.`,
      });
    } catch {
      setMessage({
        tone: "error",
        text: "Media upload failed. Please check the file and try again.",
      });
    } finally {
      setUploadingSlot(null);
    }
  }

  async function createMediaAsset(file: File, uploaded: UploadResponse) {
    const resourceType = getResourceType(file, uploaded);
    const response = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: uploaded.url,
        providerFileId: uploaded.fileId ?? null,
        thumbnailUrl: uploaded.thumbnailUrl ?? null,
        resourceType,
        altText: stripExtension(file.name),
        width: uploaded.width ?? uploaded.metadata?.width ?? null,
        height: uploaded.height ?? uploaded.metadata?.height ?? null,
        durationSeconds: uploaded.metadata?.duration ?? null,
        bytes: uploaded.size ?? uploaded.metadata?.size ?? file.size,
        mimeType: file.type || null,
        folder: normalizeImageKitFolder(`products/${form.slug || "draft"}`),
        metadata: uploaded.metadata ?? {},
      }),
    });
    const payload = await parseApi<AdminMediaAsset>(response);

    if (!payload.ok) {
      throw new Error(payload.message);
    }

    return payload.data;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setCreatedProduct(null);

    const validationMessage = validateProductForm(form, galleryMediaIds);
    if (validationMessage) {
      setMessage({ tone: "error", text: validationMessage });
      return;
    }

    setSaving(true);
    const desiredStatus = form.status;

    try {
      const product = await createProductDraft(form);
      const variant = await createDefaultVariant(product.id, form);
      await attachProductMedia({
        productId: product.id,
        galleryMediaIds,
        bentoMediaIds: useGalleryForBento ? [] : bentoMediaIds,
        videoMediaId,
        variantId: variant.id,
      });
      await createSpecifications(product.id, specs);

      const finalProduct =
        desiredStatus === "draft"
          ? product
          : await updateProductStatus(product.id, desiredStatus);

      setCreatedProduct(finalProduct);
      setMessage({
        tone: "success",
        text: getCreateSuccessMessage(desiredStatus),
      });
      resetFormForNextProduct();
      router.refresh();
    } catch (error) {
      const text =
        error instanceof Error && error.message
          ? error.message
          : "Product could not be created. Please retry.";
      setMessage({
        tone: "error",
        text: `${text} If a draft was created, keep it unpublished until the missing step is fixed.`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-brand">Catalog</p>
          <h1 className="mt-2 font-display text-3xl font-black text-foreground">
            New Product
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-muted">
            Create a complete sellable product with pricing, gallery images,
            optional separate bento images, one product video and specifications.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-black text-foreground transition hover:border-brand hover:text-brand"
        >
          Back to products
        </Link>
      </section>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <Panel title="Product details" description="Public catalog identity and product copy.">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Title"
                required
                value={form.title}
                onChange={(value) => updateForm("title", value)}
              />
              <TextField
                label="Slug"
                required
                value={form.slug}
                helpText="Lowercase words separated by hyphens. This controls /products/..."
                onChange={(value) => {
                  setSlugTouched(true);
                  updateForm("slug", slugify(value));
                }}
              />
              <SelectField
                label="Brand"
                required
                value={form.brandId}
                placeholder="Select brand"
                disabled={loadingOptions}
                options={brands.map((brand) => ({
                  label: brand.name,
                  value: brand.id,
                }))}
                onChange={(value) => updateForm("brandId", value)}
              />
              <SelectField
                label="Category"
                required
                value={form.categoryId}
                placeholder="Select category"
                disabled={loadingOptions}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
                onChange={(value) => updateForm("categoryId", value)}
              />
              <TextField
                label="Badge"
                value={form.badge}
                placeholder="New Launch"
                onChange={(value) => updateForm("badge", value)}
              />
              <TextField
                label="Feature strip"
                value={form.feature}
                placeholder="60H Playback"
                onChange={(value) => updateForm("feature", value)}
              />
              <TextField
                label="Tagline"
                value={form.tagline}
                onChange={(value) => updateForm("tagline", value)}
              />
              <SelectField
                label="Status after save"
                value={form.status}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Published", value: "published" },
                  { label: "Archived", value: "archived" },
                ]}
                onChange={(value) => updateForm("status", value as PublishStatus)}
              />
              <label className="grid gap-2 text-xs font-black uppercase text-muted md:col-span-2">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  rows={4}
                  className="min-h-28 rounded-lg border border-border bg-background px-3 py-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
                />
              </label>
            </div>
          </Panel>

          <Panel title="Pricing and default variant" description="A product needs one variant before it can appear on the storefront.">
            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="SKU"
                required
                value={form.sku}
                onChange={(value) => updateForm("sku", value.toUpperCase())}
              />
              <TextField
                label="Selling price"
                required
                type="number"
                value={form.priceAmount}
                helpText="Use rupees, not paise."
                onChange={(value) => updateForm("priceAmount", value)}
              />
              <TextField
                label="Compare-at price"
                type="number"
                value={form.compareAtAmount}
                onChange={(value) => updateForm("compareAtAmount", value)}
              />
              <TextField
                label="Color name"
                value={form.colorName}
                onChange={(value) => updateForm("colorName", value)}
              />
              <TextField
                label="Color swatch"
                value={form.colorSwatch}
                helpText="Hex color, e.g. #111318"
                onChange={(value) => updateForm("colorSwatch", value)}
              />
              <TextField
                label="Currency"
                value={form.currency}
                onChange={(value) => updateForm("currency", value.toUpperCase())}
              />
              <TextField
                label="Rating"
                type="number"
                value={form.rating}
                onChange={(value) => updateForm("rating", value)}
              />
              <TextField
                label="Rating count"
                type="number"
                value={form.ratingCount}
                onChange={(value) => updateForm("ratingCount", value)}
              />
            </div>
          </Panel>

          <Panel title="Product media" description="Slot 1 is used for product cards and the first gallery thumbnail. Add up to 5 gallery images and 1 video.">
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                {galleryMediaIds.map((mediaId, index) => (
                  <MediaSlot
                    key={`gallery-${index}`}
                    label={index === 0 ? "Card / main image" : `Gallery image ${index + 1}`}
                    required={index === 0}
                    kind="image"
                    value={mediaId}
                    mediaOptions={mediaItems}
                    selectedMedia={mediaById.get(mediaId) ?? null}
                    uploading={uploadingSlot === `gallery-${index}`}
                    onChange={(value) => updateGallerySlot(index, value)}
                    onUpload={(file) =>
                      uploadSlotFile({
                        file,
                        kind: "image",
                        slotKey: `gallery-${index}`,
                        onUploaded: (asset) => updateGallerySlot(index, asset.id),
                      })
                    }
                  />
                ))}
              </div>

              <MediaSlot
                label="Product video"
                kind="video"
                value={videoMediaId}
                mediaOptions={mediaItems}
                selectedMedia={mediaById.get(videoMediaId) ?? null}
                uploading={uploadingSlot === "product-video"}
                onChange={setVideoMediaId}
                onUpload={(file) =>
                  uploadSlotFile({
                    file,
                    kind: "video",
                    slotKey: "product-video",
                    onUploaded: (asset) => setVideoMediaId(asset.id),
                  })
                }
              />
            </div>
          </Panel>

          <Panel title="Closer look bento media" description="Use the same images as the gallery, or upload separate images for the bento section.">
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm font-black text-foreground">
              <input
                type="checkbox"
                checked={useGalleryForBento}
                onChange={(event) => setUseGalleryForBento(event.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Use gallery images for the bento section
            </label>
            {!useGalleryForBento ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {bentoMediaIds.map((mediaId, index) => (
                  <MediaSlot
                    key={`bento-${index}`}
                    label={`Bento image ${index + 1}`}
                    kind="image"
                    value={mediaId}
                    mediaOptions={mediaItems}
                    selectedMedia={mediaById.get(mediaId) ?? null}
                    uploading={uploadingSlot === `bento-${index}`}
                    onChange={(value) => updateBentoSlot(index, value)}
                    onUpload={(file) =>
                      uploadSlotFile({
                        file,
                        kind: "image",
                        slotKey: `bento-${index}`,
                        onUploaded: (asset) => updateBentoSlot(index, asset.id),
                      })
                    }
                  />
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="Specifications" description="Optional product specification rows for the detail page.">
            <div className="grid gap-3">
              {specs.map((spec) => (
                <div
                  key={spec.id}
                  className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <TextField
                    label="Label"
                    value={spec.label}
                    onChange={(value) => updateSpec(spec.id, "label", value)}
                  />
                  <TextField
                    label="Value"
                    value={spec.value}
                    onChange={(value) => updateSpec(spec.id, "value", value)}
                  />
                  <TextField
                    label="Group"
                    value={spec.groupName}
                    onChange={(value) => updateSpec(spec.id, "groupName", value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(spec.id)}
                    className="mt-6 grid h-11 w-11 place-items-center rounded-lg border border-border text-danger transition hover:border-danger md:mt-auto"
                    aria-label="Remove specification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSpec}
                className="inline-flex h-11 w-fit items-center gap-2 rounded-lg border border-border px-4 text-sm font-black text-foreground transition hover:border-brand hover:text-brand"
              >
                <Plus size={16} />
                Add specification
              </button>
            </div>
          </Panel>

          <Panel title="SEO" description="Optional search metadata.">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="SEO title"
                value={form.seoTitle}
                onChange={(value) => updateForm("seoTitle", value)}
              />
              <label className="grid gap-2 text-xs font-black uppercase text-muted">
                SEO description
                <textarea
                  value={form.seoDescription}
                  onChange={(event) => updateForm("seoDescription", event.target.value)}
                  rows={3}
                  className="min-h-24 rounded-lg border border-border bg-background px-3 py-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
                />
              </label>
            </div>
          </Panel>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] xl:sticky xl:top-24">
          <p className="text-xs font-black uppercase text-brand">Publish checklist</p>
          <h2 className="mt-2 text-xl font-black text-foreground">Product readiness</h2>
          <ul className="mt-4 grid gap-3 text-sm font-bold text-muted">
            <ChecklistItem done={Boolean(form.title && form.slug)}>
              Title and URL slug
            </ChecklistItem>
            <ChecklistItem done={Boolean(form.brandId && form.categoryId)}>
              Brand and category
            </ChecklistItem>
            <ChecklistItem done={Boolean(form.sku && form.priceAmount)}>
              SKU and price
            </ChecklistItem>
            <ChecklistItem done={Boolean(galleryMediaIds[0])}>
              Card / main product image
            </ChecklistItem>
            <ChecklistItem done={Boolean(videoMediaId)}>
              Product video optional
            </ChecklistItem>
          </ul>

          {message ? (
            <p
              className={[
                "mt-5 rounded-lg border px-3 py-2 text-sm font-bold leading-5",
                message.tone === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : message.tone === "error"
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-border bg-background text-muted",
              ].join(" ")}
            >
              {message.text}
            </p>
          ) : null}

          {createdProduct ? (
            <div className="mt-4 grid gap-2 rounded-lg border border-border bg-background p-3">
              <p className="text-sm font-black text-foreground">
                {createdProduct.title}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/products/${createdProduct.slug}`}
                  className="rounded-md bg-slate-950 px-3 py-2 text-xs font-black text-white"
                >
                  View product
                </Link>
                <Link
                  href="/admin/products"
                  className="rounded-md border border-border px-3 py-2 text-xs font-black text-foreground"
                >
                  Product list
                </Link>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving || loadingOptions || Boolean(uploadingSlot)}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-black text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <PackageCheck size={17} />}
            {createdProduct ? "Create another product" : "Create complete product"}
          </button>
          <p className="mt-3 text-xs font-bold leading-5 text-muted">
            The product is created as draft first and published only after variant,
            media and specs are saved successfully.
          </p>
        </aside>
      </form>
    </div>
  );
}

function getCreateSuccessMessage(status: PublishStatus) {
  if (status === "published") {
    return "Product created and published.";
  }

  if (status === "archived") {
    return "Product created and archived.";
  }

  return "Product created as draft.";
}

function Panel({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div>
        <h2 className="text-xl font-black text-foreground">{title}</h2>
        <p className="mt-1 text-sm font-bold leading-6 text-muted">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextField({
  helpText,
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  helpText?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "number";
  value: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase text-muted">
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      <input
        value={value}
        type={type}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
      />
      {helpText ? <span className="normal-case leading-5 text-muted">{helpText}</span> : null}
    </label>
  );
}

function SelectField({
  disabled,
  label,
  onChange,
  options,
  placeholder,
  required,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase text-muted">
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MediaSlot({
  kind,
  label,
  mediaOptions,
  onChange,
  onUpload,
  required,
  selectedMedia,
  uploading,
  value,
}: {
  kind: "image" | "video";
  label: string;
  mediaOptions: AdminMediaAsset[];
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
  required?: boolean;
  selectedMedia: AdminMediaAsset | null;
  uploading: boolean;
  value: string;
}) {
  const options = mediaOptions.filter((item) =>
    kind === "video"
      ? item.resourceType === "video"
      : item.resourceType === "image" || item.resourceType === "gif",
  );

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
      <span className="text-xs font-black uppercase text-muted">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm font-bold text-foreground outline-none transition focus:border-brand"
        >
          <option value="">Select existing {kind}</option>
          {options.map((media) => (
            <option key={media.id} value={media.id}>
              {media.altText || media.url.split("/").pop() || media.id}
            </option>
          ))}
        </select>
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-black text-foreground transition hover:border-brand hover:text-brand">
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <UploadCloud size={15} />
          )}
          Upload
          <input
            type="file"
            accept={kind === "video" ? "video/*" : "image/*"}
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                onUpload(file);
              }
            }}
          />
        </label>
      </div>
      {selectedMedia ? <MediaPreview media={selectedMedia} /> : null}
    </div>
  );
}

function MediaPreview({ media }: { media: AdminMediaAsset }) {
  const src = media.thumbnailUrl ?? media.url;

  return (
    <span className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
      <span className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-soft">
        {media.resourceType === "video" ? (
          <Video size={20} className="text-muted" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={media.altText ?? ""}
            className="h-full w-full object-cover"
          />
        )}
      </span>
      <span className="min-w-0 text-xs font-bold text-foreground">
        <span className="block truncate">
          {media.altText || media.url.split("/").pop() || media.id}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 uppercase text-muted">
          <ImageIcon size={12} />
          {media.resourceType}
        </span>
      </span>
    </span>
  );
}

function ChecklistItem({
  children,
  done,
}: {
  children: React.ReactNode;
  done: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={[
          "grid h-5 w-5 place-items-center rounded-full border",
          done
            ? "border-success bg-success text-white"
            : "border-border bg-background text-transparent",
        ].join(" ")}
      >
        <Check size={12} />
      </span>
      {children}
    </li>
  );
}

async function createProductDraft(form: ProductForm) {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug: form.slug,
      brandId: form.brandId,
      categoryId: form.categoryId,
      title: form.title,
      badge: optionalText(form.badge),
      feature: optionalText(form.feature),
      tagline: optionalText(form.tagline),
      description: optionalText(form.description),
      rating: toNumber(form.rating, 0),
      ratingCount: Math.round(toNumber(form.ratingCount, 0)),
      status: "draft",
      seoTitle: optionalText(form.seoTitle),
      seoDescription: optionalText(form.seoDescription),
    }),
  });
  const payload = await parseApi<AdminProduct>(response);

  if (!payload.ok) {
    throw new Error(payload.message);
  }

  return payload.data;
}

async function createDefaultVariant(productId: string, form: ProductForm) {
  const response = await fetch(`/api/admin/products/${productId}/variants`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sku: form.sku.trim(),
      colorName: optionalText(form.colorName),
      colorSwatch: form.colorSwatch.trim() || "#111318",
      isAvailable: true,
      priceAmount: Math.round(toNumber(form.priceAmount, 0)),
      compareAtAmount:
        form.compareAtAmount.trim() === ""
          ? null
          : Math.round(toNumber(form.compareAtAmount, 0)),
      currency: form.currency.trim().toUpperCase() || "INR",
      selectedByDefault: true,
    }),
  });
  const payload = await parseApi<{ id: string }>(response);

  if (!payload.ok) {
    throw new Error(payload.message);
  }

  return payload.data;
}

async function attachProductMedia({
  bentoMediaIds,
  galleryMediaIds,
  productId,
  variantId,
  videoMediaId,
}: {
  bentoMediaIds: string[];
  galleryMediaIds: string[];
  productId: string;
  variantId: string;
  videoMediaId: string;
}) {
  const attachments = [
    ...galleryMediaIds
      .filter(Boolean)
      .map((mediaId, index) => ({
        mediaId,
        variantId,
        role: "gallery",
        sortOrder: index,
      })),
    ...bentoMediaIds
      .filter(Boolean)
      .map((mediaId, index) => ({
        mediaId,
        variantId,
        role: "bento",
        sortOrder: 100 + index,
      })),
    ...(videoMediaId
      ? [
          {
            mediaId: videoMediaId,
            variantId,
            role: "video",
            sortOrder: 200,
          },
        ]
      : []),
  ];

  for (const attachment of attachments) {
    const response = await fetch(`/api/admin/products/${productId}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(attachment),
    });
    const payload = await parseApi<unknown>(response);

    if (!payload.ok) {
      throw new Error(payload.message);
    }
  }
}

async function createSpecifications(productId: string, specs: SpecDraft[]) {
  const validSpecs = specs.filter(
    (spec) => spec.label.trim() && spec.value.trim(),
  );

  for (const [index, spec] of validSpecs.entries()) {
    const response = await fetch(`/api/admin/products/${productId}/specs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: spec.label.trim(),
        value: spec.value.trim(),
        groupName: optionalText(spec.groupName),
        sortOrder: index,
      }),
    });
    const payload = await parseApi<unknown>(response);

    if (!payload.ok) {
      throw new Error(payload.message);
    }
  }
}

async function updateProductStatus(productId: string, status: PublishStatus) {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const payload = await parseApi<AdminProduct>(response);

  if (!payload.ok) {
    throw new Error(payload.message);
  }

  return payload.data;
}

function validateProductForm(form: ProductForm, galleryMediaIds: string[]) {
  if (!form.title.trim()) return "Product title is required.";
  if (!form.slug.trim()) return "Product slug is required.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
    return "Slug can only use lowercase letters, numbers and hyphens.";
  }
  if (!form.brandId) return "Choose a brand.";
  if (!form.categoryId) return "Choose a category.";
  if (!form.sku.trim()) return "SKU is required.";
  if (!form.priceAmount.trim() || toNumber(form.priceAmount, 0) <= 0) {
    return "Selling price must be greater than zero.";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(form.colorSwatch.trim() || "#111318")) {
    return "Color swatch must be a valid hex color.";
  }
  if (!galleryMediaIds[0]) {
    return "Choose or upload the card / main product image.";
  }
  return null;
}

function validateLocalFile(file: File, kind: "image" | "video") {
  if (kind === "image") {
    if (!file.type.startsWith("image/")) {
      return "Choose an image file for this slot.";
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return "Image files must be 10 MB or smaller.";
    }
    return null;
  }

  if (!file.type.startsWith("video/")) {
    return "Choose a video file for this slot.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "Video files must be 100 MB or smaller.";
  }
  return null;
}

async function parseApi<T>(
  response: Response,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    return { ok: false, message: "The server did not return a usable response." };
  }

  if (!response.ok || !payload.ok) {
    return {
      ok: false,
      message: payload.ok
        ? "The request could not be completed."
        : payload.error.message,
    };
  }

  return { ok: true, data: payload.data };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeImageKitFolder(value: string) {
  const cleaned = value
    .trim()
    .replaceAll("\\", "/")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");

  return cleaned || "products";
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || fileName;
}

function getResourceType(file: File, uploaded: UploadResponse): MediaResourceType {
  if (file.type === "image/gif" || uploaded.url?.toLowerCase().endsWith(".gif")) {
    return "gif";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return "file";
}

"use client";

import { Maximize2, Play, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { ImageAsset, Product } from "@/types";

type ProductMediaGalleryProps = {
  product: Product;
};

type MediaItem =
  | {
      type: "image";
      image: ImageAsset;
      label: string;
    }
  | {
      type: "video";
      poster: ImageAsset;
      src: string;
      label: string;
    };

const DEMO_VIDEO_SRC = "/assets/content/our-product-video.mp4";
const IMAGE_SLOT_COUNT = 5;

export function ProductMediaGallery({ product }: ProductMediaGalleryProps) {
  const mediaItems = useProductMediaItems(product, "gallery");
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<ImageAsset | null>(null);
  const activeItem = mediaItems[activeIndex] ?? mediaItems[0];

  if (!activeItem) {
    return null;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-[76px_minmax(0,1fr)]">
      <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:block sm:space-y-3 sm:overflow-visible sm:pb-0">
        {mediaItems.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            aria-label={`Show ${item.label}`}
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className="relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded-lg border border-border bg-surface transition hover:border-brand aria-pressed:border-brand aria-pressed:ring-2 aria-pressed:ring-brand/25 sm:h-[76px] sm:w-[76px]"
          >
            {item.type === "image" ? (
              <OptimizedImage
                src={item.image.src}
                alt={item.image.alt}
                width={item.image.width}
                height={item.image.height}
                sizes="76px"
                wrapperClassName="h-full w-full"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <>
                <OptimizedImage
                  src={item.poster.src}
                  alt={item.poster.alt}
                  width={item.poster.width}
                  height={item.poster.height}
                  sizes="76px"
                  wrapperClassName="h-full w-full"
                  className="h-full w-full object-contain p-2"
                />
                <span className="absolute inset-0 grid place-items-center bg-foreground/20 text-white">
                  <Play size={18} className="fill-white" />
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="order-1 relative overflow-hidden rounded-xl bg-surface-soft sm:order-2">
        {activeItem.type === "image" ? (
          <>
            <button
              type="button"
              aria-label="Zoom product image"
              onClick={() => setZoomImage(activeItem.image)}
              className="group block w-full"
            >
              <OptimizedImage
                src={activeItem.image.src}
                alt={activeItem.image.alt}
                width={activeItem.image.width}
                height={activeItem.image.height}
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                wrapperClassName="aspect-square w-full"
                className="h-full w-full object-contain p-10 transition duration-300 group-hover:scale-[1.03] sm:p-14 lg:p-20"
              />
            </button>
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
              <Maximize2 size={13} />
              Zoom
            </span>
          </>
        ) : (
          <video
            key={activeItem.src}
            autoPlay
            loop
            muted
            playsInline
            poster={activeItem.poster.src}
            className="aspect-square h-full w-full bg-surface-soft object-cover"
          >
            <source src={activeItem.src} type="video/mp4" />
          </video>
        )}
      </div>

      {zoomImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/80 p-4"
        >
          <button
            type="button"
            aria-label="Close zoom"
            onClick={() => setZoomImage(null)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-surface text-foreground shadow-lg"
          >
            <X size={20} />
          </button>
          <Image
            src={zoomImage.src}
            alt={zoomImage.alt}
            width={zoomImage.width}
            height={zoomImage.height}
            sizes="95vw"
            className="max-h-[90vh] w-auto max-w-[95vw] rounded-xl bg-surface object-contain p-6"
          />
        </div>
      ) : null}
    </section>
  );
}

export function ProductBentoMediaGrid({ product }: ProductMediaGalleryProps) {
  const mediaItems = useProductMediaItems(product, "bento");

  return (
    <section className="mt-12">
      <div className="mb-5">
        <p className="text-sm font-black uppercase text-brand">
          Product images
        </p>
        <h2 className="font-display text-3xl font-black text-foreground">
          A closer look
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-4 md:auto-rows-[190px] lg:auto-rows-[220px]">
        {mediaItems.map((item, index) => (
          <article
            key={`${item.label}-${index}`}
            className={getBentoItemClassName(index)}
          >
            {item.type === "image" ? (
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={getBentoImageClassName(index)}
              />
            ) : (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster={item.poster.src}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source src={item.src} type="video/mp4" />
              </video>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function getBentoItemClassName(index: number) {
  const base =
    "relative min-h-[190px] overflow-hidden rounded-xl bg-slate-950 shadow-sm";

  if (index === 0) {
    return `${base} md:col-span-2 md:row-span-2`;
  }

  if (index === 5) {
    return `${base} md:col-span-4`;
  }

  return base;
}

function getBentoImageClassName(index: number) {
  const base = "object-cover";

  if (index === 0) {
    return `${base} scale-[1.9]`;
  }

  if (index === 1 || index === 3) {
    return `${base} scale-[1.45]`;
  }

  return `${base} scale-[1.16]`;
}

function useProductMediaItems(product: Product, surface: "gallery" | "bento") {
  return useMemo(() => buildProductMediaItems(product, surface), [product, surface]);
}

function buildProductMediaItems(
  product: Product,
  surface: "gallery" | "bento",
): MediaItem[] {
  const images =
    surface === "bento" && product.bentoImages && product.bentoImages.length > 0
      ? product.bentoImages
      : product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : product.images.filter((image) => image.resourceType !== "video");
  const firstImage = images[0];

  if (!firstImage) {
    return [];
  }

  const imageItems = Array.from({ length: IMAGE_SLOT_COUNT }, (_, index) => ({
    type: "image" as const,
    image: images[index % images.length] ?? firstImage,
    label: `${product.title} image ${index + 1}`,
  }));

  return [
    ...imageItems,
    {
      type: "video",
      poster: firstImage,
      src: product.productVideo?.src ?? DEMO_VIDEO_SRC,
      label: `${product.title} video`,
    },
  ];
}

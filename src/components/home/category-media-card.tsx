"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Category } from "@/types";

type CategoryMediaCardProps = {
  category: Category;
  gifSrc: string;
  isAutoPreviewing?: boolean;
};

export function CategoryMediaCard({
  category,
  gifSrc,
  isAutoPreviewing = false,
}: CategoryMediaCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const shouldShowPreview = isPreviewing || isAutoPreviewing;

  return (
    <Link
      href={category.href}
      className="group block w-[34vw] min-w-[132px] max-w-[160px] flex-none snap-start touch-pan-x rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:w-auto sm:max-w-none sm:flex-auto sm:touch-pan-y"
      onBlur={() => setIsPreviewing(false)}
      onFocus={() => setIsPreviewing(true)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") {
          setIsPreviewing(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") {
          setIsPreviewing(false);
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-soft shadow-sm ring-1 ring-border transition duration-200 group-hover:ring-brand sm:aspect-[1.9/1] sm:rounded-xl">
        <OptimizedImage
          src={category.image.src}
          alt={category.image.alt}
          width={category.image.width}
          height={category.image.height}
          sizes="(max-width: 640px) 34vw, (max-width: 1024px) 50vw, 33vw"
          wrapperClassName="h-full w-full bg-surface-soft"
          className="h-full w-full object-contain p-3 sm:p-5"
        />
        {shouldShowPreview ? (
          <Image
            src={gifSrc}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            sizes="(max-width: 640px) 34vw, (max-width: 1024px) 50vw, 33vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition group-hover:opacity-100 max-sm:hidden" />
      </div>

      <div className="px-0 pb-1 pt-1 text-center sm:px-1 sm:pt-2">
        <h3 className="line-clamp-2 min-h-8 font-display text-xs font-black leading-4 text-foreground sm:min-h-0 sm:text-base sm:leading-5">
          {category.shortName}
        </h3>
        <p className="mx-auto mt-1 hidden max-w-64 text-xs leading-5 text-muted sm:line-clamp-2">
          {category.description}
        </p>
        <span className="mt-2 hidden items-center gap-1 text-xs font-extrabold text-brand sm:inline-flex">
          View products
          <ArrowRight
            size={14}
            className="transition group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

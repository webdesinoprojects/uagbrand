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
};

export function CategoryMediaCard({
  category,
  gifSrc,
}: CategoryMediaCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);

  return (
    <Link
      href={category.href}
      className="group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      onBlur={() => setIsPreviewing(false)}
      onFocus={() => setIsPreviewing(true)}
      onPointerEnter={() => setIsPreviewing(true)}
      onPointerLeave={() => setIsPreviewing(false)}
    >
      <div className="relative aspect-[1.9/1] overflow-hidden rounded-xl bg-surface-soft shadow-sm ring-1 ring-border transition duration-200 group-hover:ring-brand">
        <OptimizedImage
          src={category.image.src}
          alt={category.image.alt}
          width={category.image.width}
          height={category.image.height}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          wrapperClassName="h-full w-full bg-surface-soft"
          className="h-full w-full object-contain p-5"
        />
        {isPreviewing ? (
          <Image
            src={gifSrc}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>

      <div className="px-1 pb-1 pt-2 text-center">
        <h3 className="font-display text-sm font-black leading-5 text-foreground sm:text-base">
          {category.shortName}
        </h3>
        <p className="mx-auto mt-1 line-clamp-2 max-w-64 text-xs leading-5 text-muted">
          {category.description}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-brand">
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

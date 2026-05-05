"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type OptimizedImageProps = Omit<ImageProps, "alt"> & {
  alt: string;
  wrapperClassName?: string;
  skeletonClassName?: string;
};

export function OptimizedImage({
  wrapperClassName,
  skeletonClassName,
  className,
  alt,
  onLoad,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={cn("relative block overflow-hidden", wrapperClassName)}>
      {!loaded ? (
        <span
          aria-hidden="true"
          className={cn("skeleton absolute inset-0", skeletonClassName)}
        />
      ) : null}
      <Image
        {...props}
        alt={alt}
        className={cn(
          "duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
    </span>
  );
}

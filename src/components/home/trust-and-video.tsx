import { ProductVideoCard } from "@/components/home/product-video-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { VideoFeature } from "@/types";

type TrustAndVideoProps = {
  feature: VideoFeature;
};

export function TrustAndVideo({ feature }: TrustAndVideoProps) {
  return (
    <section className="soft-enter bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Product video"
          title="Watch The Product Reel"
          description="A full-width video area for product reels, warehouse clips and launch footage."
        />

        <div className="grid gap-4">
          <ProductVideoCard feature={feature} />
        </div>
      </div>
    </section>
  );
}

import { CategoryMediaCard } from "@/components/home/category-media-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Category } from "@/types";

type CategoryGridProps = {
  categories: Category[];
};

const categoryGifMap: Record<string, string> = {
  earbuds: "/assets/category-gifs/earbuds.gif",
  "wired-earphones": "/assets/category-gifs/earbuds.gif",
  neckband: "/assets/category-gifs/neckband.gif",
  "wireless-headphones": "/assets/category-gifs/neckband.gif",
  "smart-watch": "/assets/category-gifs/watch.gif",
};

const fallbackGifs = [
  "/assets/category-gifs/earbuds.gif",
  "/assets/category-gifs/neckband.gif",
  "/assets/category-gifs/watch.gif",
] as const;

function getCategoryGif(category: Category, index: number) {
  return (
    categoryGifMap[category.slug] ??
    fallbackGifs[index % fallbackGifs.length] ??
    fallbackGifs[0]
  );
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section id="categories" className="soft-enter bg-background py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Shop by need"
          title="Explore Categories"
          description="Quick paths for earbuds, watches, charging gear and daily mobile accessories."
        />

        <div className="grid gap-x-3 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryMediaCard
              key={category.slug}
              category={category}
              gifSrc={getCategoryGif(category, index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

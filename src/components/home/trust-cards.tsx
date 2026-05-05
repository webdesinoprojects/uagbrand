import type { TrustItem } from "@/types";

type TrustCardsProps = {
  items: TrustItem[];
};

export function TrustCards({ items }: TrustCardsProps) {
  return (
    <section className="soft-enter bg-background py-8">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {items.map((item) => (
          <article
            key={item.title}
            className="card-hover rounded-xl border border-border bg-surface p-5"
          >
            <p className="font-display text-3xl font-black text-brand">
              {item.metric}
            </p>
            <h3 className="mt-3 text-base font-black text-foreground">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

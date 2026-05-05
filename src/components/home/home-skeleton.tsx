export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="skeleton h-10 w-10 rounded-md" />
          <div className="skeleton h-10 w-10 rounded-md" />
          <div className="skeleton h-9 w-48 rounded-md" />
          <div className="ml-auto hidden h-10 w-72 rounded-md bg-surface-soft xl:block" />
          <div className="skeleton h-10 w-10 rounded-md" />
          <div className="skeleton h-10 w-10 rounded-md" />
        </div>
      </div>

      <main>
        <section className="border-b border-border bg-surface-soft">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8 lg:py-7">
            <div className="rounded-lg border border-border bg-surface p-5 sm:p-7">
              <div className="skeleton h-4 w-28 rounded-sm" />
              <div className="skeleton mt-5 h-12 w-11/12 rounded-md" />
              <div className="skeleton mt-3 h-12 w-8/12 rounded-md" />
              <div className="skeleton mt-6 h-5 w-full rounded-sm" />
              <div className="skeleton mt-3 h-5 w-9/12 rounded-sm" />
              <div className="mt-7 flex gap-3">
                <div className="skeleton h-12 w-40 rounded-md" />
                <div className="skeleton h-12 w-36 rounded-md" />
              </div>
            </div>
            <div className="skeleton aspect-[16/9] rounded-lg border border-border lg:min-h-[430px]" />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="skeleton h-16 min-w-40 rounded-lg border border-border"
              />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="skeleton h-8 w-72 rounded-md" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="skeleton aspect-[1.25] rounded-lg border border-border"
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

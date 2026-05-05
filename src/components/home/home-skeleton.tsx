export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="relative h-[100svh] min-h-[100svh] overflow-hidden bg-surface md:h-[78svh] md:min-h-[520px] md:max-h-[820px] lg:h-[82svh]">
          <div className="skeleton absolute inset-0" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.76)_0%,rgba(0,0,0,0.52)_36%,rgba(0,0,0,0.1)_62%,rgba(0,0,0,0.3)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.54)_34%,rgba(0,0,0,0.16)_68%,rgba(0,0,0,0.05)_100%)]" />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-xl flex-col justify-center px-5 pt-16 sm:px-8 md:max-w-3xl md:px-12 md:py-24 lg:px-20">
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

"use client";

type AppErrorProps = {
  reset: () => void;
};

export default function AppError({ reset }: AppErrorProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
        <p className="text-sm font-bold uppercase text-danger">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-black">
          This page did not load properly
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Please refresh or try again in a moment. Your cart and account details
          are safe.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-strong"
        >
          Try again
        </button>
      </section>
    </main>
  );
}

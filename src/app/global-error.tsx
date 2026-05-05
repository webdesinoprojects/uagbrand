"use client";

type GlobalErrorProps = {
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 20,
            fontFamily: "Arial, Helvetica, sans-serif",
            background: "#f8fafc",
            color: "#111827",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 420,
              border: "1px solid #dbe3ee",
              borderRadius: 8,
              background: "#ffffff",
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, color: "#dc2626", fontWeight: 700 }}>
              Something went wrong
            </p>
            <h1 style={{ margin: "12px 0 0", fontSize: 24 }}>
              This page did not load properly
            </h1>
            <p style={{ margin: "12px 0 0", color: "#64748b", lineHeight: 1.6 }}>
              Please refresh or try again in a moment. Your cart and account
              details are safe.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 24,
                height: 44,
                border: 0,
                borderRadius: 6,
                background: "#0284c7",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 700,
                padding: "0 20px",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

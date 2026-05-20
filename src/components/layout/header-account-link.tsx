"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type HeaderAccountLinkProps = {
  className?: string;
};

type SessionResponse = {
  ok: boolean;
  data?: {
    authenticated: boolean;
  };
};

export function HeaderAccountLink({ className }: HeaderAccountLinkProps) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as SessionResponse | null;

      if (!cancelled && response.ok && payload?.ok) {
        setAuthenticated(Boolean(payload.data?.authenticated));
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const accountLabel = authenticated ? "Account" : "Login / Register";

  return (
    <Link
      href="/account"
      title={accountLabel}
      aria-label={accountLabel}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-2 text-xs font-extrabold transition sm:h-10 sm:px-3",
        className,
      )}
    >
      <UserRound size={16} />
      <span className="hidden whitespace-nowrap lg:inline">{accountLabel}</span>
    </Link>
  );
}

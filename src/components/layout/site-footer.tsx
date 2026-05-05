import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Brand, Category } from "@/types";

type SiteFooterProps = {
  brands: Brand[];
  categories: Category[];
};

export function SiteFooter({ brands, categories }: SiteFooterProps) {
  const supportLinks = [
    { href: "/about", label: "About us" },
    { href: "/support", label: "Support center" },
    { href: "/contact", label: "Contact us" },
    { href: "/track-order", label: "Track my order" },
    { href: "/faq", label: "FAQ" },
  ];
  const policyLinks = [
    { href: "/return-policy", label: "Return / refund policy" },
    { href: "/shipping-policy", label: "Shipping policy" },
    { href: "/privacy-policy", label: "Privacy policy" },
    { href: "/terms-and-conditions", label: "Terms and conditions" },
    { href: "/blogs", label: "Blogs" },
  ];

  return (
    <footer className="border-t border-border bg-surface pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.35fr_0.9fr_0.9fr_1.2fr] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 font-black">
            <OptimizedImage
              src="/assets/logos/allearbuds-logo.svg"
              alt="AllEarbuds logo"
              width={320}
              height={120}
              sizes="160px"
              wrapperClassName="h-12 w-32 rounded-md bg-brand"
              className="h-full w-full object-contain"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            AllEarbuds is structured as a fast ecommerce storefront for audio,
            wearables, charging products and daily mobile accessories.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-muted">
            <ContactLine icon={<Mail size={17} />}>
              support@allearbuds.com
            </ContactLine>
            <ContactLine icon={<Phone size={17} />}>
              +91 00000 00000
            </ContactLine>
            <ContactLine icon={<MapPin size={17} />}>
              India dispatch center
            </ContactLine>
          </div>
        </div>

        <FooterColumn title="Categories">
          {categories.map((category) => (
            <FooterLink key={category.slug} href={category.href}>
              {category.shortName}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Brands">
          {brands.slice(0, 10).map((brand) => (
            <FooterLink key={brand.slug} href={brand.href}>
              {brand.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <FooterColumn title="Support">
              {supportLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Policy">
              {policyLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>
          </div>

          <div className="mt-6">
            <p className="text-sm font-black uppercase text-foreground">
              Social
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SocialLink href="/contact" label="Facebook">
                <FacebookIcon />
              </SocialLink>
              <SocialLink href="/contact" label="Instagram">
                <InstagramIcon />
              </SocialLink>
              <SocialLink href="/contact" label="LinkedIn">
                <LinkedInIcon />
              </SocialLink>
              <SocialLink href="/contact" label="YouTube">
                <YouTubeIcon />
              </SocialLink>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 text-xs text-muted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>(c) 2026 AllEarbuds. All rights reserved.</p>
          <p>Built for responsive ecommerce discovery.</p>
        </div>
      </div>
    </footer>
  );
}

function ContactLine({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <p className="flex items-center gap-2">
      <span className="text-brand">{icon}</span>
      {children}
    </p>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase text-foreground">{title}</h3>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-muted transition hover:text-brand"
    >
      {children}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background text-muted transition hover:border-brand hover:text-brand hover:shadow-md"
    >
      {children}
    </Link>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M14.2 8.1V6.7c0-.7.5-.9 1-.9h1.3V3.2c-.6-.1-1.4-.2-2.3-.2-2.3 0-3.9 1.4-3.9 4v1.1H7.8v2.9h2.5v7.9h3.1V11h2.5l.4-2.9h-2.1Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6.5 8.8H3.7v11h2.8v-11ZM5.1 7.3c.9 0 1.6-.7 1.6-1.5S6 4.3 5.1 4.3s-1.6.7-1.6 1.5.7 1.5 1.6 1.5Zm6.1 6.2c0-1.5.8-2.4 2-2.4s1.8.8 1.8 2.4v6.3h2.8v-6.7c0-3-1.6-4.6-4-4.6-1.4 0-2.3.6-2.9 1.5V8.8H8.4v11h2.8v-6.3Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M21 8.3c-.2-1-.8-1.7-1.8-1.9C17.6 6 12 6 12 6s-5.6 0-7.2.4C3.8 6.6 3.2 7.3 3 8.3 2.6 9.9 2.6 12 2.6 12s0 2.1.4 3.7c.2 1 .8 1.7 1.8 1.9 1.6.4 7.2.4 7.2.4s5.6 0 7.2-.4c1-.2 1.6-.9 1.8-1.9.4-1.6.4-3.7.4-3.7s0-2.1-.4-3.7ZM10.1 14.6V9.4l4.8 2.6-4.8 2.6Z" />
    </svg>
  );
}

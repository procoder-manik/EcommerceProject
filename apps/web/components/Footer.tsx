import Link from "next/link";
import { site } from "@/lib/site";

const cols = [
  {
    title: "Shop",
    links: [
      ["All objects", "/products"],
      ["Audio", "/products?category=audio"],
      ["Bags", "/products?category=bags"],
      ["Home", "/products?category=home"],
      ["Wearables", "/products?category=wearables"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Shipping", "/help#shipping"],
      ["Returns", "/help#returns"],
      ["Warranty", "/help#warranty"],
      ["Contact", "/help#contact"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Sign in", "/login"],
      ["Create account", "/register"],
      ["Your orders", "/account"],
      ["Your bag", "/cart"],
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="mt-32 overflow-hidden bg-ink text-paper">
      <div className="wrap grid gap-14 pb-10 pt-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="display max-w-sm text-3xl leading-tight">{site.tagline}.</p>
          <p className="mt-5 max-w-xs text-sm text-paper/60">{site.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="label !text-paper/50">{c.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="link-u text-paper/85 hover:text-paper">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="wrap">
        <p
          className="display select-none whitespace-nowrap text-center leading-[0.8] text-paper/[0.07]"
          style={{ fontSize: "clamp(5rem, 22vw, 20rem)" }}
          aria-hidden
        >
          {site.name}
        </p>
      </div>
      <div className="wrap flex flex-col gap-3 border-t border-paper/15 py-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        <p className="font-mono uppercase tracking-[0.14em]">Payments secured · Free shipping over $50</p>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { site } from "@/lib/site";
import { Close, Menu, Search } from "./icons";

interface Cat {
  name: string;
  slug: string;
}

export default function Navbar({ categories }: { categories: Cat[] }) {
  const { count, setOpen, ready } = useCart();
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMenu(false);
    setSearching(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const links = [{ name: "All", slug: "" }, ...categories];

  return (
    <>
      <div className="bg-ink px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-paper/80">
        Free shipping over ${site.freeShippingThreshold} &nbsp;·&nbsp; 30-day returns
      </div>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-md">
        <div className="wrap grid h-[68px] grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMenu(true)}
              className="-ml-2 flex h-11 w-11 cursor-pointer items-center justify-center lg:hidden"
              aria-label="Open menu"
            >
              <Menu width={24} height={24} />
            </button>
            <button
              type="button"
              onClick={() => setSearching((s) => !s)}
              className="hidden h-11 cursor-pointer items-center gap-2 text-[13px] uppercase tracking-[0.12em] lg:flex"
              aria-expanded={searching}
              aria-controls="site-search"
            >
              <Search width={18} height={18} /> Search
            </button>
          </div>

          <Link href="/" className="display text-[1.9rem] leading-none tracking-[-0.04em]" aria-label={`${site.name} home`}>
            {site.name}
            <span className="text-clay">.</span>
          </Link>

          <div className="flex items-center justify-end gap-1 text-[13px] uppercase tracking-[0.12em] sm:gap-5">
            <Link href={user ? "/account" : "/login"} className="link-u hidden sm:inline">
              {user ? user.name.split(" ")[0] : "Sign in"}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-11 cursor-pointer items-center gap-2 pl-2"
              aria-label={`Open bag, ${count} items`}
            >
              Bag
              <span className="inline-flex min-w-[1.6rem] items-center justify-center rounded-full bg-ink px-1.5 py-0.5 font-mono text-[11px] text-paper tabular-nums">
                {ready ? count : 0}
              </span>
            </button>
          </div>
        </div>

        <nav aria-label="Categories" className="hidden border-t border-ink/10 lg:block">
          <ul className="wrap flex h-11 items-center justify-center gap-10 text-[12px] uppercase tracking-[0.14em]">
            {links.map((c) => {
              const href = c.slug ? `/products?category=${c.slug}` : "/products";
              return (
                <li key={c.slug || "all"}>
                  <Link href={href} className="link-u text-ink-soft hover:text-ink">
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {searching && (
          <form
            id="site-search"
            role="search"
            className="border-t border-ink/10 bg-paper"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q")?.toString().trim();
              router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
            }}
          >
            <div className="wrap flex items-center gap-4 py-3">
              <label htmlFor="q" className="sr-only">
                Search products
              </label>
              <input id="q" name="q" autoFocus placeholder="Search objects…" className="field" />
              <button type="submit" className="btn-ghost !min-h-[44px] !px-5">
                Search
              </button>
            </div>
          </form>
        )}
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="wrap flex h-[68px] items-center justify-between">
            <span className="display text-[1.9rem] leading-none tracking-[-0.04em]">
              {site.name}
              <span className="text-clay">.</span>
            </span>
            <button
              type="button"
              onClick={() => setMenu(false)}
              className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center"
              aria-label="Close menu"
            >
              <Close width={26} height={26} />
            </button>
          </div>
          <nav className="wrap flex flex-1 flex-col justify-center gap-1 pb-16">
            {links.map((c, i) => (
              <Link
                key={c.slug || "all"}
                href={c.slug ? `/products?category=${c.slug}` : "/products"}
                className="display flex items-baseline gap-4 border-b border-ink/10 py-3 text-5xl"
              >
                <span className="font-mono text-xs text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                {c.name === "All" ? "All objects" : c.name}
              </Link>
            ))}
            <Link href={user ? "/account" : "/login"} className="label mt-8">
              {user ? `Account · ${user.name}` : "Sign in / Create account"}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

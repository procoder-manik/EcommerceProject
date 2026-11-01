import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-start justify-center gap-8 py-24">
      <p className="label">Error 404</p>
      <h1 className="display text-7xl leading-none sm:text-9xl">
        Lost <em className="italic text-clay">&amp; found.</em>
      </h1>
      <p className="max-w-md text-ink-soft">That page doesn&apos;t exist, or it has moved.</p>
      <Link href="/products" className="btn">
        Back to the shop
      </Link>
    </div>
  );
}

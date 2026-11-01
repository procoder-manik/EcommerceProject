import type { Metadata } from "next";
import { money, site } from "@/lib/site";

export const metadata: Metadata = { title: "Help" };

const sections = [
  ["shipping", "Shipping", `Orders over $${site.freeShippingThreshold} ship free. Smaller orders pay a flat ${money(site.flatShipping)}. Most orders leave our warehouse within two business days.`],
  ["returns", "Returns", "Not right? Send it back within 30 days, unused and in its original packaging, for a full refund."],
  ["warranty", "Warranty", "Every product carries a two-year warranty against defects in materials and workmanship."],
  ["contact", "Contact", "Write to hello@ecommere.test and a person will reply within one business day."],
];

export default function HelpPage() {
  return (
    <div className="wrap pb-8 pt-12 lg:pt-20">
      <p className="label">Customer care</p>
      <h1 className="display mt-3 text-6xl leading-none sm:text-8xl">Help</h1>
      <div className="mt-16 max-w-3xl divide-y divide-ink/15 border-y border-ink/15">
        {sections.map(([id, title, body]) => (
          <section key={id} id={id} className="grid gap-4 py-10 sm:grid-cols-[200px_1fr]">
            <h2 className="display text-3xl">{title}</h2>
            <p className="text-ink-soft">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

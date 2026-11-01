"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
        <Image src={images[active]} alt={name} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${name}`}
              aria-pressed={active === i}
              className={`relative h-20 w-20 flex-none overflow-hidden rounded-lg border-2 transition-colors duration-200 cursor-pointer ${
                active === i ? "border-brand-600" : "border-transparent hover:border-slate-300"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import Image from "next/image";

// Local product art is SVG, so skip the optimizer; `fill` lets the parent's
// aspect-ratio box decide the crop.
export default function Pic({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, 50vw",
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} unoptimized />;
}

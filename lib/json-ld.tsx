import { serializeJsonLd } from "./seo";

/** Structured data for search engines, rendered as a plain script tag as the Next.js guide recommends. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

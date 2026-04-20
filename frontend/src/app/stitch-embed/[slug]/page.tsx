'use client';

import { useParams } from 'next/navigation';

/**
 * Exact Stitch HTML (pixel output from Google) — iframe after `npm run stitch:download`.
 * Example: /stitch-embed/sign-in → public/stitch/sign-in/code.html
 */
export default function StitchEmbedPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  if (!slug) {
    return <div className="min-h-screen p-6 bg-bg-primary text-text-secondary">Missing slug.</div>;
  }
  const src = `/stitch/${encodeURIComponent(slug)}/code.html`;
  return (
    <iframe
      title={`Stitch: ${slug}`}
      className="w-full min-h-screen border-0 bg-[#191a1f]"
      src={src}
    />
  );
}

'use client';

import dynamic from 'next/dynamic';

const PortalScene = dynamic(
  () => import('@/components/landing/PortalScene'),
  { ssr: false }
);

export default function LocaleHome() {
  return <PortalScene />;
}

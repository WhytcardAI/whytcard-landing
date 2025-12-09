import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import '../globals.css';

export const metadata: Metadata = {
  title: 'WhytCard - AI Tools & RAG Systems',
  description: 'Advanced AI tools and RAG systems for modern businesses.',
};

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = params;

  if (!routing.locales.includes(locale as 'en' | 'fr')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

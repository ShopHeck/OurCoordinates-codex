import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OurCoordinates',
  description: 'Shopify-compatible personalized previews and GPS-enabled ordering foundation.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

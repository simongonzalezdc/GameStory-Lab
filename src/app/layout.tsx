import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShipLab - Post-Production AI Tool for Developers',
  description:
    'Transform finished code into shipped products with AI-powered analysis, documentation, and deployment guidance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

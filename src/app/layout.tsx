import type { Metadata } from 'next';

import { barlow, barlowCondensed } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'mBoss',
  description:
    'Describe it in plain language or draw it on the canvas — your ' +
    'coding agent proposes the workflow, mBoss validates and previews ' +
    'it, and the approved graph compiles to durable DBOS code.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

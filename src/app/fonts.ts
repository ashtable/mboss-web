import { Barlow, Barlow_Condensed } from 'next/font/google';

/**
 * The two faces the design system is set in.
 * Each publishes a CSS variable on <html>;
 * globals.css names those variables in
 * `--font-body` and `--font-heading` so the rest of
 * the stylesheet never has to know a family name.
 */

export const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

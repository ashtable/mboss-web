import { Barlow, Barlow_Condensed } from 'next/font/google';

/**
 * The two faces the design system is set in.
 * Each publishes a CSS variable on <html>;
 * globals.css names those variables in
 * `--font-body` and `--font-heading` so the rest of
 * the stylesheet never has to know a family name.
 *
 * The weights below are the system's declared
 * palette, not the subset in use. Every route today
 * paints only Barlow 400 and Barlow Condensed 600 —
 * the one `font-medium` in the app sits on a mono
 * element, and the one bold is a table header, also
 * mono — so the browser logs "preloaded but not
 * used" for the other three. That warning is
 * expected and costs three font files; dropping the
 * weights would silence it, at the price of the next
 * screen that asks for medium body text getting a
 * synthesised weight instead of the real face.
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

/**
 * A box drawn as a plan: a hairline frame with a
 * registration mark set outside each corner. One
 * component so the four marks cannot be forgotten,
 * and so the distinction stays legible — the
 * waitlist-facing surfaces are framed this way, and
 * the manage page and the admin console use a plain
 * divider border instead, which is how a reader
 * tells a private link or an operator's console
 * from the public front door.
 *
 * The marks overhang the box by 6px, so whatever
 * holds a Blueprint needs that much clear space and
 * must not clip its overflow.
 */
export function Blueprint({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ? `blueprint ${className}` : 'blueprint'}>
      <span className="corner tl" aria-hidden />
      <span className="corner tr" aria-hidden />
      <span className="corner bl" aria-hidden />
      <span className="corner br" aria-hidden />
      {children}
    </div>
  );
}

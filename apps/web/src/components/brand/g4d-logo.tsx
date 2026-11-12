import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface G4dLogoProps {
  /**
   * - `default`: Logo officiel G4D (`g4d.png`) pour Header et fonds clairs
   * - `light`: Logo G4D détouré (`logoPro-trim.png`) pour fonds sombres / Login / Footer
   * - `compact`: Version condensée pour mobile
   */
  variant?: 'default' | 'light' | 'compact';
  className?: string;
  imageClassName?: string;
  href?: string | null;
  priority?: boolean;
  showTagline?: boolean;
}

export function G4dLogo({
  variant = 'default',
  className,
  imageClassName,
  href = '/',
  priority = false,
  showTagline = false,
}: G4dLogoProps) {
  const src =
    variant === 'light' ? '/brand/logoPro-trim.png' : '/brand/g4d.png';

  const dimensions =
    variant === 'compact'
      ? { width: 132, height: 42 }
      : variant === 'light'
        ? { width: 190, height: 64 }
        : { width: 168, height: 54 };

  const content = (
    <span className={cn('inline-flex items-center gap-3 select-none', className)}>
      <Image
        src={src}
        alt="G4D — Group For Delivery"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className={cn(
          'h-auto w-auto max-h-12 object-contain transition-transform duration-200',
          variant === 'light' && 'max-h-14 drop-shadow-md',
          variant === 'compact' && 'max-h-9',
          imageClassName,
        )}
      />
      {showTagline && (
        <span className="hidden sm:flex flex-col border-l border-slate-200/80 pl-3 text-left">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
            Group For Delivery
          </span>
          <span className="text-[11px] font-medium text-[#1B9DD9]">
            Livraison E-commerce Maroc
          </span>
        </span>
      )}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      aria-label="Accueil G4D — Group For Delivery"
      className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B9DD9] rounded-lg"
    >
      {content}
    </Link>
  );
}


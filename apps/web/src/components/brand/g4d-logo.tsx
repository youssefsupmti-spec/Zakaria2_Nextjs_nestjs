import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { G4D_LOGO_PATH } from '@/lib/brand';

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
  const src = G4D_LOGO_PATH.split('?')[0] || G4D_LOGO_PATH;

  const dimensions =
    variant === 'compact'
      ? { width: 132, height: 42 }
      : variant === 'light'
        ? { width: 260, height: 86 }
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
          'h-auto w-auto object-contain transition-transform duration-200',
          variant === 'default' && 'max-h-12',
          variant === 'light' &&
            'h-16 xl:h-20 max-h-20 w-auto shadow-none filter-none bg-transparent border-0',
          variant === 'compact' && 'max-h-9',
          imageClassName,
        )}
      />
      {showTagline && (
        <span className="hidden sm:flex flex-col border-l border-slate-200/80 pl-3 text-left">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
            Group For Delivery
          </span>
          <span className="text-[11px] font-medium text-[#1B9DD9]">Livraison E-commerce Maroc</span>
        </span>
      )}
    </span>
  );

  if (!href) {
    return content;
  }

  if (href === '/') {
    return (
      <a
        href="/"
        aria-label="Accueil G4D — Group For Delivery"
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B9DD9] rounded-lg"
      >
        {content}
      </a>
    );
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

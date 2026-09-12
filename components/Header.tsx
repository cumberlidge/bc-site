import Link from 'next/link';

type HeaderProps = {
  showDescription?: boolean;
  variant?: 'index' | 'detail';
};

export default function Header({ showDescription = false, variant = 'index' }: HeaderProps) {
  const headerClass = variant === 'detail' ? 'site-header site-header--detail' : 'site-header';

  return (
    <header className={headerClass}>
      <h1 className="site-name">
        <Link href="/">Barry Cumberlidge</Link>
      </h1>
      {showDescription && (
        <p className="site-description">
          A continuous, dated stream of writing and thinking
        </p>
      )}
    </header>
  );
}

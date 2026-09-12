import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllEntries, getFirstLine } from '@/lib/content';
import Header from '@/components/Header';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const entries = getAllEntries();
  return entries.map((entry) => ({
    slug: entry.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entries = getAllEntries();
  const entry = entries.find((e) => e.slug === slug);

  if (!entry) {
    return {};
  }

  // For notes without title, use first sentence as title
  const title = entry.type === 'note' && !entry.title
    ? getFirstLine(entry.content)
    : entry.title;

  return {
    title: `${title} — Barry Cumberlidge`,
    description: entry.summary || undefined,
  };
}

// Custom components for MDX rendering
const components = {
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} style={{ maxWidth: '100%', height: 'auto' }} alt={props.alt || ''} />
  ),
};

export default async function EntryPage({ params }: Props) {
  const { slug } = await params;
  const entries = getAllEntries();
  const entry = entries.find((e) => e.slug === slug);

  if (!entry) {
    notFound();
  }

  // Determine wrapper class based on type
  const wrapperClass = `entry-detail entry-detail--${entry.type}`;

  // For notes without title, use first sentence as header
  const displayTitle = entry.type === 'note' && !entry.title
    ? getFirstLine(entry.content)
    : entry.title;

  return (
    <div className="page-container">
      <Header variant="detail" />
      <article className={wrapperClass}>
      <header className="entry-header">
        <h1 className="entry-title">{displayTitle}</h1>
        <time dateTime={entry.date} className="entry-date">
          {entry.date}
        </time>
      </header>

      {/* External publication block for essays and fiction */}
      {(entry.type === 'essay' || entry.type === 'fiction') && entry.externalUrl && (
        <div className="external-link-block">
          <p>
            Originally published on {entry.externalSource || 'another platform'}:{' '}
            <a href={entry.externalUrl} target="_blank" rel="noopener noreferrer">
              Read on {entry.externalSource || 'external site'}
            </a>
          </p>
        </div>
      )}

      {/* Project metadata block */}
      {entry.type === 'project' && (
        <div className="project-meta">
          {entry.stack && entry.stack.length > 0 && (
            <div className="project-stack">
              <strong>Stack:</strong> {entry.stack.join(', ')}
            </div>
          )}
          <div className="project-links">
            {entry.repoUrl && (
              <a href={entry.repoUrl} target="_blank" rel="noopener noreferrer">
                Repository
              </a>
            )}
            {entry.liveUrl && (
              <a href={entry.liveUrl} target="_blank" rel="noopener noreferrer">
                Live site
              </a>
            )}
          </div>
        </div>
      )}

      <div className="entry-content">
        <MDXRemote source={entry.content} components={components} />
      </div>
    </article>
    </div>
  );
}

import Link from 'next/link';
import { getAllEntries, getFirstLine } from '@/lib/content';
import { formatDate } from '@/lib/formatDate';
import Header from '@/components/Header';

export default function Home() {
  const entries = getAllEntries();

  // Group entries by year
  const entriesByYear = entries.reduce((acc, entry) => {
    const year = entry.date.split('-')[0];
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  // Get sorted years in descending order
  const years = Object.keys(entriesByYear).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="page-container">
      <Header showDescription />
      <main className="index">
      {years.map((year) => (
        <div key={year} className="year-section">
          <div className="year-marker">{year}</div>
          <div className="entries">
            {entriesByYear[year].map((entry) => {
              // For notes without title, use first sentence; otherwise use title
              const displayTitle = entry.type === 'note' && !entry.title
                ? getFirstLine(entry.content)
                : entry.title;

              return (
                <div key={entry.slug} className="entry-row">
                  <div className="entry-date">
                    {formatDate(entry.date)}
                  </div>
                  <Link href={`/${entry.slug}`} className="entry-title">
                    {displayTitle}
                  </Link>
                  <div className="entry-type">{entry.type}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      </main>
    </div>
  );
}

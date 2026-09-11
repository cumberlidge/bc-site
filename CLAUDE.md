# Personal site — build spec

Put this in the repo root as `CLAUDE.md`. Claude Code reads it on every session, so it stays accurate as the thing gets built. Update it when decisions change; don't keep a separate PRD.

---

## 1. What this is

A continuous, dated stream of one person's output and thinking. This is where the writing lives — in full, canonically. Every item, regardless of kind, appears as one row in a single reverse-chronological index.

It's a journal in behaviour, not in label. Nothing on the site calls it one — the dates and the accumulation say it. What that framing changes, concretely:

- Dates are prominent, not incidental. They are the signposts.
- Gaps are visible. Year markers break the list, so a quiet stretch shows rather than hides.
- The bar for an entry is low on purpose. A form that only accepts finished work won't be sustained.
- Essays and fiction publish here in full. Substack is a mirror at most. The decision was made deliberately: Substack has no canonical tag, so dual-publishing means competing with yourself and losing, and the shortened-teaser workaround is a per-post tax that wouldn't survive four entries.

Primary reader for the first twelve months: the author. Traffic is not a success measure.

Secondary purpose: the build itself is a learning exercise in the same stack as a later product (Next.js, Supabase, Stripe, Claude API, Vercel).

## 2. Non-goals

State these plainly so they don't get built by accident:

- No CMS, no admin UI, no WYSIWYG. Content is MDX files in git.
- No comments, no analytics dashboard, no search (until there are enough entries to need it).
- No image gallery, lightbox, or masonry grid. Inline images in entry bodies are supported (see §8); the `visual` type is not.
- No newsletter mechanics in phases 1–3. Email capture arrives in phase 4 and is the author's own list on this domain, not Substack's.
- No dark mode toggle in phase 1.
- No animation beyond CSS defaults.
- No per-type styling on the index. See §8.
- No per-type background tints anywhere. Considered and rejected — measure and structure carry the difference instead.
- No social post types (like, repost, reply, rsvp). The IndieWeb vocabulary is borrowed for its naming, not its interaction model.

## 3. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js, App Router, TypeScript |
| Content | `.mdx` files in `/content`, compiled with `next-mdx-remote` or `@next/mdx` |
| Schema validation | Zod, run at build time |
| Styling | Tailwind, with tokens defined in `globals.css` as CSS custom properties |
| Hosting | Vercel |
| Repo | GitHub, **private** |
| Domain | barrycumberlidge.com, registered through Vercel |

The repo is private. `draft: true` keeps an entry off the site but the file still sits in git, and unpublished personal writing should not be world-readable — nor should the history that keeps it after deletion. Vercel deploys from private repos on the free tier, so this costs nothing. `.gitignore` must cover `.env*` before the first commit; a leaked key gets rotated, not deleted, because removing it from a later commit does not remove it from history.

Static generation throughout in phase 1. Phases 3 and 4 introduce server-side data fetching and a database — that's deliberate, it's the part that transfers to the later product.

## 4. Content model

One directory: `/content`. Flat, not nested by type. The `type` field does the sorting, not the filesystem.

Type names follow the IndieWeb post-type vocabulary where it fits. That vocabulary reserves *note* for short, titleless content and *article* for long-form with a title — worth respecting, because feed readers and parsers behave accordingly.

### Shared frontmatter — every file

```yaml
title: string          # required for all types except `note`
date: YYYY-MM-DD       # required, publication date, drives sort order
type: essay | fiction | note | project   # required
slug: string           # required, unique, url-safe, matches filename
draft: boolean         # optional, defaults false. true = excluded from all indexes and from the build
summary: string        # optional, one sentence, used in metadata
```

### Type: `essay`

Long-form non-fiction. No additional fields required.

### Type: `fiction`

Fiction. No additional fields required.

### External publication

`essay` and `fiction` may optionally carry:

```yaml
externalUrl: string    # optional
externalSource: string # optional, e.g. "Substack"
```

Type describes the **form**; the external link describes **where else it lives**. A Substack essay is an `essay` with a link, not a separate type.

**The rule the schema can't enforce:** when `externalUrl` is present, the body of the entry is your framing — what prompted it, what it connects to, what you'd revise — *not* the piece itself. Reproducing the full text here duplicates it against a platform that doesn't support canonical tags, which is the problem this whole structure exists to avoid. 150–400 words of commentary, and the link does the rest.

Their presence renders a link block on the detail page. It does not change the type, and it is not visible on the index.

### Type: `note`

Fifty to a hundred words. Points at nothing, links to nothing, concludes nothing. No additional fields.

**Notes have no `title`.** This follows the IndieWeb convention and matters for RSS — a titleless entry given a placeholder title displays in feed readers as an article, which it isn't. Consequences:

- Zod requires `title` on every type except `note`, where it must be absent.
- The index row for a note renders its first line, truncated at roughly 60 characters, in the title column. No ellipsis styling tricks; just a plain truncation.
- `generateMetadata` for a note derives its page title from the same truncation.

This type exists to keep the cadence alive between substantial entries. It is not filler — it's the thing that stops the project dying at entry six.

### Type: `project`

A repo or build.

```yaml
repoUrl: string        # optional
liveUrl: string        # optional
stack: string[]        # optional
```

Body: what the problem was, what you'd do differently.

Doubles as the build log for this site. Title carries the version — `bc-site v0.1 — Foundation` — and entries accumulate under the type filter, so no separate release-notes page or series field is needed. Version by shipped capability, not by working session.

Write the reasoning, not the commands. The commands are in the git history; why you chose private over public, or killed a feature, is not recorded anywhere else and is the part worth reading in a year.

### Schema enforcement

Validate all frontmatter with Zod at build time, as a discriminated union on `type`. A malformed or incomplete file fails the build with the filename and the specific field in the error. This is not optional — it's the only thing preventing the stream rotting into inconsistency by entry forty.

### Future types

Deliberately not built yet. Add when there is real content for them, not before — an empty type is noise in the filter and a decision on every entry.

- **`reading`** — thoughts on books and publications read. Add when you've actually written one.
- **`visual`** — photography and sketches. The type with real design questions attached (sizing, captions, whether a set is one entry or many), which is why it waits.

Adding either should require: a Zod variant, a template branch, and nothing else. If it requires touching the index, the index is built wrong.

Renaming a type after entries exist is a find-and-replace across frontmatter plus a Zod change — annoying, not blocking. Changing a *slug* after publication breaks URLs and is the one genuinely expensive change. Slugs are flat and permanent.

## 5. Routes

```
/                 index — full reverse-chronological list, all types
/[slug]           detail page, template switches on type
/feed.xml         RSS, all entries
/sitemap.xml      generated
/about            single MDX page, hand-written
```

Flat slugs at root, no `/essays/` or `/fiction/` prefix. Types are a view, not a hierarchy — and flat URLs survive an item being reclassified.

## 6. Index behaviour

Each row renders from shared fields only: date, title (or note excerpt), type. Nothing type-specific appears in the list — that's what lets heterogeneous content sit together without looking broken.

- Sort: `date` descending.
- Year markers break the list. A year with no entries still shows its marker. The gap is information.
- `draft: true` never appears, in any environment.
- An entry with an `externalUrl` still links to its local detail page, never straight out. The external link lives on the detail page. The commentary is the point.
- Type filter: client-side, filters the existing list in place. No route change, no refetch. Year markers persist through filtering.
- No pagination. The list is the stream; length is the feature.

## 7. Metadata baseline

Build these in phase 1 — they're an hour of work and painful to retrofit.

- `generateMetadata` per route: title, description from `summary`, canonical URL, OpenGraph.
- JSON-LD `Article` schema on `essay` and `fiction` detail pages.
- **h-entry microformat markup** on every entry: `h-entry` on the container, `p-name` on titles (omitted on notes), `e-content` on the body, `dt-published` on the date, `u-url` on the permalink. A handful of class names, and it makes the site machine-readable.
- `sitemap.xml` and `robots.txt` generated from the content collection.
- RSS at `/feed.xml`.
- Real `<time datetime="">` elements on every date.

## 8. Design

### Direction

The list is the design. It is a ledger, and it should look like one: dense, undecorated, legible at a glance, and better-looking at 300 entries than at 3. Restraint is doing the work, so nothing else needs to.

### Tokens

```css
--paper:  #FFFFFF;   /* ground — plain white, no tint, all pages */
--ink:    #000000;   /* text — true black, not #111 */
--quiet:  #6B6B6B;   /* type labels, secondary */
--link:   #0000EE;   /* classic browser blue, unstyled on purpose */
--visited:#551A8B;   /* keep visited state — it's an archive, it matters */
--rule:   #E5E5E5;   /* year markers only */
```

### Type

One family: **Newsreader** (variable, Google Fonts). Serif, optical size axis, full weight range, true italic. Used at two sizes on the index and three on a detail page.

**No second family.** Newsreader's optical size, weight and italic axes carry all the hierarchy this site needs. If it turns out to lack tabular figures, do not bring in a mono or grotesque for the date column — a serif paired with a mono for small labels is a recognisable generated-page tell. Use a fixed-width grid column so dates align regardless of figure widths.

- Dates set in `--ink`, not `--quiet` — they are signposts, not metadata. Italic or lighter weight for the type label if it needs to recede.
- Serif body text takes more line-height than a sans would: 1.6 minimum on reading pages.
- Sentence case throughout.

### Index

```
2026

  09 03   bc-site v0.1 — Foundation            project
  08 28   The one about the harbour            fiction
  08 14   Some mornings the work is just       note
  08 02   On not finishing things              essay

2025

  11 19   ...
```

Three columns, left-aligned, no rules between rows — spacing carries the rhythm. Year markers are the only rules on the page.

**The index carries no per-type styling.** No coloured grounds, no per-row treatment. The list only works because it reads as one continuous surface; the moment rows have their own grounds they become cards or a striped table and the ledger quality is gone. Type is carried by the label alone.

Open question, to be answered by living with it: whether the type label column earns its place at all, or whether titles announce their own kind. `essay` and `fiction` will collide most — a title rarely tells you which. Build the column in, read the index in a month, then decide.

### Detail pages

This is where types differentiate. You only ever see one at a time, so difference registers as atmosphere rather than as a category badge.

The carrier is **measure**. Serif tolerates slightly longer lines than sans, so these run wider than a grotesque equivalent, because it's functionally motivated rather than decorative:

| Type | Measure | Rationale |
|---|---|---|
| `essay` | 72ch | sustained argument |
| `fiction` | 66ch | narrower, slower reading |
| `project` | 80ch | holds code blocks and images |
| `note` | 40ch, centred | see below |

Secondary carrier is structural difference that already exists: an externally-published essay or fiction piece has a link block; a `project` has repo, live link and stack. These may distinguish the pages sufficiently on their own.

`note` is where the one bold move goes. Set large, centred, narrow, with the date and permalink below the fold. It should look unlike everything else on the site — and everything else should stay quiet so it can.

### Images in entry bodies

Any type may contain inline images. This is distinct from the future `visual` type, where the image *is* the entry.

- Stored in `/public/images/`, referenced as `/images/filename.jpg` — the `public` segment is omitted from the path.
- Standard markdown `![alt text](/images/filename.jpg)`, rendered as a plain `<img>` with `max-width: 100%; height: auto`. No `next/image`, no lightbox, no captions component in phase 1.
- Alt text is required, not optional.
- Resize to ~1600px wide and compress before committing. Git keeps every version of every binary permanently, so an unoptimised photo is in the repo forever even after it's replaced.

**Open question for phase 1:** images in a `note` body. Notes are set at 40ch centred, which makes an in-measure image very small. Proposal is to let images break out to full content width while the text stays narrow. Build it, look at it, decide.

### Explicitly avoid

All-caps labels. Meta strings joined with middle dots. Arrows appended to links. Cards with border-radius and soft shadows. Hairline rules on everything. Hover animations on rows. Cream backgrounds with a terracotta accent.

### Accessibility floor

Visible keyboard focus, contrast ≥ 4.5:1 for body text, `prefers-reduced-motion` respected, responsive to 375px.

## 9. Build phases

Ship each phase to production before starting the next.

**Phase 1 — the stream.** Four MDX files, one per type. Index renders them with year markers and note truncation. Detail pages render with type-specific measure. Zod discriminated union failing the build. Deployed to Vercel on a custom domain. *Done when: you can add another MDX file, push, and see it live without touching code.*

**Phase 2 — the full index.** Type filter. RSS, sitemap, JSON-LD, h-entry markup, per-route metadata. About page. Draft handling verified. *Done when: a stranger's feed reader can subscribe, notes appear as notes rather than untitled articles, and Search Console accepts the sitemap.*

**Phase 3 — external data.** Fetch repos from the GitHub API at build time, filtered by a GitHub topic tag. Token in a Vercel environment variable. Handle rate limits and a failed fetch without breaking the build. Merge fetched repos into the index alongside MDX entries. *Done when: tagging a repo on GitHub makes it appear on the site after a rebuild.*

**Phase 4 — the mailing list.** Email capture writing to Supabase. Confirmation email via Resend. Server action, not an API route. Validation, error states, and an empty state written properly.

This was specced as a learning exercise. It stopped being one when the decision was made to publish here rather than on Substack — the only thing Substack was still providing was the ability for someone to subscribe by email, and this replaces it. Own list, own domain, exportable. *Done when: a stranger can subscribe and receive a confirmation, and you understand why each of the four pieces exists.*

## 10. Open decisions

Closed: domain (barrycumberlidge.com, via Vercel), typeface (Newsreader), repo visibility (private), background tints (out).

Needed after a month of real use:

1. **Whether the type label column stays.**

Needed before phase 3:

2. **What's public on GitHub.** Topic-tag approach means curation happens in GitHub. Decide the tag name and apply it deliberately rather than exposing everything.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

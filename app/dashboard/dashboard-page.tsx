"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { courseLabel } from "@/lib/course-labels";

type FeedAuthor = {
  name: string;
  detail: string;
  initials: string;
};

type FeedComment = {
  id: string;
  author: string;
  body: string;
};

type FeedPost = {
  id: string;
  author: FeedAuthor;
  body: string;
  createdAt: number;
  timeLabel: string;
  reactions: number;
  reacted: boolean;
  comments: FeedComment[];
};

type FeedSort = "recent" | "top";

const SEED_POSTS: FeedPost[] = [
  {
    id: "orgfair-preview",
    author: { name: "Mira Santos", detail: "BS Information Technology", initials: "MS" },
    body: "I finished the mobile pass for OrgFair. The directory now keeps meeting rooms and organization links readable on smaller phones.",
    createdAt: 3,
    timeLabel: "18 min",
    reactions: 24,
    reacted: false,
    comments: [
      { id: "orgfair-comment", author: "Aisha Villanueva", body: "The quick filters make this much easier to scan." },
    ],
  },
  {
    id: "lab-gate-demo",
    author: { name: "Kenji Ramos", detail: "BS Computer Engineering", initials: "KR" },
    body: "Our RFID lab gate logger is ready for a classroom demo. Next step is testing how it behaves when the network drops halfway through a scan.",
    createdAt: 2,
    timeLabel: "2 hr",
    reactions: 41,
    reacted: false,
    comments: [
      { id: "lab-comment", author: "Paolo Cruz", body: "A queued offline mode would be useful for the older lab connection." },
      { id: "lab-comment-2", author: "Mira Santos", body: "Bring it to the project table this Friday." },
    ],
  },
  {
    id: "study-jam",
    author: { name: "PCU Developer Circle", detail: "Student organization", initials: "PD" },
    body: "Frontend study jam this Saturday: responsive layouts, keyboard navigation, and a short portfolio review. Bring one screen you want feedback on.",
    createdAt: 1,
    timeLabel: "Yesterday",
    reactions: 12,
    reacted: false,
    comments: [],
  },
];

const opportunities = [
  { type: "Internship", title: "Junior web developer", meta: "Applications close Friday" },
  { type: "Event", title: "Campus project showcase", meta: "Registration is open" },
  { type: "Program", title: "Open-source mentoring", meta: "Four student slots" },
];

/** The signed-in student's own page, or null before they create one. */
export type DashboardMe = {
  handle: string;
  displayName: string;
  tagline: string;
  courseName: string;
} | null;

export function DashboardPage({ email, me }: { email: string; me: DashboardMe }) {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<FeedSort>("recent");
  const [openComments, setOpenComments] = useState<string[]>([]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((left, right) => {
      if (sort === "top" && right.reactions !== left.reactions) {
        return right.reactions - left.reactions;
      }
      return right.createdAt - left.createdAt;
    });
  }, [posts, sort]);

  // Before a page exists, posts go out under the sign-in address's name part.
  const name = me?.displayName ?? email.split("@")[0]!;
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      setError("Write something before publishing.");
      return;
    }

    setPosts((current) => [
      ...current,
      {
        id: `post-${crypto.randomUUID()}`,
        author: {
          name,
          detail: me?.courseName ?? "PCU student",
          initials,
        },
        body,
        createdAt: Date.now(),
        timeLabel: "Now",
        reactions: 0,
        reacted: false,
        comments: [],
      },
    ]);
    setDraft("");
    setError(null);
    setSort("recent");
  }

  function toggleReaction(id: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              reacted: !post.reacted,
              reactions: post.reactions + (post.reacted ? -1 : 1),
            }
          : post,
      ),
    );
  }

  function toggleComments(id: string) {
    setOpenComments((current) =>
      current.includes(id) ? current.filter((postId) => postId !== id) : [...current, id],
    );
  }

  return (
    <section aria-labelledby="dashboard-title" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/dashboard</p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
          Community feed
        </h1>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_16rem]">
        <aside data-testid="identity-rail" aria-label="Your profile" className="border border-ink/10 bg-background">
          <div className="flex items-center gap-3 p-4 lg:block">
            <Avatar initials={initials} className="size-12 lg:size-16" />
            <div className="min-w-0 lg:mt-4">
              <h2 className="truncate text-lg font-medium tracking-tight">{name}</h2>
              {me ? (
                <>
                  {me.tagline ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{me.tagline}</p> : null}
                  <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wide text-muted">
                    {courseLabel(me.courseName)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs leading-5 text-muted">You don&apos;t have a public page yet.</p>
              )}
            </div>
          </div>
          {me ? (
            <div className="grid grid-cols-2 border-t border-ink/10 lg:grid-cols-1">
              <Link href="/profile" className="press border-r border-ink/10 px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink lg:border-b lg:border-r-0">
                Edit profile →
              </Link>
              <Link href={`/u/${me.handle}`} className="press px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
                View public page →
              </Link>
            </div>
          ) : (
            <div className="border-t border-ink/10">
              <Link href="/profile" className="press block px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
                Create your page →
              </Link>
            </div>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          <form onSubmit={publish} className="border border-ink/10 bg-background p-4" noValidate>
            <div className="flex items-start gap-3">
              <Avatar initials={initials} className="size-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <label htmlFor="feed-post" className="font-mono text-[11px] uppercase tracking-wide text-muted">
                  Share an update
                </label>
                <textarea
                  id="feed-post"
                  name="post"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (error) setError(null);
                  }}
                  aria-describedby={error ? "feed-post-error" : "feed-post-hint"}
                  placeholder="What are you building or learning?"
                  className="mt-2 min-h-24 w-full resize-y border border-ink/15 bg-white px-3 py-2 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p id={error ? "feed-post-error" : "feed-post-hint"} role={error ? "alert" : undefined} className={`text-xs ${error ? "text-red-700" : "text-muted"}`}>
                    {error ?? `Posting as ${email}`}
                  </p>
                  <button type="submit" className="press border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink">
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Latest from the community</p>
            <div role="group" aria-label="Sort feed" className="flex border border-ink/10">
              {(["recent", "top"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={sort === option}
                  onClick={() => setSort(option)}
                  className={`press px-3 py-2 font-mono text-[10px] uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink ${sort === option ? "bg-ink text-white" : "bg-background text-muted hover:text-ink"}`}
                >
                  {option === "recent" ? "Recent" : "Top"}
                </button>
              ))}
            </div>
          </div>

          <ol data-testid="feed-posts" className="grid list-none gap-4">
            {sortedPosts.map((post, index) => {
              const commentsOpen = openComments.includes(post.id);
              return (
                <li key={post.id} data-post-id={post.id} className="rise border border-ink/10 bg-background" style={{ "--i": index } as React.CSSProperties}>
                  <article aria-labelledby={`${post.id}-author`}>
                    <header className="flex items-start gap-3 p-4">
                      <Avatar initials={post.author.initials} className="size-10 shrink-0" />
                      <div className="min-w-0">
                        <h2 id={`${post.id}-author`} className="font-medium tracking-tight">{post.author.name}</h2>
                        <p className="truncate text-xs text-muted">{post.author.detail}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted">{post.timeLabel}</p>
                      </div>
                    </header>
                    <p className="px-4 pb-4 text-sm leading-6">{post.body}</p>
                    <div className="flex items-center justify-between border-y border-ink/10 px-4 py-2 text-xs text-muted">
                      <span>{post.reactions} {post.reactions === 1 ? "reaction" : "reactions"}</span>
                      <span>{post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <button
                        type="button"
                        aria-pressed={post.reacted}
                        onClick={() => toggleReaction(post.id)}
                        className={`press border-r border-ink/10 px-4 py-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink ${post.reacted ? "bg-paper text-ink" : "text-muted"}`}
                      >
                        {post.reacted ? "Reacted" : "React"}
                      </button>
                      <button
                        type="button"
                        aria-expanded={commentsOpen}
                        aria-controls={`${post.id}-comments`}
                        onClick={() => toggleComments(post.id)}
                        className="press px-4 py-3 font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:bg-paper hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
                      >
                        Comments
                      </button>
                    </div>
                    {commentsOpen ? (
                      <div id={`${post.id}-comments`} className="rise border-t border-ink/10 bg-paper p-4">
                        {post.comments.length ? (
                          <ol className="grid gap-3">
                            {post.comments.map((comment) => (
                              <li key={comment.id} className="text-sm leading-6">
                                <strong className="font-medium">{comment.author}</strong>
                                <p className="text-muted">{comment.body}</p>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-sm text-muted">No comments yet.</p>
                        )}
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        <aside data-testid="discovery-rail" aria-label="Discover opportunities" className="hidden border border-ink/10 bg-background lg:block">
          <div className="border-b border-ink/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Discover</p>
            <h2 className="mt-2 text-xl font-medium tracking-tight">Open opportunities</h2>
          </div>
          <ol className="divide-y divide-ink/10">
            {opportunities.map((opportunity) => (
              <li key={opportunity.title} className="p-4">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted">{opportunity.type}</p>
                <h3 className="mt-2 text-sm font-medium leading-5">{opportunity.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{opportunity.meta}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}

function Avatar({ initials, className }: { initials: string; className: string }) {
  return (
    <span aria-hidden="true" className={`grid place-items-center border border-ink/15 bg-paper font-mono text-xs font-medium tracking-wide ${className}`}>
      {initials}
    </span>
  );
}

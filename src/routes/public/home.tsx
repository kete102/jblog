import { Hono } from "hono";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PostCard from "@/components/blog/PostCard";
import { getRecentPosts } from "@/services/posts";

const homeRouter = new Hono();

homeRouter.get("/", async (c) => {
  const user = c.get("user");
  const posts = await getRecentPosts(7);

  const [featured, ...rest] = posts;

  return c.render(
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="border-b border-zinc-100 bg-linear-to-b from-indigo-50/60 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-6">
              ✦ Independent writing platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1] mb-5">
              Stories worth
              <br />
              <span className="text-indigo-600">reading.</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto leading-relaxed">
              Thoughtful writing on technology, design, and everything in
              between. No ads. No noise. Just good reads.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {posts.length === 0 ? (
            <div className="text-center py-24 text-zinc-400">
              <p className="text-5xl mb-4">✍️</p>
              <p className="text-lg font-medium">No posts yet.</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </div>
          ) : (
            <>
              {/* ── Featured post ── */}
              {featured && (
                <section className="mb-14">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                      Featured
                    </span>
                    <div className="flex-1 h-px bg-zinc-100" />
                  </div>
                  <PostCard post={featured} featured />
                </section>
              )}

              {/* ── Latest posts grid ── */}
              {rest.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Latest
                    </span>
                    <div className="flex-1 h-px bg-zinc-100" />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rest.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── Author CTA ── */}
          <section className="mt-16 sm:mt-20">
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-700 to-zinc-900 px-8 py-12 sm:py-16 text-white">
              {/* Decorative warm blobs */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-indigo-600/30" />
              <div className="pointer-events-none absolute -bottom-14 -left-8 h-64 w-64 rounded-full bg-zinc-700/40" />

              <div className="relative text-center">
                {!user ? (
                  <>
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-200">
                      For writers
                    </p>
                    <h2 className="mb-3 text-2xl font-black sm:text-3xl">
                      Share your ideas with the world.
                    </h2>
                    <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-zinc-300">
                      jblog is an independent publishing platform for engineers
                      and designers who care about their craft. No algorithms,
                      no noise — just your words.
                    </p>
                    <ul className="mx-auto mb-10 flex max-w-xs flex-col gap-2 text-sm text-zinc-300 text-left">
                      {['Beautiful reading experience', 'Full ownership of your content', 'Direct connection with readers'].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/auth/google"
                      className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Apply to write
                    </a>
                  </>
                ) : user.role === 'pending' ? (
                  <>
                    <p className="mb-3 text-3xl">⏳</p>
                    <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                      Your application is in review
                    </h2>
                    <p className="text-sm text-zinc-300">
                      You're on our radar. An admin will approve your account
                      shortly.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-3xl">✍️</p>
                    <h2 className="mb-4 text-xl font-bold sm:text-2xl">
                      Ready to write?
                    </h2>
                    <a
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
                    >
                      Go to dashboard
                    </a>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>,
    {
      seo: {
        title: "jblog — Stories worth reading",
        description:
          "Thoughtful writing on technology, design, and everything in between.",
      },
    },
  );
});

export default homeRouter;

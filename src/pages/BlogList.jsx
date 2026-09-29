import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Newspaper } from "lucide-react";
import { getBlogs } from "../api/content";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";
import FAQSection from "../components/FAQSection";

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogs()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "On a Trip Holiday Blog",
    url: `${SITE_URL}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug || post.id}`,
    })),
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Seo
        title="Travel Blog"
        description="Destination guides, packing tips, and honest travel stories from the On a Trip Holiday team."
        path="/blog"
        jsonLd={posts.length > 0 ? jsonLd : null}
      />

    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 ">
      <p className="flex items-center gap-2 text-accent-hover font-semibold text-xs uppercase tracking-wide mb-4">
        <Newspaper
          className="w-4 h-4 "
          aria-hidden="true"
        />
        Travel notes
      </p>


      <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-navy mt-1 mb-5">
        The On a Trip Blog
      </h1>
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-surface animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-navy/60">
            No posts published yet — check back soon.
          </p>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {posts.map((post) => (
              <Link
                to={`/blog/${post.slug || post.id}`}
                key={post.id}
                className="group flex flex-col
                           bg-white
                           rounded-2xl
                           shadow-sm
                           border border-navy/10
                           overflow-hidden
                           hover:shadow-lg
                           transition-shadow"
              >
                <div className="h-40 sm:h-44 bg-surface overflow-hidden">
                  {post.cover_image?.url ? (
                    <img
                      src={post.cover_image.url}
                      loading="lazy"
                      decoding="async"
                      alt={post.title}
                      className="w-full h-full object-cover
                                 group-hover:scale-105
                                 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center
                                 justify-center text-navy/30 text-sm"
                    >
                      No image
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  {post.published_at && (
                    <p className="flex items-center gap-1.5 text-xs text-navy/50 mb-2">
                      <Calendar
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                      />

                      {new Date(
                        post.published_at
                      ).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}

                  <h2 className="font-display text-lg font-semibold text-navy line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-sm text-navy/60 mt-2 line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <FAQSection />

      <Footer />
    </div>
  );
}


import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  ImageOff,
} from "lucide-react";

import { getBlogBySlug } from "../../api/content";
import Footer from "../../components/Footer";
import Seo, { SITE_URL } from "../../components/Seo";
import FAQSection from "../../components/FAQSection";

import { parseBlogContent,stripMediaTokens } from "../../utils/BlogContent";

export default function BlogDetail() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // =========================================================
  // FETCH BLOG
  // =========================================================
  useEffect(() => {
    let mounted = true;

    const loadPost = async () => {
      if (!slug) {
        if (mounted) {
          setPost(null);
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setNotFound(false);

        const response = await getBlogBySlug(slug);

        if (!mounted) return;

        /*
         * The public API should return the blog object directly.
         *
         * This also safely handles APIs which return:
         * { data: {...} }
         */
        const blog = response?.data ?? response;

        if (!blog) {
          setPost(null);
          setNotFound(true);
          return;
        }

        setPost(blog);
      } catch (error) {
        console.error("Failed to load blog:", error);

        if (mounted) {
          setPost(null);
          setNotFound(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      mounted = false;
    };
  }, [slug]);

  // =========================================================
  // NORMALIZED BLOG DATA
  // =========================================================
  const coverImageUrl = useMemo(() => {
    if (!post?.cover_image) return "";

    if (typeof post.cover_image === "string") {
      return post.cover_image;
    }

    return post.cover_image?.url || "";
  }, [post]);

  const blogSlug = post?.slug || slug;

  const blogTitle = post?.title || "On a Trip Holiday Blog";

  const blogExcerpt =
    post?.excerpt ||
    "Travel inspiration, destination guides and holiday ideas from OnaTrip Holiday.";

  const blogContent = post?.content || "";

  // =========================================================
  // READING TIME
  // =========================================================
  const readingTime = useMemo(() => {
    if (!blogContent) return null;

    const plainText = stripMediaTokens(blogContent)
      .replace(/\s+/g, " ")
      .trim();

    if (!plainText) return null;

    const wordCount = plainText.split(" ").filter(Boolean).length;

    return Math.max(1, Math.ceil(wordCount / 200));
  }, [blogContent]);

  // =========================================================
  // BLOG CONTENT RENDERER
  // =========================================================
  const renderBlogContent = (content) => {
    if (!content) {
      return (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">
          No blog content is available.
        </div>
      );
    }

    const blocks = parseBlogContent(content);

    if (!blocks?.length) {
      return (
        <div className="whitespace-pre-line leading-8 text-gray-700">
          {content}
        </div>
      );
    }

    return blocks.map((block, index) => {
      // =====================================================
      // TEXT
      // =====================================================
      if (block?.type === "text") {
        if (!block.text?.trim()) {
          return null;
        }

        return (
          <div
            key={`text-${index}`}
            className="whitespace-pre-line leading-8 text-gray-700"
          >
            {block.text}
          </div>
        );
      }

      // =====================================================
      // GALLERY
      // =====================================================
      if (block?.type === "gallery") {
        const items = Array.isArray(block.items) ? block.items : [];

        if (!items.length) return null;

        return (
          <div
            key={`gallery-${index}`}
            className="my-8 grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {items.map((item, imageIndex) => {
              const imageUrl =
                typeof item === "string" ? item : item?.url || "";

              const caption =
                typeof item === "object" ? item?.caption : "";

              if (!imageUrl) return null;

              return (
                <figure
                  key={`${imageUrl}-${imageIndex}`}
                  className="overflow-hidden rounded-2xl"
                >
                  <img
                    src={imageUrl}
                    alt={
                      caption ||
                      post?.title ||
                      "OnaTrip Holiday travel image"
                    }
                    className="h-auto w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />

                  {caption && (
                    <figcaption className="mt-2 text-sm text-gray-500">
                      {caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        );
      }

      // =====================================================
      // VIDEO
      // =====================================================
      if (block?.type === "video") {
        if (!block?.url) return null;

        return (
          <figure key={`video-${index}`} className="my-8">
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-2xl"
            >
              <source
                src={block.url}
                type={block.type_mime || "video/mp4"}
              />

              Your browser does not support video playback.
            </video>

            {block.caption && (
              <figcaption className="mt-2 text-sm text-gray-500">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      return null;
    });
  };

  // =========================================================
  // JSON-LD
  // =========================================================
  const jsonLd = useMemo(() => {
    if (!post) return null;

    const blogUrl = `${SITE_URL}/blog/${blogSlug}`;

    const blogPosting = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blogTitle,
      description: blogExcerpt,
      datePublished: post.published_at || undefined,
      dateModified:
        post.updated_at || post.published_at || undefined,

      author: {
        "@type": "Organization",
        name: "OnaTrip Holiday",
      },

      publisher: {
        "@type": "Organization",
        name: "OnaTrip Holiday",
      },

      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": blogUrl,
      },

      url: blogUrl,
    };

    if (coverImageUrl) {
      blogPosting.image = [coverImageUrl];
    }

    return [
      blogPosting,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE_URL}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: blogTitle,
            item: blogUrl,
          },
        ],
      },
    ];
  }, [
    post,
    blogSlug,
    blogTitle,
    blogExcerpt,
    coverImageUrl,
  ]);

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className="
                mb-5
                h-10
                w-10
                animate-spin
                rounded-full
                border-4
                border-gray-200
                border-t-[#F22727]
              "
              aria-hidden="true"
            />

            <p className="text-sm text-gray-500 sm:text-base">
              Loading blog...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================
  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Seo
          title="Post not found"
          path={`/blog/${slug || ""}`}
          noindex
        />

        <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <div
              className="
                mx-auto
                mb-5
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-red-50
              "
            >
              <ImageOff
                className="h-7 w-7 text-[#F22727]"
                aria-hidden="true"
              />
            </div>

            <h1 className="text-2xl font-bold text-[#102040] sm:text-3xl">
              Blog post not found
            </h1>

            <p className="mt-3 text-sm text-gray-500 sm:text-base">
              This blog post may have been removed or the link
              may be incorrect.
            </p>

            <Link
              to="/blog"
              className="
                mt-7
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-[#102040]
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#182c52]
              "
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Blog
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================
  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      {/* =====================================================
          SEO
      ===================================================== */}
      <Seo
        title={blogTitle}
        description={blogExcerpt}
        path={`/blog/${blogSlug}`}
        image={coverImageUrl || undefined}
        type="article"
        jsonLd={jsonLd}
      />

      <main>
        {/* ===================================================
            BREADCRUMB
        =================================================== */}
        <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="
              flex
              flex-wrap
              items-center
              gap-1
              text-xs
              text-[#102040]/50
              sm:text-sm
            "
          >
            <Link
              to="/"
              className="transition-colors hover:text-[#F22727]"
            >
              Home
            </Link>

            <ChevronRight
              className="mx-1 h-3.5 w-3.5"
              aria-hidden="true"
            />

            <Link
              to="/blog"
              className="transition-colors hover:text-[#F22727]"
            >
              Blog
            </Link>

            <ChevronRight
              className="mx-1 h-3.5 w-3.5"
              aria-hidden="true"
            />

            <span className="max-w-[220px] truncate text-[#102040]/70 sm:max-w-lg">
              {blogTitle}
            </span>
          </nav>
        </section>

        {/* ===================================================
            COVER IMAGE
        =================================================== */}
        <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pt-9">
          {coverImageUrl ? (
            <div
              className="
                relative
                aspect-[16/8]
                w-full
                overflow-hidden
                rounded-2xl
                bg-gray-100
                shadow-sm
                sm:rounded-3xl
              "
            >
              <img
                src={coverImageUrl}
                alt={blogTitle}
                fetchPriority="high"
                width="1400"
                height="700"
                className="h-full w-full object-cover"
              />

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-x-0
                  bottom-0
                  h-1/3
                  bg-gradient-to-t
                  from-black/30
                  to-transparent
                "
                aria-hidden="true"
              />
            </div>
          ) : (
            <div
              className="
                flex
                aspect-[16/8]
                w-full
                items-center
                justify-center
                rounded-2xl
                bg-gray-100
                sm:rounded-3xl
              "
            >
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <ImageOff className="h-8 w-8" aria-hidden="true" />

                <p className="text-sm">
                  No cover image available
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ===================================================
            BLOG HEADER
        =================================================== */}
        <section className="mx-auto max-w-5xl px-4 pb-0 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          {/* Back */}
          <Link
            to="/blog"
            className="
              inline-flex
              items-center
              gap-1.5
              text-sm
              font-medium
              text-[#F22727]
              hover:underline
            "
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />

            Back to blog
          </Link>

          {/* Title */}
          <h1
            className="
              mt-5
              font-display
              text-3xl
              font-bold
              leading-[1.1]
              text-[#102040]
              sm:text-4xl
              md:text-5xl
              lg:text-[52px]
            "
          >
            {blogTitle}
          </h1>

          {/* Date + Reading Time */}
          {(post.published_at || readingTime) && (
            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                gap-x-5
                gap-y-2
                text-sm
                text-[#102040]/50
              "
            >
              {post.published_at && (
                <p className="flex items-center gap-1.5">
                  <Calendar
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  <time dateTime={post.published_at}>
                    {new Date(
                      post.published_at
                    ).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </p>
              )}

              {readingTime && (
                <p className="flex items-center gap-1.5">
                  <Clock
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  {readingTime} min read
                </p>
              )}
            </div>
          )}

          {/* Excerpt */}
          {blogExcerpt && (
            <div
              className="
                relative
                mt-7
                rounded-2xl
                border
                border-gray-100
                bg-gray-50
                p-5
                sm:p-7
              "
            >
              <div
                className="
                  absolute
                  bottom-5
                  left-0
                  top-5
                  w-1
                  rounded-r-full
                  bg-[#F22727]
                "
                aria-hidden="true"
              />

              <p
                className="
                  pl-4
                  text-base
                  leading-7
                  text-[#102040]/75
                  sm:text-lg
                  sm:leading-8
                "
              >
                {blogExcerpt}
              </p>
            </div>
          )}
        </section>

        {/* ===================================================
            BLOG CONTENT
        =================================================== */}
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <article
            className="
              prose
              prose-lg
              prose-navy
              max-w-none
              leading-relaxed
              text-[#102040]/75
              prose-headings:font-display
              prose-headings:font-bold
              prose-headings:text-[#102040]
              prose-h2:text-2xl
              sm:prose-h2:text-3xl
              prose-h3:text-xl
              sm:prose-h3:text-2xl
              prose-p:text-sm
              prose-p:leading-7
              sm:prose-p:text-base
              sm:prose-p:leading-8
              prose-li:text-sm
              sm:prose-li:text-base
              prose-strong:text-[#102040]
              prose-a:text-[#F22727]
              prose-a:no-underline
              hover:prose-a:underline
            "
          >
            {renderBlogContent(blogContent)}
          </article>
        </section>

        {/* ===================================================
            BLOG CTA
        =================================================== */}
        <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              bg-[#102040]
              p-6
              text-white
              sm:rounded-3xl
              sm:p-8
              lg:p-10
            "
          >
            <div
              className="
                absolute
                -right-20
                -top-20
                h-56
                w-56
                rounded-full
                bg-[#F22727]/10
              "
              aria-hidden="true"
            />

            <div
              className="
                absolute
                -bottom-20
                -left-20
                h-48
                w-48
                rounded-full
                bg-white/5
              "
              aria-hidden="true"
            />

            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F22727] sm:text-sm">
                Plan your next journey
              </p>

              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                Ready to explore it yourself?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Discover beautiful destinations and carefully
                planned holiday packages with OnaTrip Holiday.
              </p>

              <Link
                to="/packages"
                className="
                  mt-6
                  inline-flex
                  min-h-[48px]
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#F22727]
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-md
                  transition
                  hover:bg-[#D94141]
                  sm:px-6
                  sm:text-base
                "
              >
                Explore Packages

                <ChevronRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* ===================================================
            FAQ
        =================================================== */}
        <FAQSection />

        {/* ===================================================
            FOOTER
        =================================================== */}
        <Footer />
      </main>
    </div>
  );
}


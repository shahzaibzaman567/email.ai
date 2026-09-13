import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const BLOG_POSTS = [
  {
    slug: "what-is-email-ai",
    title: "What is email.ai? A Complete Guide",
    excerpt: "email.ai is an AI-powered cold email outreach platform that writes and sends hyper-personalized cold emails at scale. Learn how it works and why it's different.",
    category: "Getting Started",
    readTime: "5 min read",
    date: "2026-09-13",
  },
  {
    slug: "how-to-use-email-ai",
    title: "How to Use email.ai — Step by Step Tutorial",
    excerpt: "From signing up to launching your first campaign. A complete walkthrough of importing leads, configuring settings, and sending AI-personalized cold emails.",
    category: "Tutorial",
    readTime: "8 min read",
    date: "2026-09-13",
  },
  {
    slug: "is-email-ai-safe",
    title: "Is email.ai Safe? Privacy & Security Explained",
    excerpt: "Your data security matters. Learn how email.ai handles your leads, API keys, and email credentials. We never sell your data — here's the proof.",
    category: "Security",
    readTime: "4 min read",
    date: "2026-09-13",
  },
  {
    slug: "cold-email-best-practices",
    title: "Cold Email Best Practices in 2026",
    excerpt: "Master the art of cold emailing with proven strategies. Subject lines, personalization, timing, follow-ups, and how AI is changing the game.",
    category: "Strategy",
    readTime: "10 min read",
    date: "2026-09-13",
  },
  {
    slug: "groq-api-setup",
    title: "How to Get Your Free Groq API Key",
    excerpt: "email.ai uses Groq's LLaMA model to generate emails. Here's how to get your free API key in under 2 minutes and connect it to email.ai.",
    category: "Tutorial",
    readTime: "3 min read",
    date: "2026-09-13",
  },
  {
    slug: "ai-personalization-vs-mail-merge",
    title: "AI Personalization vs Mail Merge — Why Old Methods Don't Work",
    excerpt: "Mail merge is dead. Learn why AI-personalized cold emails get 3-5x more replies than template-based approaches, and how email.ai makes it effortless.",
    category: "Strategy",
    readTime: "6 min read",
    date: "2026-09-13",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Getting Started": "background: rgba(255,215,0,0.15); color: #ffd700; border: 1px solid rgba(255,215,0,0.3);",
  "Tutorial": "background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3);",
  "Security": "background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);",
  "Strategy": "background: rgba(255,45,120,0.15); color: #ff2d78; border: 1px solid rgba(255,45,120,0.3);",
};

export default async function BlogPage() {
  const { userId } = await auth();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .blog-root {
          background: #050505;
          color: #f5f5f5;
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
        }
        .blog-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 2.5rem; border-bottom: 1px solid rgba(255,215,0,0.1);
          backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100;
          background: rgba(5,5,5,0.85);
        }
        .nav-logo { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.04em; }
        .nav-logo span { color: #ffd700; }
        .nav-links { display: flex; gap: 1rem; align-items: center; }
        .btn-ghost {
          background: transparent; border: 1.5px solid rgba(255,215,0,0.35);
          color: #ffd700; padding: 0.5rem 1.25rem; border-radius: 8px;
          font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
          text-decoration: none; font-family: 'Outfit', sans-serif;
        }
        .btn-ghost:hover { border-color: #ffd700; background: rgba(255,215,0,0.08); }
        .btn-primary {
          background: linear-gradient(135deg, #ffd700, #ff9500); color: #050505;
          padding: 0.55rem 1.5rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; border: none; transition: all 0.2s; text-decoration: none;
          font-family: 'Outfit', sans-serif;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(255,215,0,0.4); }
        .blog-hero {
          max-width: 800px; margin: 0 auto; padding: 5rem 2.5rem 3rem; text-align: center;
        }
        .blog-hero h1 {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; letter-spacing: -0.03em; margin-bottom: 1rem;
        }
        .blog-hero p { color: #94a3b8; font-size: 1.1rem; max-width: 500px; margin: 0 auto; line-height: 1.7; }
        .neon-yellow { color: #ffd700; }
        .blog-grid {
          max-width: 1000px; margin: 0 auto; padding: 0 2.5rem 5rem;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;
        }
        .blog-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,215,0,0.12);
          border-radius: 16px; padding: 1.75rem; transition: all 0.3s; text-decoration: none; color: inherit; display: block;
        }
        .blog-card:hover {
          border-color: rgba(255,215,0,0.4); background: rgba(255,215,0,0.04);
          transform: translateY(-4px); box-shadow: 0 16px 40px rgba(255,215,0,0.08);
        }
        .blog-category {
          display: inline-block; padding: 0.2rem 0.75rem; border-radius: 999px;
          font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem;
        }
        .blog-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem; line-height: 1.3; }
        .blog-excerpt { font-size: 0.9rem; color: #94a3b8; line-height: 1.65; margin-bottom: 1.25rem; }
        .blog-meta { font-size: 0.8rem; color: #475569; display: flex; gap: 1rem; }
        .blog-footer {
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
          padding: 2rem 2.5rem; border-top: 1px solid rgba(255,255,255,0.07); font-size: 0.875rem; color: #475569;
        }
        .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .footer-link { color: #475569; text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: #ffd700; }
        @media (max-width: 768px) {
          .blog-hero { padding: 3rem 1.5rem 2rem; }
          .blog-grid { padding: 0 1.5rem 3rem; }
          .blog-nav { padding: 1rem 1.5rem; }
        }
      `}</style>

      <div className="blog-root">
        <nav className="blog-nav">
          <Link href="/" className="nav-logo">email<span>.ai</span></Link>
          <div className="nav-links">
            <Link href="/blog" className="btn-ghost">Blog</Link>
            <Link href="/about" className="btn-ghost">About</Link>
            {userId ? (
              <Link href="/dashboard" className="btn-primary">Dashboard →</Link>
            ) : (
              <>
                <a href="/sign-in" className="btn-ghost">Login</a>
                <a href="/sign-up" className="btn-primary">Get Started →</a>
              </>
            )}
          </div>
        </nav>

        <div className="blog-hero">
          <h1>The <span className="neon-yellow">email.ai</span> Blog</h1>
          <p>Guides, tutorials, and insights on AI-powered cold email outreach. Learn how to get the most out of email.ai.</p>
        </div>

        <div className="blog-grid">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
              <span className="blog-category" style={{ CSSStyleSheet: undefined } as any}>
                <span style={{ background: CATEGORY_COLORS[post.category]?.split("border:")[0] || "", color: CATEGORY_COLORS[post.category]?.match(/color: ([^;]+)/)?.[1] || "#ffd700", padding: "0.2rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>
                  {post.category}
                </span>
              </span>
              <div className="blog-title">{post.title}</div>
              <div className="blog-excerpt">{post.excerpt}</div>
              <div className="blog-meta">
                <span>{post.readTime}</span>
                <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </Link>
          ))}
        </div>

        <footer className="blog-footer">
          <div className="nav-logo" style={{ fontSize: "1rem" }}>email<span>.ai</span></div>
          <div style={{ fontSize: "0.8rem", color: "#334155" }}>
            © {new Date().getFullYear()} email.ai — All rights reserved.
          </div>
          <div className="footer-links">
            <Link href="/blog" className="footer-link">Blog</Link>
            <Link href="/about" className="footer-link">About</Link>
            <a href="/sign-in" className="footer-link">Login</a>
          </div>
        </footer>
      </div>
    </>
  );
}

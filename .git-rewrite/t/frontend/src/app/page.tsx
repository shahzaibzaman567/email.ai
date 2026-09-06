import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NeonOrbClient } from "@/components/landing/neon-orb-client";

const FEATURES = [
  {
    icon: "⚡",
    title: "AI-Personalized at Scale",
    desc: "Every cold email is uniquely crafted by Groq's LLaMA model — real personalization, not mail-merge.",
  },
  {
    icon: "📤",
    title: "Runs While You Sleep",
    desc: "Campaigns execute in the cloud via Inngest background jobs. Close your laptop and leads keep getting reached.",
  },
  {
    icon: "📅",
    title: "Smart Scheduling",
    desc: "Set delivery windows, daily limits, and timezone preferences. Emails land at the right time, every time.",
  },
  {
    icon: "📊",
    title: "Live Campaign Analytics",
    desc: "Track sent, failed, bounced, and replied metrics in real-time from your dashboard.",
  },
  {
    icon: "🔒",
    title: "Your Data, Your Key",
    desc: "You bring your own Groq API key. No vendor lock-in, no hidden credits — full ownership.",
  },
  {
    icon: "🎯",
    title: "Training Prompts for Owners",
    desc: "The admin can fine-tune AI behavior by chatting with the model and saving strict email guidelines.",
  },
];

const STEPS = [
  { step: "1", title: "Sign Up & Add Groq API Key", desc: "Create your account and paste your free Groq API Key in Cold Email Settings." },
  { step: "2", title: "Import Your Leads", desc: "Upload a CSV or Excel file. Map columns to lead fields like email, name, and business." },
  { step: "3", title: "Create a Campaign", desc: "Name your campaign, pick leads, configure tone & CTA, optionally preview a sample email." },
  { step: "4", title: "Launch & Walk Away", desc: "Hit Start. The platform handles AI personalization, scheduling, SMTP delivery, and logging." },
];

const REVIEWS = [
  { name: "Sarah K.", role: "Growth Lead @ Nexus", text: "Absolutely unreal. I was sending 200 personalized emails a day without touching a thing. The AI writes better than my team honestly.", stars: 5 },
  { name: "Omar R.", role: "Founder @ PixelForge", text: "Set it up in 20 mins. By morning I had 8 replies from completely cold prospects. The scheduling and daily limits are a lifesaver.", stars: 5 },
  { name: "Priya M.", role: "Sales Director @ CloudKite", text: "Imported 500 leads, set my service pitch and tone, started the campaign. Checked back the next day to real conversations. 10/10.", stars: 5 },
];

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .landing-root {
          background: #050505;
          color: #f5f5f5;
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
        }

        .neon-yellow { color: #ffd700; }
        .neon-pink   { color: #ff2d78; }

        /* Glow text */
        .glow-yellow {
          text-shadow: 0 0 20px #ffd70088, 0 0 60px #ffd70044;
        }
        .glow-pink {
          text-shadow: 0 0 20px #ff2d7888;
        }

        /* Nav */
        .landing-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 2.5rem;
          border-bottom: 1px solid rgba(255,215,0,0.1);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5,5,5,0.85);
        }
        .nav-logo {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.04em;
        }
        .nav-logo span { color: #ffd700; }
        .nav-links { display: flex; gap: 1rem; align-items: center; }
        .btn-ghost {
          background: transparent;
          border: 1.5px solid rgba(255,215,0,0.35);
          color: #ffd700;
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          font-family: 'Outfit', sans-serif;
        }
        .btn-ghost:hover {
          border-color: #ffd700;
          background: rgba(255,215,0,0.08);
          box-shadow: 0 0 12px rgba(255,215,0,0.3);
        }
        .btn-primary {
          background: linear-gradient(135deg, #ffd700, #ff9500);
          color: #050505;
          padding: 0.55rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          text-decoration: none;
          font-family: 'Outfit', sans-serif;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(255,215,0,0.4);
        }
        .btn-primary-lg {
          padding: 0.9rem 2.5rem;
          font-size: 1.1rem;
          border-radius: 12px;
        }
        .btn-outline-lg {
          background: transparent;
          border: 2px solid rgba(255,255,255,0.2);
          color: #f5f5f5;
          padding: 0.9rem 2.5rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          font-family: 'Outfit', sans-serif;
        }
        .btn-outline-lg:hover {
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
        }

        /* Hero */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 3rem;
          max-width: 1280px;
          margin: 0 auto;
          padding: 6rem 2.5rem 4rem;
        }
        @media (max-width: 768px) {
          .hero { grid-template-columns: 1fr; padding: 3rem 1.5rem; }
          .landing-nav { padding: 1rem 1.5rem; }
        }
        .hero-badge {
          display: inline-block;
          background: rgba(255,45,120,0.12);
          border: 1px solid rgba(255,45,120,0.35);
          color: #ff2d78;
          padding: 0.3rem 1rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          animation: fadeInUp 0.5s ease both;
        }
        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.03em;
          margin: 0 0 1.5rem;
          animation: fadeInUp 0.6s ease 0.1s both;
        }
        .hero-sub {
          font-size: 1.15rem;
          color: #94a3b8;
          line-height: 1.7;
          max-width: 480px;
          margin-bottom: 2.5rem;
          animation: fadeInUp 0.6s ease 0.2s both;
        }
        .hero-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          animation: fadeInUp 0.6s ease 0.3s both;
        }
        .hero-3d {
          height: 480px;
          position: relative;
          animation: fadeIn 1s ease 0.4s both;
        }
        .orb-glow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 50%, rgba(255,215,0,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Section */
        .section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 5rem 2.5rem;
        }
        .section-label {
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .section-title {
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 1rem;
        }
        .section-sub {
          font-size: 1.05rem;
          color: #94a3b8;
          max-width: 520px;
          line-height: 1.7;
          margin-bottom: 3.5rem;
        }

        /* Feature Grid */
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,215,0,0.12);
          border-radius: 16px;
          padding: 1.75rem;
          transition: all 0.3s;
        }
        .feature-card:hover {
          border-color: rgba(255,215,0,0.4);
          background: rgba(255,215,0,0.04);
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(255,215,0,0.08);
        }
        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .feature-title {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .feature-desc {
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.65;
        }

        /* Divider */
        .divider {
          border: none;
          height: 1px;
          background: rgba(255,215,0,0.1);
          margin: 0;
        }

        /* Steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 2rem;
          counter-reset: step-counter;
          position: relative;
        }
        .step-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 2rem 1.75rem;
          position: relative;
          overflow: hidden;
        }
        .step-number {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(135deg, #ffd700, #ff2d78);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.25rem;
          display: block;
        }
        .step-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .step-desc {
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.6;
        }

        /* Reviews */
        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .review-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,45,120,0.15);
          border-radius: 16px;
          padding: 1.75rem;
          transition: all 0.3s;
        }
        .review-card:hover {
          border-color: rgba(255,45,120,0.4);
          box-shadow: 0 16px 40px rgba(255,45,120,0.07);
          transform: translateY(-3px);
        }
        .stars { color: #ffd700; font-size: 1.1rem; margin-bottom: 1rem; letter-spacing: 2px; }
        .review-text {
          font-size: 0.925rem;
          color: #cbd5e1;
          line-height: 1.7;
          margin-bottom: 1.25rem;
          font-style: italic;
        }
        .reviewer-name { font-weight: 700; font-size: 0.9rem; }
        .reviewer-role { font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; }

        /* CTA Section */
        .cta-section {
          text-align: center;
          padding: 6rem 2rem;
          background: radial-gradient(ellipse at center, rgba(255,215,0,0.06) 0%, transparent 60%);
          border-top: 1px solid rgba(255,215,0,0.1);
          border-bottom: 1px solid rgba(255,215,0,0.1);
        }
        .cta-title {
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .cta-sub {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-bottom: 2.5rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.7;
        }

        /* Footer */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding: 2rem 2.5rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          font-size: 0.875rem;
          color: #475569;
        }
        .footer-logo {
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: -0.03em;
        }
        .footer-logo span { color: #ffd700; }
        .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .footer-link { color: #475569; text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: #ffd700; }

        /* Animations */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
          50% { box-shadow: 0 0 40px 8px rgba(255,215,0,0.18); }
        }
        .btn-primary { animation: pulse-glow 3s ease-in-out infinite; }
      `}</style>

      <div className="landing-root">
        {/* NAV */}
        <nav className="landing-nav">
          <div className="nav-logo">
            email<span>.ai</span>
          </div>
          <div className="nav-links">
            <a href="/sign-in" className="btn-ghost">Login</a>
            <a href="/sign-up" className="btn-primary">Get Started →</a>
          </div>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div>
            <div className="hero-badge">✦ Powered by Groq LLaMA</div>
            <h1 className="hero-title">
              Cold Emails that{" "}
              <span className="neon-yellow glow-yellow">Actually</span>{" "}
              <span className="neon-pink glow-pink">Convert</span>
            </h1>
            <p className="hero-sub">
              email.ai writes and sends hyper-personalized cold emails at scale using AI — while you sleep. Upload leads, set your pitch, start a campaign, and let the platform do the rest.
            </p>
            <div className="hero-buttons">
              <a href="/sign-up" className="btn-primary btn-primary-lg">Start for Free →</a>
              <a href="#how-it-works" className="btn-outline-lg">See How It Works</a>
            </div>
          </div>
          <div className="hero-3d">
            <div className="orb-glow" />
            <NeonOrbClient />
          </div>
        </div>

        <hr className="divider" />

        {/* FEATURES */}
        <section className="section">
          <div className="section-label neon-yellow">Features</div>
          <h2 className="section-title">
            Everything you need to<br />
            <span className="neon-yellow">automate outreach</span>
          </h2>
          <p className="section-sub">
            A complete platform for AI-powered cold email campaigns — from lead import to inbox delivery.
          </p>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* HOW IT WORKS */}
        <section className="section" id="how-it-works">
          <div className="section-label neon-pink">How It Works</div>
          <h2 className="section-title">
            Launch in{" "}
            <span className="neon-pink glow-pink">4 simple steps</span>
          </h2>
          <p className="section-sub">
            From zero to personalized cold emails hitting inboxes in under 15 minutes.
          </p>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.step} className="step-card">
                <span className="step-number">{s.step}</span>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* REVIEWS */}
        <section className="section">
          <div className="section-label neon-yellow">Testimonials</div>
          <h2 className="section-title">
            Loved by{" "}
            <span className="neon-yellow glow-yellow">founders & sales teams</span>
          </h2>
          <p className="section-sub">
            Real results from people who let email.ai run their cold outreach.
          </p>
          <div className="reviews-grid">
            {REVIEWS.map((r) => (
              <div key={r.name} className="review-card">
                <div className="stars">{"★".repeat(r.stars)}</div>
                <p className="review-text">"{r.text}"</p>
                <div className="reviewer-name">{r.name}</div>
                <div className="reviewer-role">{r.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title">
            Ready to fill your{" "}
            <span className="neon-yellow glow-yellow">pipeline?</span>
          </h2>
          <p className="cta-sub">
            Create your free account. Bring your own Groq API key. Start sending AI-personalized cold emails today.
          </p>
          <a href="/sign-up" className="btn-primary btn-primary-lg" style={{ display: "inline-block" }}>
            Get Started for Free →
          </a>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-logo">email<span>.ai</span></div>
          <div style={{ fontSize: "0.8rem", color: "#334155" }}>
            © {new Date().getFullYear()} email.ai — All rights reserved.
          </div>
          <div className="footer-links">
            <a href="/sign-in" className="footer-link">Login</a>
            <a href="/sign-up" className="footer-link">Sign Up</a>
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="footer-link">Get Groq Key</a>
          </div>
        </footer>
      </div>
    </>
  );
}
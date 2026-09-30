import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Globe, Search, Code2, ArrowRight, Zap, Shield, Layers, Gauge } from "lucide-react";

const tools = [
  { to: "/browser", title: "In-App Browser", desc: "Open any URL, navigate, reload and inspect pages inside your workspace.", icon: Globe, accent: "from-sky-500/15 to-blue-500/5", ring: "ring-sky-500/20" },
  { to: "/osint", title: "OSINT Toolkit", desc: "DNS, IP geolocation, WHOIS/RDAP, headers and URL metadata extraction.", icon: Search, accent: "from-emerald-500/15 to-teal-500/5", ring: "ring-emerald-500/20" },
  { to: "/osint-dashboard", title: "OSINT Dashboard", desc: "Track lookup activity, success rates and tool usage over time.", icon: Gauge, accent: "from-amber-500/15 to-orange-500/5", ring: "ring-amber-500/20" },
  { to: "/snippets", title: "Snippet Repository", desc: "A searchable, taggable vault of reusable code for any project.", icon: Code2, accent: "from-violet-500/15 to-fuchsia-500/5", ring: "ring-violet-500/20" },
];

const features = [
  { icon: Zap, title: "Fast learning", text: "Short, focused tools you master in minutes." },
  { icon: Shield, title: "Local & global", text: "Runs anywhere — your snippets travel with you." },
  { icon: Layers, title: "Full-stack ready", text: "From front-end to back-end, one workbench." },
];

export default function Home() {
  const [counts, setCounts] = useState({ snippets: 0, lookups: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [snips, queries] = await Promise.all([
          base44.entities.Snippet.list("-updated_date", 500),
          base44.entities.OsintQuery.list("-created_date", 500),
        ]);
        setCounts({ snippets: snips?.length || 0, lookups: queries?.length || 0 });
      } catch (e) { /* ignore */ }
    })();
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-20 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative mb-14">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-brand/10 text-brand mb-5 border border-brand/20">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          Full-stack developer workbench
        </div>
        <h1 className="font-heading text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          One deck for browsing,
          <br />
          <span className="bg-gradient-to-r from-brand via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">investigating &amp; shipping code.</span>
        </h1>
        <p className="mt-5 text-muted-foreground max-w-2xl text-base md:text-lg">
          DevDeck bundles a web browser, an OSINT intelligence toolkit and a reusable snippets
          repository — small, sharp tools you can use anywhere in your development flow.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/browser" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-medium hover:opacity-90 transition shadow-sm shadow-brand/30">
            Launch browser <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/osint" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition">
            Open OSINT toolkit
          </Link>
          <div className="flex items-center gap-4 ml-2 text-sm text-muted-foreground">
            <span><span className="font-semibold text-foreground">{counts.snippets}</span> snippets</span>
            <span className="w-px h-4 bg-border" />
            <span><span className="font-semibold text-foreground">{counts.lookups}</span> lookups</span>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-16 relative">
        {tools.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div key={t.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.4 }}>
              <Link to={t.to} className={`group relative block h-full rounded-2xl border border-border p-6 bg-gradient-to-br ${t.accent} hover:border-foreground/20 hover:-translate-y-0.5 transition-all`}>
                <div className={`w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center mb-4 ring-1 ${t.ring}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-base font-semibold mb-1.5">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground opacity-0 group-hover:opacity-100 transition">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3 border-t border-border pt-10 relative">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-brand" /></div>
              <div>
                <div className="font-medium text-sm">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.text}</div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

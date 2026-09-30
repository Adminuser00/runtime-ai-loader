import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Gauge, Search, Server, Globe, FileText, Network, Activity, ArrowRight, Loader2 } from "lucide-react";

const TOOL_META = {
  dns: { label: "DNS", icon: Network, color: "hsl(246 73% 58%)" },
  ip: { label: "IP Intel", icon: Server, color: "hsl(173 58% 39%)" },
  whois: { label: "WHOIS", icon: Globe, color: "hsl(197 37% 40%)" },
  headers: { label: "Headers", icon: FileText, color: "hsl(43 74% 56%)" },
  urlfetch: { label: "URL Fetch", icon: Search, color: "hsl(12 76% 61%)" },
};

export default function OsintDashboard() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.OsintQuery.list("-created_date", 200);
        setQueries(res || []);
      } catch (e) {
        console.error(e);
      } fontally {
        setLoading(false);
      }
    })();
  }, []);

  const byTool = Object.keys(TOOL_META).map((k) => ({
    tool: k,
    label: TOOL_META[k].label,
    color: TOOL_META[k].color,
    count: queries.filter((q) => q.tool === k).length,
  }));

  const total = queries.length;
  const success = queries.filter((q) => q.status === "success").length;
  const successRate = total ? Math.round((success / total) * 100) : 0;
  const recent = queries.slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">OSINT Dashboard</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Activity overview across your intelligence lookups.</p>
        </div>
        <Link to="/osint" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-medium hover:opacity-90 transition">
          <Search className="w-4 h-4" /> New lookup
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : total === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-brand/5 border border-border flex items-center justify-center mx-auto mb-4"><Gauge className="w-6 h-6 text-brand" /></div>
          <h3 className="font-heading text-lg font-semibold mb-1">No lookups yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Run your first OSINT lookup to populate the dashboard.</p>
          <Link to="/osint" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-medium">Open toolkit <ArrowRight className="w-4 h-4" /></Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <StatCard label="Total lookups" value={total} icon={Activity} />
            <StatCard label="Success rate" value={`${successRate}%`} icon={Gauge} />
            <StatCard label="Tools used" value={byTool.filter((b) => b.count > 0).length} icon={Network} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold text-sm mb-4">Lookups by tool</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byTool} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {byTool.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-heading font-semibold text-sm mb-4">Recent activity</h3>
              <div className="space-y-1 max-h-64 overflow-auto">
                {recent.map((q) => {
                  const M = TOOL_META[q.tool] || TOOL_META.dns;
                  const Icon = M.icon;
                  return (
                    <div key={q.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/40 transition">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${M.color}1a` }}>
                        <Icon className="w-4 h-4" style={{ color: M.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{q.query}</div>
                        <div className="text-[11px] text-muted-foreground">{M.label} • {new Date(q.created_date).toLocaleString()}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${q.status === "success" ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{q.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Icon className="w-4 h-4 text-brand" /></div>
      </div>
      <div className="font-heading text-3xl font-semibold mt-2">{value}</div>
    </motion.div>
  );
}

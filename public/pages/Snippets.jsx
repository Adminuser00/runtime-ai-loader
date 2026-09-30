import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Search, Code2, Loader2, Folder, Hash, Github } from "lucide-react";
import SnippetCard from "@/components/snippets/SnippetCard";
import SnippetForm from "@/components/snippets/SnippetForm";
import GitHubImport from "@/components/snippets/GitHubImport";

export default function Snippets() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Snippet.list("-updated_date", 500);
      setSnippets(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const languages = useMemo(() => Array.from(new Set(snippets.map((s) => s.language))).sort(), [snippets]);
  const categories = useMemo(() => Array.from(new Set(snippets.map((s) => s.category).filter(Boolean))).sort(), [snippets]);

  const langCounts = useMemo(() => {
    const m = {};
    snippets.forEach((s) => { m[s.language] = (m[s.language] || 0) + 1; });
    return m;
  }, [snippets]);

  const catCounts = useMemo(() => {
    const m = {};
    snippets.forEach((s) => { if (s.category) m[s.category] = (m[s.category] || 0) + 1; });
    return m;
  }, [snippets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snippets.filter((s) => {
      if (langFilter !== "all" && s.language !== langFilter) return false;
      if (catFilter !== "all" && s.category !== catFilter) return false;
      if (!q) return true;
      return (
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [snippets, search, langFilter, catFilter]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s) => { setEditing(s); setFormOpen(true); };

  const save = async (payload) => {
    try {
      if (editing) await base44.entities.Snippet.update(editing.id, payload);
      else await base44.entities.Snippet.create(payload);
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete "${s.title}"?`)) return;
    try {
      await base44.entities.Snippet.delete(s.id);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Snippet Repository</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{snippets.length} reusable snippets • browse, copy and ship faster.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition">
            <Github className="w-4 h-4" /> Import from GitHub
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand text-brand-foreground text-sm font-medium hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> New snippet
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-lg bg-card border border-input">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, code, tags…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-6">
          <RailSection icon={Hash} title="Languages">
            <RailItem label="All" count={snippets.length} active={langFilter === "all"} onClick={() => setLangFilter("all")} />
            {languages.map((l) => (
              <RailItem key={l} label={l} count={langCounts[l]} active={langFilter === l} onClick={() => setLangFilter(l)} />
            ))}
          </RailSection>
          {categories.length > 0 && (
            <RailSection icon={Folder} title="Categories">
              <RailItem label="All" count={snippets.length} active={catFilter === "all"} onClick={() => setCatFilter("all")} />
              {categories.map((c) => (
                <RailItem key={c} label={c} count={catCounts[c]} active={catFilter === c} onClick={() => setCatFilter(c)} />
              ))}
            </RailSection>
          )}
        </aside>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-brand/5 border border-border flex items-center justify-center mx-auto mb-4"><Code2 className="w-6 h-6 text-brand" /></div>
              <h3 className="font-heading text-lg font-semibold mb-1">No snippets found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try a different filter or add a new snippet.</p>
              <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-medium"><Plus className="w-4 h-4" /> Add snippet</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <SnippetCard snippet={s} onEdit={openEdit} onDelete={remove} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SnippetForm open={formOpen} snippet={editing} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={save} />
      <GitHubImport open={importOpen} onClose={() => setImportOpen(false)} onImported={() => load()} />
    </div>
  );
}

function RailSection({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><Icon className="w-3.5 h-3.5" /> {title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function RailItem({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition ${active ? "bg-brand/10 text-brand font-medium" : "hover:bg-muted text-foreground"}`}>
      <span className="truncate">{label}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
    </button>
  );
}

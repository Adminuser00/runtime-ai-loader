import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, ArrowRight, RotateCw, ExternalLink, Globe, Lock, Home, Clock, X, Star, Search, Trash2 } from "lucide-react";

const SUGGESTED = [
  { url: "https://developer.mozilla.org", label: "MDN" },
  { url: "https://news.ycombinator.com", label: "Hacker News" },
  { url: "https://github.com/trending", label: "GitHub" },
  { url: "https://stackoverflow.com", label: "Stack Overflow" },
  { url: "https://dev.to", label: "DEV.to" },
  { url: "https://css-tricks.com", label: "CSS Tricks" },
];

const HISTORY_KEY = "devdeck_browser_history_v2";
const PINS_KEY = "devdeck_browser_pins_v2";
const MAX = 120;

function normalizeUrl(u) {
  const v = u.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return "https://" + v;
  return "https://www.google.com/search?q=" + encodeURIComponent(v);
}

function domainOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

function faviconUrl(u, sz = 64) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domainOf(u))}&sz=${sz}`;
}

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export default function Browser() {
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [navStack, setNavStack] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [reloadKey, setReloadKey] = useState(0);
  const [history, setHistory] = useState([]);
  const [pins, setPins] = useState([]);
  const [focused, setFocused] = useState(false);
  const [hl, setHl] = useState(-1);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setHistory(load(HISTORY_KEY, []));
    setPins(load(PINS_KEY, []));
  }, []);

  const frecency = useMemo(() => {
    const map = new Map();
    history.forEach((h) => {
      const k = h.url;
      if (!map.has(k)) map.set(k, { url: k, count: 0, lastTs: 0 });
      const e = map.get(k);
      e.count++;
      e.lastTs = Math.max(e.lastTs, h.ts || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.lastTs - a.lastTs);
  }, [history]);

  const matches = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return frecency.slice(0, 6);
    return frecency
      .filter((f) => f.url.toLowerCase().includes(q) || domainOf(f.url).toLowerCase().includes(q))
      .slice(0, 6);
  }, [frecency, input]);

  const recordVisit = useCallback((u) => {
    setHistory((prev) => {
      const next = [...prev, { url: u, ts: Date.now() }].slice(-MAX * 3);
      save(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const go = useCallback((raw) => {
    const next = normalizeUrl(raw ?? input);
    if (!next) return;
    const h = idx >= 0 ? navStack.slice(0, idx + 1) : [];
    if (h[h.length - 1] !== next) h.push(next);
    setNavStack(h);
    setIdx(h.length - 1);
    setUrl(next);
    setInput(next);
    setFocused(false);
    setHl(-1);
    recordVisit(next);
  }, [input, idx, navStack, recordVisit]);

  const back = () => {
    if (idx > 0) {
      const i = idx - 1;
      setIdx(i);
      setUrl(navStack[i]);
      setInput(navStack[i]);
    }
  };

  const forward = () => {
    if (idx < navStack.length - 1) {
      const i = idx + 1;
      setIdx(i);
      setUrl(navStack[i]);
      setInput(navStack[i]);
    }
  };

  const reload = () => setReloadKey((k) => k + 1);
  const goHome = () => { setUrl(""); setInput(""); setNavStack([]); setIdx(-1); };

  const togglePin = (u) => {
    setPins((prev) => {
      const next = prev.includes(u) ? prev.filter((p) => p !== u) : [...prev, u];
      save(PINS_KEY, next);
      return next;
    });
  };

  const clearHistory = () => {
    if (!confirm("Clear all browser history?")) return;
    setHistory([]);
    save(HISTORY_KEY, []);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" && matches.length > 0) {
      e.preventDefault();
      setHl((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHl((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      if (hl >= 0 && matches[hl]) go(matches[hl].url);
      else go();
    } else if (e.key === "Escape") {
      setFocused(false);
      setHl(-1);
      inputRef.current?.blur();
    }
  };

  const recentCards = useMemo(() => {
    const seen = new Set();
    const cards = [];
    for (let i = history.length - 1; i >= 0 && cards.length < 8; i--) {
      if (!seen.has(history[i].url)) {
        seen.add(history[i].url);
        cards.push(history[i]);
      }
    }
    return cards;
  }, [history]);

  const hideImg = (e) => { e.target.style.visibility = "hidden"; };

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border bg-card relative z-20">
        <button onClick={back} disabled={idx <= 0} className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-accent disabled:opacity-40 transition" title="Back"><ArrowLeft className="w-4 h-4" /></button>
        <button onClick={forward} disabled={idx >= navStack.length - 1} className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-accent disabled:opacity-40 transition" title="Forward"><ArrowRight className="w-4 h-4" /></button>
        <button onClick={reload} disabled={!url} className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-accent disabled:opacity-40 transition" title="Reload"><RotateCw className="w-4 h-4" /></button>
        <button onClick={goHome} className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-accent transition" title="Home"><Home className="w-4 h-4" /></button>

        <div className="flex-1 relative">
          <form onSubmit={(e) => { e.preventDefault(); go(); }} className="flex items-center gap-2 px-3 h-9 rounded-full bg-background border border-input focus-within:ring-2 focus-within:ring-ring/30">
            {url ? <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setHl(-1); }}
              onFocus={() => { setFocused(true); setHl(-1); }}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={onKeyDown}
              placeholder="Search or enter URL — history predicts as you type…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {input && <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setInput(""); inputRef.current?.focus(); }} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
            {url && <a href={url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground shrink-0" title="Open in new tab"><ExternalLink className="w-4 h-4" /></a>}
          </form>

          {focused && matches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              {matches.map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); go(m.url); }}
                  onMouseEnter={() => setHl(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${i === hl ? "bg-accent" : "hover:bg-accent"}`}
                >
                  <img src={faviconUrl(m.url, 32)} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={hideImg} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{domainOf(m.url)}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{m.url}</div>
                  </div>
                  {m.count > 1 && <span className="text-[10px] text-muted-foreground shrink-0">{m.count}×</span>}
                  <Star className={`w-3.5 h-3.5 shrink-0 ${pins.includes(m.url) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowHistoryPanel((s) => !s)} className={`w-9 h-9 rounded-md flex items-center justify-center transition ${showHistoryPanel ? "bg-accent text-foreground" : "hover:bg-accent"}`} title="History"><Clock className="w-4 h-4" /></button>
      </div>

      {/* Pinned bar */}
      {pins.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-card/50 overflow-x-auto">
          {pins.map((p) => (
            <button key={p} onClick={() => go(p)} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border hover:bg-accent transition text-xs" title={p}>
              <img src={faviconUrl(p, 32)} alt="" className="w-3.5 h-3.5 rounded-sm" onError={hideImg} />
              {domainOf(p)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-h-0 bg-muted/30">
          {!url ? (
            <div className="h-full overflow-auto">
              <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-brand" />
                  </div>
                  <h1 className="font-heading text-2xl font-semibold mb-2">Browse the web</h1>
                  <p className="text-sm text-muted-foreground">Smart, predictive browsing — your history is remembered and suggested as you type.</p>
                </div>

                <div className="mb-8">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick access</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {SUGGESTED.map((s) => (
                      <button key={s.url} onClick={() => go(s.url)} className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-foreground/20 hover:bg-accent transition">
                        <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center group-hover:scale-105 transition">
                          <img src={faviconUrl(s.url, 64)} alt="" className="w-6 h-6 rounded-sm" onError={hideImg} />
                        </div>
                        <span className="text-[11px] font-medium truncate w-full text-center">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {recentCards.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recently visited</div>
                      <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {recentCards.map((h) => (
                        <div key={h.url} className="group relative rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition overflow-hidden">
                          <button onClick={() => go(h.url)} className="w-full text-left p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <img src={faviconUrl(h.url, 32)} alt="" className="w-5 h-5 rounded-sm shrink-0" onError={hideImg} />
                              <span className="text-sm font-medium truncate">{domainOf(h.url)}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{h.url}</div>
                          </button>
                          <button onClick={() => togglePin(h.url)} className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent transition" title={pins.includes(h.url) ? "Unpin" : "Pin"}>
                            <Star className={`w-3.5 h-3.5 ${pins.includes(h.url) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">Your visited sites will appear here as cards.</div>
                )}
              </div>
            </div>
          ) : (
            <iframe
              key={reloadKey}
              src={url}
              title="browser-frame"
              className="w-full h-full border-0 bg-background"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {showHistoryPanel && (
          <div className="w-72 shrink-0 border-l border-border bg-card overflow-auto hidden md:block">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
              <span className="text-sm font-semibold">History</span>
              <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
            </div>
            <div className="p-2 space-y-0.5">
              {frecency.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">No history yet.</div>
              ) : (
                frecency.map((f) => (
                  <div key={f.url} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition">
                    <img src={faviconUrl(f.url, 32)} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={hideImg} />
                    <button onClick={() => go(f.url)} className="flex-1 text-left text-sm truncate">{domainOf(f.url)}</button>
                    <button onClick={() => togglePin(f.url)} className="opacity-0 group-hover:opacity-100 transition">
                      <Star className={`w-3.5 h-3.5 ${pins.includes(f.url) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

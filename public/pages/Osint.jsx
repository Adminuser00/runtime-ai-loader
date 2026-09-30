import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Search, Globe, Server, FileText, Network, Loader2, Copy, Check, AlertTriangle,
} from "lucide-react";

const TOOLS = [
  { id: "dns", label: "DNS Lookup", icon: Network, placeholder: "example.com", hint: "Resolve DNS records via Google DoH", extra: true },
  { id: "ip", label: "IP Intel", icon: Server, placeholder: "8.8.8.8", hint: "Geolocation, ISP, ASN & proxy detection" },
  { id: "whois", label: "WHOIS / RDAP", icon: Globe, placeholder: "example.com", hint: "Domain registration via RDAP" },
  { id: "headers", label: "HTTP Headers", icon: FileText, placeholder: "example.com", hint: "Inspect response headers" },
  { id: "urlfetch", label: "URL Fetch", icon: Search, placeholder: "https://example.com", hint: "Fetch page & extract metadata" },
];

const DNS_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"];

export default function Osint() {
  const [active, setActive] = useState("dns");
  const [query, setQuery] = useState("");
  const [dnsType, setDnsType] = useState("A");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const tool = TOOLS.find((t) => t.id === active);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const payload = { tool: active, query: query.trim() };
      if (active === "dns") payload.type = dnsType;
      const res = await base44.functions.invoke("osintTool", payload);
      if (res.data?.error) {
        setError(res.data.error);
        base44.entities.OsintQuery.create({ tool: active, query: query.trim(), status: "error", summary: String(res.data.error).slice(0, 120) }).catch(() => {});
      } else {
        setResult(res.data);
        base44.entities.OsintQuery.create({ tool: active, query: query.trim(), status: "success", summary: `${active} • ${query.trim()}` }).catch(() => {});
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">OSINT Toolkit</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Open-source intelligence lookups — DNS, IP, WHOIS, headers and URL inspection.
        </p>
      </header>

      {/* Tool tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const on = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => { setActive(t.id); setResult(null); setError(null); }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition ${
                on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="text-sm text-muted-foreground mb-3">{tool.hint}</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder={tool.placeholder}
            className="flex-1 h-11 px-4 rounded-lg bg-background border border-input outline-none focus:ring-2 focus:ring-ring/30 text-sm"
          />
          {tool.extra && active === "dns" && (
            <select
              value={dnsType}
              onChange={(e) => setDnsType(e.target.value)}
              className="h-11 px-3 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              {DNS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button
            onClick={run}
            disabled={loading || !query.trim()}
            className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Run
          </button>
        </div>
      </div>

      {/* Result */}
      {(result || error || loading) && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Result</span>
            {result && (
              <button onClick={copyResult} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </button>
            )}
          </div>
          <div className="p-4">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Gathering intelligence…
              </div>
            )}
            {error && !loading && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}
            {result && !loading && <ResultView data={result} tool={active} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultView({ data, tool }) {
  const r = data.result;
  if (tool === "dns") return <DnsView data={r} />;
  if (tool === "ip") return <IpView data={r} />;
  if (tool === "whois") return <WhoisView data={r} />;
  if (tool === "headers") return <HeadersView data={r} />;
  if (tool === "urlfetch") return <UrlView data={r} />;
  return <pre className="text-xs overflow-auto">{JSON.stringify(r, null, 2)}</pre>;
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm border-b border-border/60 last:border-0">
      <div className="w-40 shrink-0 text-muted-foreground">{label}</div>
      <div className="font-mono break-all">{value ?? "—"}</div>
    </div>
  );
}

function DnsView({ data }) {
  const answers = data.Answer || [];
  return (
    <div>
      <Row label="Status" value={data.Status === 0 ? "NOERROR" : `Status ${data.Status}`} />
      {answers.length === 0 ? (
        <div className="text-sm text-muted-foreground py-3">No records found.</div>
      ) : (
        answers.map((a, i) => <Row key={i} label={`${a.type === 1 ? "A" : a.type === 28 ? "AAAA" : a.type} (${a.TTL}s)`} value={a.data} />)
      )}
    </div>
  );
}

function IpView({ data }) {
  if (data.status !== "success") return <div className="text-sm text-destructive">{data.message || "Lookup failed"}</div>;
  return (
    <div>
      <Row label="IP" value={data.query} />
      <Row label="Country" value={`${data.country}${data.city ? " — " + data.city : ""}`} />
      <Row label="Region" value={data.regionName} />
      <Row label="ZIP" value={data.zip} />
      <Row label="Coordinates" value={data.lat && data.lon ? `${data.lat}, ${data.lon}` : null} />
      <Row label="Timezone" value={data.timezone} />
      <Row label="ISP" value={data.isp} />
      <Row label="Org" value={data.org} />
      <Row label="AS" value={data.as} />
      <Row label="Reverse DNS" value={data.reverse} />
      <Row label="Hosting" value={data.hosting ? "Yes" : "No"} />
      <Row label="Proxy/VPN" value={data.proxy ? "Likely" : "No"} />
    </div>
  );
}

function WhoisView({ data }) {
  if (data.error) return <div className="text-sm text-destructive">{data.error}</div>;
  return (
    <div>
      <Row label="Domain" value={data.domain} />
      <Row label="Status" value={Array.isArray(data.status) ? data.status.join(", ") : data.status} />
      {data.events?.map((e, i) => (
        <Row key={i} label={e.eventAction} value={e.eventDate} />
      ))}
      {data.nameservers?.map((n, i) => <Row key={"ns" + i} label="Nameserver" value={n} />)}
      {data.entities?.map((e, i) => (
        <Row key={"e" + i} label={e.roles?.join(", ")} value={e.handle} />
      ))}
    </div>
  );
}

function HeadersView({ data }) {
  return (
    <div>
      <Row label="Final URL" value={data.url} />
      <Row label="Status" value={data.status} />
      {Object.entries(data.headers || {}).map(([k, v]) => (
        <Row key={k} label={k} value={v} />
      ))}
    </div>
  );
}

function UrlView({ data }) {
  return (
    <div>
      <Row label="Final URL" value={data.url} />
      <Row label="Status" value={data.status} />
      <Row label="Title" value={data.title} />
      <Row label="Description" value={data.description} />
      <Row label="Links" value={data.linkCount} />
      <Row label="Scripts" value={data.scriptCount} />
      <div className="mt-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">HTML preview</div>
        <pre className="text-[11px] leading-relaxed bg-muted/40 rounded-lg p-3 overflow-auto max-h-72 font-mono whitespace-pre-wrap break-all">
          {data.htmlPreview}
        </pre>
      </div>
    </div>
  );
}

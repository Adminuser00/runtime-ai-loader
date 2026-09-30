import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Globe, Search, Code2, Terminal, Gauge, Sparkles } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/browser", label: "Web Browser", icon: Globe },
  { to: "/osint", label: "OSINT Toolkit", icon: Search },
  { to: "/osint-dashboard", label: "OSINT Dashboard", icon: Gauge },
  { to: "/snippets", label: "Snippet Repository", icon: Code2 },
];

const labels = {
  "/": "Dashboard",
  "/browser": "Web Browser",
  "/osint": "OSINT Toolkit",
  "/osint-dashboard": "OSINT Dashboard",
  "/snippets": "Snippet Repository",
};

export default function AppLayout() {
  const location = useLocation();
  const title = labels[location.pathname] || "DevDeck";

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shadow-sm shadow-brand/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-semibold text-sm tracking-tight">DevDeck</div>
            <div className="text-[11px] text-muted-foreground">full-stack workbench</div>
          </div>
        </div>

        <div className="px-5 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-brand/10 text-brand" : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-brand" />}
                    <Icon className="w-4 h-4 relative" />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="m-3 rounded-xl border border-border bg-gradient-to-br from-brand/5 to-transparent p-3">
          <div className="flex items-center gap-2 text-xs font-medium"><Sparkles className="w-3.5 h-3.5 text-brand" /> Pro tip</div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Run an OSINT lookup, then check the dashboard for trends.</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-16 items-center justify-between px-6 border-b border-border bg-background/70 backdrop-blur sticky top-0 z-10">
          <div>
            <div className="text-[11px] text-muted-foreground">DevDeck</div>
            <div className="font-heading font-semibold text-base">{title}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> workspace ready
          </div>
        </header>

        <header className="md:hidden h-14 flex items-center gap-2 px-4 border-b border-border bg-sidebar sticky top-0 z-10">
          <div className="w-8 h-8 rounded-lg bg-brand text-brand-foreground flex items-center justify-center"><Terminal className="w-4 h-4" /></div>
          <span className="font-heading font-semibold text-sm">{title}</span>
          <nav className="ml-auto flex gap-1 overflow-x-auto">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return (
                <NavLink key={item.to} to={item.to} end={item.end} className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-sidebar-accent"}`}>
                  <Icon className="w-4 h-4" />
                </NavLink>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

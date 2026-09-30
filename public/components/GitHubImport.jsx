import React, { useState, useEffect } from "react";
import { base44 } from "../api/base44Client"; // Fixed Import Path
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Github, Loader2, RefreshCw, ChevronRight, FileCode2, Check } from "lucide-react";

export default function GitHubImport({ open, onClose, onImported }) {
  const [connected, setConnected] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [picked, setPicked] = useState({});
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const fetchRepos = async () => {
    setLoadingRepos(true);
    setError("");
    try {
      const res = await base44.functions.invoke("githubImport", { action: "repos" });
      setRepos(res.data?.repos || []);
      setConnected(true);
    } catch (e) {
      setConnected(false);
      setRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (open) {
      setConnected(null);
      setSelectedRepo(null);
      setFiles([]);
      setPicked({});
      fetchRepos();
    }
  }, [open]);

  const handleConnect = async () => {
    setError("");
    try {
      const url = await base44.connectors.connectAppUser("github");
      const popup = window.open(url, "_blank");
      if (!popup) {
        setError("Popup blocked — allow popups for this site, then click Connect again.");
        return;
      }
      setConnected(null);
      setLoadingRepos(true);
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setTimeout(() => fetchRepos(), 1500);
        }
      }, 500);
    } catch (e) {
      setError(e.message);
      setLoadingRepos(false);
    }
  };

  const openRepo = async (r) => {
    setSelectedRepo(r);
    setLoadingFiles(true);
    setError("");
    setFiles([]);
    setPicked({});
    try {
      const [owner] = r.full_name.split("/");
      const res = await base44.functions.invoke("githubImport", {
        action: "tree",
        owner,
        repo: r.name,
        branch: r.default_branch || "main",
      });
      setFiles(res.data?.files || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingFiles(false);
    }
  };

  const toggle = (path) => setPicked((p) => ({ ...p, [path]: !p[path] }));
  const pickedFiles = files.filter((f) => picked[f.path]);

  const doImport = async () => {
    if (!selectedRepo || pickedFiles.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const [owner] = selectedRepo.full_name.split("/");
      const res = await base44.functions.invoke("githubImport", {
        action: "import",
        owner,
        repo: selectedRepo.name,
        branch: selectedRepo.default_branch || "main",
        files: pickedFiles.map((f) => ({ path: f.path, size: f.size })),
      });
      onImported?.(res.data?.imported || 0);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setSelectedRepo(null);
    setFiles([]);
    setPicked({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Github className="w-4 h-4" /> Import from GitHub</DialogTitle>
        </DialogHeader>

        {connected === false && !loadingRepos && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">Connect your GitHub account to browse your repos and import code files as snippets.</p>
            <Button onClick={handleConnect} className="bg-foreground text-background hover:opacity-90"><Github className="w-4 h-4" /> Connect GitHub</Button>
          </div>
        )}

        {loadingRepos && (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        )}

        {connected && !selectedRepo && !loadingRepos && (
          <div className="overflow-auto flex-1 -mx-1 px-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{repos.length} repositories</span>
              <button onClick={fetchRepos} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><RefreshCw className="w-3 h-3" /> refresh</button>
            </div>
            <div className="space-y-1">
              {repos.map((r) => (
                <button key={r.id || r.name} onClick={() => openRepo(r)} className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    {r.description && <div className="text-xs text-muted-foreground truncate">{r.description}</div>}
                  </div>
                  {r.private && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">private</span>}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
              {repos.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">No repositories found.</div>}
            </div>
          </div>
        )}

        {selectedRepo && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={reset} className="text-muted-foreground hover:text-foreground">Repos</button>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{selectedRepo.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{pickedFiles.length} selected</span>
            </div>
            {loadingFiles ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : files.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No importable code files found in this repo.</div>
            ) : (
              <div className="overflow-auto flex-1 -mx-1 px-1 space-y-0.5">
                {files.map((f) => (
                  <label key={f.path} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition">
                    <input type="checkbox" checked={!!picked[f.path]} onChange={() => toggle(f.path)} className="accent-foreground" />
                    <FileCode2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{f.path}</span>
                    <span className="text-[10px] text-muted-foreground">{f.language}</span>
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        {error && <div className="text-xs text-destructive">{error}</div>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {selectedRepo && (
            <Button onClick={doImport} disabled={importing || pickedFiles.length === 0}>
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {importing ? "Importing…" : `Import${pickedFiles.length > 0 ? ` ${pickedFiles.length} file${pickedFiles.length > 1 ? "s" : ""}` : ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

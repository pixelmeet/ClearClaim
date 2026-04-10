"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, PlusCircle, CheckCircle,
  Users, Settings, Search, ArrowRight, Command,
} from "lucide-react";
import { UserRole } from "@/lib/types";
import { getRoleHomePath } from "@/lib/auth/postLoginRedirect";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  group: string;
  /** If set, only shown for these roles. */
  roles?: UserRole[];
  badge?: string;
  iconTone?: "blue" | "violet" | "emerald" | "zinc";
}

const RECENT_SEARCHES_KEY = "clearclaim:command-palette:recent-searches:v1";
const RECENT_COMMANDS_KEY = "clearclaim:command-palette:recent-commands:v1";
const MAX_RECENTS = 5;

function clampRecents(list: string[]) {
  return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean))).slice(0, MAX_RECENTS);
}

function toneClasses(tone: CommandItem["iconTone"]) {
  switch (tone) {
    case "blue":
      return "bg-blue-500/12 text-blue-500 dark:text-blue-400";
    case "violet":
      return "bg-violet-500/12 text-violet-500 dark:text-violet-400";
    case "emerald":
      return "bg-emerald-500/12 text-emerald-500 dark:text-emerald-400";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  }
}

export function CommandPalette({ userRole }: { userRole?: UserRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);

  const commands = useMemo((): CommandItem[] => {
    const role = userRole ?? UserRole.EMPLOYEE;
    const home = getRoleHomePath(role);
    const all: CommandItem[] = [
      { id: "dashboard", label: "Dashboard", description: "Overview and KPIs", icon: LayoutDashboard, href: home, group: "Navigation", iconTone: "blue" },
      { id: "expenses", label: "My Expenses", description: "View all expenses", icon: FileText, href: "/dashboard/expenses", group: "Navigation", iconTone: "violet" },
      { id: "new-expense", label: "New Expense", description: "Submit a new expense", icon: PlusCircle, href: "/dashboard/expenses/new", group: "Actions", iconTone: "violet", badge: "Quick" },
      {
        id: "approvals",
        label: "Pending Approvals",
        description: "Review requests",
        icon: CheckCircle,
        href: "/manager/approvals",
        group: "Actions",
        roles: [UserRole.MANAGER, UserRole.ADMIN],
        iconTone: "emerald",
        badge: "Quick",
      },
      { id: "users", label: "Manage Users", description: "User management", icon: Users, href: "/admin/users", group: "Navigation", roles: [UserRole.ADMIN], iconTone: "blue" },
      { id: "settings", label: "Company Settings", description: "Update preferences", icon: Settings, href: "/admin/company", group: "Navigation", roles: [UserRole.ADMIN], iconTone: "blue" },
    ];
    return all.filter((cmd) => !cmd.roles || cmd.roles.includes(role));
  }, [userRole]);

  const normalizedSearch = search.trim().toLowerCase();

  const recentCommands = useMemo(() => {
    const byId = new Map(commands.map((c) => [c.id, c]));
    return recentCommandIds.map((id) => byId.get(id)).filter(Boolean) as CommandItem[];
  }, [commands, recentCommandIds]);

  const filtered = useMemo(() => {
    if (!normalizedSearch) {
      return commands;
    }
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(normalizedSearch) ||
        (cmd.description?.toLowerCase().includes(normalizedSearch))
    );
  }, [commands, normalizedSearch]);

  const groups = useMemo(() => {
    const acc: Record<string, CommandItem[]> = {};
    if (!normalizedSearch && recentCommands.length) {
      acc["Recent"] = recentCommands;
    }

    for (const cmd of filtered) {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group].push(cmd);
    }

    // Prefer a premium/intentional order
    const order = ["Recent", "Navigation", "Actions"];
    const ordered: Record<string, CommandItem[]> = {};
    for (const key of order) {
      if (acc[key]?.length) ordered[key] = acc[key];
    }
    for (const key of Object.keys(acc)) {
      if (!ordered[key]) ordered[key] = acc[key];
    }
    return ordered;
  }, [filtered, normalizedSearch, recentCommands]);

  const flatFiltered = Object.values(groups).flat();

  const handleSelect = useCallback((cmd: CommandItem) => {
    setIsOpen(false);
    setSearch("");
    setRecentCommandIds((prev) => clampRecents([cmd.id, ...prev]));
    router.push(cmd.href);
  }, [router]);

  useEffect(() => {
    const onToggle = () => setIsOpen((prev) => !prev);
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onToggle();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", down);
    document.addEventListener("command-palette:toggle", onToggle as any);
    document.addEventListener("command-palette:open", onOpen as any);
    document.addEventListener("command-palette:close", onClose as any);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("command-palette:toggle", onToggle as any);
      document.removeEventListener("command-palette:open", onOpen as any);
      document.removeEventListener("command-palette:close", onClose as any);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    try {
      const rawSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
      const rawCommands = localStorage.getItem(RECENT_COMMANDS_KEY);
      if (rawSearches) setRecentSearches(JSON.parse(rawSearches));
      if (rawCommands) setRecentCommandIds(JSON.parse(rawCommands));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch {
      // ignore
    }
  }, [recentSearches]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recentCommandIds));
    } catch {
      // ignore
    }
  }, [recentCommandIds]);

  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-cmd-index="${selectedIndex}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, isOpen, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter" && flatFiltered[selectedIndex]) {
      if (search.trim()) {
        setRecentSearches((prev) => clampRecents([search.trim(), ...prev]));
      }
      handleSelect(flatFiltered[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="fixed top-[18%] left-1/2 z-50 w-[92vw] max-w-[640px] -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="glass-panel-strong rounded-[18px] shadow-2xl overflow-hidden border border-border/50">
              {/* Search input */}
              <div className="px-4 pt-4 pb-3 border-b border-border/20">
                <div className="group flex items-center gap-3 rounded-xl bg-background/50 px-3 py-2.5 ring-1 ring-border/30 focus-within:ring-2 focus-within:ring-transparent focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.18)] dark:focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.18)] transition-all">
                  <div className="h-9 w-9 rounded-lg bg-muted/40 flex items-center justify-center ring-1 ring-border/20">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search commands, pages, users..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/80 outline-none text-[13.5px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                    <kbd className="h-6 inline-flex items-center rounded-md border border-border/40 bg-muted/30 px-2 font-medium">ESC</kbd>
                    <kbd className="h-6 inline-flex items-center rounded-md border border-border/40 bg-muted/30 px-2 font-medium">↑↓</kbd>
                    <kbd className="h-6 inline-flex items-center rounded-md border border-border/40 bg-muted/30 px-2 font-medium">Enter</kbd>
                  </div>
                </div>
                {!normalizedSearch && recentSearches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 px-1">
                    {recentSearches.slice(0, MAX_RECENTS).map((s) => (
                      <button
                        key={s}
                        className="text-[11px] px-2 py-1 rounded-lg bg-muted/25 hover:bg-muted/40 text-muted-foreground hover:text-foreground ring-1 ring-border/20 transition-colors"
                        onClick={() => {
                          setSearch(s);
                          setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Results */}
              <div ref={resultsRef} className="max-h-[360px] overflow-y-auto py-2">
                {Object.keys(groups).length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <div className="mx-auto mb-3 h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 ring-1 ring-border/20 flex items-center justify-center">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-semibold text-foreground tracking-tight">No results found</div>
                    <div className="mt-1 text-xs text-muted-foreground">Try searching for pages or actions</div>
                  </div>
                ) : (
                  Object.entries(groups).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-5 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {group}
                      </div>
                      {items.map((cmd) => {
                        const globalIndex = flatFiltered.indexOf(cmd);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <motion.button
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, delay: Math.min(globalIndex, 10) * 0.008 }}
                            key={cmd.id}
                            data-cmd-index={globalIndex}
                            className={[
                              "group w-full flex items-center gap-3 px-5 py-2.5 text-left rounded-xl mx-2",
                              "transition-all duration-150 ease-out",
                              isSelected
                                ? "bg-gradient-to-r from-violet-500/14 to-blue-500/10 dark:from-violet-500/18 dark:to-blue-500/14 ring-1 ring-violet-500/25 shadow-[0_10px_30px_-16px_rgba(124,58,237,0.55)] scale-[1.01]"
                                : "text-foreground hover:bg-muted/25 hover:ring-1 hover:ring-border/20",
                            ].join(" ")}
                            onClick={() => handleSelect(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            <div className={`h-9 w-9 rounded-xl ring-1 ring-border/20 flex items-center justify-center ${toneClasses(cmd.iconTone)}`}>
                              <cmd.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-[13.5px] font-semibold text-foreground truncate">{cmd.label}</p>
                                {cmd.badge && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/30 ring-1 ring-border/20 text-muted-foreground">
                                    {cmd.badge}
                                  </span>
                                )}
                              </div>
                              {cmd.description && (
                                <p className="text-[12px] text-muted-foreground truncate">{cmd.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-border/40 bg-muted/30 px-2 text-[10px] font-medium text-muted-foreground">
                                {cmd.group === "Actions" ? "Enter" : "→"}
                              </kbd>
                              <ArrowRight className={`h-3.5 w-3.5 transition-all ${isSelected ? "opacity-100 text-foreground/60" : "opacity-0 group-hover:opacity-100 text-muted-foreground"}`} />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-border/15 flex items-center justify-between gap-4 text-[10px] text-muted-foreground/70">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-muted/30">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-muted/30">↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-muted/30">Enter</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded border border-border/40 bg-muted/30">Esc</kbd>
                    Close
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Command className="h-3 w-3" />
                  <span className="text-muted-foreground/70">Ctrl</span>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-muted-foreground/70">⌘</span>
                  <span className="text-muted-foreground/70">K</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CommandPaletteTrigger() {
  return (
    <button
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      onClick={() => {
        document.dispatchEvent(new Event("command-palette:toggle"));
      }}
    >
      <Command className="h-3 w-3" />
      <span>Search</span>
      <kbd className="ml-2 px-1.5 py-0.5 rounded border border-border/30 bg-muted/30 text-[10px]">Ctrl/⌘ K</kbd>
    </button>
  );
}

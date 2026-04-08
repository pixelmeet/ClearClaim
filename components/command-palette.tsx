"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, PlusCircle, CheckCircle,
  Users, Settings, Search, ArrowRight, Command,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  group: string;
}

const commands: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Overview and KPIs", icon: LayoutDashboard, href: "/dashboard", group: "Navigation" },
  { id: "expenses", label: "My Expenses", description: "View all expenses", icon: FileText, href: "/dashboard/expenses", group: "Navigation" },
  { id: "new-expense", label: "New Expense", description: "Submit a new expense", icon: PlusCircle, href: "/dashboard/expenses/new", group: "Actions" },
  { id: "approvals", label: "Pending Approvals", description: "Review requests", icon: CheckCircle, href: "/manager/approvals", group: "Navigation" },
  { id: "users", label: "Manage Users", description: "User management", icon: Users, href: "/admin/users", group: "Admin" },
  { id: "settings", label: "Company Settings", description: "Update preferences", icon: Settings, href: "/admin/company", group: "Admin" },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      (cmd.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const groups = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flatFiltered = Object.values(groups).flat();

  const handleSelect = useCallback((cmd: CommandItem) => {
    setIsOpen(false);
    setSearch("");
    router.push(cmd.href);
  }, [router]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
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
      handleSelect(flatFiltered[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="glass-panel-strong rounded-2xl shadow-2xl overflow-hidden border border-border/50">
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-2 text-[10px] font-medium text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-2">
                {Object.keys(groups).length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                ) : (
                  Object.entries(groups).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                        {group}
                      </div>
                      {items.map((cmd) => {
                        const globalIndex = flatFiltered.indexOf(cmd);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={cmd.id}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                              isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/30"
                            }`}
                            onClick={() => handleSelect(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            <cmd.icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{cmd.label}</p>
                              {cmd.description && (
                                <p className="text-xs text-muted-foreground">{cmd.description}</p>
                              )}
                            </div>
                            {isSelected && <ArrowRight className="h-3.5 w-3.5 text-primary/50" />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-border/20 flex items-center gap-4 text-[10px] text-muted-foreground/50">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border/30 bg-muted/30">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border/30 bg-muted/30">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border/30 bg-muted/30">Esc</kbd> Close
                </span>
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
        const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
        document.dispatchEvent(event);
      }}
    >
      <Command className="h-3 w-3" />
      <span>Search</span>
      <kbd className="ml-2 px-1.5 py-0.5 rounded border border-border/30 bg-muted/30 text-[10px]">⌘K</kbd>
    </button>
  );
}

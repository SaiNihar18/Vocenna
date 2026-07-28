import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

import {
  Bell,
  Home,
  MessageSquare,
  Mic,
  Users,
  Settings,
  HelpCircle,
  Plus,
  LogOut,
  Globe,
} from "@/lib/icons";
import { currentUser, api, setToken } from "@/lib/vocenna-api";


type Nav = { to: string; label: string; Icon: typeof Home };
const NAV: Nav[] = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/my-rooms", label: "My Rooms", Icon: MessageSquare },
  { to: "/recordings", label: "Recordings", Icon: Mic },
  { to: "/team", label: "Team", Icon: Users },
];

export function AppShell({
  title,
  onCreateRoom,
  children,
}: {
  title: string;
  onCreateRoom?: () => void;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    async function fetchUser() {
      const u = await api.me();
      setUser(u);
    }
    fetchUser();
  }, []);

  function handleLogout() {
    setToken("");
    window.location.href = "/";
  }


  return (
    <div className="min-h-screen flex bg-ink text-paper">
      <aside className="w-64 shrink-0 border-r border-hairline flex flex-col bg-ink">
        <div className="px-6 pt-6 pb-8">
          <div className="font-display text-3xl text-signal-amber leading-none">Vocenna</div>
          <div className="mt-1 font-mono-ui text-[10px] tracking-[0.22em] uppercase text-muted-slate">
            Voice Intelligence
          </div>
        </div>

        <div className="px-4">
          <button
            onClick={onCreateRoom}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-signal-amber text-[#12161C] font-medium text-sm px-4 py-2.5 hover:brightness-105 transition"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create Room
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`relative isolate flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition duration-300 ${
                  active
                    ? "text-[#12161C] font-medium"
                    : "text-paper/85 hover:bg-ink-raised/50"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-echo-teal rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>


        <div className="mt-auto p-3 space-y-1 border-t border-hairline">
          <Link
            to="/memory"
            className={`relative isolate flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition duration-300 ${
              pathname.startsWith("/memory")
                ? "text-[#12161C] font-medium"
                : "text-paper/85 hover:bg-ink-raised/50"
            }`}
          >
            {pathname.startsWith("/memory") && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-echo-teal rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <HelpCircle size={16} />
            Memory Search
          </Link>
          <Link
            to="/settings"
            className={`relative isolate flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition duration-300 ${
              pathname.startsWith("/settings")
                ? "text-[#12161C] font-medium"
                : "text-paper/85 hover:bg-ink-raised/50"
            }`}
          >
            {pathname.startsWith("/settings") && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-echo-teal rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Settings size={16} /> Settings
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-hairline flex items-center justify-between px-8 bg-ink">
          <h1 className="font-display text-xl">{title}</h1>
          <div className="flex items-center gap-4">
            <button className="text-muted-slate hover:text-paper transition" aria-label="Language">
              <Globe size={18} />
            </button>
            <button className="text-muted-slate hover:text-paper transition relative" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-signal-amber" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-hairline">
              <Link
                to="/settings"
                className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer text-left focus:outline-none"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-echo-teal text-[#12161C] flex items-center justify-center font-mono-ui text-xs font-bold uppercase">
                    {user.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
                  </div>
                )}
                <div className="hidden md:block leading-tight">
                  <div className="text-sm">{user.name}</div>
                  <div className="text-[11px] text-muted-slate">{user.email}</div>
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="ml-2 text-muted-slate hover:text-flag-rose transition" 
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

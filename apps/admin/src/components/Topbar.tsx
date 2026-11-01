import { useAuth } from "../lib/auth";
import { BellIcon, MenuIcon, SearchIcon } from "./icons";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={onMenuClick}
        className="flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <label htmlFor="admin-search" className="sr-only">
          Search
        </label>
        <input
          id="admin-search"
          type="search"
          placeholder="Search orders, products…"
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white"
        />
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 cursor-pointer"
      >
        <BellIcon className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
      </button>

      <div className="flex items-center gap-3 pl-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {(user?.name ?? "A").slice(0, 2).toUpperCase()}
        </div>
        <span className="hidden text-sm font-medium text-slate-700 sm:inline">{user?.name}</span>
        <button type="button" onClick={logout} className="cursor-pointer text-sm text-slate-500 hover:text-slate-900">
          Sign out
        </button>
      </div>
    </header>
  );
}

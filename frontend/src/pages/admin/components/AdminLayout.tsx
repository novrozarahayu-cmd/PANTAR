import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { clearAdminSession, getAdminUser } from "../utils/auth-storage";

const navItems = [
  {
    to: "/admin",
    labelKey: "nav.dashboard",
    defaultLabel: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/admin/reports",
    labelKey: "nav.adminReports",
    defaultLabel: "Laporan Pengaduan",
    icon: ClipboardList,
    end: false,
  },
];

type SidebarProps = {
  compact: boolean;
  userName: string;
  onNavigate: () => void;
  onLogout: () => void;
};

function Sidebar({ compact, userName, onNavigate, onLogout }: SidebarProps) {
  const { t } = useTranslation();
  const initial = userName.slice(0, 1).toUpperCase();

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div
        className={`flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-100 ${compact ? "justify-center px-3" : "px-5"
          }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
          <MapPin size={20} />
        </span>
        {!compact && (
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold tracking-tight text-slate-900">
              Pantau<span className="text-emerald-600">Jalan</span>
            </p>
            <p className="text-xs text-slate-500">{t("nav.adminPanel", "Panel admin")}</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav aria-label="Menu admin" className="flex-1 overflow-y-auto px-3 py-5">
        {!compact && (
          <p className="mb-2 px-3 text-xs font-medium text-slate-400">{t("nav.menu", "Menu")}</p>
        )}
        <ul className="space-y-1">
          {navItems.map(({ to, labelKey, defaultLabel, icon: Icon, end }) => {
            const label = t(labelKey, defaultLabel);
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  title={compact ? label : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${compact ? "justify-center px-0" : "px-3"
                    } ${isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-600"
                        />
                      )}
                      <Icon
                        size={19}
                        className={
                          isActive
                            ? "text-emerald-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }
                      />
                      {!compact && <span className="flex-1">{label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Akun */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <div
          className={`flex items-center gap-3 rounded-xl p-2 ${compact ? "justify-center" : ""
            }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            {initial}
          </span>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {userName}
              </p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          title={t("nav.logout", "Keluar")}
          aria-label={t("nav.logout", "Keluar dari akun")}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${compact ? "justify-center px-0" : "px-3"
            }`}
        >
          <LogOut size={18} />
          {!compact && t("nav.logout", "Keluar")}
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAdminUser();
  const userName = user?.name || "Administrator";

  const currentItem = navItems.find((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to),
  );
  const pageTitle = currentItem
    ? t(currentItem.labelKey, currentItem.defaultLabel)
    : t("nav.dashboard", "Dashboard");

  // Tutup drawer saat pindah halaman
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Escape menutup drawer, dan scroll halaman dikunci saat drawer terbuka
  useEffect(() => {
    if (!mobileOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const logout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f6faf7] text-slate-800 lg:flex">
      {/* Sidebar desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block ${collapsed ? "w-[84px]" : "w-[256px]"
          }`}
      >
        <Sidebar
          compact={collapsed}
          userName={userName}
          onNavigate={() => undefined}
          onLogout={logout}
        />
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu admin"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
          />
          <div className="relative h-full w-[272px] shadow-2xl">
            <Sidebar
              compact={false}
              userName={userName}
              onNavigate={() => setMobileOpen(false)}
              onLogout={logout}
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Konten */}
      <div
        className={`min-w-0 flex-1 transition-[padding] duration-200 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[256px]"
          }`}
      >
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
              aria-label="Buka menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={19} />
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 lg:inline-flex"
              aria-label={collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
            >
              {collapsed ? (
                <ChevronRight size={17} />
              ) : (
                <ChevronLeft size={17} />
              )}
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Admin</p>
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="admin" />
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight text-slate-800">
                  {userName}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {userName.slice(0, 1).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
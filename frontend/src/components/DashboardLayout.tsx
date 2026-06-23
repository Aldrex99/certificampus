import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  Settings,
  LogOut,
  Building2,
  CreditCard,
  FileText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { useLogoutMutation } from "@/store/api";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const schoolNav: NavItem[] = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/app/students", label: "Étudiants", icon: Users },
  { to: "/app/trainings", label: "Formations", icon: GraduationCap },
  { to: "/app/certifications", label: "Certifications", icon: Award },
  { to: "/app/settings", label: "Paramètres", icon: Settings },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/schools", label: "Établissements", icon: Building2 },
  { to: "/admin/subscriptions", label: "Abonnements", icon: CreditCard },
  { to: "/admin/templates", label: "Templates", icon: FileText },
];

export function DashboardLayout({ variant }: { variant: "school" | "admin" }) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutMutation] = useLogoutMutation();
  const nav = variant === "admin" ? adminNav : schoolNav;

  const onLogout = async () => {
    // Clear the httpOnly cookies + server-side session, then the local state.
    try {
      await logoutMutation().unwrap();
    } catch {
      // ignore — we log out locally regardless
    }
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="flex w-64 flex-col bg-brand text-white">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Logo light className="text-xl" />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app" || to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 text-sm">
            <p className="font-medium">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-xs text-white/60">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

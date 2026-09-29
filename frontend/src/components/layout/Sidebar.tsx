import { Activity, FolderKanban, LayoutDashboard, User, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Teams", path: "/teams", icon: UsersRound },
  { label: "Users", path: "/users", icon: User },
  { label: "Projects", path: "/projects", icon: FolderKanban },
  { label: "Activity log", path: "/activity", icon: Activity },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
];

export const Sidebar = () => (
  <aside className="fixed top-14 bottom-0 left-0 z-10 w-60 border-r border-slate-200 bg-white">
    <nav aria-label="Main" className="p-3">
      <ul className="space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);

export default Sidebar;

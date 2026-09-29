import { LogOut, UsersRound } from "lucide-react";

import { useAuth } from "../../auth/authContext";
import { Button } from "../ui/Button";

export const Topbar = ({ title = "Team Management" }: { title?: string }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <UsersRound className="size-5 text-brand-600" aria-hidden />
        {title}
      </div>
      {user && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-600">{user.displayName}</span>
          <Button variant="ghost" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      )}
    </header>
  );
};

export default Topbar;

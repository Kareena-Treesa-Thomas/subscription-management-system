import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Badge } from "@/components/ui";

export function UserMenu({ name, email, role }: { name: string; email: string; role: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700" aria-hidden>{initials}</span>
      <div className="hidden min-w-0 text-left leading-tight sm:block">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-ink-mute">{email}</p>
      </div>
      <Badge tone={role === "ADMIN" ? "amber" : role === "STAFF" ? "blue" : "green"}>{role.charAt(0) + role.slice(1).toLowerCase()}</Badge>
      <form action={logoutAction}>
        <button type="submit" aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-ink-soft hover:bg-slate-100 hover:text-ink">
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

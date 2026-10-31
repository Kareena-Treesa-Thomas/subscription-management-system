"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Circle } from "lucide-react";
import { Field } from "@/components/ui";
import { passwordRules } from "@/lib/validation";
import { cn } from "@/lib/utils";

/** Password input with show/hide toggle and a live rule checklist. */
export function PasswordField({ name = "password", label = "Password", error, showRules = true }: {
  name?: string; label?: string; error?: string; showRules?: boolean;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="relative">
        <Field
          label={label} name={name} type={show ? "text" : "password"} autoComplete={showRules ? "new-password" : "current-password"}
          value={value} onChange={(e) => setValue(e.target.value)} error={error} placeholder="••••••••••"
        />
        <button
          type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-[34px] text-ink-mute hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showRules && (
        <ul className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
          {passwordRules.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.label} className={cn("flex items-center gap-1.5", ok ? "text-brand-600" : "text-ink-mute")}>
                {ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                {r.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

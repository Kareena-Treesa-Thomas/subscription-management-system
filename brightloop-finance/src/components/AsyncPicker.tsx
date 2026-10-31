"use client";

import { useEffect, useId, useRef, useState } from "react";

export type PickerItem = { id: string; label: string; sub?: string; balance?: number };

type Props = {
  endpoint: string;
  placeholder: string;
  name?: string;
  initial?: PickerItem | null;
  extraParams?: Record<string, string>;
  invalid?: boolean;
  onChange?: (item: PickerItem | null) => void;
};

/** Search-as-you-type picker. Works inside a plain GET form (it renders a hidden input when `name` is set). */
export function AsyncPicker({ endpoint, placeholder, name, initial = null, extraParams, invalid, onChange }: Props) {
  const [selected, setSelected] = useState<PickerItem | null>(initial);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PickerItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const extraKey = JSON.stringify(extraParams ?? {});

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ ...(JSON.parse(extraKey) as Record<string, string>), q: query });
        const res = await fetch(`${endpoint}?${qs.toString()}`, { signal: ctrl.signal });
        if (res.ok) {
          const json = (await res.json()) as { items?: PickerItem[] };
          setItems(json.items ?? []);
          setActive(0);
        }
      } catch {
        // aborted or offline
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, open, endpoint, extraKey]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function choose(item: PickerItem | null) {
    setSelected(item);
    setOpen(false);
    setQuery("");
    onChange?.(item);
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-white px-3 py-2 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium">{selected.label}</p>
          {selected.sub && <p className="truncate text-xs text-ink-soft">{selected.sub}</p>}
        </div>
        {name && <input type="hidden" name={name} value={selected.id} />}
        <button type="button" className="shrink-0 text-xs font-medium text-brand-dark hover:underline" onClick={() => choose(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        autoComplete="off"
        className={`field ${invalid ? "field-error" : ""}`}
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(items.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && items[active]) {
            e.preventDefault();
            choose(items[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-line bg-white py-1 shadow-lg"
        >
          {loading && items.length === 0 && <li className="px-3 py-2 text-sm text-ink-soft">Searching…</li>}
          {!loading && items.length === 0 && <li className="px-3 py-2 text-sm text-ink-soft">No matches. Try a different search.</li>}
          {items.map((it, i) => (
            <li
              key={it.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(it);
              }}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-canvas" : ""}`}
            >
              <p className="text-sm font-medium">{it.label}</p>
              {it.sub && <p className="text-xs text-ink-soft">{it.sub}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import type { ModuleDef } from "../types/modules";

const KEY = "module-order-v1";

export function useModules() {
  const [modules, setModules] = useState<ModuleDef[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/src/modules.json");
      const defs: ModuleDef[] = await res.json();

      const saved = localStorage.getItem(KEY);
      if (saved) {
        const order: string[] = JSON.parse(saved);
        // sort by saved order (fallback to def.order)
        defs.sort((a, b) => {
          const ia = order.indexOf(a.id);
          const ib = order.indexOf(b.id);
          if (ia === -1 && ib === -1) return a.order - b.order;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
      } else {
        defs.sort((a, b) => a.order - b.order);
      }

      setModules(defs);
    }
    load();
  }, []);

  function saveOrder(next: ModuleDef[]) {
    setModules(next);
    localStorage.setItem(KEY, JSON.stringify(next.map((m) => m.id)));
  }

  function reset(defs: ModuleDef[]) {
    localStorage.removeItem(KEY);
    setModules([...defs].sort((a, b) => a.order - b.order));
  }

  return { modules, setModules: saveOrder };
}
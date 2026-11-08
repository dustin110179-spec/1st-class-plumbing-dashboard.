"use client";

import { CommandCenter } from "@/components/CommandCenter";
import { StoreProvider } from "@/lib/store";

export default function Page() {
  return (
    <StoreProvider>
      <CommandCenter />
    </StoreProvider>
  );
}

"use client";

/**
 * Minimal retry control for the server-rendered integration page.
 * Re-runs the Server Component data fetch without a full page reload.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "./ui/button";

export default function RefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <button
      type="button"
      disabled={refreshing}
      onClick={() => {
        setRefreshing(true);
        router.refresh();
        // Server re-render completes asynchronously; re-enable shortly after.
        setTimeout(() => setRefreshing(false), 1500);
      }}
      className={buttonClasses("ghost", "sm")}
    >
      {refreshing ? "Retrying…" : "Retry"}
    </button>
  );
}

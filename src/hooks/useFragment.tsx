"use client";
// Hook for reading and updating the URL hash fragment in the app router.
import { useEffect, useState } from "react";

// based on https://blog.zenblog.com/how-to-get-the-anchor-or-hash-from-the-url-in-nextjs-15-app-router
export default function useFragment(onChange = (fragment: string) => {}): [string, (newFragment: string, causeEvent?: boolean) => void] {
  const getHash = () => ((typeof window !== "undefined") ? window : undefined)?.decodeURIComponent(window.location.hash) ?? "";
  const [fragment, setFragment] = useState((getHash() || "#").slice(1));

  useEffect(() => {
    const onHashChange = () => {
      const newFragment = (getHash() || "#").slice(1);
      setFragment(newFragment);
      onChange(newFragment);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return [fragment, (newFragment: string, causeEvent = true) => {
    if (causeEvent) {
      window.location.hash = newFragment;
    } else {
      setFragment(newFragment);
      history.replaceState(history.state, "", `${window.location.pathname}#${newFragment}`);
    }
  }];
}
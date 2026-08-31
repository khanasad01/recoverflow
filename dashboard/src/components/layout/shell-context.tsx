"use client";

import React, { createContext, useContext, useState, useSyncExternalStore, useCallback } from "react";

interface ShellContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapsed: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  environment: "live" | "test";
  setEnvironment: (env: "live" | "test") => void;
  toggleEnvironment: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const defaultShellContext: ShellContextType = {
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleCollapsed: () => {},
  isMobileDrawerOpen: false,
  setIsMobileDrawerOpen: () => {},
  environment: "live",
  setEnvironment: () => {},
  toggleEnvironment: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
};

const ShellContext = createContext<ShellContextType>(defaultShellContext);

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const initialCollapse = useSyncExternalStore(
    subscribeStorage,
    () => localStorage.getItem("rf_sidebar_collapsed") === "true",
    () => false
  );

  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialCollapse);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [environment, setEnvironment] = useState<"live" | "test">("live");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("rf_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  const toggleEnvironment = useCallback(() => {
    setEnvironment((prev) => (prev === "live" ? "test" : "live"));
  }, []);

  return (
    <ShellContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        environment,
        setEnvironment,
        toggleEnvironment,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const context = useContext(ShellContext);
  return context || defaultShellContext;
}

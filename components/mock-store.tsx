"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EDITABLE_HANDLE,
  INITIAL_PROFILES,
  type MockProfile,
  upsertProfile,
} from "@/lib/mock-profiles";

const STORAGE_KEY = "dolphub-mock-profiles";

type MockStore = {
  ready: boolean;
  profiles: MockProfile[];
  editableHandle: string;
  saveEditable: (profile: MockProfile) => void;
};

const MockStoreContext = createContext<MockStore | null>(null);

function readStoredProfiles(): MockProfile[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockProfile[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<MockProfile[]>(INITIAL_PROFILES);
  const [editableHandle, setEditableHandle] = useState(EDITABLE_HANDLE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredProfiles();
    if (stored) {
      setProfiles(stored);
      const stillThere = stored.some((profile) => profile.handle === EDITABLE_HANDLE);
      if (!stillThere) {
        const fallback = stored.find((profile) => profile.projects.length > 0);
        if (fallback) setEditableHandle(fallback.handle);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles, ready]);

  const value = useMemo<MockStore>(
    () => ({
      ready,
      profiles,
      editableHandle,
      saveEditable: (profile) => {
        setProfiles((current) => upsertProfile(current, profile, editableHandle));
        setEditableHandle(profile.handle);
      },
    }),
    [editableHandle, profiles, ready],
  );

  return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>;
}

export function useMockStore() {
  const store = useContext(MockStoreContext);
  if (!store) throw new Error("useMockStore must run inside MockStoreProvider");
  return store;
}

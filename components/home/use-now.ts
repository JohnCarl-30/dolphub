"use client";

import { useEffect, useState } from "react";

/**
 * The visitor's clock, or null until the page has hydrated. Closing labels such as
 * "Closes today" depend on it, so rendering them only after mount keeps the server's
 * HTML and the first browser render the same.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // The browser clock only exists after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);
  return now;
}

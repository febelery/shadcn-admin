import { useState, useEffect } from "react";

export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Initial check
    setIsMobile(mediaQuery.matches);

    // Modern event listener
    mediaQuery.addEventListener("change", handleViewportChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, [breakpoint]);

  return isMobile;
};

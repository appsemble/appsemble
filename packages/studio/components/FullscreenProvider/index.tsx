import { type Toggle, useToggle } from '@appsemble/react-components';
import {
  createContext,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

interface FullscreenContextValue {
  /**
   * Function to enable fullscreen from anywhere within the app context.
   */
  enterFullscreen: () => void;

  /**
   * Function to disable fullscreen from anywhere within the app context.
   */
  exitFullscreen: () => void;

  /**
   * Function to enable fullscreen from anywhere within the app context.
   */
  fullscreen: Toggle;

  /**
   * Keep a reference point for the app to set fullscreen.
   */
  fullscreenRef: MutableRefObject<HTMLDivElement | null>;

  /**
   * Update the app in the current context.
   */
}

const FullscreenContext = createContext<FullscreenContextValue | null>(null);

interface FullscreenProviderProps {
  readonly children: ReactNode;
}

export function FullscreenProvider({ children }: FullscreenProviderProps): ReactNode {
  const fullscreenRef = useRef<HTMLDivElement | null>();
  const fullscreen = useToggle(false);

  const enterFullscreen = useCallback(() => {
    fullscreenRef.current?.requestFullscreen().then(() => {
      fullscreen.enable();
    });
  }, [fullscreen]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        fullscreen.disable();
      });
    }
  }, [fullscreen]);

  const value = useMemo(
    () => ({
      enterFullscreen,
      exitFullscreen,
      fullscreen,
      fullscreenRef,
    }),
    [enterFullscreen, exitFullscreen, fullscreen],
  );

  useEffect(() => {
    function onFullscreenChange(): void {
      // Check if the document is currently in fullscreen mode
      const isFullscreen = Boolean(document.fullscreenElement);

      // If there is no fullscreen element, fullscreen mode has been exited
      if (isFullscreen) {
        fullscreen.enable();
      } else {
        fullscreen.disable();
      }
    }

    // Add event listener for fullscreen change
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Clean up event listener
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [fullscreen, fullscreen.enabled]);

  return <FullscreenContext.Provider value={value}>{children}</FullscreenContext.Provider>;
}

export const useFullscreenContext = (): FullscreenContextValue => {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error('useFullscreenContext must be used within a FullscreenProvider');
  }
  return context;
};

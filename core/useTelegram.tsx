"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Extend Window interface to include Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface TelegramContextType {
  webApp: any | null;
  user: TelegramUser | null;
  isTelegramEnv: boolean;
  isReady: boolean;
  colorScheme: "light" | "dark";
  themeParams: any;
  expand: () => void;
  close: () => void;
  showBackButton: (onClick?: () => void) => void;
  hideBackButton: () => void;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  hapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [webAppInstance, setWebAppInstance] = useState<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Dynamically import SDK to avoid SSR issues
    import("@twa-dev/sdk").then((module) => {
      const WebApp = module.default;
      setWebAppInstance(WebApp);

      // Check if we're in Telegram environment
      const isTg = window.Telegram?.WebApp?.initData !== undefined;
      
      setIsTelegramEnv(isTg);

      if (isTg) {
        // Initialize Telegram WebApp
        WebApp.ready();
        WebApp.expand();
      
      // Get user info
      const tgUser = WebApp.initDataUnsafe?.user;
      if (tgUser) {
        setUser({
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          language_code: tgUser.language_code,
          is_premium: tgUser.is_premium,
          photo_url: tgUser.photo_url,
        });
      }

      // Set color scheme from Telegram
      setColorScheme(WebApp.colorScheme);

      // Listen for theme changes
      const handleThemeChange = () => {
        setColorScheme(WebApp.colorScheme);
      };

      WebApp.onEvent("themeChanged", handleThemeChange);

      // Apply Telegram theme to document
      if (WebApp.colorScheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Hide Telegram back button by default
      WebApp.BackButton.hide();

        console.log("Telegram WebApp initialized", {
          version: WebApp.version,
          platform: WebApp.platform,
          colorScheme: WebApp.colorScheme,
          user: tgUser,
        });
      }

      setIsReady(true);
    }).catch((error) => {
      console.error("Failed to load Telegram SDK:", error);
      setIsReady(true);
    });
  }, []);

  const value: TelegramContextType = {
    webApp: webAppInstance,
    user,
    isTelegramEnv,
    isReady,
    colorScheme,
    themeParams: webAppInstance?.themeParams || {},
    
    expand: () => {
      if (webAppInstance) webAppInstance.expand();
    },
    
    close: () => {
      if (webAppInstance) webAppInstance.close();
    },
    
    showBackButton: (onClick?: () => void) => {
      if (webAppInstance?.BackButton) {
        webAppInstance.BackButton.show();
        if (onClick) {
          webAppInstance.BackButton.onClick(onClick);
        }
      }
    },
    
    hideBackButton: () => {
      if (webAppInstance?.BackButton) webAppInstance.BackButton.hide();
    },
    
    showMainButton: (text: string, onClick: () => void) => {
      if (webAppInstance?.MainButton) {
        webAppInstance.MainButton.setText(text);
        webAppInstance.MainButton.onClick(onClick);
        webAppInstance.MainButton.show();
      }
    },
    
    hideMainButton: () => {
      if (webAppInstance?.MainButton) webAppInstance.MainButton.hide();
    },
    
    showAlert: (message: string) => {
      if (webAppInstance) {
        webAppInstance.showAlert(message);
      } else {
        alert(message);
      }
    },
    
    showConfirm: (message: string, callback: (confirmed: boolean) => void) => {
      if (webAppInstance) {
        webAppInstance.showConfirm(message, callback);
      } else {
        callback(confirm(message));
      }
    },
    
    hapticFeedback: {
      impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => {
        if (webAppInstance?.HapticFeedback) {
          webAppInstance.HapticFeedback.impactOccurred(style);
        }
      },
      notificationOccurred: (type: "error" | "success" | "warning") => {
        if (webAppInstance?.HapticFeedback) {
          webAppInstance.HapticFeedback.notificationOccurred(type);
        }
      },
      selectionChanged: () => {
        if (webAppInstance?.HapticFeedback) {
          webAppInstance.HapticFeedback.selectionChanged();
        }
      },
    },
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}

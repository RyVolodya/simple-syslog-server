//СТВОРЮЄМО КОНТЕКСТ

import { createContext } from "react";

interface AppNameContextType {
  appName: string;
  setAppName: (name: string) => void;
}

export const AppNameContext = createContext<AppNameContextType>({
  appName: "",
  setAppName: () => {},
});

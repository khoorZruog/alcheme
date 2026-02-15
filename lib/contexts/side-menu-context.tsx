"use client";

import { createContext, useContext } from "react";

interface SideMenuContextValue {
  openSideMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextValue>({
  openSideMenu: () => {},
});

export const SideMenuProvider = SideMenuContext.Provider;
export const useSideMenu = () => useContext(SideMenuContext);

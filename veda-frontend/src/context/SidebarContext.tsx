import { createContext, useContext, useState, type ReactNode } from "react";

export interface UserInfo {
  name: string;
  instituteName: string;
  instituteLocation: string;
  instituteLogo?: string;
}

interface SidebarContextValue {
  userInfo: UserInfo;
  setUserInfo: (info: Partial<UserInfo>) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const DEFAULT_USER: UserInfo = {
  name: "Madhur Rastogi",
  instituteName: "Delhi Public School",
  instituteLocation: "Bokaro Steel City",
};

const SidebarContext = createContext<SidebarContextValue>({
  userInfo: DEFAULT_USER,
  setUserInfo: () => {},
  isOpen: true,
  setIsOpen: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfoState] = useState<UserInfo>(DEFAULT_USER);
  const [isOpen, setIsOpen] = useState(true);

  function setUserInfo(info: Partial<UserInfo>) {
    setUserInfoState((prev) => ({ ...prev, ...info }));
  }

  return (
    <SidebarContext.Provider value={{ userInfo, setUserInfo, isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

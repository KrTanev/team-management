import type { ReactNode } from "react";
import type { User } from "../../api/types/userTypes";


export interface AuthContextValue {
    user: User | null,
    login: (user: User) => void;
    logout: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
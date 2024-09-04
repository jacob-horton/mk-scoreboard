import { createContext, useEffect, useState } from "react";
import getApiAddr from "../data/ip";

async function getIsAuthenticated(): Promise<{ isAuthed: boolean, requestSucceeded: boolean }> {
  const apiAddr = getApiAddr();
  const resp = await fetch(`${apiAddr}/auth`);

  // If 500 or above, ignore response - retry
  return { isAuthed: resp.ok, requestSucceeded: resp.status < 500 };
}

const AuthContext = createContext<
  { isAuthenticated: boolean }
>({ isAuthenticated: false });

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setAuthenticated] = useState<boolean>(false);

  // Load auth on first load
  useEffect(() => {
    getIsAuthenticated().then((auth) => {
      if (auth.requestSucceeded) {
        setAuthenticated(auth.isAuthed);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

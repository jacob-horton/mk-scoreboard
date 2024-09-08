import { createContext, useState } from "react";
import getApiAddr from "../data/ip";

function getStoredJwt(): string | null {
  // TODO: local storage
  return null;
}

async function authenticate(name: string, password: string): Promise<string> {
  const body = {
    name,
    password,
  };

  const apiAddr = getApiAddr();
  const url = new URL(`${apiAddr}/auth`);
  const resp = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  if (!resp.ok) {
    throw new Error('Failed to authenticate');
  }

  return await resp.text();
}

const AuthContext = createContext<{
  isAuthenticated: boolean,
  authenticate: (name: string, password: string) => Promise<boolean>,
  logout: () => void
  jwt: string | null,
}>({
  isAuthenticated: false,
  authenticate: (_: string, __: string) => new Promise(() => false),
  logout: () => { },
  jwt: null,
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [jwt, setJwt] = useState<string | null>(getStoredJwt());

  const authenticateAndUpdate = async (name: string, password: string) => {
    try {
      const jwt = await authenticate(name, password);
      // TODO: save to localstorage
      setJwt(jwt);

      return true;
    } catch (Error) {
      return false;
    }
  }

  const logout = async () => {
    // TODO: clear localstorage
    setJwt(null);
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!jwt,
      authenticate: authenticateAndUpdate,
      logout,
      jwt,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

import { createContext, useMemo, useState } from "react";
import getApiAddr from "../data/ip";
import store from "store2";
import { jwtDecode } from "jwt-decode";

function getStoredJwt(): string | null {
  return store.get("jwt");
  ;
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
  username: string | null,
}>({
  isAuthenticated: false,
  authenticate: (_: string, __: string) => new Promise(() => false),
  logout: () => { },
  jwt: null,
  username: null,
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [jwt, setJwt] = useState<string | null>(getStoredJwt());
  const username = useMemo(() => {
    if (!jwt) {
      return null;
    }

    return jwtDecode(jwt).sub ?? null;
  }, [jwt]);

  const authenticateAndUpdate = async (name: string, password: string) => {
    try {
      const jwt = await authenticate(name, password);
      store.set("jwt", jwt);
      setJwt(jwt);

      return true;
    } catch (Error) {
      return false;
    }
  }

  const logout = async () => {
    store.remove("jwt");
    setJwt(null);
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!jwt,
      authenticate: authenticateAndUpdate,
      logout,
      jwt,
      username
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

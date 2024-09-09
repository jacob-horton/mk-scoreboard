import { createContext, useMemo, useState } from "react";
import store from "store2";
import { jwtDecode } from "jwt-decode";
import ax from "../data/fetch";

function getStoredJwt(): string | null {
  const jwt = store.get("jwt");
  ax.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
  return jwt;
}

async function authenticate(name: string, password: string): Promise<string> {
  const resp = await ax.post("/auth", { name, password });

  if (resp.status >= 400) {
    throw new Error('Failed to authenticate');
  }

  return resp.data;
}

const AuthContext = createContext<{
  isAuthenticated: boolean,
  authenticate: (name: string, password: string) => Promise<boolean>,
  logout: () => void
  username: string | null,
}>({
  isAuthenticated: false,
  authenticate: (_: string, __: string) => new Promise(() => false),
  logout: () => { },
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

  const updateJwt = (jwt: string | null) => {
    if (jwt) {
      store.set("jwt", jwt);
      ax.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    } else {
      store.remove("jwt");
      ax.defaults.headers.common['Authorization'] = null;
    }

    setJwt(jwt);
  }

  const authenticateAndUpdate = async (name: string, password: string) => {
    try {
      updateJwt(await authenticate(name, password));

      return true;
    } catch (Error) {
      return false;
    }
  }

  const logout = async () => {
    updateJwt(null);
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!jwt,
      authenticate: authenticateAndUpdate,
      logout,
      username
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

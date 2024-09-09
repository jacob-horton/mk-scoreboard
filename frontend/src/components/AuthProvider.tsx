import { createContext, useEffect, useMemo, useState } from "react";
import store from "store2";
import { jwtDecode } from "jwt-decode";
import ax from "../data/fetch";

type Tokens = { access: string | null; refresh: string | null };

function loadStoredTokens(): Tokens {
  const access = store.get("access_token");
  const refresh = store.get("refresh_token");
  return { access, refresh };
}

async function authenticate(name: string, password: string): Promise<Tokens> {
  const resp = await ax.post("/auth", { name, password });
  return { access: resp.data.access_token, refresh: resp.data.refresh_token };
}

function configureAxios(tokens: Tokens, onUpdateAccessToken: (token: string) => void, onFailedReauth: () => void) {
  // Set up access token header
  if (tokens.access) {
    ax.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
  } else {
    ax.defaults.headers.common['Authorization'] = null;
  }

  // Set up auto refresh token
  ax.interceptors.response.use(
    (resp) => {
      return resp;
    },
    async (error) => {
      if (
        error.response.status === 401 &&
        error.config.url.trim() !== "/auth/refresh" &&
        error.config.url.trim() !== "/auth"
      ) {
        try {
          const newToken = (await ax.get("/auth/refresh", { headers: { 'Authorization': `Bearer ${tokens.refresh}` } })).data;
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          onUpdateAccessToken(newToken);
        } catch (error) {
          onFailedReauth();
          return;
        }

        return await ax.request(error.config);
      } else {
        throw error;
      }
    },
  );
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
  const logout = async () => {
    updateTokens({ access: null, refresh: null });
  }

  const [tokens, setTokens] = useState<Tokens>({ access: null, refresh: null });
  const username = useMemo(() => {
    if (!tokens.access) {
      return null;
    }

    return jwtDecode(tokens.access).sub ?? null;
  }, [tokens.access]);

  // 
  useEffect(() => {
    const tokens = loadStoredTokens();
    configureAxios(tokens, (access) => updateTokens({ ...tokens, access }), logout);
    setTokens(tokens);
  }, [])

  const updateTokens = (tokens: Tokens) => {
    if (tokens.access) {
      store.set("access_token", tokens.access);
    } else {
      store.remove("access_token");
    }

    if (tokens.refresh) {
      store.set("refresh_token", tokens.refresh);
    } else {
      store.remove("refresh_token");
    }

    configureAxios(tokens, (access) => updateTokens({ ...tokens, access }), logout);
    setTokens(tokens);
  }

  const authenticateAndUpdate = async (name: string, password: string) => {
    try {
      updateTokens(await authenticate(name, password));

      return true;
    } catch (Error) {
      return false;
    }
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!tokens.access,
      authenticate: authenticateAndUpdate,
      logout,
      username
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

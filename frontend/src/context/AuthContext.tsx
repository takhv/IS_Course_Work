import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  login: string | null;
  nickname: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, login: string, nickname: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('jwtToken');
    const savedLogin = localStorage.getItem('userLogin');
    const savedNickname = localStorage.getItem('userNickname');
    if (savedToken) {
      setToken(savedToken);
      setLogin(savedLogin);
      setNickname(savedNickname);
    }
  }, []);

  const setAuth = (newToken: string, newLogin: string, newNickname: string) => {
    setToken(newToken);
    setLogin(newLogin);
    setNickname(newNickname);
    localStorage.setItem('jwtToken', newToken);
    localStorage.setItem('userLogin', newLogin);
    localStorage.setItem('userNickname', newNickname);
  };

  const logout = () => {
    setToken(null);
    setLogin(null);
    setNickname(null);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userLogin');
    localStorage.removeItem('userNickname');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        nickname,
        isAuthenticated: !!token,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

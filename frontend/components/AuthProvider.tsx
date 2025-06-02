import React, { createContext, useContext, useState } from 'react';

type AuthContextType = {
  user: any; // Replace with your user type or keep as any for now
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null); // Replace any with your user type
  const [loading, setLoading] = useState(false); // Set to false by default since no async auth

  // You can add your own authentication logic here later

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
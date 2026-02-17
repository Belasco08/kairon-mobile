import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { authService, SignUpData } from "../services/auth";

/* =======================
   TYPES
======================= */

export type UserRole = 'OWNER' | 'PROFESSIONAL' | 'STAFF' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  plan: 'FREE' | 'PLUS'; 
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // 👇 Alterado para aceitar undefined (para a tela de loading saber que está carregando)
  hasSeenTutorial: boolean | undefined;
  completeTutorial: () => Promise<void>;

  signIn(email: string, password: string): Promise<void>;
  signUp(data: SignUpData): Promise<void>;
  signOut(): Promise<void>;
  updateUser(data: Partial<User>): Promise<void>;
}

/* =======================
   CONTEXT
======================= */

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);

export const useAuth = () => useContext(AuthContext);

/* =======================
   PROVIDER
======================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 👇 Começa como undefined para travar a navegação até termos a resposta do AsyncStorage
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean | undefined>(undefined);

  const isAuthenticated = !!user;

  /* =======================
      RESTORE SESSION
  ======================= */

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [[, storedUser], [, token], [, tutorialStatus]] = await AsyncStorage.multiGet([
          "@Kairon:user",
          "@Kairon:token",
          "@Kairon:tutorial", // Essa é a chave oficial do app!
        ]);

        // Define se já viu ou não
        if (tutorialStatus === 'true') {
          setHasSeenTutorial(true);
        } else {
          setHasSeenTutorial(false);
        }

        if (!storedUser || !token) { 
          setLoading(false);
          return;
        }

        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Erro ao restaurar sessão", err);
        // Se der erro, assumimos false para garantir
        setHasSeenTutorial(false);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /* =======================
      TUTORIAL (ONBOARDING)
  ======================= */
  
  const completeTutorial = async () => {
    await AsyncStorage.setItem("@Kairon:tutorial", "true");
    setHasSeenTutorial(true);
  };

  /* =======================
      SIGN IN
  ======================= */

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const response = await authService.signIn({ email, password });

      const userWithPlan: User = {
        ...response.user,
        plan: response.user.plan || 'FREE' 
      };

      console.log("🔐 Login efetuado:", userWithPlan.email);

      await AsyncStorage.multiSet([
        ["@Kairon:user", JSON.stringify(userWithPlan)],
        ["@Kairon:token", response.token],
        ["@Kairon:refreshToken", response.refreshToken],
      ]);

      api.defaults.headers.Authorization = `Bearer ${response.token}`;
      setUser(userWithPlan);
      
    } catch (error: any) {
       console.error("Erro no login:", error);
       
       let message = "Não foi possível entrar.";
       if (error.response?.data?.message) {
           message = error.response.data.message; 
       } else if (error.response?.data?.error) {
           message = error.response.data.error;
       }

       throw new Error(message); 
    } finally {
      setLoading(false);
    }
  };

  /* =======================
      SIGN UP (CADASTRO)
  ======================= */

  const signUp = async (data: SignUpData) => {
    try {
        setLoading(true);
        await authService.signUp(data);
        await signIn(data.email, data.password);
    } catch (error: any) {
        console.log("❌ Erro detalhado:", JSON.stringify(error.response?.data, null, 2));

        let userFriendlyMessage = "Ocorreu um erro ao criar a conta.";

        if (error.response?.data) {
            const backendData = error.response.data;

            if (typeof backendData === 'object' && !backendData.message && !backendData.error) {
                 const firstKey = Object.keys(backendData)[0];
                 if (firstKey) {
                     userFriendlyMessage = backendData[firstKey];
                 }
            }
            else if (backendData.message) {
                userFriendlyMessage = backendData.message;
            }
        }

        throw new Error(userFriendlyMessage); 
    } finally {
        setLoading(false);
    }
  };

  /* =======================
      SIGN OUT
  ======================= */

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      "@Kairon:user",
      "@Kairon:token",
      "@Kairon:refreshToken",
    ]);

    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  /* =======================
      UPDATE USER (LOCAL)
  ======================= */
  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    await AsyncStorage.setItem("@Kairon:user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        hasSeenTutorial, 
        completeTutorial, 
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
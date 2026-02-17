import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

// Stacks
import { AuthStack } from "./AuthStack";
import { AppStack } from "./AppStack";
import { PublicStack } from "./PublicStack";

// Context
import { useAuth } from "../hooks/useAuth";

export function Navigation() {
  const { user, loading } = useAuth();

  /* =======================
     LOADING GLOBAL
  ======================= */

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* =======================
     NÃO AUTENTICADO
  ======================= */

  if (!user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  /* =======================
     CLIENTE
  ======================= */

  if (user.role === "CLIENT") {
    return (
      <NavigationContainer>
        <PublicStack />
      </NavigationContainer>
    );
  }

  /* =======================
     OWNER / STAFF
     (com ou sem empresa)
  ======================= */

  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}

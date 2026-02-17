import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons as Icon } from "@expo/vector-icons"; // ✅ FIX
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/common";

/* =========================
   TIPOS
========================= */

interface RouteParams {
  appointmentId: string;
}

type Navigation = {
  navigate: (screen: string, params?: any) => void;
};

/* =========================
   COMPONENT
========================= */

export function BookingConfirmation() {
  const navigation = useNavigation<Navigation>(); // ✅ FIX
  const route = useRoute();
  const { appointmentId } = route.params as RouteParams;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={{ flexGrow: 1, padding: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: `${colors.success}20`, // ✅ FIX
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <Icon name="check-circle" size={60} color={colors.success} />
        </View>

        <Text
          style={[commonStyles.h1, { textAlign: "center", marginBottom: 16 }]}
        >
          Agendamento Confirmado!
        </Text>

        <Text
          style={[
            commonStyles.body,
            {
              textAlign: "center",
              color: colors.textSecondary,
              marginBottom: 32,
            },
          ]}
        >
          Seu agendamento foi realizado com sucesso. Você receberá um e-mail de
          confirmação com todos os detalhes.
        </Text>

        <Card style={{ width: "100%", marginBottom: 32 }}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Icon name="calendar-today" size={48} color={colors.primary} />
            <Text style={[commonStyles.h3, { marginTop: 16 }]}>
              Detalhes do Agendamento
            </Text>
            <Text
              style={[
                commonStyles.caption,
                { color: colors.textSecondary, textAlign: "center" },
              ]}
            >
              ID: {appointmentId}
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <View style={commonStyles.rowBetween}>
              <Text
                style={[commonStyles.body, { color: colors.textSecondary }]}
              >
                Data:
              </Text>
              <Text style={commonStyles.body}>12/12/2023</Text>
            </View>

            <View style={commonStyles.rowBetween}>
              <Text
                style={[commonStyles.body, { color: colors.textSecondary }]}
              >
                Horário:
              </Text>
              <Text style={commonStyles.body}>14:30</Text>
            </View>

            <View style={commonStyles.rowBetween}>
              <Text
                style={[commonStyles.body, { color: colors.textSecondary }]}
              >
                Serviço:
              </Text>
              <Text style={commonStyles.body}>Corte de Cabelo</Text>
            </View>

            <View style={commonStyles.rowBetween}>
              <Text
                style={[commonStyles.body, { color: colors.textSecondary }]}
              >
                Profissional:
              </Text>
              <Text style={commonStyles.body}>João Silva</Text>
            </View>

            <View style={commonStyles.rowBetween}>
              <Text
                style={[commonStyles.body, { color: colors.textSecondary }]}
              >
                Valor:
              </Text>
              <Text style={[commonStyles.h3, { color: colors.primary }]}>
                R$ 60,00
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ width: "100%", gap: 12 }}>
          <Button title="Ver Detalhes" icon="visibility" onPress={() => {}} />

          <Button
            title="Novo Agendamento"
            onPress={() =>
              navigation.navigate("BookingScreen", {
                companyId: "1",
              })
            }
            variant="outline"
            icon="add"
          />

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("CompanyPublic", {
                companyId: "1",
              })
            }
            style={{ alignItems: "center", marginTop: 16 }}
          >
            <Text style={[commonStyles.body, { color: colors.primary }]}>
              Voltar para a página da empresa
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 48 }}>
          <Text
            style={[
              commonStyles.caption,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            Em caso de dúvidas, entre em contato com a empresa.
          </Text>
          <Text
            style={[
              commonStyles.caption,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            Lembre-se de chegar com 10 minutos de antecedência.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

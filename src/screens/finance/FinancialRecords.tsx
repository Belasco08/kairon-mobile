import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import {
  financeService,
  FinancialRecord as ServiceFinancialRecord,
} from '../../services/finance';

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/shared/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';

type RecordType = 'all' | 'revenue' | 'expense';

/**
 * 🔹 Tipo local NORMALIZADO
 * garante que o componente tenha tudo que precisa
 */
type FinancialRecord = ServiceFinancialRecord & {
  date: string;
  category: 'appointment' | 'product' | 'service' | 'other';
  status: 'pending' | 'completed' | 'cancelled';
};

export function FinancialRecords() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [filterType, setFilterType] = useState<RecordType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRecords();
  }, [filterType]);

  const loadRecords = async () => {
    try {
      setLoading(true);

      const response = await financeService.getRecords({
        type: filterType !== 'all' ? filterType : undefined,
      });

      /**
       * 🔹 Mapeia e normaliza dados vindos da API
       */
      const normalized: FinancialRecord[] = response.map((r) => ({
        ...r,
        date: r.date ?? new Date().toISOString(),
        category: r.category ?? 'other',
        status: r.status ?? 'completed',
      }));

      setRecords(normalized);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os registros financeiros');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const filteredRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          r.description.toLowerCase().includes(search.toLowerCase()) ||
          r.reference?.toLowerCase().includes(search.toLowerCase())
      ),
    [records, search]
  );

  const totals = useMemo(() => {
    const revenue = records
      .filter((r) => r.type === 'revenue' && r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);

    const expenses = records
      .filter((r) => r.type === 'expense' && r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);

    return { revenue, expenses };
  }, [records]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR');

  const getCategoryIcon = (category: FinancialRecord['category']) =>
    ({
      appointment: 'calendar-today',
      product: 'shopping-cart',
      service: 'build',
      other: 'receipt',
    }[category] as any);

  const getStatusBadge = (status: FinancialRecord['status']) =>
    ({
      pending: { color: 'warning', text: 'Pendente' },
      completed: { color: 'success', text: 'Concluído' },
      cancelled: { color: 'error', text: 'Cancelado' },
    }[status]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir Registro',
      'Deseja realmente excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await financeService.deleteRecord?.(id);
              setRecords((prev) => prev.filter((r) => r.id !== id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: FinancialRecord }) => (
    <View style={[commonStyles.card, { marginBottom: 8 }]}>
      <View style={commonStyles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <MaterialIcons
              name={getCategoryIcon(item.category)}
              size={20}
              color={item.type === 'revenue' ? colors.success : colors.error}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={commonStyles.body}>{item.description}</Text>
            <Text style={[commonStyles.caption, { color: colors.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={[
              commonStyles.h3,
              { color: item.type === 'revenue' ? colors.success : colors.error },
            ]}
          >
            {item.type === 'revenue' ? '+' : '-'}{' '}
            {formatCurrency(item.amount)}
          </Text>
          <Badge
            variant={getStatusBadge(item.status).color as any}
            text={getStatusBadge(item.status).text}
            size="small"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        style={{ alignSelf: 'flex-end', marginTop: 8 }}
      >
        <MaterialIcons name="delete" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={filteredRecords}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <>
          <Text style={commonStyles.h2}>Registros Financeiros</Text>

          <Input
            placeholder="Buscar..."
            value={search}
            onChangeText={setSearch}
          />

          <View style={[commonStyles.rowBetween, { marginTop: 16 }]}>
            <Text style={{ color: colors.success }}>
              Receitas: {formatCurrency(totals.revenue)}
            </Text>
            <Text style={{ color: colors.error }}>
              Despesas: {formatCurrency(totals.expenses)}
            </Text>
          </View>
        </>
      }
      ListEmptyComponent={
        <EmptyState
          icon="account-balance"
          title="Nenhum registro encontrado"
          description="Adicione receitas ou despesas"
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

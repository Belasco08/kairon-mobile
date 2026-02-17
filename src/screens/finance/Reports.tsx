import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { colors } from '../../styles/colors';
import { commonStyles } from '../../styles/common';

type ReportType = 'financial' | 'services' | 'clients' | 'professionals';
type FormatType = 'pdf' | 'excel' | 'csv';

export function Reports() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('financial');
  const [formatType, setFormatType] = useState<FormatType>('pdf');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const reportTypes = [
    { id: 'financial', label: 'Financeiro', icon: 'attach-money' },
    { id: 'services', label: 'Serviços', icon: 'style' },
    { id: 'clients', label: 'Clientes', icon: 'people' },
    { id: 'professionals', label: 'Profissionais', icon: 'person' },
  ] as const;

  const formatTypes = [
    { id: 'pdf', label: 'PDF', icon: 'picture-as-pdf' },
    { id: 'excel', label: 'Excel', icon: 'table-chart' },
    { id: 'csv', label: 'CSV', icon: 'grid-on' },
  ] as const;

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR');

  const handleDateChange = (
    type: 'start' | 'end',
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (!selectedDate) return;

    if (type === 'start') {
      setShowStartDatePicker(Platform.OS === 'ios');
      setStartDate(selectedDate);
    } else {
      setShowEndDatePicker(Platform.OS === 'ios');
      setEndDate(selectedDate);
    }
  };

  const validateDates = () => {
    if (startDate > endDate) {
      Alert.alert('Erro', 'A data inicial não pode ser posterior à data final');
      return false;
    }
    return true;
  };

  const generateReport = async () => {
    if (!validateDates()) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Sucesso', 'Relatório gerado com sucesso!', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartilhar', onPress: shareReport },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    await Share.share({
      title: 'Relatório Kairon',
      message: `Relatório ${reportType} (${formatDate(startDate)} até ${formatDate(endDate)})`,
    });
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={commonStyles.h1}>Relatórios</Text>

      <Card>
        <Text style={commonStyles.h3}>Tipo de Relatório</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {reportTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              onPress={() => setReportType(type.id)}
              style={{
                flex: 1,
                minWidth: '45%',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor:
                  reportType === type.id ? colors.primary : colors.border,
              }}
            >
              <MaterialIcons
                name={type.icon}
                size={24}
                color={colors.primary}
              />
              <Text>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          onChange={(e, d) => handleDateChange('start', e, d)}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          onChange={(e, d) => handleDateChange('end', e, d)}
        />
      )}

      <Button
        title={loading ? 'Gerando...' : 'Gerar Relatório'}
        onPress={generateReport}
        loading={loading}
      />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, textAlign: 'center' }}>
          Cancelar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

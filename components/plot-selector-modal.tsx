import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';

interface PlotSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPlot: (plot: { type: string; timeRange: string; label: string }) => void;
}

const plotTypes = [
  { id: 'glucose', label: 'Glucosa' },
  { id: 'daily_pattern', label: 'Patrón Diario' },
  { id: 'glucose_meals', label: 'Glucosa y Comidas' },
];

const timeRanges = [
  { id: '24h', label: 'Últimas 24 horas' },
  { id: '7d', label: 'Última semana' },
  { id: '30d', label: 'Último mes' },
];

export default function PlotSelectorModal({
  visible,
  onClose,
  onAddPlot,
}: PlotSelectorModalProps) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('');

  const handleAdd = () => {
    if (selectedType) {
      const plotType = plotTypes.find((t) => t.id === selectedType);
      const timeRange = timeRanges.find((t) => t.id === selectedTimeRange);
      
      onAddPlot({
        type: selectedType,
        timeRange: selectedTimeRange || '24h',
        label: `${plotType?.label} - ${timeRange?.label || 'Últimas 24 horas'}`,
      });
      
      // Reset selections
      setSelectedType('');
      setSelectedTimeRange('');
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agregar Gráfico</Text>
          
          <Text style={styles.sectionTitle}>Tipo de Gráfico</Text>
          <View style={styles.optionsContainer}>
            {plotTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.option,
                  selectedType === type.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedType === type.id && styles.selectedOptionText,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Rango de Tiempo</Text>
          <View style={styles.optionsContainer}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.option,
                  selectedTimeRange === range.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedTimeRange(range.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedTimeRange === range.id && styles.selectedOptionText,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.addButton,
                !selectedType && styles.disabledButton,
              ]}
              onPress={handleAdd}
              disabled={!selectedType}
            >
              <Text style={styles.buttonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  optionText: {
    color: '#666',
  },
  selectedOptionText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
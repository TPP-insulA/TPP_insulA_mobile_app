import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { X } from 'lucide-react-native';
import { CreateMealInput } from '../lib/api/meals';

interface FoodEntryFormProps {
  onSubmit: (data: CreateMealInput) => void;
  onCancel: () => void;
}

export function FoodEntryForm({ onSubmit, onCancel }: FoodEntryFormProps) {
  const { control, handleSubmit, setValue } = useForm<CreateMealInput>({
    defaultValues: {
      timestamp: new Date().toISOString(),
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Agregar Comida</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            rules={{ required: true }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Ej: Milanesa con ensalada"
                />
                {error && (
                  <Text style={styles.errorText}>Este campo es requerido</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Ej: Milanesa de pollo con ensalada de lechuga y tomate"
                  multiline
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="carbs"
            rules={{ required: true, min: 0 }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Carbohidratos (g) *</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  onChangeText={(text) => onChange(Number(text))}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
                {error && (
                  <Text style={styles.errorText}>
                    Ingrese un valor válido mayor o igual a 0
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="protein"
            rules={{ required: true, min: 0 }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Proteínas (g) *</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  onChangeText={(text) => onChange(Number(text))}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
                {error && (
                  <Text style={styles.errorText}>
                    Ingrese un valor válido mayor o igual a 0
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="fat"
            rules={{ required: true, min: 0 }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Grasas (g) *</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  onChangeText={(text) => onChange(Number(text))}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
                {error && (
                  <Text style={styles.errorText}>
                    Ingrese un valor válido mayor o igual a 0
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="calories"
            rules={{ required: true, min: 0 }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Calorías *</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  onChangeText={(text) => onChange(Number(text))}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
                {error && (
                  <Text style={styles.errorText}>
                    Ingrese un valor válido mayor o igual a 0
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, value } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Cantidad (g)</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={(text) => onChange(Number(text))}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            )}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
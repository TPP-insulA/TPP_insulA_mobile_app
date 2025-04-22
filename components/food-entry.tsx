import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FoodItem } from '../lib/api/meals';

interface FoodEntryProps {
  entry: FoodItem;
}

export function FoodEntry({ entry }: FoodEntryProps) {
  // Values from API are already for the full amount, no need to scale
  const quantity = Number(entry.quantity) || 1;
  const servingSize = Number(entry.servingSize) || 200;
  const carbs = Number(entry.carbs) || 0;
  const protein = Number(entry.protein) || 0;
  const fat = Number(entry.fat) || 0;
  const calories = Number(entry.calories) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{entry.name || "Sin nombre"}</Text>
          {entry.description && (
            <Text style={styles.description}>{entry.description}</Text>
          )}
        </View>
      </View>

      <View style={styles.macros}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{calories}</Text>
          <Text style={styles.macroLabel}>Cal</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{carbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{protein}g</Text>
          <Text style={styles.macroLabel}>Prot</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{fat}g</Text>
          <Text style={styles.macroLabel}>Grasas</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{servingSize}g</Text>
          <Text style={styles.macroLabel}>Porción</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});


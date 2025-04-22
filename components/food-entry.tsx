import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FoodItem } from '../lib/api/meals';

interface FoodEntryProps {
  entry: FoodItem;
}

export function FoodEntry({ entry }: FoodEntryProps) {
  const quantity = Number(entry.quantity) || 1;
  const servingSize = Number(entry.servingSize) || 200;
  const carbs = Number(entry.carbs) || 0;
  const protein = Number(entry.protein) || 0;
  const fat = Number(entry.fat) || 0;
  const calories = Number(entry.calories) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={1}>{entry.name || "Sin nombre"}</Text>
          {entry.description && (
            <Text style={styles.description} numberOfLines={1}>{entry.description}</Text>
          )}
        </View>

        <View style={styles.macros}>
          <View style={styles.macroGroup}>
            <Text style={styles.macroValue}>{calories}</Text>
            <Text style={styles.macroLabel}>Cal</Text>
          </View>
          <Text style={styles.separator}>·</Text>
          <View style={styles.macroGroup}>
            <Text style={styles.macroValue}>{carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <Text style={styles.separator}>·</Text>
          <View style={styles.macroGroup}>
            <Text style={styles.macroValue}>{protein}g</Text>
            <Text style={styles.macroLabel}>Prot</Text>
          </View>
          <Text style={styles.separator}>·</Text>
          <View style={styles.macroGroup}>
            <Text style={styles.macroValue}>{fat}g</Text>
            <Text style={styles.macroLabel}>Gras</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mainContent: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  macroLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  separator: {
    fontSize: 13,
    color: '#9ca3af',
  },
});


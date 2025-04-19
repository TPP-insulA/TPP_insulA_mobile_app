import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Meal } from '../lib/api/meals';

interface FoodEntryProps {
  entry: Meal;
  handleDelete: () => void;
}

export function FoodEntry({ entry, handleDelete }: FoodEntryProps) {
  const formattedDate = new Date(entry.timestamp).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{entry.name}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {entry.description && (
        <Text style={styles.description}>{entry.description}</Text>
      )}

      <View style={styles.macros}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{entry.calories}</Text>
          <Text style={styles.macroLabel}>Cal</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{entry.carbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{entry.protein}g</Text>
          <Text style={styles.macroLabel}>Prot</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{entry.fat}g</Text>
          <Text style={styles.macroLabel}>Grasas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});


import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Meal } from '../lib/api/meals';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FoodEntryProps {
  entry: Meal;
  handleDelete: () => void;
}

export function FoodEntry({ entry, handleDelete }: FoodEntryProps) {
  // Safely format the date, with a fallback if the timestamp is invalid
  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(entry.timestamp);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return format(date, 'PPp', { locale: es });
    } catch (error) {
      console.warn('Invalid timestamp:', entry.timestamp);
      return 'Fecha no disponible';
    }
  }, [entry.timestamp]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{entry.name}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentRow}>
        {entry.photo && (
          <Image source={{ uri: entry.photo }} style={styles.thumbnail} />
        )}
        
        <View style={styles.contentMain}>
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
  headerContent: {
    flex: 1,
    marginRight: 8,
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
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  contentMain: {
    flex: 1,
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


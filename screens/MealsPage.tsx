// screens/meals-page.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { PlusCircle, Utensils } from 'lucide-react-native';
import { FoodEntry } from '../components/food-entry';
import { FoodEntryForm } from '../components/food-entry-form';
import { Footer } from '../components/footer';
import { BackButton } from '../components/back-button';
import { useNavigation } from '@react-navigation/native';

interface FoodItem {
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  timestamp: string;
  photo?: string;
}

const mockMeals: FoodItem[] = [
  {
    name: 'Desayuno',
    carbs: 45,
    protein: 15,
    fat: 12,
    calories: 350,
    timestamp: '08:30',
  },
  {
    name: 'Almuerzo',
    carbs: 60,
    protein: 30,
    fat: 15,
    calories: 500,
    timestamp: '13:00',
  },
];

export default function MealsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meals, setMeals] = useState<FoodItem[]>(mockMeals);
  const navigation = useNavigation();

  const handleAddMeal = (entry: FoodItem) => {
    setMeals([entry, ...meals]);
    setIsFormOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackButton />
            </TouchableOpacity>
            <Utensils width={32} height={32} color="#22c55e" />
            <Text style={styles.title}>Comidas</Text>
          </View>
          <Text style={styles.description}>
            Acá podés ver tu historial de comidas
          </Text>
        </View>

        <View style={styles.content}>
          {meals.map((meal, index) => (
            <FoodEntry
              key={index}
              entry={meal}
              handleDelete={() => {
                setMeals(meals.filter((_, i) => i !== index));
              }}
            />
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsFormOpen(true)}
          >
            <PlusCircle size={24} color="#22c55e" />
            <Text style={styles.addButtonText}>Agregar Comida</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isFormOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FoodEntryForm
              onSubmit={handleAddMeal}
              onCancel={() => setIsFormOpen(false)}
            />
          </View>
        </View>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    width: '100%',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#22c55e',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#22c55e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
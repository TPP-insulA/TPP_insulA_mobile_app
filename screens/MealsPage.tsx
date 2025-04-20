// screens/meals-page.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { PlusCircle, Utensils } from 'lucide-react-native';
import { FoodEntry } from '../components/food-entry';
import { FoodEntryForm } from '../components/food-entry-form';
import { Footer } from '../components/footer';
import { BackButton } from '../components/back-button';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { getMeals, createMeal, deleteMeal, Meal, CreateMealInput } from '../lib/api/meals';
import { useToast } from '../hooks/use-toast';

export default function MealsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const { token } = useAuth();
  const { toast } = useToast();

  const fetchMeals = useCallback(async () => {
    if (!token) return;
    try {
      const fetchedMeals = await getMeals(token);
      setMeals(fetchedMeals);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las comidas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleAddMeal = async (entry: CreateMealInput) => {
    if (!token) return;
    try {
      const mealData = {
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
        quantity: entry.quantity || 1  // Ensure quantity is always present
      };

      // Log with truncated photo URL
      const logData = { ...mealData };
      if (logData.photo) {
        logData.photo = `${logData.photo.substring(0, 50)}...`;
      }
      console.log('Adding meal with data:', JSON.stringify(logData, null, 2));

      const newMeal = await createMeal(mealData, token);
      
      // Log response with truncated photo URL
      const logResponse = { ...newMeal };
      if (logResponse.photo) {
        logResponse.photo = `${logResponse.photo.substring(0, 50)}...`;
      }
      console.log('New meal created:', JSON.stringify(logResponse, null, 2));

      setMeals(prevMeals => [newMeal, ...prevMeals]);
      setIsFormOpen(false);
      toast({
        title: 'Éxito',
        description: 'Comida agregada correctamente',
      });
    } catch (error: any) {
      console.error('Error adding meal:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar la comida',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await deleteMeal(id, token);
      setMeals(meals.filter(meal => meal.id !== id));
      toast({
        title: 'Éxito',
        description: 'Comida eliminada correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la comida',
        variant: 'destructive',
      });
    }
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

        <TouchableOpacity
          style={[styles.addButtonTop, { alignSelf: 'center', width: 'auto', marginHorizontal: 16 }]}
          onPress={() => setIsFormOpen(true)}
        >
          <PlusCircle size={24} color="#22c55e" />
          <Text style={styles.addButtonText}>Agregar Comida</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
            </View>
          ) : (
            <>
              {meals && meals.length > 0 ? (
                meals.map((meal) => {
                  const key = meal.id || meal.timestamp || Math.random().toString();
                  return (
                    <FoodEntry
                      key={key}
                      entry={meal}
                      handleDelete={() => handleDelete(meal.id)}
                    />
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No hay comidas registradas</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isFormOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormOpen(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FoodEntryForm
              onSubmit={handleAddMeal}
              onCancel={() => setIsFormOpen(false)}
            />
          </View>
        </SafeAreaView>
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
    gap: 12,
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
  addButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#22c55e',
    marginTop: 8,
    width: '100%',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#22c55e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 'auto',
    height: '90%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
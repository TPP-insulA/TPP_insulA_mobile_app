// screens/meals-page.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image, Alert } from 'react-native';
import { PlusCircle, Utensils, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react-native';
import { FoodEntry } from '../components/food-entry';
import { FoodEntryForm } from '../components/food-entry-form';
import { Footer } from '../components/footer';
import { BackButton } from '../components/back-button';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { getMeals, createMeal, deleteMeal, updateMeal, Meal, CreateMealInput, FoodItem } from '../lib/api/meals';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MealsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
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

  const getMealTypeColor = (type: Meal['type']) => {
    switch (type) {
      case 'breakfast':
        return { bg: '#fef3c7', text: '#92400e' }; // Amber
      case 'lunch':
        return { bg: '#fee2e2', text: '#991b1b' }; // Red
      case 'snack':
        return { bg: '#dcfce7', text: '#166534' }; // Green
      case 'dinner':
        return { bg: '#dbeafe', text: '#1e40af' }; // Blue
      default:
        return { bg: '#f3f4f6', text: '#374151' }; // Gray
    }
  };

  const getMealTypeName = (type: Meal['type']) => {
    switch (type) {
      case 'breakfast':
        return 'Desayuno';
      case 'lunch':
        return 'Almuerzo';
      case 'snack':
        return 'Merienda';
      case 'dinner':
        return 'Cena';
      default:
        return type;
    }
  };

  const handleAddMeal = async (mealData: CreateMealInput) => {
    if (!token) return;
    try {
      const processedMealData = {
        ...mealData,
        timestamp: mealData.timestamp || new Date().toISOString()
      };

      const newMeal = await createMeal(processedMealData, token);
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

  const handleEditMeal = async (mealData: CreateMealInput) => {
    if (!token || !editingMeal) return;
    try {
      const updatedMeal = await updateMeal(editingMeal.id, mealData, token);
      setMeals(prevMeals => 
        prevMeals.map(meal => 
          meal.id === updatedMeal.id ? updatedMeal : meal
        )
      );
      setEditingMeal(null);
      setIsFormOpen(false);
      toast({
        title: 'Éxito',
        description: 'Comida actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error updating meal:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la comida',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    Alert.alert(
      "Eliminar Comida",
      "¿Estás seguro que querés eliminar esta comida?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
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
          }
        }
      ]
    );
  };

  const toggleMealExpansion = (id: string) => {
    setExpandedMealId(currentId => currentId === id ? null : id);
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
                  const isExpanded = expandedMealId === meal.id;
                  const typeColors = getMealTypeColor(meal.type);
                  const formattedDate = format(new Date(meal.timestamp), 'PPp', { locale: es });

                  return (
                    <View key={meal.id} style={styles.mealCard}>
                      <TouchableOpacity
                        style={styles.mealHeader}
                        onPress={() => toggleMealExpansion(meal.id)}
                      >
                        <View style={styles.mealHeaderLeft}>
                          {meal.photo && (
                            <Image source={{ uri: meal.photo }} style={styles.mealPhoto} />
                          )}
                          <View style={styles.mealHeaderContent}>
                            <View style={styles.mealTitleRow}>
                              <Text style={styles.mealTitle}>{meal.name}</Text>
                              <View style={[styles.mealTypeTag, { backgroundColor: typeColors.bg }]}>
                                <Text style={[styles.mealTypeText, { color: typeColors.text }]}>
                                  {getMealTypeName(meal.type)}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.mealDate}>{formattedDate}</Text>
                          </View>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={24} color="#6b7280" />
                        ) : (
                          <ChevronDown size={24} color="#6b7280" />
                        )}
                      </TouchableOpacity>

                      <View style={styles.mealFooter}>
                        <View style={styles.macroSummary}>
                          <Text style={styles.macroText}>
                            <Text style={styles.macroValue}>{Math.round(meal.totalCarbs * 10) / 10}g</Text> carbs ·{' '}
                            <Text style={styles.macroValue}>{Math.round(meal.totalProtein * 10) / 10}g</Text> prot ·{' '}
                            <Text style={styles.macroValue}>{Math.round(meal.totalCalories)}</Text> cal
                          </Text>
                        </View>
                        <View style={styles.mealActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                              setEditingMeal(meal);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit2 size={20} color="#3b82f6" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(meal.id)}
                          >
                            <Trash2 size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {isExpanded && (
                        <View style={styles.foodList}>
                          {meal.photo && (
                            <Image source={{ uri: meal.photo }} style={styles.expandedMealPhoto} />
                          )}
                          {meal.foods.map((food, index) => (
                            <View key={food.id || index} style={styles.foodItem}>
                              <FoodEntry entry={food} />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
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
        onRequestClose={() => {
          setIsFormOpen(false);
          setEditingMeal(null);
        }}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FoodEntryForm
              onSubmit={editingMeal ? handleEditMeal : handleAddMeal}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingMeal(null);
              }}
              initialData={editingMeal}
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
    borderStyle: 'solid',
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
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  mealHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  mealPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  expandedMealPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mealTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mealDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  macroSummary: {
    flex: 1,
  },
  macroText: {
    fontSize: 14,
    color: '#6b7280',
  },
  macroValue: {
    fontWeight: '600',
    color: '#4b5563',
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  foodList: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  foodItem: {
    marginTop: 8,
  },
});
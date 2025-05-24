import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image as RNImage, ScrollView, Platform, SafeAreaView } from "react-native";
import * as Form from "react-hook-form";
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as GalleryIcon, Plus, Trash2, UtensilsCrossed, ScrollText, Scale, Banana, Cookie, GanttChart, CalendarClock, Pizza, Brain, ArrowLeft } from 'lucide-react-native';
import { tw } from '../styles/theme';
import { CreateMealInput, FoodItem, processFoodName, Meal } from '../lib/api/meals';
import { useToast } from '../hooks/use-toast';

interface FoodEntryFormProps {
  onSubmit: (data: CreateMealInput) => void;
  onCancel: () => void;
  initialData?: Meal | null;
}

type FormData = {
  name: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  foods: Array<{
    name: string;
    description?: string;
    carbs: string;
    protein: string;
    fat: string;
    calories: string;
    servingSize: string;  // Added required field
    quantity: string;
    photo?: string;
  }>;
};

type ControlledInputProps = {
  control: any;
  name: string;
  label: string;
  error?: any;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
}

const ControlledInput = ({ 
  control, 
  name, 
  label, 
  error, 
  placeholder = "", 
  keyboardType = "default",
  multiline = false,
  required = true,
  icon
}: ControlledInputProps) => (
  <View style={tw`mb-4`}>
    <View style={tw`flex-row items-center mb-2`}>
      {icon && <View style={tw`mr-2`}>{icon}</View>}
      <Text style={tw`text-sm font-medium text-text-primary`}>{label}</Text>
    </View>
    <Form.Controller
      control={control}
      name={name}
      rules={{ required: required ? "Este campo es requerido" : false }}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          style={tw`border border-gray-300 rounded-lg p-2.5 text-base bg-white`}
          onChangeText={onChange}
          onBlur={onBlur}
          value={value}
          keyboardType={keyboardType}
          placeholder={placeholder}
          multiline={multiline}
        />
      )}
    />
    {error && <Text style={tw`text-red-500 text-xs mt-1`}>{error.message}</Text>}
  </View>
);

type MealTypeOption = {
  value: FormData['type'];
  label: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
};

const mealTypeOptions: MealTypeOption[] = [
  { 
    value: 'breakfast', 
    label: 'Desayuno', 
    bgColor: '#fef3c7', 
    textColor: '#92400e',
    icon: <Cookie width={18} height={18} color="#92400e" />
  },
  { 
    value: 'lunch', 
    label: 'Almuerzo', 
    bgColor: '#fee2e2', 
    textColor: '#991b1b',
    icon: <UtensilsCrossed width={18} height={18} color="#991b1b" />
  },
  { 
    value: 'snack', 
    label: 'Merienda', 
    bgColor: '#dcfce7', 
    textColor: '#166534',
    icon: <Banana width={18} height={18} color="#166534" />
  },
  { 
    value: 'dinner', 
    label: 'Cena', 
    bgColor: '#dbeafe', 
    textColor: '#1e40af',
    icon: <Pizza width={18} height={18} color="#1e40af" />
  },
];

export function FoodEntryForm({ onSubmit, onCancel, initialData }: FoodEntryFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const [photo, setPhoto] = useState<string | null>(initialData?.photo || null);
  // Initialize with the first food item expanded (not collapsed)
  const [collapsedFoods, setCollapsedFoods] = useState<{ [key: number]: boolean }>({0: false});
  const { toast } = useToast();

  const getFoodTitle = (food: FormData['foods'][0], index: number) => {
    if (food.name && food.name.trim()) {
      return food.name;
    }
    return `Alimento ${index + 1}`;
  };

  const toggleFoodCollapse = (index: number) => {
    setCollapsedFoods(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = Form.useForm<FormData>({
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "lunch",
      foods: initialData?.foods?.map(food => ({
        name: food.name,
        description: food.description || "",
        carbs: food.carbs.toString(),
        protein: food.protein.toString(),
        fat: food.fat.toString(),
        calories: food.calories.toString(),
        servingSize: food.servingSize?.toString() || "100",
        quantity: food.quantity?.toString() || "1",
      })) || [{
        name: "",
        description: "",
        carbs: "",
        protein: "",
        fat: "",
        calories: "",
        servingSize: "100",
        quantity: "1",
      }],
    }
  });

  const foods = watch('foods');
  const selectedType = watch('type');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la imagen',
        variant: 'destructive',
      });
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast({
          title: 'Error',
          description: 'Se necesita permiso para acceder a la cámara',
          variant: 'destructive',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo tomar la foto',
        variant: 'destructive',
      });
    }
  };

  const handleProcessFood = async (index: number) => {
    const description = foods[index].description;
    if (!description) return;
    
    setIsProcessing(true);
    try {
      const result = await processFoodName(description);

      if (result.success && result.items.length > 0) {
        const foodItem = result.items[0];
        const newFoods = [...foods];
        
        // Use the actual serving size from the API
        const servingSize = foodItem.serving_size_g;
        
        newFoods[index] = {
          ...newFoods[index],
          name: foodItem.name,
          // Store the original values from API
          carbs: foodItem.carbs_g.toString(),
          protein: foodItem.protein_g.toString(),
          fat: foodItem.fat_g.toString(),
          calories: foodItem.calories.toString(),
          servingSize: servingSize.toString(),
          quantity: "1" // Set to 1 since we're using the original values
        };
        
        setValue('foods', newFoods);
        toast({
          title: 'Éxito',
          description: 'Información nutricional completada',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se encontró información nutricional',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in handleProcessFood:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la descripción',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  const addFood = () => {
    const newIndex = foods.length;
    setValue('foods', [
      ...foods,
      {
        name: "",
        description: "",
        carbs: "",
        protein: "",
        fat: "",
        calories: "",
        servingSize: "100",  // Default 100g serving size
        quantity: "1",      // Default 1x quantity
      }
    ]);
    // Set the new food item as expanded
    setCollapsedFoods(prev => ({
      ...prev,
      [newIndex]: false
    }));
    setCurrentFoodIndex(newIndex);
  };

  const removeFood = (index: number) => {
    if (foods.length > 1) {
      const newFoods = foods.filter((_, i) => i !== index);
      setValue('foods', newFoods);
      setCurrentFoodIndex(Math.min(currentFoodIndex, newFoods.length - 1));
    }
  };

  const handleClearForm = () => {
    reset();
  };
  const toggleCollapse = (index: number) => {
    setCollapsedFoods(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      const now = new Date();
      
      // Process each food item - just convert strings to numbers
      const processedFoods = data.foods.map(food => ({
        name: food.name.trim(),
        description: food.description?.trim(),
        carbs: Number(food.carbs),
        protein: Number(food.protein),
        fat: Number(food.fat),
        calories: Number(food.calories),
        servingSize: Number(food.servingSize),
        quantity: Number(food.quantity)
      }));

      const submitData: CreateMealInput = {
        name: data.name.trim(),
        type: data.type,
        foods: processedFoods,
        timestamp: now.toISOString(),
        photo: photo || undefined // Convert null to undefined
      };

      await onSubmit(submitData);
      onCancel();
    } catch (error) {
      console.error('Error in onFormSubmit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la comida',
        variant: 'destructive',
      });
    }
  };
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Fixed Header */}
      <View style={[
        tw`bg-apple-green px-6 py-4 z-10 shadow-md`, 
        { 
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
          borderBottomLeftRadius: 15,
          borderBottomRightRadius: 15,
        }
      ]}>
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity 
            style={tw`p-2 -ml-2`} 
            onPress={onCancel}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`flex-1 text-2xl font-bold text-center text-white -ml-8`}>
            {initialData ? 'Editar Comida' : 'Agregar Comida'}
          </Text>
        </View>
      </View>
      
      {/* Scrollable Content */}
      <ScrollView
        style={tw`bg-white`} 
        contentContainerStyle={tw`pb-32 pt-4`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`px-6`}>
        {/* Photo Section */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row items-center mb-2`}>
            <GalleryIcon size={18} color="#666666" style={tw`mr-2`} />
            <Text style={tw`text-sm font-medium text-text-primary`}>Foto</Text>
          </View>
          {photo ? (
            <View style={tw`items-center`}>
              <RNImage 
                source={{ uri: photo }} 
                style={tw`w-full h-48 rounded-lg mb-2`} 
                resizeMode="cover"
              />
              <TouchableOpacity
                style={tw`bg-red-100 py-2 px-4 rounded-lg flex-row items-center`}
                onPress={() => setPhoto(null)}
              >
                <Trash2 size={18} color="#dc2626" style={tw`mr-2`} />
                <Text style={tw`text-red-600`}>Eliminar foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`flex-row justify-center gap-4`}>
              <TouchableOpacity
                style={tw`flex-1 flex-row items-center justify-center bg-gray-100 py-4 rounded-lg`}
                onPress={takePhoto}
              >
                <Camera size={24} color="#6b7280" />
                <Text style={tw`ml-2 text-gray-600`}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 flex-row items-center justify-center bg-gray-100 py-4 rounded-lg`}
                onPress={pickImage}
              >
                <GalleryIcon size={24} color="#6b7280" />
                <Text style={tw`ml-2 text-gray-600`}>Galería</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ControlledInput
          control={control}
          name="name"
          label="Nombre de la Comida"
          error={errors.name}
          placeholder="Ej: Almuerzo del mediodía"
          icon={<UtensilsCrossed size={18} color="#666666" />}
        />

        <View style={tw`mb-6`}>
          <View style={tw`flex-row items-center mb-2`}>
            <CalendarClock size={18} color="#666666" style={tw`mr-2`} />
            <Text style={tw`text-sm font-medium text-text-primary`}>Tipo de Comida</Text>
          </View>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {mealTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  tw`flex-row items-center border rounded-full px-4 py-2`,
                  { 
                    backgroundColor: selectedType === option.value ? option.bgColor : '#f3f4f6',
                    borderColor: selectedType === option.value ? option.textColor : '#e5e7eb'
                  }
                ]}
                onPress={() => setValue('type', option.value)}
              >
                {option.icon}
                <Text
                  style={[
                    tw`text-sm font-medium ml-2`,
                    { color: selectedType === option.value ? option.textColor : '#666666' }
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}          </View>
        </View>
        
        {/* Foods Section */}
        {foods.map((food, index) => (
          <View key={index} style={[
            tw`mb-6 bg-gray-50 p-4 rounded-lg`,
            { 
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3 
            }
          ]}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <TouchableOpacity onPress={() => toggleCollapse(index)} style={tw`flex-row items-center`}>
                <Pizza size={18} color="#666666" style={tw`mr-2`} />
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-lg font-semibold text-text-primary`}>
                    {getFoodTitle(food, index)}
                  </Text>
                  <Text style={tw`ml-2 text-gray-500`}>
                    {collapsedFoods[index] ? '▼' : '▲'}
                  </Text>
                </View>
              </TouchableOpacity>
              {foods.length > 1 && (
                <TouchableOpacity
                  style={tw`bg-red-100 p-2 rounded-full`}
                  onPress={() => removeFood(index)}
                >
                  <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>

            {!collapsedFoods[index] && (
              <>
                <ControlledInput
                  control={control}
                  name={`foods.${index}.name`}
                  label="Nombre"
                  error={errors.foods?.[index]?.name}
                  placeholder="Ej: Pollo a la plancha"
                  icon={<UtensilsCrossed size={18} color="#666666" />}
                />

                <View style={tw`mb-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <ScrollText size={18} color="#666666" style={tw`mr-2`} />
                    <Text style={tw`text-sm font-medium text-text-primary`}>Descripción</Text>
                  </View>
                  <View style={tw`flex-row`}>
                    <View style={tw`flex-1 mr-2`}>
                      <Form.Controller
                        control={control}
                        name={`foods.${index}.description`}
                        rules={{ required: false }}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <TextInput
                            style={tw`border border-gray-300 rounded-lg p-2.5 text-base bg-white`}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            value={value}
                            placeholder="Ej: 100g pechuga de pollo"
                            multiline={true}
                          />
                        )}
                      />
                    </View>
                    <TouchableOpacity
                      style={tw`bg-blue-500 px-3 py-2 rounded-lg justify-center`}
                      onPress={() => handleProcessFood(index)}
                      disabled={isProcessing || !foods[index].description}
                    >
                      <View style={tw`flex-row items-center justify-center`}>
                        <Brain size={16} color="#FFFFFF" style={tw`mr-1`} />
                        <Text style={[tw`text-white text-center font-medium`, isProcessing && {opacity: 0.7}]}>
                          {isProcessing ? 'Procesando...' : 'Completar Macros'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {errors.foods?.[index]?.description && (
                    <Text style={tw`text-red-500 text-xs mt-1`}>{errors.foods?.[index]?.description.message}</Text>
                  )}
                </View>

                <View style={tw`flex-row gap-4 mb-4`}>
                  <View style={tw`flex-1`}>
                    <ControlledInput
                      control={control}
                      name={`foods.${index}.servingSize`}
                      label="Porción (g)"
                      error={errors.foods?.[index]?.servingSize}
                      keyboardType="numeric"
                      placeholder="100"
                      icon={<Scale size={18} color="#666666" />}
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <ControlledInput
                      control={control}
                      name={`foods.${index}.quantity`}
                      label="Cantidad"
                      error={errors.foods?.[index]?.quantity}
                      keyboardType="numeric"
                      placeholder="1"
                      icon={<GanttChart size={18} color="#666666" />}
                    />
                  </View>
                </View>

                <View style={tw`flex-row gap-4 mb-4`}>
                  <View style={tw`flex-1`}>
                    <ControlledInput
                      control={control}
                      name={`foods.${index}.carbs`}
                      label="Carbohidratos (g)"
                      error={errors.foods?.[index]?.carbs}
                      keyboardType="numeric"
                      placeholder="0"
                      icon={<Cookie size={18} color="#666666" />}
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <ControlledInput
                      control={control}
                      name={`foods.${index}.protein`}
                      label="Proteína (g)"
                      error={errors.foods?.[index]?.protein}
                      keyboardType="numeric"
                      placeholder="0"
                      icon={<Scale size={18} color="#666666" />}
                    />
                  </View>
                </View>

                <View style={tw`flex-row gap-4`}>
                  <View style={tw`flex-1`}>
                    <ControlledInput
                      control={control}
                      name={`foods.${index}.fat`}
                      label="Grasa (g)"
                      error={errors.foods?.[index]?.fat}
                      keyboardType="numeric"
                      placeholder="0"
                      icon={<Scale size={18} color="#666666" />}
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <ControlledInput
                      control={control}
                      name={`foods.${index}.calories`}
                      label="Calorías"
                      error={errors.foods?.[index]?.calories}
                      keyboardType="numeric"
                      placeholder="0"
                      icon={<Scale size={18} color="#666666" />}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        ))}
        </View>
      </ScrollView>

      {/* Floating action buttons */}
      <View style={[
        tw`absolute bottom-0 left-0 right-0 bg-white px-6 py-4`,
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 10,
          borderTopWidth: 1,
          borderColor: "#f0f0f0"
        }
      ]}>
        <TouchableOpacity
          style={tw`flex-row items-center justify-center bg-gray-100 p-4 rounded-lg mb-4 border border-apple-green`}
          onPress={addFood}
        >
          <Plus size={24} color="#4CAF50" />
          <Text style={tw`ml-2 text-apple-green font-medium`}>Agregar Alimento</Text>
        </TouchableOpacity>
        <View style={tw`flex-row gap-4`}>
          <TouchableOpacity
            style={tw`flex-1 bg-gray-100 py-3 rounded-lg border border-gray-300`}
            onPress={onCancel}          >
            <Text style={tw`text-center text-gray-600 font-medium`}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 bg-apple-green py-3 rounded-lg`}
            onPress={handleSubmit(onFormSubmit)}
          >
            <Text style={tw`text-center text-white font-medium`}>
              {initialData ? 'Actualizar' : 'Guardar'}            
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
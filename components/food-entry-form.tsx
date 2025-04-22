import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image as RNImage, ScrollView } from "react-native";
import * as Form from "react-hook-form";
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as GalleryIcon, Plus, Trash2 } from 'lucide-react-native';
import tw from '../styles/theme';
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
}

const ControlledInput = ({ 
  control, 
  name, 
  label, 
  error, 
  placeholder = "", 
  keyboardType = "default",
  multiline = false,
  required = true
}: ControlledInputProps) => (
  <View style={tw`mb-4`}>
    <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>{label}</Text>
    <Form.Controller
      control={control}
      name={name}
      rules={{ required: required ? "Este campo es requerido" : false }}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
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
};

const mealTypeOptions: MealTypeOption[] = [
  { value: 'breakfast', label: 'Desayuno', bgColor: '#fef3c7', textColor: '#92400e' },
  { value: 'lunch', label: 'Almuerzo', bgColor: '#fee2e2', textColor: '#991b1b' },
  { value: 'snack', label: 'Merienda', bgColor: '#dcfce7', textColor: '#166534' },
  { value: 'dinner', label: 'Cena', bgColor: '#dbeafe', textColor: '#1e40af' },
];

export function FoodEntryForm({ onSubmit, onCancel, initialData }: FoodEntryFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const [photo, setPhoto] = useState<string | null>(initialData?.photo || null);
  const { toast } = useToast();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast({
        title: 'Error',
        description: 'No se pudo seleccionar la imagen',
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

      if (!result.canceled) {
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

  const { control, handleSubmit, formState: { errors }, watch, setValue, reset } = Form.useForm<FormData>({
    defaultValues: initialData ? {
      name: initialData.name,
      type: initialData.type,
      foods: initialData.foods.map((food: FoodItem) => ({
        name: food.name,
        description: food.description || "",
        carbs: food.carbs.toString(),
        protein: food.protein.toString(),
        fat: food.fat.toString(),
        calories: food.calories.toString(),
        servingSize: food.servingSize.toString(),
        quantity: food.quantity.toString(),
        photo: food.photo
      }))
    } : {
      name: "",
      type: "lunch",
      foods: [{
        name: "",
        description: "",
        carbs: "",
        protein: "",
        fat: "",
        calories: "",
        servingSize: "100",  // Default serving size
        quantity: "100",     // Default quantity
      }]
    },
  });

  const foods = watch('foods');
  const selectedType = watch('type');

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
    setCurrentFoodIndex(foods.length);
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
    <ScrollView style={tw`bg-white`}>
      <View style={tw`p-6`}>
        <Text style={tw`text-xl font-bold mb-6 text-center text-text-primary`}>
          {initialData ? 'Editar Comida' : 'Agregar Comida'}
        </Text>

        {/* Photo Section */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Foto</Text>
          {photo ? (
            <View style={tw`items-center`}>
              <RNImage 
                source={{ uri: photo }} 
                style={tw`w-full h-48 rounded-lg mb-2`} 
                resizeMode="cover"
              />
              <TouchableOpacity
                style={tw`bg-red-100 py-2 px-4 rounded-lg`}
                onPress={() => setPhoto(null)}
              >
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
                <Text style={tw`ml-2 text-gray-600`}>Tomar foto</Text>
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
        />

        <View style={tw`mb-6`}>
          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Tipo de Comida</Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {mealTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={tw`${
                  selectedType === option.value
                    ? `bg-[${option.bgColor}] border-[${option.textColor}]`
                    : 'bg-gray-100 border-gray-300'
                } border rounded-full px-4 py-2`}
                onPress={() => setValue('type', option.value)}
              >
                <Text
                  style={tw`${
                    selectedType === option.value
                      ? `text-[${option.textColor}]`
                      : 'text-gray-600'
                  } text-sm font-medium`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={tw`mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-lg font-semibold text-text-primary`}>Alimentos</Text>
            <TouchableOpacity
              style={tw`flex-row items-center bg-apple-green py-2 px-3 rounded-lg`}
              onPress={addFood}
            >
              <Plus size={20} color="white" />
              <Text style={tw`text-white text-sm font-medium ml-1`}>Agregar</Text>
            </TouchableOpacity>
          </View>

          <View style={tw`gap-4`}>
            {foods.map((food, index) => (
              <View key={index} style={tw`bg-gray-50 rounded-lg p-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-base font-medium text-text-primary`}>
                    Alimento {index + 1}
                  </Text>
                  {foods.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeFood(index)}
                      style={tw`p-2`}
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <Form.Controller
                  control={control}
                  name={`foods.${index}.description`}
                  render={({ field: { onChange, value } }) => (
                    <View style={tw`mb-4`}>
                      <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Descripción</Text>
                      <TextInput
                        style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Ej: 200gr de pollo grillado"
                        multiline
                      />
                    </View>
                  )}
                />

                <TouchableOpacity 
                  style={tw`${foods[index].description ? 'bg-apple-green' : 'bg-gray-300'} py-2.5 px-5 rounded-lg items-center mb-4`}
                  onPress={() => handleProcessFood(index)}
                  disabled={!foods[index].description || isProcessing}
                >
                  <Text style={tw`text-base font-medium text-white`}>
                    {isProcessing ? 'Procesando...' : 'Completar nutrición'}
                  </Text>
                </TouchableOpacity>

                <Form.Controller
                  control={control}
                  name={`foods.${index}.name`}
                  rules={{ required: "El nombre es requerido" }}
                  render={({ field: { onChange, value } }) => (
                    <View style={tw`mb-4`}>
                      <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Nombre</Text>
                      <TextInput
                        style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Nombre del alimento"
                      />
                    </View>
                  )}
                />

                <View style={tw`flex-row flex-wrap justify-between`}>
                  <View style={tw`w-[48%]`}>
                    <Form.Controller
                      control={control}
                      name={`foods.${index}.carbs`}
                      rules={{ required: "Los carbohidratos son requeridos" }}
                      render={({ field: { onChange, value } }) => (
                        <View style={tw`mb-4`}>
                          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Carbohidratos (g)</Text>
                          <TextInput
                            style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                            value={value}
                            onChangeText={onChange}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>

                  <View style={tw`w-[48%]`}>
                    <Form.Controller
                      control={control}
                      name={`foods.${index}.protein`}
                      rules={{ required: "Las proteínas son requeridas" }}
                      render={({ field: { onChange, value } }) => (
                        <View style={tw`mb-4`}>
                          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Proteínas (g)</Text>
                          <TextInput
                            style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                            value={value}
                            onChangeText={onChange}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>

                  <View style={tw`w-[48%]`}>
                    <Form.Controller
                      control={control}
                      name={`foods.${index}.fat`}
                      rules={{ required: "Las grasas son requeridas" }}
                      render={({ field: { onChange, value } }) => (
                        <View style={tw`mb-4`}>
                          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Grasas (g)</Text>
                          <TextInput
                            style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                            value={value}
                            onChangeText={onChange}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>

                  <View style={tw`w-[48%]`}>
                    <Form.Controller
                      control={control}
                      name={`foods.${index}.calories`}
                      rules={{ required: "Las calorías son requeridas" }}
                      render={({ field: { onChange, value } }) => (
                        <View style={tw`mb-4`}>
                          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Calorías</Text>
                          <TextInput
                            style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                            value={value}
                            onChangeText={onChange}
                            placeholder="0"
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>

                  <View style={tw`w-[48%]`}>
                    <Form.Controller
                      control={control}
                      name={`foods.${index}.servingSize`}
                      rules={{ required: "El tamaño de porción es requerido" }}
                      render={({ field: { onChange, value } }) => (
                        <View style={tw`mb-4`}>
                          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Porción (g)</Text>
                          <TextInput
                            style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                            value={value}
                            onChangeText={onChange}
                            placeholder="100"
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>

                  <View style={tw`w-[48%]`}>
                    <Form.Controller
                      control={control}
                      name={`foods.${index}.quantity`}
                      rules={{ required: "La cantidad es requerida" }}
                      render={({ field: { onChange, value } }) => (
                        <View style={tw`mb-4`}>
                          <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>Cantidad (g)</Text>
                          <TextInput
                            style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
                            value={value}
                            onChangeText={onChange}
                            placeholder="100"
                            keyboardType="numeric"
                          />
                        </View>
                      )}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={tw`flex-row justify-between mt-6`}>
          <TouchableOpacity 
            style={tw`bg-red-100 py-2.5 px-5 rounded-lg flex-1 items-center mr-2`} 
            onPress={onCancel}
          >
            <Text style={tw`text-base font-medium text-red-600`}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`bg-gray-200 py-2.5 px-5 rounded-lg flex-1 items-center mx-2`}
            onPress={handleClearForm}
          >
            <Text style={tw`text-base font-medium text-gray-600`}>Limpiar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`bg-apple-green py-2.5 px-5 rounded-lg flex-1 items-center ml-2`}
            onPress={handleSubmit(onFormSubmit)}
          >
            <Text style={tw`text-base font-medium text-white`}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
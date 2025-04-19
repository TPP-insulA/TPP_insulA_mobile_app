import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image as RNImage, Alert, ActivityIndicator } from 'react-native';
import * as Form from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as GalleryIcon } from 'lucide-react-native';
import tw from '../styles/theme';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://tppinsulabackend-production.up.railway.app/api';

interface FoodEntryFormProps {
  onSubmit: (entry: {
    name: string;
    carbs: number;
    protein: number;
    fat: number;
    calories: number;
    timestamp: string;
    photo?: string;
    quantity: number;
  }) => void;
  onCancel: () => void;
}

type FormData = {
  name: string;
  description: string;
  carbs: string;
  protein: string;
  fat: string;
  calories: string;
  quantity: string;
};

type ControlledInputProps = {
  control: any;
  name: keyof FormData;
  label: string;
  error?: any;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
};

const ControlledInput = ({
  control,
  name,
  label,
  error,
  placeholder = '',
  keyboardType = 'default',
}: ControlledInputProps) => (
  <View style={tw`mb-4`}>
    <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>{label}</Text>
    <Form.Controller
      control={control}
      name={name}
      rules={{ required: 'Este campo es requerido' }}
      render={({ field }) => (
        <TextInput
          style={tw`border border-gray-300 rounded-lg p-2.5 text-base`}
          onChangeText={(text) => field.onChange(text)}
          onBlur={field.onBlur}
          value={field.value}
          keyboardType={keyboardType}
          placeholder={placeholder}
        />
      )}
    />
    {error && <Text style={tw`text-red-500 text-xs mt-1`}>{error.message}</Text>}
  </View>
);

export function FoodEntryForm({ onSubmit, onCancel }: FoodEntryFormProps) {
  const [photo, setPhoto] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { control, handleSubmit, setValue, watch, formState: { errors } } = Form.useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      carbs: '',
      protein: '',
      fat: '',
      calories: '',
      quantity: '1',
    },
  });

  const watchQuantity = watch('quantity');
  const description = watch('description');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para usar la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const processFoodDescription = async () => {
    if (!description || !description.trim()) {
      Alert.alert('Error', 'Por favor, ingrese una descripción del plato');
      return;
    }

    setIsProcessing(true);
    try {
      const apiEndpoint = `${API_URL}/food/process-food-name`;
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: description
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.items && data.items.length > 0) {
        const foodItem = data.items[0];
        setValue('name', foodItem.name);
        setValue('carbs', foodItem.carbs_g.toString());
        setValue('protein', foodItem.protein_g.toString());
        setValue('fat', foodItem.fat_g.toString());
        setValue('calories', foodItem.calories.toString());
        
        // If serving size is available, update quantity
        if (foodItem.serving_size_g > 0) {
          setValue('quantity', (foodItem.serving_size_g / 100).toString());
        }

      } else {
        Alert.alert('Error', 'No se encontró información nutricional para este plato');
      }
    } catch (error: any) {
      console.error('Error processing food description:', error);
      Alert.alert('Error', `No se pudo procesar la descripción: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update nutrition when quantity changes
  React.useEffect(() => {
    const qty = parseFloat(watchQuantity) || 1;
    updateNutritionBasedOnQuantity(qty);
  }, [watchQuantity]);

  const updateNutritionBasedOnQuantity = (qty: number = 1) => {
    const currentCarbs = parseFloat(watch('carbs') || '0');
    const currentProtein = parseFloat(watch('protein') || '0');
    const currentFat = parseFloat(watch('fat') || '0');
    const currentCalories = parseFloat(watch('calories') || '0');
    
    if (currentCarbs !== 0 || currentProtein !== 0 || currentFat !== 0 || currentCalories !== 0) {
      const baseCarbs = currentCarbs / (parseFloat(watch('quantity') || '1'));
      const baseProtein = currentProtein / (parseFloat(watch('quantity') || '1'));
      const baseFat = currentFat / (parseFloat(watch('quantity') || '1'));
      const baseCalories = currentCalories / (parseFloat(watch('quantity') || '1'));
      
      setValue('carbs', (baseCarbs * qty).toFixed(1));
      setValue('protein', (baseProtein * qty).toFixed(1));
      setValue('fat', (baseFat * qty).toFixed(1));
      setValue('calories', Math.round(baseCalories * qty).toString());
    }
  };

  const resetForm = () => {
    setValue('description', '');
    setValue('name', '');
    setValue('quantity', '1');
    setValue('carbs', '');
    setValue('protein', '');
    setValue('fat', '');
    setValue('calories', '');
    setPhoto(undefined);
  };

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      name: data.name,
      carbs: Number(data.carbs),
      protein: Number(data.protein),
      fat: Number(data.fat),
      calories: Number(data.calories),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photo,
      quantity: Number(data.quantity),
    });
  };

  return (
    <View style={tw`bg-white rounded-t-3xl p-6`}>
      <Text style={tw`text-xl font-bold mb-6 text-center text-text-primary`}>Agregar Comida</Text>

      <View style={tw`mb-6`}>
        {photo ? (
          <View style={tw`items-center`}>
            <TouchableOpacity onPress={pickImage}>
              <RNImage source={{ uri: photo }} style={tw`w-32 h-32 rounded-lg mb-2`} />
              <Text style={tw`text-sm text-text-secondary`}>Toca para cambiar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={tw`flex-row justify-center gap-4`}>
            <TouchableOpacity
              onPress={takePhoto}
              style={tw`items-center bg-gray-100 p-4 rounded-lg flex-1`}
            >
              <Camera size={24} color="#22c55e" />
              <Text style={tw`text-sm mt-2 text-text-secondary`}>Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              style={tw`items-center bg-gray-100 p-4 rounded-lg flex-1`}
            >
              <GalleryIcon size={24} color="#22c55e" />
              <Text style={tw`text-sm mt-2 text-text-secondary`}>Galería</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ControlledInput
        control={control}
        name="description"
        label="Descripción del Plato"
        error={errors.description}
        placeholder="Ej: 3 zanahorias y un sandwich de pollo"
      />

      <ControlledInput
        control={control}
        name="name"
        label="Nombre del Alimento"
        error={errors.name}
        placeholder="Ingrese el nombre"
      />

      <View style={tw`mb-4`}>
        <TouchableOpacity
          style={tw`bg-apple-green w-full py-2.5 px-5 rounded-lg items-center ${isProcessing ? 'opacity-50' : ''}`}
          onPress={processFoodDescription}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={tw`flex-row items-center`}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={tw`text-base font-medium text-white ml-2`}>Procesando...</Text>
            </View>
          ) : (
            <Text style={tw`text-base font-medium text-white`}>Completar información nutricional</Text>
          )}
        </TouchableOpacity>
      </View>

      <ControlledInput
        control={control}
        name="quantity"
        label="Cantidad (porciones)"
        error={errors.quantity}
        placeholder="1"
        keyboardType="numeric"
      />

      <View style={tw`flex-row flex-wrap justify-between`}>
        <View style={tw`w-[48%]`}>
          <ControlledInput
            control={control}
            name="carbs"
            label="Carbohidratos (g)"
            error={errors.carbs}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={tw`w-[48%]`}>
          <ControlledInput
            control={control}
            name="protein"
            label="Proteínas (g)"
            error={errors.protein}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={tw`w-[48%]`}>
          <ControlledInput
            control={control}
            name="fat"
            label="Grasas (g)"
            error={errors.fat}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={tw`w-[48%]`}>
          <ControlledInput
            control={control}
            name="calories"
            label="Calorías"
            error={errors.calories}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={tw`flex-row justify-between gap-2 mt-6`}>
        <TouchableOpacity
          style={tw`bg-red-100 py-2.5 px-5 rounded-lg min-w-[100px] items-center`}
          onPress={onCancel}
        >
          <Text style={tw`text-base font-medium text-red-600`}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-gray-100 py-2.5 px-5 rounded-lg min-w-[100px] items-center`}
          onPress={resetForm}
        >
          <Text style={tw`text-base font-medium text-text-primary`}>Limpiar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`bg-apple-green py-2.5 px-5 rounded-lg min-w-[100px] items-center ${isProcessing ? 'opacity-50' : ''}`}
          onPress={handleSubmit(onFormSubmit)}
          disabled={isProcessing}
        >
          <Text style={tw`text-base font-medium text-white`}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
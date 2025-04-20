import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image as RNImage } from "react-native";
import * as Form from "react-hook-form";
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as GalleryIcon } from 'lucide-react-native';
import tw from '../styles/theme';
import { CreateMealInput, processFoodName } from '../lib/api/meals';
import { useToast } from '../hooks/use-toast';

interface FoodEntryFormProps {
  onSubmit: (data: CreateMealInput) => void;
  onCancel: () => void;
}

type FormData = {
  name: string;
  description?: string;
  carbs: string;
  protein: string;
  fat: string;
  calories: string;
  quantity?: string;
};

type ControlledInputProps = {
  control: any;
  name: keyof FormData;
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

export function FoodEntryForm({ onSubmit, onCancel }: FoodEntryFormProps) {
  const [photo, setPhoto] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { control, handleSubmit, formState: { errors }, watch, setValue, reset } = Form.useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      carbs: "",
      protein: "",
      fat: "",
      calories: "",
      quantity: "",
    },
  });

  const description = watch('description');

  const handleProcessFood = async () => {
    if (!description) return;
    
    console.log('Starting handleProcessFood...');
    console.log('Description to process:', description);
    
    setIsProcessing(true);
    try {
      console.log('Calling processFoodName...');
      const result = await processFoodName(description);
      console.log('Process result:', result);

      if (result.success && result.items.length > 0) {
        const foodItem = result.items[0];
        console.log('Setting form values with:', foodItem);
        
        setValue('name', foodItem.name);
        setValue('carbs', foodItem.carbs_g.toString());
        setValue('protein', foodItem.protein_g.toString());
        setValue('fat', foodItem.fat_g.toString());
        setValue('calories', foodItem.calories.toString());
        
        if (foodItem.serving_size_g > 0) {
          setValue('quantity', foodItem.serving_size_g.toString());
        }

        toast({
          title: 'Éxito',
          description: 'Información nutricional completada',
        });
      } else {
        console.log('No items returned from processing');
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

  const handleClearForm = () => {
    reset();
    setPhoto(undefined);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la galería');
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
      alert('Se necesitan permisos para usar la cámara');
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

  const onFormSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data);
    try {
      const now = new Date();
      onSubmit({
        name: data.name,
        description: data.description,
        carbs: Number(data.carbs),
        protein: Number(data.protein),
        fat: Number(data.fat),
        calories: Number(data.calories),
        quantity: data.quantity ? Number(data.quantity) : undefined,
        timestamp: now.toISOString(),
        photo: photo,
      });
      console.log('onSubmit called successfully');
    } catch (error) {
      console.error('Error in onFormSubmit:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit form',
        variant: 'destructive',
      });
    }
  };

  return (
    <View style={tw`bg-white rounded-t-3xl p-6`}>
      <Text style={tw`text-xl font-bold mb-6 text-center text-text-primary`}>Agregar Comida</Text>
      
      <View style={tw`mb-6`}>
        {photo ? (
          <TouchableOpacity onPress={pickImage} style={tw`items-center`}>
            <RNImage source={{ uri: photo }} style={tw`w-32 h-32 rounded-lg mb-2`} />
            <Text style={tw`text-sm text-text-secondary`}>Toca para cambiar</Text>
          </TouchableOpacity>
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
        label="Descripción"
        error={errors.description}
        placeholder="Describa el alimento"
        multiline={true}
        required={false}
      />

      <TouchableOpacity 
        style={tw`${description ? 'bg-apple-green' : 'bg-gray-300'} py-2.5 px-5 rounded-lg items-center mb-4`}
        onPress={handleProcessFood}
        disabled={!description || isProcessing}
      >
        <Text style={tw`text-base font-medium text-white`}>
          {isProcessing ? 'Procesando...' : 'Completar nutrición'}
        </Text>
      </TouchableOpacity>

      <ControlledInput
        control={control}
        name="name"
        label="Nombre del Alimento"
        error={errors.name}
        placeholder="Ingrese el nombre"
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

        <View style={tw`w-[48%]`}>
          <ControlledInput
            control={control}
            name="quantity"
            label="Cantidad (g)"
            error={errors.quantity}
            placeholder="0"
            keyboardType="numeric"
            required={false}
          />
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
  );
}
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
  required = true,
  formRules
}: ControlledInputProps & { formRules?: any }) => (
  <View style={tw`mb-4`}>
    <Text style={tw`text-sm font-medium mb-2 text-text-primary`}>{label}</Text>
    <Form.Controller
      control={control}
      name={name}
      rules={formRules ? formRules[name] : { required: required ? "Este campo es requerido" : false }}
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
  const [photoBase64, setPhotoBase64] = useState<string>();
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
    mode: "onSubmit",
  });

  const formRules = {
    name: { required: "El nombre es requerido" },
    carbs: { required: "Los carbohidratos son requeridos" },
    protein: { required: "Las proteínas son requeridas" },
    fat: { required: "Las grasas son requeridas" },
    calories: { required: "Las calorías son requeridas" },
  };

  const description = watch('description');

  const handleProcessFood = async () => {
    if (!description) return;
    
    console.log('Starting handleProcessFood...');
    console.log('Description to process:', description);

    // Parse quantity from description, now including 'gr' unit
    const quantityMatch = description.match(/^([\d.]+)\s*(lb|lbs|oz|g|gr|kg)\s+/i);
    let extractedQuantity = 0;
    let processDescription = description;
    
    if (quantityMatch) {
      const [_, amount, unit] = quantityMatch;
      // Convert to grams
      switch (unit.toLowerCase()) {
        case 'lb':
        case 'lbs':
          extractedQuantity = parseFloat(amount) * 453.592;
          break;
        case 'oz':
          extractedQuantity = parseFloat(amount) * 28.3495;
          break;
        case 'kg':
          extractedQuantity = parseFloat(amount) * 1000;
          break;
        case 'g':
        case 'gr':
          extractedQuantity = parseFloat(amount);
          break;
      }
      // Remove quantity from description for processing
      processDescription = description.substring(quantityMatch[0].length);
    }
    
    setIsProcessing(true);
    try {
      console.log('Calling processFoodName with:', processDescription);
      const result = await processFoodName(processDescription);
      console.log('Process result:', result);

      if (result.success && result.items.length > 0) {
        const foodItem = result.items[0];
        console.log('Setting form values with:', foodItem);
        
        // Calculate nutrition values based on the extracted quantity
        const ratio = extractedQuantity > 0 ? extractedQuantity / 100 : 1; // API returns per 100g
        
        setValue('name', foodItem.name);
        // Format numbers to handle zero values correctly
        const formatNumber = (num: number) => {
          const value = (num * ratio);
          return value === 0 ? "0" : value.toFixed(1);
        };
        
        setValue('carbs', formatNumber(foodItem.carbs_g));
        setValue('protein', formatNumber(foodItem.protein_g));
        setValue('fat', formatNumber(foodItem.fat_g));
        setValue('calories', Math.round(foodItem.calories * ratio).toString());
        setValue('quantity', extractedQuantity > 0 ? extractedQuantity.toString() : '100');

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
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      if (result.assets[0].base64) {
        setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
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
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      if (result.assets[0].base64) {
        setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    }
  };

  const onFormSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    
    try {
      const now = new Date();
      
      const submitData = {
        name: data.name.trim(),
        description: data.description?.trim(),
        carbs: Number(data.carbs),
        protein: Number(data.protein),
        fat: Number(data.fat),
        calories: Number(data.calories),
        quantity: Number(data.quantity || '1'),
        timestamp: now.toISOString(),
        photo: photoBase64, // Use stored base64 directly
      };

      // Log with truncated photo
      const logSubmitData = { ...submitData };
      if (logSubmitData.photo) {
        logSubmitData.photo = `${logSubmitData.photo.substring(0, 10)}...`;
      }
      console.log('Submitting data:', JSON.stringify(logSubmitData, null, 2));

      await onSubmit(submitData);
      console.log('onSubmit called successfully');
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
        formRules={formRules}
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
            formRules={formRules}
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
            formRules={formRules}
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
            formRules={formRules}
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
            formRules={formRules}
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
import { API_URL } from './auth';

export interface FoodItem {
  id?: string;
  name: string;
  description?: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  servingSize: number;  // Added as required field
  quantity: number;     // Changed from optional to required
  photo?: string;
}

export interface Meal {
  id: string;
  name: string;
  description?: string;  // Added optional field
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  timestamp: string;
  foods: FoodItem[];
  photo?: string;       // Added optional field
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  totalCalories: number;
  createdAt?: string;   // Added optional field from backend
  updatedAt?: string;   // Added optional field from backend
}

export interface CreateMealInput {
  name: string;
  description?: string;  // Added optional field
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  timestamp?: string;
  foods: Omit<FoodItem, 'id'>[];
  photo?: string;       // Added optional field
}

interface ProcessFoodResponse {
  success: boolean;
  items: Array<{
    name: string;
    calories: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    serving_size_g: number;
  }>;
}

interface MealResponse {
  data: Meal;
  success: boolean;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export const getMeals = async (token: string, params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<Meal[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  console.log('Fetching meals...');
  console.log('API URL:', `${API_URL}/meals?${queryParams}`);
  
  const response = await fetch(`${API_URL}/meals?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const responseData = await response.json() as ApiResponse<any>;

  if (!response.ok) {
    throw new Error(responseData.message || 'Failed to fetch meals');
  }

  // Check if response has data property and it's an array
  if (responseData.data && Array.isArray(responseData.data)) {
    // Transform each meal to match our Meal interface
    const transformedMeals: Meal[] = responseData.data.map(meal => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      description: meal.description,
      timestamp: meal.timestamp,
      photo: meal.photo,
      foods: meal.mealFoods?.map((mealFood: any) => ({
        id: mealFood.id,
        name: mealFood.food.name,
        description: mealFood.food.description,
        carbs: mealFood.food.carbs,
        protein: mealFood.food.protein,
        fat: mealFood.food.fat,
        calories: mealFood.food.calories,
        servingSize: mealFood.food.servingSize || 100,
        quantity: mealFood.quantity || 1,
        photo: mealFood.food.photo
      })) || [],
      totalCarbs: meal.carbs,
      totalProtein: meal.protein,
      totalFat: meal.fat,
      totalCalories: meal.calories,
      createdAt: meal.createdAt,
      updatedAt: meal.updatedAt,
    }));

    return transformedMeals;
  }

  console.warn('Meals API did not return an array in data property, defaulting to empty array');
  return [];
};

export const createMeal = async (mealData: CreateMealInput, token: string): Promise<Meal> => {
  // Validate required fields
  const requiredFields = ['name', 'type', 'foods'];
  const missingFields = requiredFields.filter(field => {
    const value = mealData[field as keyof CreateMealInput];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Process foods with correct scaling based on quantity vs serving size
  const processedMealData: CreateMealInput = {
    ...mealData,
    timestamp: mealData.timestamp || new Date().toISOString(),
    foods: mealData.foods.map(food => {
      // Original values from API are per full serving, just send them as is
      return {
        ...food,
        carbs: Number(food.carbs),
        protein: Number(food.protein),
        fat: Number(food.fat),
        calories: Number(food.calories),
        servingSize: Number(food.servingSize),
        quantity: Number(food.quantity)
      };
    })
  };

  // Log with truncated photo URLs
  const logData = { ...processedMealData };
  logData.foods = logData.foods.map(food => {
    if (food.photo) {
      return {
        ...food,
        photo: `${food.photo.substring(0, 50)}...`
      };
    }
    return food;
  });
  console.log('Creating meal with validated data:', JSON.stringify(logData, null, 2));
  
  const response = await fetch(`${API_URL}/meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(processedMealData),
  });

  const responseData = await response.json() as ApiResponse<any>;
  console.log('Create meal response:', response.status, responseData);

  if (!response.ok) {
    throw new Error(responseData.message || 'Failed to create meal');
  }

  if (!responseData.success || !responseData.data) {
    throw new Error('Invalid response format from server');
  }

  // Transform the response to match our Meal interface with proper unit conversion
  const transformedMeal: Meal = {
    id: responseData.data.id,
    name: responseData.data.name,
    type: responseData.data.type,
    description: responseData.data.description,
    timestamp: responseData.data.timestamp,
    photo: responseData.data.photo,
    foods: responseData.data.mealFoods?.map((mealFood: any) => ({
      id: mealFood.id,
      name: mealFood.food.name,
      description: mealFood.food.description,
      carbs: mealFood.food.carbs,
      protein: mealFood.food.protein,
      fat: mealFood.food.fat,
      calories: mealFood.food.calories,
      servingSize: mealFood.food.servingSize || 200, // Use actual serving size from food
      quantity: mealFood.quantity || 1,
      photo: mealFood.food.photo,
    })) || [],
    totalCarbs: responseData.data.carbs,
    totalProtein: responseData.data.protein,
    totalFat: responseData.data.fat,
    totalCalories: responseData.data.calories,
    createdAt: responseData.data.createdAt,
    updatedAt: responseData.data.updatedAt,
  };

  return transformedMeal;
};

export const updateMeal = async (id: string, mealData: Partial<CreateMealInput>, token: string): Promise<Meal> => {
  const response = await fetch(`${API_URL}/meals/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(mealData),
  });

  const responseData = await response.json() as ApiResponse<any>;

  if (!response.ok) {
    throw new Error(responseData.message || "Failed to update meal");
  }

  // Transform the response to match our Meal interface
  const transformedMeal: Meal = {
    id: responseData.data.id,
    name: responseData.data.name,
    type: responseData.data.type,
    description: responseData.data.description,
    timestamp: responseData.data.timestamp,
    photo: responseData.data.photo,
    foods: responseData.data.mealFoods?.map((mealFood: any) => ({
      id: mealFood.id,
      name: mealFood.food.name,
      description: mealFood.food.description,
      carbs: mealFood.food.carbs,
      protein: mealFood.food.protein,
      fat: mealFood.food.fat,
      calories: mealFood.food.calories,
      servingSize: mealFood.food.servingSize || 200, // Use actual serving size from food
      quantity: mealFood.quantity || 1,
      photo: mealFood.food.photo,
    })) || [],
    totalCarbs: responseData.data.carbs,
    totalProtein: responseData.data.protein,
    totalFat: responseData.data.fat,
    totalCalories: responseData.data.calories,
    createdAt: responseData.data.createdAt,
    updatedAt: responseData.data.updatedAt,
  };

  return transformedMeal;
};

export const deleteMeal = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/meals/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete meal');
  }
};

export const processFoodName = async (query: string): Promise<ProcessFoodResponse> => {
  console.log('Starting processFoodName...');
  console.log('API URL:', `${API_URL}/food/process-food-name`);
  console.log('Request body:', { query });

  try {
    const response = await fetch(`${API_URL}/food/process-food-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Process food failed:', data.message || 'Failed to process food name');
      throw new Error(data.message || 'Failed to process food name');
    }

    return data;
  } catch (error) {
    console.error('Error in processFoodName:', error);
    throw error;
  }
};
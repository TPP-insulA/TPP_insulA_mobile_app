import { API_URL } from './auth';

export interface Meal {
  id: string;
  name: string;
  description?: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  quantity?: number;
  timestamp: string;
  photo?: string;
}

export interface CreateMealInput {
  name: string;
  description?: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  quantity?: number;
  timestamp?: string;
  photo?: string;
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

  const responseData = await response.json();
  
  // Truncate photo URLs in logs
  const logData = { ...responseData };
  if (logData.data && Array.isArray(logData.data)) {
    logData.data = logData.data.map((meal: Meal) => {
      if (meal.photo) {
        return {
          ...meal,
          photo: `${meal.photo.substring(0, 50)}...`
        };
      }
      return meal;
    });
  }
  console.log('Meals API response:', logData);

  if (!response.ok) {
    throw new Error(responseData.message || 'Failed to fetch meals');
  }

  // Check if response has data property and it's an array
  if (responseData.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }

  console.warn('Meals API did not return an array in data property, defaulting to empty array');
  return [];
};

export const createMeal = async (mealData: CreateMealInput, token: string): Promise<Meal> => {
  // Validate required fields
  const requiredFields = ['name'];  // Only name is truly required
  const missingFields = requiredFields.filter(field => {
    const value = mealData[field as keyof CreateMealInput];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Ensure all numeric fields are handled properly
  const processedMealData: CreateMealInput = {
    ...mealData,
    timestamp: mealData.timestamp || new Date().toISOString(),
    carbs: mealData.carbs ?? 0,
    protein: mealData.protein ?? 0,
    fat: mealData.fat ?? 0,
    calories: mealData.calories ?? 0,
    quantity: mealData.quantity ?? 100
  };

  // Ensure all numeric values are actual numbers
  ['carbs', 'protein', 'fat', 'calories', 'quantity'].forEach(field => {
    const key = field as keyof Pick<CreateMealInput, 'carbs' | 'protein' | 'fat' | 'calories' | 'quantity'>;
    const value = processedMealData[key];
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      processedMealData[key] = isNaN(parsed) ? 0 : parsed;
    }
  });

  // Ensure photo is in the correct format
  if (mealData.photo) {
    // If the photo doesn't start with data:image, add the prefix
    if (!mealData.photo.startsWith('data:image')) {
      processedMealData.photo = `data:image/jpeg;base64,${mealData.photo}`;
    } else {
      processedMealData.photo = mealData.photo;
    }
  }

  // Log with truncated photo URL
  const logData = { ...processedMealData };
  if (logData.photo) {
    logData.photo = `${logData.photo.substring(0, 50)}...`;
  }
  console.log('Creating meal with validated data:', JSON.stringify(logData, null, 2));
  console.log('API URL:', `${API_URL}/meals`);
  
  const response = await fetch(`${API_URL}/meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(processedMealData),
  });

  const responseData = await response.json() as ApiResponse<Meal>;
  
  // Log response with truncated photo URL
  const logResponse = { ...responseData };
  if (logResponse.data?.photo) {
    logResponse.data.photo = `${logResponse.data.photo.substring(0, 50)}...`;
  }
  console.log('Create meal response:', response.status, logResponse);

  if (!response.ok) {
    console.error('Failed to create meal:', responseData);
    throw new Error(responseData.message || 'Failed to create meal');
  }

  if (!responseData.success || !responseData.data) {
    throw new Error('Invalid response format from server');
  }

  return responseData.data;
};

export const updateMeal = async (id: string, mealData: Partial<CreateMealInput>, token: string): Promise<Meal> => {
  const response = await fetch(`${API_URL}/meals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(mealData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update meal');
  }

  return data;
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
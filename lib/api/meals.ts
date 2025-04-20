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
  console.log('Meals API response:', responseData);

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
  const response = await fetch(`${API_URL}/meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(mealData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create meal');
  }

  return data;
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
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

export const getMeals = async (token: string, params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<Meal[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_URL}/meals?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch meals');
  }

  return data;
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
import { API_URL } from './auth';

export interface InsulinDose {
  id: number;
  units: number;
  timestamp: Date;
  type: 'rapid' | 'long';
  notes?: string;
}

export interface InsulinCalculation {
  currentGlucose: number;
  carbs: number;
  activity: string;
  timeOfDay: string;
}

export interface InsulinRecommendation {
  total: number;
  breakdown: {
    correctionDose: number;
    mealDose: number;
    activityAdjustment: number;
    timeAdjustment: number;
  };
}

export interface InsulinSettings {
  carbRatio: number;
  correctionFactor: number;
  targetGlucose: {
    min: number;
    max: number;
  };
  activeInsulin: {
    duration: number;
  };
}

export const getInsulinDoses = async (
  token: string,
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<{ doses: InsulinDose[] }> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${API_URL}/insulin/doses?${queryParams}`;
  console.log('Fetching insulin doses from:', url);
  console.log('With headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...` });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Insulin doses response status:', response.status);
    const data = await response.json();
    console.log('Insulin doses response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch insulin doses');
    }

    return data;
  } catch (error) {
    console.error('Error fetching insulin doses:', error);
    throw error;
  }
};

export const createInsulinDose = async (
  dose: Omit<InsulinDose, 'id'>,
  token: string
): Promise<InsulinDose> => {
  console.log('Creating insulin dose:', JSON.stringify(dose, null, 2));
  
  try {
    const response = await fetch(`${API_URL}/insulin/doses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dose),
    });

    console.log('Create insulin dose response status:', response.status);
    const data = await response.json();
    console.log('Create insulin dose response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create insulin dose');
    }

    return data;
  } catch (error) {
    console.error('Error creating insulin dose:', error);
    throw error;
  }
};

export const deleteInsulinDose = async (id: number, token: string): Promise<{ success: boolean }> => {
  console.log('Deleting insulin dose with id:', id);

  try {
    const response = await fetch(`${API_URL}/insulin/doses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Delete insulin dose response status:', response.status);
    const data = await response.json();
    console.log('Delete insulin dose response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete insulin dose');
    }

    return data;
  } catch (error) {
    console.error('Error deleting insulin dose:', error);
    throw error;
  }
};

export const calculateInsulinDose = async (
  calculation: InsulinCalculation,
  token: string
): Promise<InsulinRecommendation> => {
  console.log('Calculating insulin dose with data:', JSON.stringify(calculation, null, 2));

  try {
    const response = await fetch(`${API_URL}/insulin/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(calculation),
    });

    console.log('Calculate insulin dose response status:', response.status);
    const data = await response.json();
    console.log('Calculate insulin dose response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to calculate insulin dose');
    }

    return data;
  } catch (error) {
    console.error('Error calculating insulin dose:', error);
    throw error;
  }
};

export const getInsulinPredictions = async (
  token: string,
  limit?: number
): Promise<{
  accuracy: {
    percentage: number;
    trend: {
      value: number;
      direction: 'up' | 'down';
    };
  };
  predictions: Array<{
    id: number;
    mealType: string;
    date: Date;
    carbs: number;
    glucose: number;
    units: number;
    accuracy: 'Accurate' | 'Slightly low' | 'Low';
  }>;
}> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());

  const url = `${API_URL}/insulin/predictions?${queryParams}`;
  console.log('Fetching insulin predictions from:', url);
  console.log('With headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...` });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Insulin predictions response status:', response.status);
    const data = await response.json();
    console.log('Insulin predictions response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch insulin predictions');
    }

    return data;
  } catch (error) {
    console.error('Error fetching insulin predictions:', error);
    throw error;
  }
};

export const getInsulinSettings = async (token: string): Promise<InsulinSettings> => {
  console.log('Fetching insulin settings');
  console.log('With headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...` });

  try {
    const response = await fetch(`${API_URL}/insulin/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Insulin settings response status:', response.status);
    const data = await response.json();
    console.log('Insulin settings response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch insulin settings');
    }

    return data;
  } catch (error) {
    console.error('Error fetching insulin settings:', error);
    throw error;
  }
};

export const updateInsulinSettings = async (
  settings: Partial<InsulinSettings>,
  token: string
): Promise<{ success: boolean }> => {
  console.log('Updating insulin settings:', JSON.stringify(settings, null, 2));

  try {
    const response = await fetch(`${API_URL}/insulin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    console.log('Update insulin settings response status:', response.status);
    const data = await response.json();
    console.log('Update insulin settings response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update insulin settings');
    }

    return data;
  } catch (error) {
    console.error('Error updating insulin settings:', error);
    throw error;
  }
};
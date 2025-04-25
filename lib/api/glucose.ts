import { API_URL } from './auth';

export interface GlucoseReading {
  id: string;
  value: number;
  notes?: string;
  timestamp: string;
  status?: 'low' | 'high' | 'in-range';
}

export interface ActivityItem {
  id: string;
  type: 'glucose' | 'meal' | 'insulin';
  value?: number;
  mealType?: string;
  carbs?: number;
  units?: number;
  timestamp: string;
  notes?: string; 
}

export interface CreateGlucoseReadingInput {
  value: number;
  notes?: string;
}

export const getGlucoseReadings = async (
  token: string, 
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<GlucoseReading[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_URL}/glucose?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch glucose readings');
  }

  return data;
};

export const createGlucoseReading = async (
  readingData: CreateGlucoseReadingInput,
  token: string
): Promise<GlucoseReading> => {
  console.log('Creating glucose reading with data:', JSON.stringify(readingData, null, 2));

  const response = await fetch(`${API_URL}/glucose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(readingData),
  });

  const data = await response.json();
  console.log('Glucose reading creation response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create glucose reading');
  }

  return data;
};

export const getActivities = async (
  token: string,
  params?: {
    startDate?: string;
    endDate?: string;
    type?: 'glucose' | 'meal' | 'insulin';
    limit?: number;
  }
): Promise<ActivityItem[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${API_URL}/activities?${queryParams}`;
  console.log('Fetching activities from:', url);
  console.log('With headers:', { 'Authorization': `Bearer ${token.substring(0, 10)}...` });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Activities response status:', response.status);
    const data = await response.json();
    console.log('Activities response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch activities');
    }

    return data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};
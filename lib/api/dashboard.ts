import { API_URL } from './auth';
import { ProfileResponse } from './auth';
import { GlucoseReading, ActivityItem } from './glucose';
import { InsulinPredictionResult } from './insulin';

export interface DashboardData {
  profile: ProfileResponse;
  glucoseReadings: GlucoseReading[];
  activities: ActivityItem[];
  predictions: InsulinPredictionResult[];
}

export const getDashboardData = async (
  token: string,
  params?: { startDate?: string; endDate?: string }
): Promise<DashboardData> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const response = await fetch(`${API_URL}/dashboard?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard data');
  }
  return data;
};

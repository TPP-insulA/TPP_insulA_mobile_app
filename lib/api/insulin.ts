import { API_URL } from './auth';

export interface InsulinPredictionData {
  date: string; // UTC ISO string
  cgmPrev: number[];
  glucoseObjective: number;
  carbs: number;
  insulinOnBoard: number;
  sleepLevel: number;
  workLevel: number;
  activityLevel: number;
}

export interface InsulinPredictionResult extends InsulinPredictionData {
  id: string;
  recommendedDose: number;
  applyDose?: number;
  cgmPost: number[];
}

export const deleteInsulinPrediction = async (id: string, token: string): Promise<{ success: boolean }> => {
  console.log('Deleting insulin dose with id:', id);

  try {
    const response = await fetch(`${API_URL}/insulin/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Delete insulin prediction response status:', response.status);
    const data = await response.json();
    console.log('Delete insulin prediction response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete insulin prediction');
    }
    console.log('Delete insulin prediction response data:', JSON.stringify(data, null, 2));
    if (!response.ok) {
      throw new Error('Failed to delete insulin prediction');
    }
    return data;
  } catch (error) {
    console.error('Error deleting insulin prediction:', error);
    throw error;
  }
};

export const getPredictionHistory = async (token: string): Promise<InsulinPredictionResult[]> => {
  console.log('Fetching insulin prediction history for token:', token);
  try {
    const response = await fetch(`${API_URL}/insulin/predictions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Get insulin prediction history response status:', response.status);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to retrieve insulin prediction history');
    }
    return data;
  } catch (error) {
    console.error('Error fetching insulin prediction history:', error);
    throw error;
  }
};

export const calculateInsulinDose = async (
  calculation: InsulinPredictionData,
  token: string
): Promise<InsulinPredictionResult> => {
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
    console.log(response)

    if (!response.ok) {
      console.error('Error in response:', data);
      throw new Error(data.message || 'Failed to calculate insulin dose');
    }

    return data;
  } catch (error) {
    console.error('Error calculating insulin dose:', error);
    throw error;
  }
};

export const updateInsulinPredictionResult = async (
  token: string,
  predictionId: string,
  {
    applyDose,
    cgmPost,
  }: {
    applyDose: number | undefined;
    cgmPost: number[],
  }
): Promise<InsulinPredictionResult> => {
  console.log('Updating insulin dose with data:', JSON.stringify({ applyDose, cgmPost }, null, 2));
  const applyDoseValue = applyDose !== undefined ? applyDose : null;
  
  try {
    const response = await fetch(`${API_URL}/insulin/${predictionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ applyDose: applyDoseValue, cgmPost }),
    });

    console.log('Update insulin dose response status:', response.status);
    const data = await response.json();
    console.log('Update insulin dose response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update insulin dose');
    }

    return data;
  } catch (error) {
    console.error('Error updating insulin dose:', error);
    throw error;
  }
};
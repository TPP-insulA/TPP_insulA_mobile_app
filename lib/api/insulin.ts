import { API_URL } from './auth';

export interface InsulinDose {
  id: number;
  units: number;
  timestamp: Date;
  type: 'rapid' | 'long';
  notes?: string;
}

export interface InsulinPredictionData {
  userId: string;
  date: string; // UTC ISO string
  cgmPrev: number[];
  glucoseObjective: number;
  carbs: number;
  insulinOnBoard: number;
  sleepLevel: number;
  workLevel: number;
  activityLevel: number;
}

export interface InsulinPredictionResult {
  id: string;
  userId: string;
  date: string; // UTC ISO string
  cgmPrev: number[];
  glucoseObjective: number;
  carbs: number;
  insulinOnBoard: number;
  sleepLevel: number;
  workLevel: number;
  activityLevel: number;
  recommendedDose: number;
  applyDose?: number;
  cgmPost: number[];
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
  console.log('With headers:', token ? { 'Authorization': `Bearer ${token.slice(0, 10)}...` } : 'No token provided');

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

export const deleteInsulinPrediction = async (id: string, token: string): Promise<{ success: boolean }> => {
  console.log('Deleting insulin dose with id:', id);

  try {
    /*const response = await fetch(`${API_URL}/insulin/doses/${id}`, {
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
    */
    // Simulating a response for testing purposes
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = {
      ok: true
    };
    const data = {
      success: true,
    };
    console.log('Delete insulin dose response data:', JSON.stringify(data, null, 2));
    if (!response.ok) {
      throw new Error('Failed to delete insulin dose');
    }
    return data;
  } catch (error) {
    console.error('Error deleting insulin dose:', error);
    throw error;
  }
};

export const getPredictionHistory = async (token: string, id: string): Promise<InsulinPredictionResult[]> => {
  console.log('Fetching insulin prediction history for id:', id);
  try {
    //Commented for testing purposes
    /*const response = await fetch(`${API_URL}/insulin/predictions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(id),
    });

    console.log('Calculate insulin dose response status:', response.status);
    const data = await response.json();*/
    // Simulating a response for testing purposes
    // add sleep of 5 secs
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = {
      ok: true
    };
    const data = [
      {
        id: "test_1",
        userId: id,
        date: "2025-05-16T00:04:16.268Z",
        cgmPrev: [100, 110, 120],
        glucoseObjective: 100,
        carbs: 30,
        insulinOnBoard: 5,
        sleepLevel: 1,
        workLevel: 2,
        activityLevel: 3,
        recommendedDose: 5,
        applyDose: 5,
        cgmPost: [90, 95, 100],
      },
      {
        id: "test_2",
        userId: id,
        date: "2025-05-16T00:05:16.268Z",
        cgmPrev: [95, 100, 105],
        glucoseObjective: 100,
        carbs: 25,
        insulinOnBoard: 4,
        sleepLevel: 2,
        workLevel: 3,
        activityLevel: 2,
        recommendedDose: 4,
        applyDose: 4,
        cgmPost: [85, 90, 95],
      },
      {
        id: "test_3",
        userId: id,
        date: "2025-05-18T00:06:16.268Z",
        cgmPrev: [90, 95, 100],
        glucoseObjective: 100,
        carbs: 20,
        insulinOnBoard: 3,
        sleepLevel: 3,
        workLevel: 2,
        activityLevel: 1,
        recommendedDose: 3,
        cgmPost: [],
      },
      {
        id: "test_4",
        userId: id,
        date: "2025-05-16T00:04:16.268Z",
        cgmPrev: [100, 110, 120],
        glucoseObjective: 100,
        carbs: 30,
        insulinOnBoard: 5,
        sleepLevel: 1,
        workLevel: 2,
        activityLevel: 3,
        recommendedDose: 5,
        applyDose: 5,
        cgmPost: [90, 95, 100],
      },
      {
        id: "test_5",
        userId: id,
        date: "2025-05-19T21:40:00.000Z",
        cgmPrev: [95, 100, 105],
        glucoseObjective: 100,
        carbs: 25,
        insulinOnBoard: 4,
        sleepLevel: 2,
        workLevel: 3,
        activityLevel: 2,
        recommendedDose: 4,
        applyDose: 4,
        cgmPost: [85, 90, 95],
      },
      {
        id: "test_6",
        userId: id,
        date: "2025-05-18T00:06:16.268Z",
        cgmPrev: [90, 95, 100],
        glucoseObjective: 100,
        carbs: 20,
        insulinOnBoard: 3,
        sleepLevel: 3,
        workLevel: 2,
        activityLevel: 1,
        recommendedDose: 3,
        cgmPost: [],
      },
      {
        id: "test_7",
        userId: id,
        date: "2025-05-16T00:04:16.268Z",
        cgmPrev: [100, 110, 120],
        glucoseObjective: 100,
        carbs: 30,
        insulinOnBoard: 5,
        sleepLevel: 1,
        workLevel: 2,
        activityLevel: 3,
        recommendedDose: 5,
        applyDose: 5,
        cgmPost: [90, 95, 100],
      },
      {
        id: "test_8",
        userId: id,
        date: "2025-05-16T00:05:16.268Z",
        cgmPrev: [95, 100, 105],
        glucoseObjective: 100,
        carbs: 25,
        insulinOnBoard: 4,
        sleepLevel: 2,
        workLevel: 3,
        activityLevel: 2,
        recommendedDose: 5,
        applyDose: 4,
        cgmPost: [85, 90, 95],
      },
      {
        id: "test_9",
        userId: id,
        date: "2025-05-18T00:06:16.268Z",
        cgmPrev: [90, 95, 100],
        glucoseObjective: 100,
        carbs: 20,
        insulinOnBoard: 3,
        sleepLevel: 3,
        workLevel: 2,
        activityLevel: 1,
        recommendedDose: 3,
        cgmPost: [],
      },
    ];
    if (!response.ok) {
      //throw new Error(data.message || Failed to retrieve insulin prediction history');
      throw new Error('Failed to retrieve insulin prediction history');
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
    //Commented for testing purposes
    /*const response = await fetch(`${API_URL}/insulin/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(calculation),
    });

    console.log('Calculate insulin dose response status:', response.status);
    const data = await response.json();*/
    // Simulating a response for testing purposes
    // add sleep of 5 secs
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = {
      ok: true
    };

    const data = {
      id: "test_1",
      userId: calculation.userId,
      date: calculation.date, // string
      cgmPrev: calculation.cgmPrev,
      glucoseObjective: calculation.glucoseObjective,
      carbs: calculation.carbs,
      insulinOnBoard: calculation.insulinOnBoard,
      sleepLevel: calculation.sleepLevel,
      workLevel: calculation.workLevel,
      activityLevel: calculation.activityLevel,
      recommendedDose: 5, // Simulated recommended dose
      cgmPost: [], // Simulated CGM post values
    };
    console.log('Calculate insulin dose response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      //throw new Error(data.message || 'Failed to calculate insulin dose');
      throw new Error('Failed to calculate insulin dose');
    }

    return data;
  } catch (error) {
    console.error('Error calculating insulin dose:', error);
    throw error;
  }
};

export const updateInsulinPredictionResult = async (
  token: string,
  prediction: InsulinPredictionResult,
): Promise<InsulinPredictionResult> => {
  console.log('Updating insulin dose with data:', JSON.stringify(prediction, null, 2)); 
  
  try {
    //Commented for testing purposes
    /*const response = await fetch(`${API_URL}/insulin/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(prediction),
    });

    console.log('Update insulin dose response status:', response.status);
    const data = await response.json();*/
    // Simulating a response for testing purposes
    // add sleep of 5 secs
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = {
      ok: true
    };

    const data = {
      id: prediction.id,
      userId: prediction.userId,
      date: prediction.date,
      cgmPrev: prediction.cgmPrev,
      glucoseObjective: prediction.glucoseObjective,
      carbs: prediction.carbs,
      insulinOnBoard: prediction.insulinOnBoard,
      sleepLevel: prediction.sleepLevel,
      workLevel: prediction.workLevel,
      activityLevel: prediction.activityLevel,
      recommendedDose: prediction.recommendedDose, // Simulated recommended dose
      applyDose: prediction.applyDose, // Simulated apply dose
      cgmPost: prediction.cgmPost, // Simulated CGM post values
    };
    console.log('Update insulin dose response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      //throw new Error(data.message || 'Failed to update insulin dose');
      throw new Error('Failed to update insulin dose');
    }

    return data;
  } catch (error) {
    console.error('Error updating insulin dose:', error);
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
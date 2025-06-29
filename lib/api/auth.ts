import { GlucoseProfile } from '../../types';

// const API_URL = 'http://localhost:3000/api';  // You need to change 'your-ip' to your computer's IP address
//export const API_URL = 'http://10.0.2.2:3000/api'; // For local testing with Android emulator
export const API_URL = 'https://tppinsulabackend-production.up.railway.app/api';

// Types
export interface ApiUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  weight: number;
  height: number;
  glucoseProfile: GlucoseProfile;
  maxTargetGlucose?: number;
  minTargetGlucose?: number;
  profileImage?: string | null;
  treatingDoctor?: string | null;
  diabetesType?: string;
  diagnosisDate?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  weight: number;
  height: number;
  glucoseProfile: GlucoseProfile;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserResponse extends ApiResponse<{
  user: ApiUserData;
  token: string;
}> {}

export interface ProfileResponse extends ApiResponse<{
  user: ApiUserData & {
    medicalInfo?: {
      diabetesType: string;
      diagnosisDate: string;
      treatingDoctor: string;
    };
  };
}> {}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  weight?: number;
  height?: number;
  glucoseProfile?: GlucoseProfile;
  profileImage?: string;
  diabetesType?: string;
  diagnosisDate?: string;
  treatingDoctor?: string;
  maxTargetGlucose?: number;
  minTargetGlucose?: number;
}

export const registerUser = async (userData: RegisterUserInput): Promise<UserResponse> => {
  console.log('Starting registerUser API call...');
  console.log('API URL:', `${API_URL}/users/register`);
  console.log('Request headers:', {
    'Content-Type': 'application/json'
  });
  console.log('Request body:', JSON.stringify(userData, null, 2));

  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()]), null, 2));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));    if (!response.ok) {
      console.error('Registration failed:', data.message || 'Registration failed');
      
      // If there are specific validation errors, show the first one
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        throw new Error(data.errors[0]);
      }
      
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Network or parsing error:', error);
    if (error instanceof TypeError && error.message === 'Network request failed') {
      console.error('This might be a CORS issue or the server might be down');
      console.log('Please check:');
      console.log('1. Is the backend server running?');
      console.log('2. Is the API_URL correct?', API_URL);
      console.log('3. Are you connecting to the right port?');
      console.log('4. Is CORS properly configured on the backend?');
    }
    throw error;
  }
};

export const loginUser = async (credentials: LoginInput): Promise<UserResponse> => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
};

export const getUserProfile = async (token: string): Promise<ApiUserData> => {
  console.log('Fetching user profile...');
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log('Profile data received:', data);

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user profile');
  }

  return data;
};

export const updateUserProfile = async (userData: UpdateProfileInput, token: string): Promise<ProfileResponse> => {
  console.log('Updating user profile:', userData);
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  console.log('Profile update response:', data);

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user profile');
  }

  return data;
};

export const updateProfileImage = async (imageUrl: string, token: string): Promise<ApiUserData> => {
  console.log('Updating profile image:', {
    imageUrlPreview: imageUrl.substring(0, 50) + '...',
    totalLength: imageUrl.length
  });

  const response = await fetch(`${API_URL}/users/profile/image`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      imageUrl: imageUrl
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile image');
  }

  return data;
};

export const updateGlucoseTarget = async (
  targetData: { minTarget: number; maxTarget: number }, 
  token: string
): Promise<ProfileResponse> => {
  console.log('Updating glucose target:', targetData);
  const response = await fetch(`${API_URL}/users/glucose-target`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(targetData),
  });

  const data = await response.json();
  console.log('Glucose target update response:', data);

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update glucose target');
  }

  return data;
};

export const deleteUser = async (token: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete account');
  }

  return data;
};

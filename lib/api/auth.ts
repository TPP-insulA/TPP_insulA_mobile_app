import { GlucoseProfile } from '../types';

// Replace 'your-ip' with your computer's local IP address (e.g., '192.168.1.100')
// const API_URL = 'http://192.168.1.13:3000/api';  // You need to change 'your-ip' to your computer's IP address
// const API_URL = 'https://tpp-insula-backend.onrender.com/api'; // For production use
export const API_URL = 'https://tppinsulabackend-production.up.railway.app/api';

// Types
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

export interface UserResponse {
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
  profileImage: string | null;
  diabetesType: string;
  diagnosisDate: string;
  treatingDoctor: string | null;
  createdAt: string;
  updatedAt: string;
  token: string;
}

export interface MedicalInfo {
  diabetesType: 'type1';
  diagnosisDate: string;
  treatingDoctor: string;
}

export interface ProfileResponse extends Omit<UserResponse, 'token'> {}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  weight?: number;
  height?: number;
  medicalInfo?: {
    diagnosisDate?: string;
    treatingDoctor?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const registerUser = async (userData: RegisterUserInput): Promise<ApiResponse<UserResponse>> => {
  console.log('Starting registerUser API call...');
  const response = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  console.log('API URL:', response.url);
  console.log('Request headers:', {
    'Content-Type': 'application/json',
  });
  console.log('Request body:', userData);
  console.log('Response status:', response.status);
  console.log('Response status text:', response.statusText);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const data = await response.json();
  console.log('Response data:', data);

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrar usuario');
  }

  return data;
};

export const loginUser = async ({ email, password }: { email: string; password: string }): Promise<ApiResponse<UserResponse>> => {
  console.log('Starting loginUser API call...');
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  console.log('API URL:', response.url);
  console.log('Request headers:', {
    'Content-Type': 'application/json',
  });
  console.log('Request body:', { email, password });
  console.log('Response status:', response.status);
  console.log('Response status text:', response.statusText);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const data = await response.json();
  console.log('Response data:', data);

  if (!response.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  return data;
};

export const getUserProfile = async (token: string): Promise<ApiResponse<ProfileResponse>> => {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener perfil de usuario');
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

export const updateProfileImage = async (imageUrl: string, token: string): Promise<ProfileResponse> => {
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

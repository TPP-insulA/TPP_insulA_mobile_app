import { GlucoseProfile } from '../../types';

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
  token: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  weight?: number;
  height?: number;
  glucoseProfile?: GlucoseProfile;
  glucoseTarget?: {
    minTarget: number;
    maxTarget: number;
  };
}

export interface MedicalInfo {
  diabetesType: 'type1';
  diagnosisDate: string;
  treatingDoctor: string;
}

export interface ProfileResponse extends UserResponse {
  medicalInfo: MedicalInfo;
  profileImage?: string;
}

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
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Registration failed:', data.message || 'Registration failed');
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

export const getUserProfile = async (token: string): Promise<ProfileResponse> => {
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

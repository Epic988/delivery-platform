import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient } from '@delivery/shared';
import { API_BASE_URL } from '../config';

let cachedToken: string | null = null;
export async function loadToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem('token');
  return cachedToken;
}
export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem('token', token);
  else await AsyncStorage.removeItem('token');
}

export const api = createApiClient({ baseUrl: API_BASE_URL, getToken: () => cachedToken });

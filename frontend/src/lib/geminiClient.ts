// In production, use the backend URL. In development, use localhost.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://qr-scan-shield-backend.vercel.app';
const API_URL = import.meta.env.PROD
  ? `${BACKEND_URL}/api/chat`
  : 'http://localhost:3000/api/chat';

export async function sendMessage(message: string): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || `Failed to get response: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
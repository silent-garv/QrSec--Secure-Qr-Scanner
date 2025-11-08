const API_URL = import.meta.env.PROD
  ? 'https://qr-sec-backend.vercel.app/api/chat'  // Production backend URL
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
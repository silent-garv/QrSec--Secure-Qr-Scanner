// Prefer an explicit backend URL in production via VITE_API_URL. If not provided,
// fall back to a same-origin serverless route (`/api/chat`) when deployed together,
// or localhost in development.
const API_URL = import.meta.env.VITE_API_URL
  ?? (import.meta.env.PROD ? '/api/chat' : 'http://localhost:3000/api/chat');

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
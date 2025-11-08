const API_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_BASE_URL}/api/chat`
  : 'http://localhost:3000/api/chat';

export async function sendMessage(message: string): Promise<string> {
  try {
    console.log('Sending message to:', API_URL);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData?.error || `Failed to get response: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.response) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }
    return data.response;
  } catch (error) {
    console.error('Error sending message:', {
      error,
      url: API_URL,
      env: import.meta.env.MODE
    });
    throw error;
  }
}
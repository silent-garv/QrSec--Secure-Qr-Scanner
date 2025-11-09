// Set API URL based on environment
const API_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_BASE_URL}/api/chat`
  : 'http://localhost:3000/api/chat';

interface ApiErrorResponse {
  error: string;
  details?: Record<string, any>;
  success: boolean;
  meta?: {
    processingTime: number;
    timestamp: string;
  };
}

interface ApiSuccessResponse {
  response: string;
  meta?: {
    processingTime: number;
    timestamp: string;
  };
}

export async function sendMessage(message: string): Promise<string> {
  try {
    console.log('Sending message to:', API_URL);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ message }),
    });

    let jsonResponse: ApiSuccessResponse | ApiErrorResponse;
    
    try {
      jsonResponse = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      const errorData = jsonResponse as ApiErrorResponse;
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      throw new Error(
        errorData.error || 
        errorData.details?.message || 
        `Server error: ${response.status}`
      );
    }

    const data = jsonResponse as ApiSuccessResponse;
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
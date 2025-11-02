// Utility to check links/QRs using VirusTotal and Google Safe Browsing
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';

interface ApiResponse {
  service: 'VirusTotal' | 'Google Safe Browsing' | 'Error';
  result: any;
  threatFound: boolean;
  error?: string;
  details?: any;
}

// Use backend endpoint for link checks
export async function checkLinkBackend(url: string): Promise<ApiResponse> {
  try {
    const resp = await axios.post(`${API_BASE}/api/linkcheck`, { url }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
    
    return {
      ...resp.data,
      threatFound: resp.data.threatFound || false,
    };
  } catch (err: any) {
    console.error('API Error:', err);
    
    // Handle specific error cases
    if (err.code === 'ECONNABORTED') {
      return {
        service: 'Error',
        result: null,
        threatFound: false,
        error: 'Request timed out. Please try again.',
      } as ApiResponse;
    }
    
    if (err.response?.status === 404) {
      return {
        service: 'Error',
        result: null,
        threatFound: false,
        error: 'API endpoint not found. Please check the backend configuration.',
      } as ApiResponse;
    }
    
    return {
      service: 'Error',
      result: null,
      threatFound: false,
      error: err?.response?.data?.error || err?.message || 'Backend error',
      details: err?.response?.data?.details || undefined,
    } as ApiResponse;
  }
}

// Utility to check links/QRs using VirusTotal and Google Safe Browsing
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';

// Use backend endpoint for link checks
export async function checkLinkBackend(url: string) {
  try {
    const resp = await axios.post(`${API_BASE}/api/linkcheck`, { url });
    return resp.data;
  } catch (err: any) {
    return { error: err?.response?.data?.error || err?.message || 'Backend error' };
  }
}

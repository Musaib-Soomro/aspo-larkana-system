import { useState, useCallback } from 'react';
import api from '../utils/api';

/**
 * Generic API hook.
 * Usage: const { data, loading, error, request } = useApi();
 * await request('get', '/offices', { params: { page: 1 } });
 */
export function useApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api[method](url, config);
      setData(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'An error occurred.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, request };
}

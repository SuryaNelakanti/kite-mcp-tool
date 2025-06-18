import React, { useState, useEffect } from 'react';
import { rpcRequest } from '../api/client';

const ApiTest = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        // Test a simple RPC call - adjust the method name as per your backend API
        const result = await rpcRequest('get_profile');
        setData(result);
      } catch (err) {
        console.error('API Test Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) {
    return <div>Testing connection to backend...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded">
        <h3 className="text-red-700 font-semibold">Connection Error</h3>
        <p className="text-red-600">{error}</p>
        <p className="mt-2 text-sm text-red-600">
          Make sure the backend server is running on port 3001 and CORS is properly configured.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-green-300 bg-green-50 rounded">
      <h3 className="text-green-700 font-semibold">Connection Successful!</h3>
      <div className="mt-2 p-2 bg-white rounded border">
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ApiTest;

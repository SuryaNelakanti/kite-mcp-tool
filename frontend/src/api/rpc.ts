import axios from 'axios';
import { toast } from 'react-hot-toast';

export interface RpcRequest {
  method: string;
  params?: Record<string, unknown>;
}

export interface RpcResponse<T = any> {
  result: T;
  error?: { message: string };
}

export const rpc = async <T = any>(body: RpcRequest): Promise<T> => {
  try {
    const { data } = await axios.post<RpcResponse<T>>('/rpc', {
      jsonrpc: '2.0',
      id: Date.now(),
      ...body,
    });
    return data.result;
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || err.message;
    toast.error(msg);
    throw err;
  }
};

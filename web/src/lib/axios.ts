/// <reference types="vite/client" />
import axios from 'axios';
import { notification } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765',
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload.code !== 0) {
      notification.error({ message: '请求失败', description: payload.msg || '未知错误' });
      return Promise.reject(payload);
    }
    return payload.data;
  },
  (error) => {
    notification.error({ message: '网络错误', description: error.message });
    return Promise.reject(error);
  }
);

export default api;

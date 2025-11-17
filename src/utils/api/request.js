// 基础请求封装模块

// API基础URL
const API_BASE_URL = '/api';

// 请求超时时间（毫秒）
const TIMEOUT = 30000;

/**
 * 带超时控制的fetch请求
 */
async function fetchWithTimeout(url, options, timeout = TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}

/**
 * 处理响应数据
 */
async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP错误! 状态码: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

/**
 * 核心请求函数
 */
async function request(url, options = {}) {
  try {
    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // 默认配置
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // 合并配置
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    // 发送请求
    const response = await fetchWithTimeout(fullUrl, mergedOptions);
    return await handleResponse(response);
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
}

// 导出HTTP方法
export const get = (url, params = {}) => {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  return request(fullUrl, { method: 'GET' });
};

export const post = (url, data = {}) => {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const put = (url, data = {}) => {
  return request(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const del = (url) => {
  return request(url, { method: 'DELETE' });
};

// 导出默认请求函数
export default request;

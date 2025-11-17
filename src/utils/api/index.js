// API模块统一导出
import * as request from './request.js';
import * as accountApi from './accountApi.js';

// 统一导出所有API
export {
  // 基础请求方法
  request,
  
  // 业务API
  accountApi
};

// 默认导出
export default {
  request,
  accountApi
};

// 账户相关API模块
import { get, post } from './request.js';

/**
 * 获取账户统计数据
 * @param {Object} params - 统计参数
 * @param {Array} params.accountIds - 账户ID数组
 * @param {string} params.startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} params.endDate - 结束日期 (YYYY-MM-DD)
 * @param {string} params.groupBy - 分组方式 (MONTH, DAY, YEAR等)
 * @param {string} params.transactionType - 交易类型 (EXPENSE或INCOME)
 * @returns {Promise<Array>} 统计数据数组
 */
export async function getAccountStatistics(params) {
  try {
    console.log('开始获取账户统计数据:', params);
    const response = await post('/account/statistics', params);
    
    console.log('统计API返回数据:', JSON.stringify(response, null, 2));
    
    // 确保返回的数据是数组格式
    const data = response && response.data && Array.isArray(response.data) 
      ? response.data 
      : [];
      
    console.log('处理后的统计数据:', data);
    return data;
  } catch (error) {
    console.error('获取账户统计数据失败:', error);
    return [];
  }
}

/**
 * 获取账户树数据
 */
export async function fetchAccountTree() {
  try {
    console.log('开始获取账户树数据');
    const response = await get('/account/tree');
    
    console.log('API返回的原始数据结构:', JSON.stringify(response, null, 2));
    
    // 确保response是数组格式
    const dataToProcess = Array.isArray(response) ? response : 
                         (response && response.data && Array.isArray(response.data)) ? response.data : 
                         [];
    
    console.log('处理前的数据格式:', JSON.stringify(dataToProcess, null, 2));
    
    // 转换数据格式以适应Element Plus的Tree组件
    const transformedData = transformAccountNodes(dataToProcess);
    
    // 分析账户层级深度
    const analyzeAccountDepth = (nodes, depth = 0) => {
      let maxDepth = depth;
      if (nodes && Array.isArray(nodes)) {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            const childDepth = analyzeAccountDepth(node.children, depth + 1);
            maxDepth = Math.max(maxDepth, childDepth);
          }
        });
      }
      return maxDepth;
    };
    
    const maxDepth = analyzeAccountDepth(transformedData);
    console.log('账户树最大层级深度:', maxDepth);
    console.log('转换后的完整账户树数据:', JSON.stringify(transformedData, null, 2));
    
    // 分类账户为收入和支出
    const { incomeAccounts, expenseAccounts } = classifyAccounts(transformedData);
    
    console.log('处理后的数据 - 收入账户数量:', incomeAccounts.length, '支出账户数量:', expenseAccounts.length);
    console.log('收入账户层级结构:', JSON.stringify(incomeAccounts, null, 2));
    console.log('支出账户层级结构:', JSON.stringify(expenseAccounts, null, 2));
    
    return {
      allAccounts: transformedData,
      incomeAccounts,
      expenseAccounts
    };
  } catch (error) {
    console.error('获取账户树失败:', error);
    // 返回空列表作为默认值
    return {
      allAccounts: [],
      incomeAccounts: [],
      expenseAccounts: []
    };
  }
}

/**
 * 转换账户节点格式
 */
export function transformAccountNodes(nodes) {
  // 添加对nodes参数的空值检查
  if (!Array.isArray(nodes)) {
    return [];
  }
  
  return nodes.map(node => ({
    id: node.id || (node.guid || (node.accountId || (node.code || Math.random().toString(36).substr(2, 9)))),
    label: node.name || node.label || '未命名账户',
    accountType: node.accountType || 'unknown',
    children: node.children && Array.isArray(node.children) ? transformAccountNodes(node.children) : []
  }));
}

/**
 * 分类账户为收入和支出
 */
export function classifyAccounts(accounts) {
  const incomeAccounts = [];
  const expenseAccounts = [];
  
  console.log('开始分类账户，原始账户数据:', JSON.stringify(accounts, null, 2));
  
  function traverseNodes(nodes, parentList = []) {
    if (!nodes || !Array.isArray(nodes)) {
      console.warn('无效的节点数据:', nodes);
      return;
    }
    
    console.log(`当前处理层级 (${parentList.length}):`, parentList.join(' / ') || '根节点');
    
    nodes.forEach(node => {
      // 根据accountType或名称关键字判断账户类型
      const nodeId = node.id != null ? String(node.id) : '';
      
      console.log(`处理节点: ID=${nodeId}, Label=${node.label}, Type=${node.accountType}`);
      
      let isIncome = false;
      let isExpense = false;
      let reason = '';
      
      if (node.accountType === 'income') {
        isIncome = true;
        reason = 'accountType=income';
      } else if (node.accountType === 'expense') {
        isExpense = true;
        reason = 'accountType=expense';
      } else if (node.label && node.label.includes('收入')) {
        isIncome = true;
        reason = 'label包含收入';
      } else if (node.label && node.label.includes('支出')) {
        isExpense = true;
        reason = 'label包含支出';
      } else if (nodeId.startsWith('1')) {
        isIncome = true;
        reason = 'ID以1开头';
      } else if (nodeId.startsWith('2')) {
        isExpense = true;
        reason = 'ID以2开头';
      } else {
        console.log(`节点未分类: ${nodeId} - ${node.label}`);
      }
      
      if (isIncome) {
        const accountData = {
          ...node,
          parentPath: [...parentList, node.label].join(' / ')
        };
        incomeAccounts.push(accountData);
        console.log(`分类为收入账户: ${node.label}, 路径: ${accountData.parentPath}, 原因: ${reason}`);
      } else if (isExpense) {
        const accountData = {
          ...node,
          parentPath: [...parentList, node.label].join(' / ')
        };
        expenseAccounts.push(accountData);
        console.log(`分类为支出账户: ${node.label}, 路径: ${accountData.parentPath}, 原因: ${reason}`);
      }
      
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        console.log(`进入子节点处理: ${node.label} (${node.children.length}个子节点)`);
        traverseNodes(node.children, [...parentList, node.label]);
      }
    });
  }
  
  traverseNodes(accounts);
  
  console.log('账户分类完成 - 收入账户:', incomeAccounts.length, '支出账户:', expenseAccounts.length);
  return { incomeAccounts, expenseAccounts };
}

// 移除了兜底数据函数，现在使用空列表作为默认值

// 导出所有API函数
export default {
  fetchAccountTree,
  getAccountStatistics
};

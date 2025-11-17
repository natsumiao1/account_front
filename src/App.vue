<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <el-card shadow="hover" class="title-card">
      <h1 class="page-title">记账数据统计</h1>
    </el-card>

    <!-- 筛选工具栏 -->
    <el-card shadow="hover" class="filter-card">
      <div class="filter-container">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          align="center"
          class="date-picker"
        />
        <el-select
          v-model="transactionTypeFilter"
          placeholder="交易类型"
          class="type-select"
        >
          <el-option label="全部" value="all" />
          <el-option label="收入" value="income" />
          <el-option label="支出" value="expense" />
        </el-select>
        <el-select
          v-model="categoryFilter"
          placeholder="支出分类"
          class="category-select"
        >
          <el-option label="全部" value="all" />
          <el-option
            v-for="category in expenseCategories"
            :key="category.value"
            :label="category.label"
            :value="category.value"
          />
        </el-select>
        <el-button type="primary" @click="applyFilters">应用筛选</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </el-card>

    <!-- 数据概览卡片 -->
    <div class="overview-container">
      <el-card shadow="hover" class="overview-card income-card">
        <div class="card-header">
          <h3 class="card-title">总收入</h3>
          <el-icon class="card-icon"><TrendCharts /></el-icon>
        </div>
        <div class="card-value income-value">¥{{ totalIncome.toFixed(2) }}</div>
        <div class="card-subtitle">较上期 <span class="income-change">+5.2%</span></div>
      </el-card>

      <el-card shadow="hover" class="overview-card expense-card">
        <div class="card-header">
          <h3 class="card-title">总支出</h3>
          <el-icon class="card-icon"><ShoppingBag /></el-icon>
        </div>
        <div class="card-value expense-value">¥{{ totalExpense.toFixed(2) }}</div>
        <div class="card-subtitle">较上期 <span class="expense-change">+2.1%</span></div>
      </el-card>

      <el-card shadow="hover" class="overview-card balance-card">
        <div class="card-header">
          <h3 class="card-title">结余</h3>
          <el-icon class="card-icon"><Wallet /></el-icon>
        </div>
        <div class="card-value balance-value">¥{{ balance.toFixed(2) }}</div>
        <div class="card-subtitle">较上期 <span class="balance-change">+3.8%</span></div>
      </el-card>

      <el-card shadow="hover" class="overview-card transaction-card">
        <div class="card-header">
          <h3 class="card-title">交易笔数</h3>
          <el-icon class="card-icon"><Document /></el-icon>
        </div>
        <div class="card-value transaction-value">{{ transactionCount }}</div>
        <div class="card-subtitle">笔交易记录</div>
      </el-card>
    </div>

    <!-- 全局浮动的时间选择面板 -->
    <TimeSelectionPanel 
      :time-range="timeRange"
      :time-panel-visible="timePanelVisible"
      @update-time-range="updateTimeRange"
      @toggle-panel="toggleTimePanel"
      @update-trend-chart="updateTrendChart"
    />

    <!-- 主内容区域 - 图表 -->
    <div class="main-content">
      <el-card shadow="hover" class="chart-card trend-chart-card">
        <h3 class="chart-title">收支趋势</h3>
        <div id="trendChart" ref="trendChartRef" class="chart trend-chart"></div>
      </el-card>
    </div>

    <!-- 全局浮动的账户选择面板 -->
    <AccountSelectionPanel 
      :account-panel-visible="accountPanelVisible"
      :expense-account-tree="expenseAccountTree"
      :income-account-tree="incomeAccountTree"
      :expense-account-popover-visible="expenseAccountPopoverVisible"
      :income-account-popover-visible="incomeAccountPopoverVisible"
      @toggle-panel="toggleAccountPanel"
      @update-expense-popover="updateExpensePopover"
      @update-income-popover="updateIncomePopover"
      @handle-expense-check="handleExpenseAccountCheckChange"
      @handle-income-check="handleIncomeAccountCheckChange"
      @confirm-income-selection="confirmIncomeAccountSelection"
      @confirm-expense-selection="confirmExpenseAccountSelection"
    />
    
    <!-- 支出分类图表单独一行 -->
    <div class="category-chart-container">
      <el-card shadow="hover" class="chart-card category-chart-card">
        <h3 class="chart-title">支出分类</h3>
        <div id="categoryChart" ref="categoryChartRef" class="chart category-chart"></div>
      </el-card>
    </div>

    <!-- 分类统计列表 -->
    <el-card shadow="hover" class="table-card">
      <h3 class="table-title">分类统计详情</h3>
      <el-table :data="categoryStats" style="width: 100%">
        <el-table-column prop="category" label="分类" min-width="100" />
        <el-table-column prop="amount" label="金额" min-width="100">
          <template #default="scope">
            ¥{{ scope.row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" min-width="100">
          <template #default="scope">
            {{ scope.row.percentage.toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column prop="count" label="笔数" min-width="80" />
        <el-table-column prop="average" label="平均金额" min-width="100">
          <template #default="scope">
            ¥{{ scope.row.average.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineComponent } from 'vue'
import * as echarts from 'echarts'
import { TrendCharts, ShoppingBag, Wallet, Document, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import TimeSelectionPanel from './components/TimeSelectionPanel.vue'
import AccountSelectionPanel from './components/AccountSelectionPanel.vue'

// 面板显示控制变量
const timePanelVisible = ref(true)
const accountPanelVisible = ref(true)

// 弹窗控制变量
const expenseAccountPopoverVisible = ref(false)
const incomeAccountPopoverVisible = ref(false)

// 筛选相关数据
const dateRange = ref([])
import { accountApi } from './utils/api'

const transactionTypeFilter = ref('all')
const categoryFilter = ref('all')

// 时间范围和尺度控制
const timeRange = ref('3m') // 默认最近3个月
const timeScale = ref('month') // 默认按月
const customDateRange = ref([])

// 账户选择相关变量
const selectedIncomeAccounts = ref([]) // 存储选中的收入账户ID
const selectedIncomeAccountLabels = ref([]) // 存储选中的收入账户名称
const selectedExpenseAccounts = ref([]) // 存储选中的支出账户ID
const selectedExpenseAccountLabels = ref([]) // 存储选中的支出账户名称

// 树状结构账户数据 - 改为响应式引用
const incomeAccountTree = ref([])
const expenseAccountTree = ref([])

// 从后端API获取账户树数据
const fetchAccountTree = async () => {
  try {
    const result = await accountApi.fetchAccountTree()
    incomeAccountTree.value = result.allAccounts
    expenseAccountTree.value = result.allAccounts
  } catch (error) {
    console.warn('获取账户树数据失败', error.message)
  }

}


// 示例支出分类列表
const expenseCategories = [
  { label: '餐饮', value: 'food' },
  { label: '交通', value: 'transport' },
  { label: '购物', value: 'shopping' },
  { label: '娱乐', value: 'entertainment' },
  { label: '医疗', value: 'medical' },
  { label: '教育', value: 'education' },
  { label: '住房', value: 'housing' },
  { label: '其他', value: 'other' }
]

// 示例统计数据
const totalIncome = ref(25000)
const totalExpense = ref(18500)
const balance = ref(totalIncome.value - totalExpense.value)
const transactionCount = ref(156)

// 示例分类统计数据
const categoryStats = [
  { category: '餐饮', amount: 5200, percentage: 28.1, count: 45, average: 115.56 },
  { category: '交通', amount: 2100, percentage: 11.4, count: 30, average: 70.00 },
  { category: '购物', amount: 4800, percentage: 25.9, count: 15, average: 320.00 },
  { category: '娱乐', amount: 1800, percentage: 9.7, count: 12, average: 150.00 },
  { category: '医疗', amount: 900, percentage: 4.9, count: 5, average: 180.00 },
  { category: '教育', amount: 2200, percentage: 11.9, count: 8, average: 275.00 },
  { category: '住房', amount: 1000, percentage: 5.4, count: 3, average: 333.33 },
  { category: '其他', amount: 500, percentage: 2.7, count: 18, average: 27.78 }
]

// 图表引用
const trendChartRef = ref(null)
const categoryChartRef = ref(null)
let trendChart = null
let categoryChart = null

// 组件挂载时获取账户数据
onMounted(() => {
  fetchAccountTree()
  })

// 筛选函数
const applyFilters = () => {
  // TODO: 实现筛选逻辑
  console.log('应用筛选', { dateRange: dateRange.value, transactionTypeFilter: transactionTypeFilter.value, categoryFilter: categoryFilter.value })
}

// 重置筛选
const resetFilters = () => {
  dateRange.value = []
  transactionTypeFilter.value = 'all'
  categoryFilter.value = 'all'
}

// 切换时间面板显示/隐藏
const toggleTimePanel = () => {
  timePanelVisible.value = !timePanelVisible.value
}

// 切换账户面板显示/隐藏
const toggleAccountPanel = () => {
  accountPanelVisible.value = !accountPanelVisible.value
}

// 更新时间范围
const updateTimeRange = (newRange) => {
  timeRange.value = newRange
}

// 更新支出账户弹窗状态
const updateExpensePopover = (visible) => {
  expenseAccountPopoverVisible.value = visible
}

// 更新收入账户弹窗状态
const updateIncomePopover = (visible) => {
  incomeAccountPopoverVisible.value = visible
}

// 弹窗状态控制变量已在文件开头声明

// 处理收入账户选择
const handleIncomeAccountCheck = () => {
  // 实时处理逻辑（可选）
}

// 处理支出账户选择
const handleExpenseAccountCheck = () => {
  // 实时处理逻辑（可选）
}

// 处理收入账户选择变化
const handleIncomeAccountCheckChange = (data, checked, indeterminate) => {
  // 处理收入账户选择变化逻辑
  console.log('收入账户选择变化:', data, checked, indeterminate)
}

// 处理支出账户选择变化
const handleExpenseAccountCheckChange = (data, checked, indeterminate) => {
  // 处理支出账户选择变化逻辑
  console.log('支出账户选择变化:', data, checked, indeterminate)
}

// 函数已在前面定义

// 获取所有叶子节点ID的工具函数
const getAllLeafNodeIds = (nodes, ids = []) => {
  nodes.forEach(node => {
    if (node.children && node.children.length > 0) {
      getAllLeafNodeIds(node.children, ids)
    } else {
      ids.push(node.id)
    }
  })
  return ids
}

// 获取节点标签的工具函数
const getNodeLabelById = (id, nodes) => {
  for (const node of nodes) {
    if (node.id === id) return node.label
    if (node.children && node.children.length > 0) {
      const found = getNodeLabelById(id, node.children)
      if (found) return found
    }
  }
  return null
}

// 这些函数已在文件前面部分声明

// 全选功能已在AccountSelectionPanel组件内部实现

// 确认收入账户选择
const confirmIncomeAccountSelection = (checkedKeys) => {
  console.log('===== 确认收入账户选择 =====')
  console.log('传入的选中账户ID:', checkedKeys)
  
  // 更新选中的收入账户ID和标签
  if (checkedKeys && checkedKeys.length > 0) {
    selectedIncomeAccounts.value = checkedKeys
    selectedIncomeAccountLabels.value = checkedKeys.map(id => {
      const label = getNodeLabelById(id, incomeAccountTree.value)
      console.log(`收入账户ID: ${id} 对应标签: ${label}`)
      return label
    }).filter(Boolean)
    
    console.log(`更新后选中的收入账户数量: ${selectedIncomeAccounts.value.length}`)
    console.log(`更新后选中的收入账户标签: ${selectedIncomeAccountLabels.value.join(', ')}`)
  } else if (incomeAccountTree.value.length > 0) {
    // 如果没有传递选中的账户，使用默认的选中所有
    const allLeafIds = getAllLeafNodeIds(incomeAccountTree.value)
    selectedIncomeAccounts.value = allLeafIds
    selectedIncomeAccountLabels.value = allLeafIds.map(id => getNodeLabelById(id, incomeAccountTree.value)).filter(Boolean)
    
    console.log(`使用默认全选: ${allLeafIds.length}个收入账户叶子节点`)
  }
  
  // 更新图表
  updateTrendChart()
  console.log('===== 收入账户选择确认完成 =====')
}

// 确认支出账户选择
const confirmExpenseAccountSelection = (checkedKeys) => {
  console.log('===== 确认支出账户选择 =====')
  console.log('传入的选中账户ID:', checkedKeys)
  
  // 更新选中的支出账户ID和标签
  if (checkedKeys && checkedKeys.length > 0) {
    selectedExpenseAccounts.value = checkedKeys
    selectedExpenseAccountLabels.value = checkedKeys.map(id => {
      const label = getNodeLabelById(id, expenseAccountTree.value)
      console.log(`支出账户ID: ${id} 对应标签: ${label}`)
      return label
    }).filter(Boolean)
    
    console.log(`更新后选中的支出账户数量: ${selectedExpenseAccounts.value.length}`)
    console.log(`更新后选中的支出账户标签: ${selectedExpenseAccountLabels.value.join(', ')}`)
  } else if (expenseAccountTree.value.length > 0) {
    // 如果没有传递选中的账户，使用默认的选中所有
    const allLeafIds = getAllLeafNodeIds(expenseAccountTree.value)
    selectedExpenseAccounts.value = allLeafIds
    selectedExpenseAccountLabels.value = allLeafIds.map(id => getNodeLabelById(id, expenseAccountTree.value)).filter(Boolean)
    
    console.log(`使用默认全选: ${allLeafIds.length}个支出账户叶子节点`)
  }
  
  // 更新图表
  updateTrendChart()
  console.log('===== 支出账户选择确认完成 =====')
}

// 根据时间范围、尺度和选定账户生成模拟数据
const generateTrendData = () => {
  const now = new Date()
  let startDate = new Date()
  let dataPoints = []
  let labels = []
  let incomeData = []
  let expenseData = []
  
  // 设置开始日期
  if (timeRange.value === '7d') {
    startDate.setDate(now.getDate() - 6)
    dataPoints = 7
  } else if (timeRange.value === '30d') {
    startDate.setDate(now.getDate() - 29)
    dataPoints = 30
  } else if (timeRange.value === '3m') {
    startDate.setMonth(now.getMonth() - 2)
    dataPoints = 3
  } else if (timeRange.value === '1y') {
    startDate.setFullYear(now.getFullYear() - 1)
    dataPoints = 12
  } else if (timeRange.value === 'custom' && customDateRange.value.length === 2) {
    startDate = customDateRange.value[0]
    const endDate = customDateRange.value[1]
    
    // 根据选择的尺度计算数据点数量
    if (timeScale.value === 'day') {
      dataPoints = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    } else if (timeScale.value === 'week') {
      dataPoints = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7)) + 1
    } else if (timeScale.value === 'month') {
      dataPoints = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                  (endDate.getMonth() - startDate.getMonth()) + 1
    } else if (timeScale.value === 'year') {
      dataPoints = endDate.getFullYear() - startDate.getFullYear() + 1
    }
  }
  
  // 分别计算收入和支出账户的权重
  const incomeAccountWeight = selectedIncomeAccounts.value.length > 0 
    ? selectedIncomeAccounts.value.length / 8 // 假设总共有8个叶子账户
    : 1
  
  const expenseAccountWeight = selectedExpenseAccounts.value.length > 0 
    ? selectedExpenseAccounts.value.length / 8
    : 1
  
  // 生成标签和数据
  const tempDate = new Date(startDate)
  for (let i = 0; i < dataPoints; i++) {
    // 根据时间尺度生成标签
    if (timeScale.value === 'day') {
      labels.push(`${tempDate.getMonth() + 1}/${tempDate.getDate()}`)
      tempDate.setDate(tempDate.getDate() + 1)
    } else if (timeScale.value === 'week') {
      const weekStart = new Date(tempDate)
      const weekEnd = new Date(tempDate)
      weekEnd.setDate(weekStart.getDate() + 6)
      labels.push(`${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`)
      tempDate.setDate(tempDate.getDate() + 7)
    } else if (timeScale.value === 'month') {
      labels.push(`${tempDate.getFullYear()}-${tempDate.getMonth() + 1}`)
      tempDate.setMonth(tempDate.getMonth() + 1)
    } else if (timeScale.value === 'year') {
      labels.push(`${tempDate.getFullYear()}`)
      tempDate.setFullYear(tempDate.getFullYear() + 1)
    }
    
    // 生成随机数据（实际应用中应从后端获取，并根据账户筛选）
    const baseIncome = 25000 * incomeAccountWeight
    const baseExpense = 18500 * expenseAccountWeight
    incomeData.push(baseIncome + Math.random() * 5000 * incomeAccountWeight - 2500 * incomeAccountWeight)
    expenseData.push(baseExpense + Math.random() * 4000 * expenseAccountWeight - 2000 * expenseAccountWeight)
  }
  
  return { labels, incomeData, expenseData }
}

// 更新趋势图表
const updateTrendChart = () => {
  if (!trendChart) return
  
  const { labels, incomeData, expenseData } = generateTrendData()
  
  trendChart.setOption({
    xAxis: {
      data: labels
    },
    series: [
      {
        name: '收入',
        data: incomeData
      },
      {
        name: '支出',
        data: expenseData
      }
    ]
  })
}

// 初始化图表
const initCharts = () => {
  // 初始化趋势图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    const { labels, incomeData, expenseData } = generateTrendData()
    
    const trendOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: ['收入', '支出']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '收入',
          type: 'line',
          stack: '总量',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: incomeData,
          lineStyle: {
            color: '#67C23A'
          }
        },
        {
          name: '支出',
          type: 'line',
          stack: '总量',
          areaStyle: {},
          emphasis: {
            focus: 'series'
          },
          data: expenseData,
          lineStyle: {
            color: '#F56C6C'
          }
        }
      ]
    }
    trendChart.setOption(trendOption)
  }

  // 初始化分类饼图
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
    const categoryOption = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '支出分类',
          type: 'pie',
          radius: '50%',
          data: categoryStats.map(stat => ({
            value: stat.amount,
            name: stat.category
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    categoryChart.setOption(categoryOption)
  }
}

// 响应式调整图表大小
const handleResize = () => {
  if (trendChart) trendChart.resize()
  if (categoryChart) categoryChart.resize()
}

onMounted(() => {
  // 设置默认日期范围（最近3个月）
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(now.getMonth() - 3)
  dateRange.value = [threeMonthsAgo, now]
  customDateRange.value = [threeMonthsAgo, now]
  
  // 获取账户数据
  fetchAccountTree()
  
  // 初始化时默认选择所有收入和支出账户
  setTimeout(() => {
    // 移除对已删除函数的引用，直接调用确认函数
    confirmIncomeAccountSelection(null)
    confirmExpenseAccountSelection(null)
  }, 100)
  
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChart) trendChart.dispose()
  if (categoryChart) categoryChart.dispose()
})
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #303133;
}

.app-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
}

/* 页面标题样式 */
.title-card {
  margin-bottom: 20px;
  text-align: center;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 筛选工具栏样式 */
.filter-card {
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.date-picker {
  width: 300px;
}

.type-select,
.category-select {
  width: 150px;
}

/* 数据概览卡片样式 */
.overview-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.overview-card {
  transition: transform 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin: 0;
}

.card-icon {
  font-size: 20px;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 5px;
}

.card-subtitle {
  font-size: 14px;
  color: #909399;
}

.income-card .card-icon,
.income-change {
  color: #67C23A;
}

.income-value {
  color: #67C23A;
}

.expense-card .card-icon,
.expense-change {
  color: #F56C6C;
}

.expense-value {
  color: #F56C6C;
}

.balance-card .card-icon,
.balance-change {
  color: #409EFF;
}

.balance-value {
  color: #409EFF;
}

.transaction-card .card-icon {
  color: #909399;
}

/* 图表区域样式 */
.category-chart-container {
  margin-bottom: 20px;
}

/* 主内容区域 */
  main {
    padding: 20px;
    margin: 0 auto;
    max-width: calc(100% - 600px);
  }

  /* 全局浮动面板样式 */
  .floating-panel {
    position: fixed;
    z-index: 1000;
    background-color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 15px;
    margin: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    transition: transform 0.3s ease;
  }

  /* 时间选择面板 - 左侧垂直居中 */
  .floating-panel.left {
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    min-width: min-content;
    max-width: 240px;
  }

  /* 账户选择面板 - 右侧垂直居中 */
  .floating-panel.right {
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    min-width: min-content;
    max-width: 240px;
  }

  .control-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

/* 面板头部样式 */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  /* 面板标题样式 */
  .panel-title {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
    flex: 1;
    text-align: center;
    margin: 0;
  }

  /* 折叠按钮样式 */
.collapse-btn {
  padding: 4px;
  min-width: unset;
}

/* 折叠状态样式 */
  .floating-panel.collapsed {
  width: 40px;
  padding: 8px;
}
.floating-panel.collapsed .panel-header {
  justify-content: center;
}
.floating-panel.collapsed .panel-title {
  display: none;
}

  /* 时间面板标题居中（左侧按钮） */
  .time-panel .panel-header {
    justify-content: flex-end;
  }

  .time-panel .panel-title {
    margin-right: auto;
  }

  /* 账户面板标题居中（右侧按钮） */
  .account-panel .panel-header {
    justify-content: flex-start;
  }

  .account-panel .panel-title {
    margin-left: auto;
  }

  /* 折叠按钮样式 */
  .collapse-btn {
    transition: transform 0.3s ease;
    font-size: 16px;
    padding: 4px;
    cursor: pointer;
  }

  .collapse-btn.collapsed {
    transform: rotate(180deg);
  }

  /* 折叠动画 */
  .slide-enter-active,
  .slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .slide-enter-from,
  .slide-leave-to {
    max-height: 0;
    opacity: 0;
    transform: translateX(20px);
  }

  /* 确保展开时内容正常显示 */
  .slide-enter-to,
  .slide-leave-from {
    max-height: 500px;
    opacity: 1;
    transform: translateX(0);
  }

  /* 时间面板的展开收起动画方向 */
  .time-panel .slide-enter-from,
  .time-panel .slide-leave-to {
    transform: translateX(-20px);
  }

.chart-card {
  transition: transform 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  transform: translateY(-2px);
}

.chart-title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 20px 0;
  text-align: center;
}

.trend-chart {
  height: 400px;
  flex: 1;
  min-height: 0;
}

.category-chart {
  height: 400px; /* 支出分类图表高度保持适中 */
}

/* 时间选择控件样式优化 - 垂直排列 */
.time-controls-group {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: fit-content;
  }

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
  display: block;
  text-align: center;
}

/* 单选按钮组容器 */
.radio-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 垂直排列的单选按钮组 */
.vertical-radio-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.vertical-radio-group .el-radio-button {
  display: block;
  width: 100%;
  text-align: center;
  /* 重置按钮组的默认样式 */
  position: relative;
}

.vertical-radio-group .el-radio-button__inner {
  width: 100%;
  text-align: center;
  border-radius: 4px !important;
}

/* 覆盖Element UI的默认样式，确保垂直排列时按钮样式一致 */
.vertical-radio-group .el-radio-button:first-child .el-radio-button__inner,
.vertical-radio-group .el-radio-button.is-active:first-child .el-radio-button__inner {
  border-radius: 4px !important;
}

.vertical-radio-group .el-radio-button:last-child .el-radio-button__inner,
.vertical-radio-group .el-radio-button.is-active:last-child .el-radio-button__inner {
  border-radius: 4px !important;
}

/* 移除按钮之间的连接边框，让每个按钮都有独立完整的边框 */
.vertical-radio-group .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  z-index: 1;
}

/* 自定义日期悬浮弹出框样式 */
.custom-date-popover {
  z-index: 2000 !important;
  padding: 10px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.custom-date-popover .el-picker-panel {
  box-shadow: none !important;
  border: none !important;
}

/* 垂直排列的单选按钮组 */
.el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.el-radio-button {
  display: block;
  width: 100%;
  margin-bottom: 5px;
}

.el-radio-button:last-child {
  margin-bottom: 0;
}

/* 自定义日期选择器垂直排列 */
.custom-date-picker {
  margin-bottom: 10px;
  width: 100%;
}

.custom-date-picker .el-date-editor {
  width: 100%;
}

/* 垂直排列的账户选择 */
.account-group {
    margin-bottom: 25px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: fit-content;
  }

.account-group:last-child {
  margin-bottom: 0;
}

.account-popover {
  width: 300px;
}

.account-popover .el-tree {
  max-height: 300px;
  overflow-y: auto;
}

.account-popover .el-tree-node__content {
  height: auto;
  padding: 8px 0;
}

.account-buttons {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
}

/* 收入账户按钮样式 */
.income-account-btn {
  background-color: #67c23a;
  border-color: #67c23a;
  color: white;
  width: 100%;
}

.income-account-btn:hover {
  background-color: #85ce61;
  border-color: #85ce61;
}

/* 支出账户按钮样式 */
.expense-account-btn {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
  width: 100%;
}

.expense-account-btn:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.custom-date-picker {
  margin-bottom: 10px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .time-panel,
  .account-panel {
    max-width: 200px;
    width: fit-content;
  }
}

@media (max-width: 992px) {
  /* 响应式设计 */
  .floating-panel {
    position: static;
    margin: 10px 0;
    width: 100%;
    max-width: 100%;
  }

  /* 在小屏幕上重置转换 */
  .time-panel,
  .account-panel {
    transform: none;
    top: auto;
    left: auto;
    right: auto;
  }

  .main-content {
    padding: 10px;
  }
  
  .trend-chart {
    height: 350px;
  }
}

.chart {
  width: 100%;
  height: 400px;
}

/* 表格区域样式 */
.table-card {
  transition: transform 0.2s;
}

.table-card:hover {
  transform: translateY(-2px);
}

.table-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }
  
  .date-picker {
    width: 100%;
  }
  
  .type-select,
  .category-select {
    flex: 1;
    min-width: 120px;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .chart {
    height: 300px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1600px) {
  .overview-container {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .trend-chart {
    height: 550px; /* 大屏幕上收支趋势图表更高 */
  }
  
  .category-chart {
    height: 500px; /* 大屏幕上支出分类图表也相应增高 */
  }
  
  .filter-container {
    justify-content: space-between;
  }
  
  .date-picker {
    width: 350px;
  }
  
  .type-select,
  .category-select {
    width: 180px;
  }
}

/* 账户选择器样式 */
.account-popover .el-tree {
  max-height: 300px;
  overflow-y: auto;
}
</style>

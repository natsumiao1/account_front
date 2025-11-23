<template>
  <div class="floating-panel right right-panel" :class="{ 'collapsed': !accountPanelVisible }">
    <div class="panel-header">
      <div v-if="accountPanelVisible" class="panel-title">账户选择</div>
      <el-button size="small" type="text" class="collapse-btn" @click="toggleVisibility">
        <el-icon v-if="accountPanelVisible"><ArrowRight /></el-icon>
        <el-icon v-else><ArrowLeft /></el-icon>
      </el-button>
    </div>
    <transition name="slide">
      <div v-if="accountPanelVisible" key="account-content">
        <div class="account-group">
          <div class="control-label">收入账户</div>
          <el-popover
            placement="top-start"
            width="250"
            trigger="click"
            :visible="incomeAccountPopoverVisible"
            @update:visible="handleIncomePopoverUpdate"
            popper-class="account-popover"
          >
            <template #reference>
              <el-button type="primary" class="account-select-btn">选择账户</el-button>
            </template>
            <div style="max-height: 300px; overflow-y: auto;">
              <el-tree
                :data="incomeAccountTree"
                show-checkbox
                node-key="id"
                :check-strictly="false"
                :default-expand-all="false"
                @check-change="handleIncomeCheckChange"
                ref="incomeTreeRef"
                style="width: 100%;"
              >
                <template #default="{ node, data }">
                  <span class="custom-tree-node">
                    <span>{{ node.label }}</span>
                  </span>
                </template>
              </el-tree>
            </div>
            <div class="tree-controls">
              <el-button size="small" @click="handleSelectAllIncome">全选</el-button>
              <el-button type="primary" size="small" @click="handleCloseIncomePopover">确定</el-button>
            </div>
          </el-popover>
        </div>
        
        <div class="account-group">
          <div class="control-label">支出账户</div>
          <el-popover
            placement="top-start"
            width="250"
            trigger="click"
            :visible="expenseAccountPopoverVisible"
            @update:visible="handleExpensePopoverUpdate"
            popper-class="account-popover"
          >
            <template #reference>
              <el-button type="primary" class="account-select-btn">选择账户</el-button>
            </template>
            <div style="max-height: 300px; overflow-y: auto;">
              <el-tree
                :data="expenseAccountTree"
                show-checkbox
                node-key="id"
                :check-strictly="false"
                :default-expand-all="false"
                @check-change="handleExpenseCheckChange"
                ref="expenseTreeRef"
                style="width: 100%;"
              >
                <template #default="{ node, data }">
                  <span class="custom-tree-node">
                    <span>{{ node.label }}</span>
                  </span>
                </template>
              </el-tree>
            </div>
            <div class="tree-controls">
              <el-button size="small" @click="handleSelectAllExpense">全选</el-button>
              <el-button type="primary" size="small" @click="handleCloseExpensePopover">确定</el-button>
            </div>
          </el-popover>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue'

// 树组件引用
const incomeTreeRef = ref(null)
const expenseTreeRef = ref(null)

// 定义props并添加数据验证和日志
const props = defineProps({
  accountPanelVisible: {
    type: Boolean,
    default: true
  },
  expenseAccountTree: {
    type: Array,
    default: () => []
  },
  incomeAccountTree: {
    type: Array,
    default: () => []
  },
  expenseAccountPopoverVisible: {
    type: Boolean,
    default: false
  },
  incomeAccountPopoverVisible: {
    type: Boolean,
    default: false
  }
})

// 监听账户树数据变化，记录日志
import { watch } from 'vue'

watch(() => props.incomeAccountTree, (newVal) => {
  console.log('收入账户树数据更新:', JSON.stringify(newVal, null, 2));
  console.log('收入账户树节点数量:', countNodes(newVal));
  console.log('收入账户树层级深度:', getTreeDepth(newVal));
}, { deep: true })

watch(() => props.expenseAccountTree, (newVal) => {
  console.log('支出账户树数据更新:', JSON.stringify(newVal, null, 2));
  console.log('支出账户树节点数量:', countNodes(newVal));
  console.log('支出账户树层级深度:', getTreeDepth(newVal));
}, { deep: true })

// 计算树的节点数量
function countNodes(nodes) {
  let count = 0;
  if (nodes && Array.isArray(nodes)) {
    nodes.forEach(node => {
      count++;
      if (node.children && node.children.length > 0) {
        count += countNodes(node.children);
      }
    });
  }
  return count;
}

// 计算树的深度
function getTreeDepth(nodes, currentDepth = 1) {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return 0;
  }
  
  let maxDepth = currentDepth;
  nodes.forEach(node => {
    if (node.children && node.children.length > 0) {
      const childDepth = getTreeDepth(node.children, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  });
  
  return maxDepth;
}

// 定义emits
const emit = defineEmits([
  'toggle-panel', 
  'update-expense-popover', 
  'update-income-popover', 
  'handle-expense-check', 
  'handle-income-check',
  'confirm-income-selection',
  'confirm-expense-selection'
])

// 方法
const toggleVisibility = () => {
  emit('toggle-panel')
}

// 处理收入账户选择变化
const handleIncomeCheckChange = (data, checked, indeterminate) => {
  console.log('收入账户选择变化:', { node: data.label, id: data.id, checked, indeterminate });
  // 获取当前所有选中的节点
  if (incomeTreeRef.value) {
    const allCheckedKeys = incomeTreeRef.value.getCheckedKeys();
    const allHalfCheckedKeys = incomeTreeRef.value.getHalfCheckedKeys();
    console.log('当前收入账户选中状态 - 完全选中:', allCheckedKeys, '半选中:', allHalfCheckedKeys);
  }
  emit('handle-income-check', data, checked, indeterminate)
}

// 处理支出账户选择变化
const handleExpenseCheckChange = (data, checked, indeterminate) => {
  console.log('支出账户选择变化:', { node: data.label, id: data.id, checked, indeterminate });
  // 获取当前所有选中的节点
  if (expenseTreeRef.value) {
    const allCheckedKeys = expenseTreeRef.value.getCheckedKeys();
    const allHalfCheckedKeys = expenseTreeRef.value.getHalfCheckedKeys();
    console.log('当前支出账户选中状态 - 完全选中:', allCheckedKeys, '半选中:', allHalfCheckedKeys);
  }
  emit('handle-expense-check', data, checked, indeterminate)
}

// 获取所有叶子节点ID的函数
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

// 在组件内部实现全选功能
const handleSelectAllIncome = () => {
  if (incomeTreeRef.value && props.incomeAccountTree.length > 0) {
    const allLeafIds = getAllLeafNodeIds(props.incomeAccountTree)
    console.log('执行收入账户全选 - 叶子节点数量:', allLeafIds.length, '叶子节点IDs:', allLeafIds)
    incomeTreeRef.value.setCheckedKeys(allLeafIds)
  }
}

// 在组件内部实现全选功能
const handleSelectAllExpense = () => {
  if (expenseTreeRef.value && props.expenseAccountTree.length > 0) {
    const allLeafIds = getAllLeafNodeIds(props.expenseAccountTree)
    console.log('执行支出账户全选 - 叶子节点数量:', allLeafIds.length, '叶子节点IDs:', allLeafIds)
    expenseTreeRef.value.setCheckedKeys(allLeafIds)
  }
}

// 关闭收入账户弹窗
const handleCloseIncomePopover = () => {
  // 获取选中的账户ID
  const checkedKeys = incomeTreeRef.value ? incomeTreeRef.value.getCheckedKeys(true) : []
  console.log('确认收入账户选择 - 选中的叶子节点:', checkedKeys);
  
  // 获取所有选中的节点(包括父节点)
  const allCheckedKeys = incomeTreeRef.value ? incomeTreeRef.value.getCheckedKeys(false) : [];
  console.log('确认收入账户选择 - 所有选中节点(包括父节点):', allCheckedKeys);
  
  // 传递选中的账户信息给父组件
  emit('confirm-income-selection', checkedKeys)
  emit('update-income-popover', false)
}

// 关闭支出账户弹窗
const handleCloseExpensePopover = () => {
  // 获取选中的账户ID
  const checkedKeys = expenseTreeRef.value ? expenseTreeRef.value.getCheckedKeys(true) : []
  console.log('确认支出账户选择 - 选中的叶子节点:', checkedKeys);
  
  // 获取所有选中的节点(包括父节点)
  const allCheckedKeys = expenseTreeRef.value ? expenseTreeRef.value.getCheckedKeys(false) : [];
  console.log('确认支出账户选择 - 所有选中节点(包括父节点):', allCheckedKeys);
  
  // 传递选中的账户信息给父组件
  emit('confirm-expense-selection', checkedKeys)
  emit('update-expense-popover', false)
}

// 处理收入账户弹窗可见性更新
const handleIncomePopoverUpdate = (visible) => {
  emit('update-income-popover', visible)
}

// 处理支出账户弹窗可见性更新
const handleExpensePopoverUpdate = (visible) => {
  emit('update-expense-popover', visible)
}
</script>

<style scoped>
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

.floating-panel.right {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  min-width: min-content;
  max-width: 240px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  flex: 1;
  text-align: center;
  margin: 0;
}

.collapse-btn {
  padding: 4px;
  min-width: unset;
}

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

.account-group {
  margin-bottom: 20px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 5px;
}

.account-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 账户选择弹窗样式 */
:deep(.account-popover) {
  max-height: calc(100vh - 100px);
  overflow: visible;
}

/* 树形控件样式优化 */
:deep(.el-tree) {
  font-size: 14px;
}

:deep(.el-tree-node) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
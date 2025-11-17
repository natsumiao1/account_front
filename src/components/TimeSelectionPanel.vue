<template>
  <div class="floating-panel left left-panel" :class="{ 'collapsed': !isVisible }">
    <div class="panel-header">
      <div v-if="isVisible" class="panel-title">时间选择</div>
      <el-button size="small" type="text" class="collapse-btn" @click="toggleVisibility">
        <el-icon v-if="isVisible"><ArrowLeft /></el-icon>
        <el-icon v-else><ArrowRight /></el-icon>
      </el-button>
    </div>
    <transition name="slide">
      <div v-if="isVisible" key="time-content">
        <div class="time-controls-group">
          <div class="control-label">时间范围</div>
          <div class="radio-controls">
            <el-radio-group v-model="localTimeRange" size="small" @change="handleTimeRangeChange" class="vertical-radio-group">
              <el-radio-button label="7d">最近7天</el-radio-button>
              <el-radio-button label="30d">最近30天</el-radio-button>
              <el-radio-button label="3m">最近3个月</el-radio-button>
              <el-radio-button label="1y">最近1年</el-radio-button>
              <el-popover
                placement="right"
                trigger="click"
                popper-class="custom-date-popover"
              >
                <template #reference>
                  <el-radio-button label="custom">自定义</el-radio-button>
                </template>
                <el-date-picker
                  v-model="localCustomDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  @change="handleDateRangeChange"
                />
              </el-popover>
            </el-radio-group>
          </div>
          <div class="control-label">时间尺度</div>
          <div class="radio-controls">
            <el-radio-group v-model="localTimeScale" size="small" @change="handleTimeScaleChange" class="vertical-radio-group">
              <el-radio-button label="day">按天</el-radio-button>
              <el-radio-button label="week">按周</el-radio-button>
              <el-radio-button label="month">按月</el-radio-button>
              <el-radio-button label="quarter">按季度</el-radio-button>
              <el-radio-button label="year">按年</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

// 定义props
const props = defineProps({
  timePanelVisible: {
    type: Boolean,
    default: true
  },
  timeRange: {
    type: String,
    default: '3m'
  },
  timeScale: {
    type: String,
    default: 'month'
  }
})

// 定义emits
const emit = defineEmits(['toggle-panel', 'update-time-range', 'update-trend-chart'])

// 本地状态
const localTimeRange = ref(props.timeRange)
const localTimeScale = ref(props.timeScale)
const localCustomDateRange = ref([])

// 计算属性，连接props和模板
const isVisible = computed(() => props.timePanelVisible)

// 方法
const toggleVisibility = () => {
  emit('toggle-panel')
}

const handleTimeRangeChange = () => {
  emit('update-time-range', localTimeRange.value)
  // 无论是否为自定义范围，都触发更新，确保图表正确显示
  emit('update-trend-chart')
}

const handleTimeScaleChange = () => {
  emit('update-trend-chart')
}

const handleDateRangeChange = () => {
  if (localCustomDateRange.value && localCustomDateRange.value.length === 2) {
    emit('update-trend-chart')
  }
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

.floating-panel.left {
  top: 50%;
  left: 0;
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

.time-controls-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 5px;
}

.radio-controls {
  margin-bottom: 10px;
}

.vertical-radio-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
    .slide-leave-to {
      transform: translateX(-100%);
      opacity: 0;
    }
    
    /* 直接针对弹出框div元素的样式 */
    .el-popper.custom-date-popover {
      width: auto !important;
      min-width: 300px !important; /* 设置最小宽度确保覆盖 */
      padding: 0 !important;
      box-sizing: border-box !important;
      border-radius: 6px !important;
    }
    
    /* 确保日期编辑器容器能正确显示 */
    .el-popper.custom-date-popover .el-date-editor--daterange {
      width: auto !important;
      min-width: 300px !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      border: 1px solid #dcdfe6 !important; /* 添加边框确保可见性 */
    }
    
    /* 确保输入框正确排列 */
    .el-popper.custom-date-popover .el-date-editor--daterange .el-range-input {
      width: 120px !important;
      box-sizing: border-box !important;
    }
    
    /* 确保分隔符正确显示 */
    .el-popper.custom-date-popover .el-date-editor--daterange .el-range-separator {
      padding: 0 5px !important;
    }
</style>
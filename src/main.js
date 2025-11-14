import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// 导入Element Plus组件库
import ElementPlus from 'element-plus'
// 导入Element Plus样式
import 'element-plus/dist/index.css'
// 导入Element Plus图标库
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 创建应用实例
const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册所有图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')

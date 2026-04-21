/// <reference types="vite/client" />

// 声明 .vue 单文件组件模块，使 TypeScript/编辑器能正确识别 Vue 组件的导入
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 声明 Vite 的 ?raw 查询导入，使 TypeScript/编辑器能识别以原始字符串方式导入的文件
declare module '*?raw' {
  const content: string
  export default content
}

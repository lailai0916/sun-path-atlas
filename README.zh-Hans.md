<div align="center">
  <h1>太阳路径图谱</h1>
  <p><a href="README.md">English</a> | 简体中文</p>
  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/lailai0916/sun-path-atlas/deploy.yml?style=flat-square" alt="部署状态" />
    <img src="https://img.shields.io/github/last-commit/lailai0916/sun-path-atlas?style=flat-square" alt="最后提交" />
    <img src="https://img.shields.io/github/languages/top/lailai0916/sun-path-atlas?style=flat-square" alt="主要语言" />
    <img src="https://img.shields.io/github/repo-size/lailai0916/sun-path-atlas?style=flat-square" alt="仓库大小" />
    <img src="https://img.shields.io/github/license/lailai0916/sun-path-atlas?style=flat-square" alt="许可证" />
  </p>
</div>

## 网站简介

面向建筑与户外规划的浏览器太阳路径计算器。选择地点、日期、时间与时区后，可在 2D 或
3D 视图中检查太阳几何，对比全年路径，并导出结果。

## 网站特性

☀️ **太阳几何** —— 使用可读的 NOAA 风格简化公式，计算高度角、方位角、日出、日落、
太阳正午、日长与曙暮光带。

🌍 **地图输入** —— 在世界地图上点选坐标，或直接输入经纬度与明确的时区偏移。

📊 **单日与全年视图** —— 检查某日轨迹，或比较全年代表月份的太阳路径。

🧭 **2D 与 3D 图表** —— 使用极坐标图，或旋转、缩放 Three.js 天球。

🖼️ **确定性导出** —— 将当前图表保存为 SVG 或高分辨率 PNG。

🌐 **双语界面** —— 默认使用英文，并完整支持简体中文。

## 快速开始

```bash
git clone https://github.com/lailai0916/sun-path-atlas.git
cd sun-path-atlas
npm install
npm run dev
```

发布改动前运行：

```bash
npm run lint
npm run build
```

## 计算范围

模型计算时间方程、太阳赤纬、时角、高度角与方位角。日出和日落使用太阳中心高度
$-0.833°$；民用、航海与天文曙暮光分别使用 $-6°$、$-12°$ 与 $-18°$。

结果为近似值，与高精度星历可能相差数十秒。除日出和日落定义外，模型不计算大气折射，
也不包含地形与局部地平线遮挡；极圈边界附近更敏感。公式与限制见
[太阳计算说明](docs/about.md)。

## 项目结构

```bash
sun-path-atlas/
├── src/
│   ├── components/                 # 控件、图表、地图与统计
│   ├── modules/                    # 太阳计算、导出与 i18n
│   ├── App.tsx                     # 应用组合
│   ├── index.css                   # 主题与响应式布局
│   └── main.tsx                    # React 入口
├── docs/about.md                   # 公式、定义与限制
├── public/                         # 静态资源
├── index.html                      # 应用入口页面
├── package-lock.json               # 依赖锁定文件
├── package.json                    # 依赖配置
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 配置
└── LICENSE                         # 代码许可协议
```

## 许可协议

本项目代码采用 [MIT 许可协议](LICENSE)。

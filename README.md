# LoveTrack · 足迹地图

情侣 / 朋友 / 家人共享足迹与记录。**线上地址（推荐直接使用）：** [https://lovetrack2.vercel.app](https://lovetrack2.vercel.app)

---

## 功能简介

- **关系空间**：情侣、朋友、家人三种模式，各自独立地图与配色。  
- **打卡足迹**：地图 + 列表联动；支持地址搜索、经纬度选点、扫码；图钉光晕与缩放聚合。  
- **数据记录**：文字与附件（图片/文件），支持筛选、排序、导出 CSV；数据与**登录账号**绑定，存在服务器数据库。  
- **账号**：邮箱注册 / 登录；换设备用同一账号即可同步云端数据。  
- **足迹云端快照**：登录后足迹会同步到账号（编辑后自动上传，也可使用页内「云同步」）。  
- **主题与多端**：深/浅色主题，响应式布局，手机浏览器即可使用。

---

## 别人怎么用（访客说明）

1. 打开 **https://lovetrack2.vercel.app**  
2. 首次使用请先 **注册**（右上角入口或跳转后的注册页），使用**常用邮箱**和**至少 8 位密码**。  
3. **登录**后：  
   - **足迹地图**：切换空间、时间筛选、地图/列表、右下角「+」添加打卡。  
   - **数据记录**：顶部导航进入，可新建记录、筛选排序、导出 CSV。  
4. **退出**：右上角 **退出**。

> 仅需浏览器，**无需**安装 App 或配置开发环境。

---

## 开发与部署（贡献者）

**技术栈：** Next.js 16 · React 19 · TypeScript · Tailwind · MapLibre · Dexie · NextAuth · Neon (Postgres)

```bash
git clone https://github.com/chenzhi123/LoveTrack2.git
cd LoveTrack2
npm install
```

本地环境变量参考仓库根目录 **`.env.example`**。使用 Vercel 时可在项目目录执行：

```bash
vercel env pull .env.local
```

启动开发服务：

```bash
npm run dev
```

**GitHub ↔ Vercel：** 本仓库已与 Vercel 项目关联；向 **`main`** 分支 **push** 后会触发自动构建与生产部署（以 Vercel 控制台显示为准）。

---

## 许可证

按仓库所有者约定使用；欢迎 Issue / PR 改进体验。

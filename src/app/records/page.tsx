import { RecordsApp } from "./records-app";

export const metadata = {
  title: "数据记录 · LoveTrack",
  description: "文本与文件记录、筛选排序与导出",
};

export default function RecordsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">数据记录中心</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          支持文本与附件；已连接数据库时自动多端同步并定时刷新列表。
        </p>
      </div>
      <RecordsApp />
    </div>
  );
}

import { DashboardView } from "@/components/dashboard-view";
import { ScanForm } from "@/components/scan-form";
import { useAuth } from "@/hooks/use-auth";
import { Shield, BarChart2, FileText, Settings, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen">
      {/* サイドナビゲーション */}
      <div className="w-64 bg-slate-800 text-white p-4">
        <div className="flex items-center mb-8">
          <Shield className="h-8 w-8 text-blue-400" />
          <h1 className="ml-2 text-xl font-bold">AppSafeguard</h1>
        </div>

        <nav>
          <ul>
            <li className={`mb-2 p-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
                onClick={() => setActiveTab('dashboard')}>
              <button className="flex items-center w-full text-left">
                <BarChart2 className="mr-2 h-5 w-5" />
                <span>ダッシュボード</span>
              </button>
            </li>
            <li className={`mb-2 p-2 rounded ${activeTab === 'reports' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
                onClick={() => setActiveTab('reports')}>
              <button className="flex items-center w-full text-left">
                <FileText className="mr-2 h-5 w-5" />
                <span>レポート</span>
              </button>
            </li>
            <li className={`mb-2 p-2 rounded ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
                onClick={() => setActiveTab('settings')}>
              <button className="flex items-center w-full text-left">
                <Settings className="mr-2 h-5 w-5" />
                <span>設定</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-auto">
        {/* ヘッダー */}
        <header className="bg-white p-4 shadow flex justify-between items-center">
          <h2 className="text-xl font-semibold">セキュリティダッシュボード</h2>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-4">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="ml-2">{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DashboardView />
            </div>
            <div>
              <ScanForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
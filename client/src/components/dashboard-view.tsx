import { useQuery } from "@tanstack/react-query";
import type { Scan } from "@shared/schema";
import { AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function DashboardView() {
  const { toast } = useToast();
  const { data: scans, isLoading } = useQuery<Scan[]>({
    queryKey: ["/api/scans"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const completedScans = scans?.filter((scan) => scan.status === "complete") || [];
  const latestScan = completedScans[0];
  
  const totalVulnerabilities = completedScans.reduce((acc, scan) => {
    return acc + (scan.results?.vulnerabilities.length || 0);
  }, 0);

  const averageScore = completedScans.length > 0
    ? completedScans.reduce((acc, scan) => acc + (scan.results?.score || 0), 0) / completedScans.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              平均リスクスコア
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}/100</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              検出された脆弱性
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVulnerabilities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              実行されたスキャン
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedScans.length}</div>
          </CardContent>
        </Card>
      </div>

      {latestScan && latestScan.results && (
        <Card>
          <CardHeader>
            <CardTitle>最新のスキャン結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestScan.results.vulnerabilities.map((vuln, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    vuln.severity === "high"
                      ? "bg-red-50 border-red-200"
                      : vuln.severity === "medium"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{vuln.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        vuln.severity === "high"
                          ? "bg-red-500"
                          : vuln.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      } text-white`}
                    >
                      {vuln.severity}
                    </span>
                  </div>
                  <p className="text-sm mt-2">{vuln.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    場所: {vuln.location}
                  </div>
                  <Button
                    variant="link"
                    className="px-0 mt-2"
                    onClick={() => {
                      toast({
                        title: "修正ガイド",
                        description: vuln.remediation,
                      });
                    }}
                  >
                    修正ガイドを表示
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

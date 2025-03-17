import { useQuery, useMutation } from "@tanstack/react-query";
import type { CustomRule } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, AlertTriangle, FileText, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function CustomRulesList() {
  const { toast } = useToast();
  const { data: rules, isLoading } = useQuery<CustomRule[]>({
    queryKey: ["/api/custom-rules"],
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/custom-rules/${id}`, { isEnabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-rules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/custom-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-rules"] });
      toast({
        title: "ルールを削除しました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>カスタムルール一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rules?.map((rule) => (
            <div
              key={rule.id}
              className="p-4 rounded-lg border bg-card"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {rule.severity === "high" ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : rule.severity === "medium" ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <h3 className="font-semibold">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isEnabled}
                    onCheckedChange={(checked) =>
                      toggleRuleMutation.mutate({ id: rule.id, isEnabled: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    パターン
                  </div>
                  <code className="text-xs bg-muted p-1 rounded">{rule.pattern}</code>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Settings className="h-4 w-4" />
                    カテゴリ
                  </div>
                  <span>{rule.category}</span>
                </div>
              </div>
            </div>
          ))}

          {(!rules || rules.length === 0) && (
            <div className="text-center text-muted-foreground">
              カスタムルールがまだ作成されていません
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

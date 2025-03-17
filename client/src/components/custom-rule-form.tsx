import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomRuleSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CustomRuleForm() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertCustomRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      pattern: "",
      severity: "medium",
      category: "content",
      remediation: "",
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const res = await apiRequest("POST", "/api/custom-rules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-rules"] });
      toast({
        title: "カスタムルールを作成しました",
        description: "新しいスキャンルールが追加されました。",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createRuleMutation.mutate(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>新しいカスタムルールを作成</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ルール名</FormLabel>
                  <FormControl>
                    <Input placeholder="SQLインジェクション検出" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="このルールはSQLインジェクションの脆弱性を検出します。"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>検出パターン</FormLabel>
                  <FormControl>
                    <Input placeholder="(select|insert|update|delete).*from" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>重要度</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="重要度を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">重大</SelectItem>
                      <SelectItem value="medium">警告</SelectItem>
                      <SelectItem value="low">注意</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カテゴリ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="header">ヘッダー</SelectItem>
                      <SelectItem value="form">フォーム</SelectItem>
                      <SelectItem value="content">コンテンツ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remediation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>修正ガイド</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="1. プリペアドステートメントを使用する。
2. 入力値のバリデーションを実装する。"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createRuleMutation.isPending}
            >
              ルールを作成
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

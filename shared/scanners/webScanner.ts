import axios from 'axios';
import * as cheerio from 'cheerio';

// 軽量セキュリティスキャナーの実装
export async function scan(url: string) {
  const results = {
    vulnerabilities: [] as Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      name: string;
      description: string;
      location: string;
      remediation: string;
    }>,
    score: 0,
    scannedAt: new Date().toISOString(),
  };

  try {
    // 基本的なHTTPヘッダーチェック
    const response = await axios.get(url);
    const headers = response.headers;

    // セキュリティヘッダーのチェック
    if (!headers['content-security-policy']) {
      results.vulnerabilities.push({
        type: 'missing_header',
        severity: 'medium' as const,
        name: 'Content-Security-Policyヘッダーの不在',
        description: 'Content-Security-Policyヘッダーが設定されていません。これによりXSS攻撃のリスクが高まる可能性があります。',
        location: url,
        remediation: '実行可能なスクリプトのソースを制限するために、Content-Security-Policyヘッダーを追加してください。'
      });
    }

    if (!headers['x-xss-protection']) {
      results.vulnerabilities.push({
        type: 'missing_header',
        severity: 'low' as const,
        name: 'X-XSS-Protectionヘッダーの不在',
        description: 'X-XSS-Protectionヘッダーが設定されていません。古いブラウザでXSS攻撃のリスクが高まる可能性があります。',
        location: url,
        remediation: '"1; mode=block"の値でX-XSS-Protectionヘッダーを追加してください。'
      });
    }

    // HTMLの解析
    const $ = cheerio.load(response.data);

    // パスワードフィールドがHTTPSで保護されているかチェック
    if (url.startsWith('http:') && $('input[type="password"]').length > 0) {
      results.vulnerabilities.push({
        type: 'insecure_form',
        severity: 'high' as const,
        name: '非HTTPS上のパスワードフォーム',
        description: '非HTTPS（暗号化されていない）ページでパスワード入力フィールドが検出されました。',
        location: url,
        remediation: 'ログインや会員登録フォームを含むすべてのページでHTTPSを使用してください。'
      });
    }

    // スコア計算（単純な実装）
    const severityScores = {
      'low': 1,
      'medium': 2,
      'high': 3
    } as const;

    const totalSeverity = results.vulnerabilities.reduce((total, vuln) => total + severityScores[vuln.severity], 0);
    const maxPossibleScore = 10; // 10点満点
    results.score = Math.max(0, 100 - (totalSeverity * 10));

    return results;
  } catch (error) {
    console.error('スキャンエラー:', error);
    if (error instanceof Error) {
      throw new Error(`URLのスキャンに失敗しました: ${error.message}`);
    }
    throw new Error('URLのスキャンに失敗しました: 不明なエラー');
  }
}
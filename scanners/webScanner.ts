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
        severity: 'medium',
        name: 'Content-Security-Policy Missing',
        description: 'The Content-Security-Policy header is not set, which can lead to XSS vulnerabilities.',
        location: url,
        remediation: 'Add a Content-Security-Policy header to restrict the sources of executable scripts.'
      });
    }

    if (!headers['x-xss-protection']) {
      results.vulnerabilities.push({
        type: 'missing_header',
        severity: 'low',
        name: 'X-XSS-Protection Missing',
        description: 'The X-XSS-Protection header is not set, which can lead to XSS vulnerabilities in older browsers.',
        location: url,
        remediation: 'Add the X-XSS-Protection header with a value of "1; mode=block".'
      });
    }

    // HTMLの解析
    const $ = cheerio.load(response.data);

    // パスワードフィールドがHTTPSで保護されているかチェック
    if (url.startsWith('http:') && $('input[type="password"]').length > 0) {
      results.vulnerabilities.push({
        type: 'insecure_form',
        severity: 'high',
        name: 'Password Form on HTTP',
        description: 'Password input field detected on a non-HTTPS page.',
        location: url,
        remediation: 'Use HTTPS for all pages containing login or registration forms.'
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
    console.error('Scan error:', error);
    throw new Error(`Failed to scan URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}
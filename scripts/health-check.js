import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    // 掃描目錄
    targetDirs: ['./components', './services', './hooks', '.'],
    // 排除目錄
    exclude: ['node_modules', '.git', '.next', 'dist', 'build', '.agent', 'scripts'],
    // 警示閾值
    thresholds: {
        fileLines: 400,        // 檔案超過 400 行視為過大
        componentProps: 15,    // Props 超過 15 個視為過於複雜
        stateCount: 10,        // useState 超過 10 個視為狀態臃腫
        complexityScore: 50    // 綜合複雜度分數
    }
};

const report = {
    timestamp: new Date().toISOString(),
    summary: {
        totalFiles: 0,
        bloatedFiles: [],
        complexComponents: [],
        heavyStates: []
    },
    details: []
};

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const lineCount = lines.length;

    // 基本分析
    const stateCount = (content.match(/useState\(/g) || []).length;
    const effectCount = (content.match(/useEffect\(/g) || []).length;
    const todoCount = (content.match(/\/\/\s*TODO/g) || []).length + (content.match(/\/\/\s*FIXME/g) || []).length;

    // 簡單估算 Props 數量 (尋找 React.FC<Props>)
    let propsCount = 0;
    const interfaceMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
    if (interfaceMatch) {
        propsCount = interfaceMatch[1].split('\n').filter(l => l.trim() && !l.trim().startsWith('//')).length;
    }

    const complexityScore = (lineCount * 0.1) + (stateCount * 2) + (effectCount * 3) + (propsCount * 1);

    const fileStat = {
        path: filePath,
        lines: lineCount,
        stateCount,
        effectCount,
        propsCount,
        todoCount,
        score: Math.round(complexityScore)
    };

    if (lineCount > CONFIG.thresholds.fileLines) {
        report.summary.bloatedFiles.push({ path: filePath, lines: lineCount });
    }
    if (stateCount > CONFIG.thresholds.stateCount) {
        report.summary.heavyStates.push({ path: filePath, count: stateCount });
    }

    return fileStat;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // 檢查排除清單
        if (CONFIG.exclude.some(ex => filePath.includes(ex))) return;

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            // 只分析 TypeScript 相關檔案
            if (file.endsWith('.d.ts')) return;

            report.summary.totalFiles++;
            const fileAnalysis = analyzeFile(filePath);
            report.details.push(fileAnalysis);
        }
    });
}

console.log('🔍 Starting System Health Check...');
CONFIG.targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        walkDir(dir);
    }
});

// 排序找出最需要優化的檔案
report.details.sort((a, b) => b.score - a.score);

// 輸出報告
const reportPath = 'system_health_report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('✅ Health Check Complete!');
console.log(`📊 Total Files Scanned: ${report.summary.totalFiles}`);
console.log(`⚠️  Bloated Files (> ${CONFIG.thresholds.fileLines} lines): ${report.summary.bloatedFiles.length}`);
console.log(`⚠️  Complex State Components: ${report.summary.heavyStates.length}`);
console.log(`📄 Report saved to: ${reportPath}`);

// 顯示前 3 名最需要優化的檔案
console.log('\nTop 3 Candidates for Optimization:');
report.details.slice(0, 3).forEach((f, i) => {
    console.log(`${i + 1}. ${f.path} (Score: ${f.score}) - Lines: ${f.lines}, States: ${f.stateCount}`);
});

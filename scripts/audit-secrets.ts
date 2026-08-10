import fs from 'fs'
import path from 'path'

const SECRET_PATTERNS = [
  { name: 'Hardcoded Database Password', regex: /postgresql:\/\/[^:]+:([^@]+)@/i },
  { name: 'Hardcoded API Secret/Key', regex: /api[_-]?secret\s*=\s*['"][^'"]+['"]/i },
  { name: 'Hardcoded Bearer Token', regex: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/i },
  { name: 'Private Key PEM', regex: /-----BEGIN PRIVATE KEY-----/i },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
]

const IGNORE_DIRS = ['node_modules', '.next', '.git', '.vercel', 'dist']

function scanDirectory(dirPath: string): { file: string; line: number; type: string }[] {
  const issues: { file: string; line: number; type: string }[] = []

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name)) {
        issues.push(...scanDirectory(fullPath))
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|json|md)$/i.test(entry.name)) {
      if (entry.name.includes('.env') || entry.name.includes('audit-secrets')) continue

      const content = fs.readFileSync(fullPath, 'utf8')
      const lines = content.split('\n')

      lines.forEach((line, index) => {
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(line)) {
            issues.push({ file: fullPath, line: index + 1, type: pattern.name })
          }
        }
      })
    }
  }

  return issues
}

console.log('🔍 Executando Auditoria Automática de Segredos e Senhas no Código...')
const rootDir = process.cwd()
const foundIssues = scanDirectory(rootDir)

if (foundIssues.length > 0) {
  console.error('\n❌ ERRO DE SEGURANÇA: Encontradas senhas/chaves no código fonte!')
  foundIssues.forEach((issue) => {
    console.error(`  - [${issue.type}] em ${issue.file}:${issue.line}`)
  })
  process.exit(1)
} else {
  console.log('✅ AUDITORIA CONCLUÍDA COM SUCESSO: 0 senhas ou credenciais no código fonte!')
}

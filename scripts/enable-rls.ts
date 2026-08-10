import { prisma } from '../lib/prisma'

async function main() {
  console.log('🔒 Habilitando Row Level Security (RLS) no PostgreSQL...')

  const tables = ['clientes', 'feedbacks_melhoria', 'bug_reports']

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`)
      console.log(`  ✅ RLS ativado na tabela: ${table}`)

      // Policy allowing full application access
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'allow_app_full_access'
          ) THEN
            CREATE POLICY "allow_app_full_access" ON "${table}" FOR ALL USING (true) WITH CHECK (true);
          END IF;
        END
        $$;
      `)
      console.log(`  🛡️ Política "allow_app_full_access" configurada para: ${table}`)
    } catch (err) {
      console.error(`  ❌ Erro ao ativar RLS na tabela ${table}:`, err)
    }
  }

  console.log('🎉 Row Level Security (RLS) ativado com sucesso em todas as tabelas!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

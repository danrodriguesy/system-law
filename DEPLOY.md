# 📋 Guia de Deploy - Legal Flow Studio

## Problema: Erro "Not Found" e Erro ao Salvar Dados

### ✅ Passo 1: Variáveis de Ambiente na Vercel

O arquivo `.env` **NÃO** é enviado para o Git/GitHub por segurança. Você precisa configurar manualmente:

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Vá até o seu projeto `legal-flow-studio`
3. Clique em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=https://fkwdyzbtsntbqadhvbuz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2R5emJ0c250YnFhZGh2YnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzI0NDksImV4cCI6MjA5MDQ0ODQ0OX0.m3Xw9Ab09vas5Iqz8Dz6_CYKZLF_qS7MsneTYHcTTtM
```

5. Após adicionar, clique em **Redeploy** para aplicar as mudanças

---

### ✅ Passo 2: Rodar Migrations no Supabase

As tabelas precisam existir no seu banco de dados Supabase:

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto: `fkwdyzbtsntbqadhvbuz`
3. Vá para **SQL Editor** → **New Query**
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20260330191450_917cb9ce-76cf-42a5-ba22-61c9767d5266.sql`
5. Clique em **Run** para executar

**OU** use o CLI do Supabase:

```bash
cd /Users/mac/Documents/projetos/legal-flow-studio
npx supabase db push
```

---

### ✅ Passo 3: Verificar RLS (Row Level Security)

As políticas de RLS já estão configuradas no migration, mas verifique:

1. No Supabase Dashboard, vá para **Authentication** → **Policies**
2. Verifique se todas as tabelas têm políticas para:
   - `SELECT` (ler)
   - `INSERT` (criar)
   - `UPDATE` (atualizar)
   - `DELETE` (deletar)

Todas as políticas devem usar: `auth.uid() = user_id`

---

### ✅ Passo 4: Testar Localmente com Build de Produção

Antes de deploy, teste localmente:

```bash
# Build de produção
npm run build

# Preview local
npm run preview
```

---

### ✅ Passo 5: Verificar Logs de Erro na Vercel

Se ainda houver erro:

1. Vercel Dashboard → Seu Projeto → **Deployments**
2. Clique no deployment mais recente
3. Clique em **View Build Logs**
4. Para erros em runtime: **Function Logs**

---

## Estrutura das Tabelas

| Tabela | Descrição |
|--------|-----------|
| `clientes` | Dados dos clientes |
| `juntas` | Varas/Juntas (JCJ) |
| `agenda` | Agenda de processos |
| `compromissos` | Compromissos/prazos |
| `respostas_compromisso` | Respostas dos compromissos |

---

## URLs Importantes

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Docs Vercel SPA:** https://vercel.com/docs/deployments/troubleshoot-deployments#single-page-applications

---

## Problemas Comuns

### Erro 404 ao acessar rotas
✅ Solucionado com o arquivo `vercel.json`

### Erro "relation does not exist"
✅ Execute as migrations no Supabase

### Erro "permission denied for table"
✅ Verifique as políticas de RLS no Supabase

### Erro "Invalid API key"
✅ Configure as variáveis de ambiente na Vercel

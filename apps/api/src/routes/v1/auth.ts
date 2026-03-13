import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const authRoutes = new Hono()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
    if (error) {
      return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { tenant: { include: { settings: true } } },
    })

    if (!user) {
      return c.json({ error: 'ユーザーが見つかりません' }, 401)
    }

    return c.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: 'ログインに失敗しました', detail: String(err) }, 500)
  }
})

authRoutes.post('/logout', authMiddleware, async (c) => {
  const authHeader = c.req.header('Authorization')!
  const token = authHeader.slice(7)
  await supabaseAdmin.auth.admin.signOut(token)
  return c.json({ ok: true })
})

authRoutes.get('/me', authMiddleware, async (c) => {
  const u = c.get('user')
  const user = await prisma.user.findUnique({
    where: { id: u.id },
    include: { tenant: { include: { settings: true } } },
  })
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: user.tenant.name,
    settings: user.tenant.settings,
  })
})

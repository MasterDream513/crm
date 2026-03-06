import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { supabaseAdmin } from '../lib/supabase.js'
import { prisma } from '../lib/prisma.js'

export type AuthUser = {
  id: string
  email: string
  tenantId: string
  role: 'ADMIN' | 'VIEWER'
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing authorization token' })
  }

  const token = authHeader.slice(7)

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }

  const user = await prisma.user.findFirst({
    where: { email: data.user.email!, deletedAt: null },
  })

  if (!user) {
    throw new HTTPException(401, { message: 'User not found in system' })
  }

  c.set('user', {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role as 'ADMIN' | 'VIEWER',
  })

  await next()
})

export const adminOnly = createMiddleware(async (c, next) => {
  const user = c.get('user')
  if (user.role !== 'ADMIN') {
    throw new HTTPException(403, { message: 'Admin access required' })
  }
  await next()
})

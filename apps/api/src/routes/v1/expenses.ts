import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const expenseRoutes = new Hono()
expenseRoutes.use('*', authMiddleware)

const expenseSchema = z.object({
  label: z.string().min(1),
  amountJpy: z.number().int().positive(),
  category: z.string().min(1),
  expenseDate: z.string().datetime(),
  note: z.string().optional(),
})

expenseRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const { from, to } = c.req.query()
  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(from || to
        ? {
            expenseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { expenseDate: 'desc' },
  })
  return c.json(expenses)
})

expenseRoutes.post('/', zValidator('json', expenseSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')
  const expense = await prisma.expense.create({
    data: { tenantId, ...data, expenseDate: new Date(data.expenseDate) },
  })
  return c.json(expense, 201)
})

expenseRoutes.delete('/:id', async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  await prisma.expense.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  })
  return c.json({ ok: true })
})

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware, adminOnly } from '../../middleware/auth.js'

export const productRoutes = new Hono()
productRoutes.use('*', authMiddleware)

const productSchema = z.object({
  name: z.string().min(1),
  priceJpy: z.number().int().min(0),
  category: z.enum(['LIST_ACQUISITION', 'INDIVIDUAL', 'SEMINAR', 'ONLINE_COURSE', 'SUBSCRIPTION']),
  billingType: z.enum(['ONE_TIME', 'RECURRING_MONTHLY', 'RECURRING_ANNUAL']).default('ONE_TIME'),
  isActive: z.boolean().default(true),
})

productRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: [{ category: 'asc' }, { priceJpy: 'asc' }],
  })
  return c.json(products)
})

productRoutes.post('/', adminOnly, zValidator('json', productSchema), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')
  const product = await prisma.product.create({ data: { tenantId, ...data } })
  return c.json(product, 201)
})

productRoutes.patch('/:id', adminOnly, zValidator('json', productSchema.partial()), async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const product = await prisma.product.updateMany({
    where: { id, tenantId, deletedAt: null },
    data,
  })
  if (product.count === 0) return c.json({ error: 'Not found' }, 404)
  return c.json(await prisma.product.findUnique({ where: { id } }))
})

productRoutes.delete('/:id', adminOnly, async (c) => {
  const { tenantId } = c.get('user')
  const id = c.req.param('id')
  await prisma.product.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  })
  return c.json({ ok: true })
})

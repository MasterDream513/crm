/**
 * UTAGE Webhook stub — Phase 2
 * Receives webhook POST from UTAGE on form submit / seminar registration.
 * Phase 1: logs raw payload, returns 200.
 * Phase 2: parses payload → auto-creates/updates customer + event attendance.
 */
import { Hono } from 'hono'
import { prisma } from '../../../lib/prisma.js'

export const utageWebhookRoutes = new Hono()

utageWebhookRoutes.post('/:tenantId', async (c) => {
  const tenantId = c.req.param('tenantId')
  const payload = await c.req.json()

  // Phase 1: just log it
  await prisma.webhookLog.create({
    data: {
      tenantId,
      source: 'utage',
      payload,
      processed: false,
    },
  })

  // TODO Phase 2: parse payload → upsert customer + seminar attendance
  // const customer = await upsertCustomerFromUtage(tenantId, payload)

  return c.json({ received: true }, 200)
})

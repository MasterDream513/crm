import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { authMiddleware } from '../../middleware/auth.js'

export const eventRoutes = new Hono()
eventRoutes.use('*', authMiddleware)

eventRoutes.get('/', async (c) => {
  const { tenantId } = c.get('user')
  const events = await prisma.event.findMany({
    where: { tenantId, deletedAt: null },
    include: { _count: { select: { attendees: true } } },
    orderBy: { eventDate: 'desc' },
  })
  return c.json(events)
})

eventRoutes.post('/', zValidator('json', z.object({
  name: z.string().min(1),
  eventDate: z.string().datetime(),
  description: z.string().optional(),
})), async (c) => {
  const { tenantId } = c.get('user')
  const data = c.req.valid('json')
  const event = await prisma.event.create({
    data: { tenantId, ...data, eventDate: new Date(data.eventDate) },
  })
  return c.json(event, 201)
})

// Mark attendance
eventRoutes.patch('/:eventId/attendees/:attendeeId', zValidator('json', z.object({
  status: z.enum(['REGISTERED', 'ATTENDED', 'NO_SHOW']),
})), async (c) => {
  const data = c.req.valid('json')
  const attendeeId = c.req.param('attendeeId')
  const attendee = await prisma.eventAttendee.update({
    where: { id: attendeeId },
    data: { status: data.status },
  })
  return c.json(attendee)
})

// Add attendee to event
eventRoutes.post('/:eventId/attendees', zValidator('json', z.object({
  customerId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
})), async (c) => {
  const { tenantId } = c.get('user')
  const eventId = c.req.param('eventId')
  const data = c.req.valid('json')
  const attendee = await prisma.eventAttendee.create({
    data: { tenantId, eventId, ...data },
  })
  return c.json(attendee, 201)
})

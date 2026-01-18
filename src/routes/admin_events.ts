import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).render('admin/error', { message: 'Unauthorized' });
  }
  next();
}

// List events
router.get('/admin/events', requireAuth, async (req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
    include: {
      _count: { select: { tickets: true } }
    }
  });

  res.render('admin/events', { token: req.query.token, events });
});

// New event form
router.get('/admin/events/new', requireAuth, (req, res) => {
  res.render('admin/event_form', { token: req.query.token, event: null });
});

// Edit event form
router.get('/admin/events/:id/edit', requireAuth, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id }
  });

  if (!event) {
    return res.status(404).render('admin/error', { message: 'Event not found' });
  }

  res.render('admin/event_form', { token: req.query.token, event });
});

// Create event
router.post('/admin/events', requireAuth, async (req, res) => {
  const {
    name, date, location, address,
    gaPriceOnline, gaPriceGate, vipPriceOnline, vipPriceGate,
    gaCapacity, vipCapacity, active
  } = req.body;

  await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      location,
      address: address || null,
      gaPriceOnline: parseFloat(gaPriceOnline) || 15,
      gaPriceGate: parseFloat(gaPriceGate) || 20,
      vipPriceOnline: parseFloat(vipPriceOnline) || 35,
      vipPriceGate: parseFloat(vipPriceGate) || 40,
      gaCapacity: parseInt(gaCapacity) || 500,
      vipCapacity: parseInt(vipCapacity) || 100,
      active: active === 'on' || active === 'true'
    }
  });

  res.redirect(`/admin/events?token=${req.query.token}`);
});

// Update event
router.post('/admin/events/:id', requireAuth, async (req, res) => {
  const {
    name, date, location, address,
    gaPriceOnline, gaPriceGate, vipPriceOnline, vipPriceGate,
    gaCapacity, vipCapacity, active
  } = req.body;

  await prisma.event.update({
    where: { id: req.params.id },
    data: {
      name,
      date: new Date(date),
      location,
      address: address || null,
      gaPriceOnline: parseFloat(gaPriceOnline),
      gaPriceGate: parseFloat(gaPriceGate),
      vipPriceOnline: parseFloat(vipPriceOnline),
      vipPriceGate: parseFloat(vipPriceGate),
      gaCapacity: parseInt(gaCapacity),
      vipCapacity: parseInt(vipCapacity),
      active: active === 'on' || active === 'true'
    }
  });

  res.redirect(`/admin/events?token=${req.query.token}`);
});

// Toggle event active status
router.post('/admin/events/:id/toggle', requireAuth, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (event) {
    await prisma.event.update({
      where: { id: req.params.id },
      data: { active: !event.active }
    });
  }
  res.redirect(`/admin/events?token=${req.query.token}`);
});

// Delete event
router.post('/admin/events/:id/delete', requireAuth, async (req, res) => {
  await prisma.event.delete({ where: { id: req.params.id } });
  res.redirect(`/admin/events?token=${req.query.token}`);
});

export default router;

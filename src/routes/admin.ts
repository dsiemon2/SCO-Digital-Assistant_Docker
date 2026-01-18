import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';

const router = Router();

// Base path for URL prefix (Docker deployment)
const basePath = '/SCOAssistant';

// Helper to get branding with defaults
async function getBranding() {
  const branding = await prisma.branding.findFirst();
  return branding || {
    id: 'default',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#ea580c',
    secondaryColor: '#c2410c',
    accentColor: '#f97316',
    headingFont: 'Inter',
    bodyFont: 'Inter'
  };
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).render('admin/error', { message: 'Unauthorized', basePath });
  }
  next();
}

// Dashboard
router.get('/admin', requireAuth, async (req, res) => {
  const [
    callCount,
    ticketCount,
    recentCalls,
    upcomingEvents,
    branding
  ] = await Promise.all([
    prisma.callLog.count(),
    prisma.ticketPurchase.count({ where: { paymentStatus: 'completed' } }),
    prisma.callLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.event.findMany({
      where: { active: true, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 3
    }),
    getBranding()
  ]);

  res.render('admin/dashboard', {
    token: req.query.token,
    basePath,
    branding,
    stats: { callCount, ticketCount },
    recentCalls,
    upcomingEvents
  });
});

// Call Logs
router.get('/admin/calls', requireAuth, async (req, res) => {
  const [calls, branding] = await Promise.all([
    prisma.callLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        tickets: true,
        messages: true
      }
    }),
    getBranding()
  ]);

  res.render('admin/calls', { token: req.query.token, basePath, branding, calls });
});

// Ticket Sales
router.get('/admin/tickets', requireAuth, async (req, res) => {
  const [tickets, stats, branding] = await Promise.all([
    prisma.ticketPurchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { event: true }
    }),
    prisma.ticketPurchase.groupBy({
      by: ['ticketType', 'paymentStatus'],
      _count: true,
      _sum: { totalPrice: true }
    }),
    getBranding()
  ]);

  res.render('admin/tickets', { token: req.query.token, basePath, branding, tickets, stats });
});

// Sponsor Inquiries
router.get('/admin/sponsors', requireAuth, async (req, res) => {
  const [inquiries, branding] = await Promise.all([
    prisma.sponsorInquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    getBranding()
  ]);

  res.render('admin/sponsors', { token: req.query.token, basePath, branding, inquiries });
});

// Mark sponsor followed up
router.post('/admin/sponsors/:id/followup', requireAuth, async (req, res) => {
  await prisma.sponsorInquiry.update({
    where: { id: req.params.id },
    data: { followedUp: true }
  });
  res.redirect(`${basePath}/admin/sponsors?token=${req.query.token}`);
});

// Events
router.get('/admin/events', requireAuth, async (req, res) => {
  const [events, branding] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: 'desc' },
      include: {
        _count: {
          select: { tickets: true }
        }
      }
    }),
    getBranding()
  ]);

  res.render('admin/events', { token: req.query.token, basePath, branding, events });
});

// Knowledge Base
router.get('/admin/kb', requireAuth, async (req, res) => {
  const [docs, branding] = await Promise.all([
    prisma.knowledgeDoc.findMany({
      orderBy: { createdAt: 'desc' }
    }),
    getBranding()
  ]);

  res.render('admin/kb', { token: req.query.token, basePath, branding, docs });
});

// Sponsorship Packages
router.get('/admin/sponsorship', requireAuth, async (req, res) => {
  const [packages, branding] = await Promise.all([
    prisma.sponsorshipPackage.findMany({
      orderBy: { price: 'desc' }
    }),
    getBranding()
  ]);
  res.render('admin/sponsorship', { token: req.query.token, basePath, branding, packages });
});

// Update sponsorship package
router.post('/admin/sponsorship/:id', requireAuth, async (req, res) => {
  try {
    const { name, subtitle, price, available, colorClass, benefits } = req.body;

    await prisma.sponsorshipPackage.update({
      where: { id: req.params.id },
      data: {
        name,
        subtitle,
        price: parseFloat(price) || 0,
        available: parseInt(available) || 0,
        colorClass,
        benefits
      }
    });

    // Check if AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true });
    }

    res.redirect(`${basePath}/admin/sponsorship?token=${req.query.token}`);
  } catch (error) {
    console.error('Error updating sponsorship package:', error);
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, error: 'Failed to update' });
    }
    res.redirect(`${basePath}/admin/sponsorship?token=${req.query.token}`);
  }
});

// Winners
router.get('/admin/winners', requireAuth, async (req, res) => {
  const [winners, branding] = await Promise.all([
    prisma.winner.findMany({
      orderBy: [{ eventName: 'desc' }, { division: 'asc' }, { place: 'asc' }]
    }),
    getBranding()
  ]);

  res.render('admin/winners', { token: req.query.token, basePath, branding, winners });
});

// About
router.get('/admin/about', requireAuth, async (req, res) => {
  const branding = await getBranding();
  res.render('admin/about', { token: req.query.token, basePath, branding });
});

// ============================================
// HELP & SUPPORT
// ============================================

router.get('/admin/help', requireAuth, async (req, res) => {
  const branding = await getBranding();
  res.render('admin/help', { token: req.query.token, basePath, branding });
});

// ============================================
// ACCOUNT
// ============================================

router.get('/admin/account', requireAuth, async (req, res) => {
  // Get business config for organization info
  const config = await prisma.businessConfig.findFirst();
  const branding = await getBranding();

  // Calculate usage stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalCalls, smsSent] = await Promise.all([
    prisma.callLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    0 // SMS count would come from SMS logs if implemented
  ]);

  // Calculate approximate minutes from calls
  const calls = await prisma.callLog.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { duration: true }
  });
  const totalMinutes = Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / 60);

  res.render('admin/account', {
    token: req.query.token,
    basePath,
    branding,
    account: {
      organizationName: config?.organizationName || 'Soup Cookoff',
      email: 'admin@soupcookoff.com',
      phone: '',
      plan: 'starter',
      planPrice: 0,
      paymentMethod: null,
      apiToken: process.env.ADMIN_TOKEN || 'sk-xxxx-xxxx-xxxx-xxxx'
    },
    usage: {
      totalCalls,
      callLimit: 500,
      totalMinutes,
      minuteLimit: 1000,
      smsSent,
      smsLimit: 200,
      tokensUsed: 0,
      tokenLimit: 100000
    },
    billing: []
  });
});

router.post('/admin/account/profile', requireAuth, async (req, res) => {
  const { organizationName, email, phone } = req.body;

  let config = await prisma.businessConfig.findFirst();
  if (config) {
    await prisma.businessConfig.update({
      where: { id: config.id },
      data: { organizationName }
    });
  }

  res.json({ success: true });
});

router.post('/admin/account/password', requireAuth, async (req, res) => {
  // Password change would be implemented with proper auth system
  res.json({ success: true });
});

router.post('/admin/account/regenerate-token', requireAuth, async (req, res) => {
  // Token regeneration would be implemented with proper auth system
  const newToken = 'sk-' + Math.random().toString(36).substring(2, 10) + '-' +
                   Math.random().toString(36).substring(2, 10);
  res.json({ success: true, newToken });
});

// Analytics
router.get('/admin/analytics', requireAuth, async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalCalls,
    completedCalls,
    ticketPurchases,
    topIntents,
    revenue,
    branding
  ] = await Promise.all([
    prisma.callLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.callLog.count({
      where: { createdAt: { gte: thirtyDaysAgo }, outcome: 'completed' }
    }),
    prisma.ticketPurchase.count({
      where: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'completed' }
    }),
    prisma.intentLog.groupBy({
      by: ['intent'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      orderBy: { _count: { intent: 'desc' } },
      take: 10
    }),
    prisma.ticketPurchase.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'completed' },
      _sum: { totalPrice: true }
    }),
    getBranding()
  ]);

  res.render('admin/analytics', {
    token: req.query.token,
    basePath,
    branding,
    stats: {
      totalCalls,
      completedCalls,
      ticketPurchases,
      revenue: Number(revenue._sum.totalPrice || 0)
    },
    topIntents
  });
});

// Settings (with 3 tabs: Store Info, Branding, Payment Gateways)
router.get('/admin/settings', requireAuth, async (req, res) => {
  const [storeInfo, branding, paymentSettings] = await Promise.all([
    prisma.storeInfo.findFirst(),
    getBranding(),
    prisma.paymentSettings.findFirst()
  ]);

  res.render('admin/settings', {
    token: req.query.token,
    basePath,
    branding,
    settings: {
      // Store Info
      businessName: storeInfo?.businessName || 'The Soup Cookoff',
      tagline: storeInfo?.tagline || 'AKT Foundation Events',
      description: storeInfo?.description || '',
      address: storeInfo?.address || '',
      phone: storeInfo?.phone || '',
      email: storeInfo?.email || '',
      website: storeInfo?.website || '',
      businessHours: storeInfo?.businessHours || '',
      timezone: storeInfo?.timezone || 'America/New_York',
      // Branding
      logoUrl: branding?.logoUrl || '',
      faviconUrl: branding?.faviconUrl || '',
      primaryColor: branding?.primaryColor || '#ea580c',
      secondaryColor: branding?.secondaryColor || '#c2410c',
      accentColor: branding?.accentColor || '#f97316',
      headingFont: branding?.headingFont || 'Inter',
      bodyFont: branding?.bodyFont || 'Inter',
      // Payment Settings
      paymentsEnabled: paymentSettings?.enabled || false,
      stripeEnabled: paymentSettings?.stripeEnabled || false,
      stripePublishableKey: paymentSettings?.stripePublishableKey || '',
      stripeTestMode: paymentSettings?.stripeTestMode !== false,
      paypalEnabled: paymentSettings?.paypalEnabled || false,
      paypalClientId: paymentSettings?.paypalClientId || '',
      paypalSandbox: paymentSettings?.paypalSandbox !== false,
      squareEnabled: paymentSettings?.squareEnabled || false,
      squareAppId: paymentSettings?.squareAppId || '',
      squareSandbox: paymentSettings?.squareSandbox !== false
    }
  });
});

router.post('/admin/settings', requireAuth, async (req, res) => {
  const body = req.body;

  // Update Store Info
  const storeInfo = await prisma.storeInfo.findFirst();
  const storeData = {
    businessName: body.businessName || 'The Soup Cookoff',
    tagline: body.tagline || '',
    description: body.description || '',
    address: body.address || '',
    phone: body.phone || '',
    email: body.email || '',
    website: body.website || '',
    businessHours: body.businessHours || '',
    timezone: body.timezone || 'America/New_York'
  };

  if (storeInfo) {
    await prisma.storeInfo.update({ where: { id: storeInfo.id }, data: storeData });
  } else {
    await prisma.storeInfo.create({ data: storeData });
  }

  // Update Branding
  const brandingRecord = await prisma.branding.findFirst();
  const brandingData = {
    logoUrl: body.logoUrl || '',
    faviconUrl: body.faviconUrl || '',
    primaryColor: body.primaryColor || '#ea580c',
    secondaryColor: body.secondaryColor || '#c2410c',
    accentColor: body.accentColor || '#f97316',
    headingFont: body.headingFont || 'Inter',
    bodyFont: body.bodyFont || 'Inter'
  };

  if (brandingRecord) {
    await prisma.branding.update({ where: { id: brandingRecord.id }, data: brandingData });
  } else {
    await prisma.branding.create({ data: brandingData });
  }

  // Update Payment Settings
  const paymentSettingsRecord = await prisma.paymentSettings.findFirst();
  const paymentData = {
    enabled: body.paymentsEnabled === true || body.paymentsEnabled === 'true',
    stripeEnabled: body.stripeEnabled === true || body.stripeEnabled === 'true',
    stripePublishableKey: body.stripePublishableKey || '',
    stripeTestMode: body.stripeTestMode !== false && body.stripeTestMode !== 'false',
    paypalEnabled: body.paypalEnabled === true || body.paypalEnabled === 'true',
    paypalClientId: body.paypalClientId || '',
    paypalSandbox: body.paypalSandbox !== false && body.paypalSandbox !== 'false',
    squareEnabled: body.squareEnabled === true || body.squareEnabled === 'true',
    squareAppId: body.squareAppId || '',
    squareSandbox: body.squareSandbox !== false && body.squareSandbox !== 'false'
  };

  if (paymentSettingsRecord) {
    await prisma.paymentSettings.update({ where: { id: paymentSettingsRecord.id }, data: paymentData });
  } else {
    await prisma.paymentSettings.create({ data: paymentData });
  }

  // Check if AJAX request
  if (req.headers['content-type']?.includes('application/json')) {
    return res.json({ success: true });
  }

  res.redirect(`${basePath}/admin/settings?token=${req.query.token}`);
});

// Features page
router.get('/admin/features', requireAuth, async (req, res) => {
  const [features, branding] = await Promise.all([
    prisma.features.findFirst(),
    getBranding()
  ]);

  res.render('admin/features', {
    token: req.query.token,
    basePath,
    branding,
    features: features || {
      faqEnabled: false,
      stickyBarEnabled: false,
      stickyBarText: '',
      stickyBarBgColor: '#ea580c',
      stickyBarLink: '',
      stickyBarLinkText: '',
      liveChatEnabled: false,
      chatProvider: 'builtin',
      chatWelcomeMessage: 'Hi! How can we help you today?',
      chatAgentName: 'Support',
      chatWidgetColor: '#ea580c',
      chatPosition: 'bottom-right',
      chatShowOnMobile: true,
      chatWidgetId: '',
      chatEmbedCode: '',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      orderConfirmations: true,
      marketingEmails: false,
      appointmentReminders: true,
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
      youtubeUrl: '',
      tiktokUrl: '',
      shareOnFacebook: true,
      shareOnTwitter: true,
      shareOnLinkedin: false,
      shareOnWhatsapp: true,
      shareOnEmail: true,
      copyLinkButton: true
    }
  });
});

router.post('/admin/features', requireAuth, async (req, res) => {
  const body = req.body;

  const featuresData = {
    faqEnabled: body.faqEnabled === true || body.faqEnabled === 'true',
    stickyBarEnabled: body.stickyBarEnabled === true || body.stickyBarEnabled === 'true',
    stickyBarText: body.stickyBarText || '',
    stickyBarBgColor: body.stickyBarColor || body.stickyBarBgColor || '#ea580c',
    stickyBarLink: body.stickyBarLink || '',
    stickyBarLinkText: body.stickyBarLinkText || '',
    liveChatEnabled: body.liveChatEnabled === true || body.liveChatEnabled === 'true',
    chatProvider: body.chatProvider || 'builtin',
    chatWelcomeMessage: body.chatWelcomeMessage || '',
    chatAgentName: body.chatAgentName || 'Support',
    chatWidgetColor: body.chatWidgetColor || '#ea580c',
    chatPosition: body.chatPosition || 'bottom-right',
    chatShowOnMobile: body.chatShowOnMobile !== false && body.chatShowOnMobile !== 'false',
    chatWidgetId: body.chatWidgetId || '',
    chatEmbedCode: body.chatEmbedCode || '',
    emailNotifications: body.emailNotifications !== false && body.emailNotifications !== 'false',
    smsNotifications: body.smsNotifications === true || body.smsNotifications === 'true',
    pushNotifications: body.pushNotifications === true || body.pushNotifications === 'true',
    orderConfirmations: body.orderConfirmations !== false && body.orderConfirmations !== 'false',
    marketingEmails: body.marketingEmails === true || body.marketingEmails === 'true',
    appointmentReminders: body.appointmentReminders !== false && body.appointmentReminders !== 'false',
    facebookUrl: body.facebookUrl || '',
    twitterUrl: body.twitterUrl || '',
    instagramUrl: body.instagramUrl || '',
    linkedinUrl: body.linkedinUrl || '',
    youtubeUrl: body.youtubeUrl || '',
    tiktokUrl: body.tiktokUrl || '',
    shareOnFacebook: body.shareOnFacebook !== false && body.shareOnFacebook !== 'false',
    shareOnTwitter: body.shareOnTwitter !== false && body.shareOnTwitter !== 'false',
    shareOnLinkedin: body.shareOnLinkedin === true || body.shareOnLinkedin === 'true',
    shareOnWhatsapp: body.shareOnWhatsapp !== false && body.shareOnWhatsapp !== 'false',
    shareOnEmail: body.shareOnEmail !== false && body.shareOnEmail !== 'false',
    copyLinkButton: body.copyLinkButton !== false && body.copyLinkButton !== 'false'
  };

  const featuresRecord = await prisma.features.findFirst();
  if (featuresRecord) {
    await prisma.features.update({ where: { id: featuresRecord.id }, data: featuresData });
  } else {
    await prisma.features.create({ data: featuresData });
  }

  // Check if AJAX request
  if (req.headers['content-type']?.includes('application/json')) {
    return res.json({ success: true });
  }

  res.redirect(`${basePath}/admin/features?token=${req.query.token}`);
});

// Voices & Languages
router.get('/admin/voices', requireAuth, async (req, res) => {
  const [config, branding] = await Promise.all([
    prisma.businessConfig.findFirst(),
    getBranding()
  ]);
  const selectedVoice = config?.selectedVoice || 'alloy';

  // Get or create default languages
  let languages = await prisma.supportedLanguage.findMany({
    orderBy: { name: 'asc' }
  });

  // Seed all languages that have KB content if none exist
  if (languages.length === 0) {
    const defaultLangs = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tieng Viet' },
      { code: 'fr', name: 'French', nativeName: 'Francais' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' }
    ];

    for (const lang of defaultLangs) {
      await prisma.supportedLanguage.create({ data: lang });
    }
    languages = await prisma.supportedLanguage.findMany({ orderBy: { name: 'asc' } });
  }

  // Count KB docs per language
  const docCounts = await prisma.knowledgeDoc.groupBy({
    by: ['language'],
    _count: true
  });

  const langsWithCounts = languages.map(lang => ({
    ...lang,
    flag: lang.code === 'en' ? 'US' : lang.code === 'es' ? 'ES' : lang.code === 'de' ? 'DE' :
          lang.code === 'zh' ? 'CN' : lang.code === 'vi' ? 'VN' : lang.code === 'fr' ? 'FR' :
          lang.code === 'it' ? 'IT' : lang.code === 'pt' ? 'BR' : lang.code === 'ja' ? 'JP' :
          lang.code === 'ko' ? 'KR' : lang.code === 'ar' ? 'SA' : lang.code === 'hi' ? 'IN' :
          lang.code === 'ru' ? 'RU' : lang.code === 'pl' ? 'PL' : lang.code === 'nl' ? 'NL' :
          lang.code === 'uk' ? 'UA' : lang.code === 'fil' ? 'PH' : lang.code === 'tl' ? 'PH' :
          lang.code === 'ne' ? 'NP' : lang.code === 'fa' ? 'IR' : lang.code === 'gl' ? 'ES' :
          lang.code === 'he' ? 'IL' : lang.code === 'sr' ? 'RS' : lang.code === 'nl-be' ? 'BE' : 'UN',
    docCount: docCounts.find(d => d.language === lang.code)?._count || 0
  }));

  const totalDocs = await prisma.knowledgeDoc.count();

  res.render('admin/voices', {
    token: req.query.token,
    basePath,
    branding,
    selectedVoice,
    languages: langsWithCounts,
    totalDocs
  });
});

// Select voice
router.post('/admin/voices/select', requireAuth, async (req, res) => {
  const { voice } = req.body;
  const validVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];

  if (!validVoices.includes(voice)) {
    return res.status(400).json({ error: 'Invalid voice' });
  }

  let config = await prisma.businessConfig.findFirst();
  if (config) {
    await prisma.businessConfig.update({
      where: { id: config.id },
      data: { selectedVoice: voice }
    });
  } else {
    await prisma.businessConfig.create({
      data: { selectedVoice: voice }
    });
  }

  res.json({ success: true, voice });
});

// Toggle language
router.post('/admin/voices/language/:id', requireAuth, async (req, res) => {
  const { enabled } = req.body;

  await prisma.supportedLanguage.update({
    where: { id: req.params.id },
    data: { enabled: !!enabled }
  });

  res.json({ success: true });
});

// Add language
router.post('/admin/voices/language', requireAuth, async (req, res) => {
  const { code } = req.body;

  const langData: Record<string, { name: string; nativeName: string }> = {
    zh: { name: 'Chinese (Mandarin)', nativeName: '中文' },
    vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    fr: { name: 'French', nativeName: 'Français' },
    it: { name: 'Italian', nativeName: 'Italiano' },
    pt: { name: 'Portuguese', nativeName: 'Português' },
    ja: { name: 'Japanese', nativeName: '日本語' },
    ko: { name: 'Korean', nativeName: '한국어' },
    ar: { name: 'Arabic', nativeName: 'العربية' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी' },
    ru: { name: 'Russian', nativeName: 'Русский' },
    pl: { name: 'Polish', nativeName: 'Polski' },
    nl: { name: 'Dutch', nativeName: 'Nederlands' }
  };

  if (code && langData[code]) {
    try {
      await prisma.supportedLanguage.create({
        data: {
          code,
          name: langData[code].name,
          nativeName: langData[code].nativeName,
          enabled: true
        }
      });
    } catch (e) {
      // Already exists
    }
  }

  res.redirect(`${basePath}/admin/voices?token=${req.query.token}`);
});

// Greeting Config
router.get('/admin/greeting', requireAuth, async (req, res) => {
  const [config, branding] = await Promise.all([
    prisma.businessConfig.findFirst(),
    getBranding()
  ]);

  res.render('admin/greeting', {
    token: req.query.token,
    basePath,
    branding,
    greeting: config?.greeting || ''
  });
});

router.post('/admin/greeting', requireAuth, async (req, res) => {
  const { greeting } = req.body;

  let config = await prisma.businessConfig.findFirst();
  if (config) {
    await prisma.businessConfig.update({
      where: { id: config.id },
      data: { greeting }
    });
  } else {
    await prisma.businessConfig.create({
      data: { greeting }
    });
  }

  res.json({ success: true });
});

// TTS Preview endpoint using OpenAI TTS API
router.post('/admin/greeting/preview', requireAuth, async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Get selected voice from config
    const config = await prisma.businessConfig.findFirst();
    const voice = config?.selectedVoice || 'alloy';

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS error:', error);
      return res.status(500).json({ error: 'TTS generation failed' });
    }

    // Stream the audio back
    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache'
    });

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('TTS preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WEBHOOKS CONFIGURATION
// ============================================

router.get('/admin/webhooks', requireAuth, async (req, res) => {
  const [webhooks, branding] = await Promise.all([
    prisma.webhook.findMany({ orderBy: { name: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/webhooks', { token: req.query.token, basePath, branding, webhooks });
});

router.post('/admin/webhooks', requireAuth, async (req, res) => {
  const { name, url, enabled, secret } = req.body;
  await prisma.webhook.upsert({
    where: { name },
    create: { name, url, enabled: enabled === 'true', secret: secret || null },
    update: { url, enabled: enabled === 'true', secret: secret || null }
  });
  res.json({ success: true });
});

router.delete('/admin/webhooks/:name', requireAuth, async (req, res) => {
  await prisma.webhook.delete({ where: { name: req.params.name } });
  res.json({ success: true });
});

// ============================================
// SMS CONFIGURATION
// ============================================

router.get('/admin/sms', requireAuth, async (req, res) => {
  let config = await prisma.smsConfig.findFirst();
  if (!config) {
    config = await prisma.smsConfig.create({ data: {} });
  }
  const [templates, branding] = await Promise.all([
    prisma.smsTemplate.findMany({ orderBy: { name: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/sms', { token: req.query.token, basePath, branding, config, templates });
});

router.post('/admin/sms/config', requireAuth, async (req, res) => {
  const { enabled, fromNumber, ticketConfirmation, sponsorFollowUp, eventReminder, voicemailNotification, adminAlertNumber } = req.body;
  let config = await prisma.smsConfig.findFirst();
  if (config) {
    await prisma.smsConfig.update({
      where: { id: config.id },
      data: {
        enabled: enabled === 'true',
        fromNumber: fromNumber || null,
        ticketConfirmation: ticketConfirmation === 'true',
        sponsorFollowUp: sponsorFollowUp === 'true',
        eventReminder: eventReminder === 'true',
        voicemailNotification: voicemailNotification === 'true',
        adminAlertNumber: adminAlertNumber || null
      }
    });
  } else {
    await prisma.smsConfig.create({
      data: {
        enabled: enabled === 'true',
        fromNumber: fromNumber || null,
        ticketConfirmation: ticketConfirmation === 'true',
        sponsorFollowUp: sponsorFollowUp === 'true',
        eventReminder: eventReminder === 'true',
        voicemailNotification: voicemailNotification === 'true',
        adminAlertNumber: adminAlertNumber || null
      }
    });
  }
  res.json({ success: true });
});

router.post('/admin/sms/template', requireAuth, async (req, res) => {
  const { name, template, enabled } = req.body;
  await prisma.smsTemplate.upsert({
    where: { name },
    create: { name, template, enabled: enabled === 'true' },
    update: { template, enabled: enabled === 'true' }
  });
  res.json({ success: true });
});

// ============================================
// TRANSFER CONFIGURATION
// ============================================

router.get('/admin/transfer', requireAuth, async (req, res) => {
  let config = await prisma.transferConfig.findFirst();
  if (!config) {
    config = await prisma.transferConfig.create({ data: {} });
  }
  const [routes, branding] = await Promise.all([
    prisma.transferRoute.findMany({ orderBy: { name: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/transfer', { token: req.query.token, basePath, branding, config, routes });
});

router.post('/admin/transfer/config', requireAuth, async (req, res) => {
  const { enabled, defaultTransferNumber, transferMessage, voicemailEnabled, voicemailNumber, voicemailGreeting, maxWaitTime } = req.body;
  let config = await prisma.transferConfig.findFirst();
  if (config) {
    await prisma.transferConfig.update({
      where: { id: config.id },
      data: {
        enabled: enabled === 'true',
        defaultTransferNumber: defaultTransferNumber || null,
        transferMessage: transferMessage || 'Please hold while I transfer you.',
        voicemailEnabled: voicemailEnabled === 'true',
        voicemailNumber: voicemailNumber || null,
        voicemailGreeting: voicemailGreeting || 'Please leave a message after the tone.',
        maxWaitTime: parseInt(maxWaitTime) || 30
      }
    });
  } else {
    await prisma.transferConfig.create({
      data: {
        enabled: enabled === 'true',
        defaultTransferNumber: defaultTransferNumber || null,
        transferMessage: transferMessage || 'Please hold while I transfer you.',
        voicemailEnabled: voicemailEnabled === 'true',
        voicemailNumber: voicemailNumber || null,
        voicemailGreeting: voicemailGreeting || 'Please leave a message after the tone.',
        maxWaitTime: parseInt(maxWaitTime) || 30
      }
    });
  }
  res.json({ success: true });
});

router.post('/admin/transfer/route', requireAuth, async (req, res) => {
  const { name, phoneNumber, description, schedule, enabled } = req.body;
  await prisma.transferRoute.upsert({
    where: { name },
    create: { name, phoneNumber, description: description || null, schedule: schedule || null, enabled: enabled === 'true' },
    update: { phoneNumber, description: description || null, schedule: schedule || null, enabled: enabled === 'true' }
  });
  res.json({ success: true });
});

router.delete('/admin/transfer/route/:name', requireAuth, async (req, res) => {
  await prisma.transferRoute.delete({ where: { name: req.params.name } });
  res.json({ success: true });
});

// ============================================
// DTMF MENU CONFIGURATION
// ============================================

router.get('/admin/dtmf', requireAuth, async (req, res) => {
  let menu = await prisma.dtmfMenu.findFirst();
  if (!menu) {
    menu = await prisma.dtmfMenu.create({ data: {} });
  }
  const [options, branding] = await Promise.all([
    prisma.dtmfOption.findMany({ orderBy: { sortOrder: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/dtmf', { token: req.query.token, basePath, branding, menu, options });
});

router.post('/admin/dtmf/menu', requireAuth, async (req, res) => {
  const { enabled, greeting, timeoutSecs } = req.body;
  let menu = await prisma.dtmfMenu.findFirst();
  if (menu) {
    await prisma.dtmfMenu.update({
      where: { id: menu.id },
      data: {
        enabled: enabled === 'true',
        greeting: greeting || 'Press 1 for event info...',
        timeoutSecs: parseInt(timeoutSecs) || 5
      }
    });
  } else {
    await prisma.dtmfMenu.create({
      data: {
        enabled: enabled === 'true',
        greeting: greeting || 'Press 1 for event info...',
        timeoutSecs: parseInt(timeoutSecs) || 5
      }
    });
  }
  res.json({ success: true });
});

router.post('/admin/dtmf/option', requireAuth, async (req, res) => {
  const { digit, label, action, actionValue, enabled, sortOrder } = req.body;
  await prisma.dtmfOption.upsert({
    where: { digit },
    create: { digit, label, action, actionValue: actionValue || null, enabled: enabled === 'true', sortOrder: parseInt(sortOrder) || 0 },
    update: { label, action, actionValue: actionValue || null, enabled: enabled === 'true', sortOrder: parseInt(sortOrder) || 0 }
  });
  res.json({ success: true });
});

router.delete('/admin/dtmf/option/:digit', requireAuth, async (req, res) => {
  await prisma.dtmfOption.delete({ where: { digit: req.params.digit } });
  res.json({ success: true });
});

// ============================================
// AI TOOLS CONFIGURATION
// ============================================

router.get('/admin/tools', requireAuth, async (req, res) => {
  const [tools, branding] = await Promise.all([
    prisma.aiTool.findMany({ orderBy: { category: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/tools', { token: req.query.token, basePath, branding, tools });
});

router.post('/admin/tools', requireAuth, async (req, res) => {
  const { name, displayName, description, enabled, category } = req.body;
  await prisma.aiTool.upsert({
    where: { name },
    create: { name, displayName, description, enabled: enabled === 'true', category: category || 'general' },
    update: { displayName, description, enabled: enabled === 'true', category: category || 'general' }
  });
  res.json({ success: true });
});

router.post('/admin/tools/toggle/:name', requireAuth, async (req, res) => {
  const tool = await prisma.aiTool.findUnique({ where: { name: req.params.name } });
  if (tool) {
    await prisma.aiTool.update({
      where: { name: req.params.name },
      data: { enabled: !tool.enabled }
    });
  }
  res.json({ success: true });
});

// ============================================
// AI AGENTS CONFIGURATION
// ============================================

router.get('/admin/agents', requireAuth, async (req, res) => {
  const [agents, branding] = await Promise.all([
    prisma.aiAgent.findMany({ orderBy: { name: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/agents', { token: req.query.token, basePath, branding, agents });
});

router.post('/admin/agents', requireAuth, async (req, res) => {
  const { name, displayName, voice, language, systemPrompt, greeting, tools, isDefault, enabled } = req.body;

  // If setting as default, unset other defaults
  if (isDefault === 'true') {
    await prisma.aiAgent.updateMany({ data: { isDefault: false } });
  }

  await prisma.aiAgent.upsert({
    where: { name },
    create: {
      name,
      displayName,
      voice: voice || 'alloy',
      language: language || 'en',
      systemPrompt,
      greeting: greeting || null,
      tools: tools || '[]',
      isDefault: isDefault === 'true',
      enabled: enabled === 'true'
    },
    update: {
      displayName,
      voice: voice || 'alloy',
      language: language || 'en',
      systemPrompt,
      greeting: greeting || null,
      tools: tools || '[]',
      isDefault: isDefault === 'true',
      enabled: enabled === 'true'
    }
  });
  res.json({ success: true });
});

router.delete('/admin/agents/:name', requireAuth, async (req, res) => {
  await prisma.aiAgent.delete({ where: { name: req.params.name } });
  res.json({ success: true });
});

// ============================================
// LOGIC RULES CONFIGURATION
// ============================================

router.get('/admin/logic', requireAuth, async (req, res) => {
  const [rules, branding] = await Promise.all([
    prisma.logicRule.findMany({ orderBy: { priority: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/logic', { token: req.query.token, basePath, branding, rules });
});

router.post('/admin/logic', requireAuth, async (req, res) => {
  const { name, description, condition, action, actionValue, priority, enabled } = req.body;
  await prisma.logicRule.upsert({
    where: { name },
    create: {
      name,
      description: description || null,
      condition,
      action,
      actionValue,
      priority: parseInt(priority) || 0,
      enabled: enabled === 'true'
    },
    update: {
      description: description || null,
      condition,
      action,
      actionValue,
      priority: parseInt(priority) || 0,
      enabled: enabled === 'true'
    }
  });
  res.json({ success: true });
});

router.delete('/admin/logic/:name', requireAuth, async (req, res) => {
  await prisma.logicRule.delete({ where: { name: req.params.name } });
  res.json({ success: true });
});

// ============================================
// CUSTOM FUNCTIONS & CALENDAR CONFIGURATION
// ============================================

router.get('/admin/functions', requireAuth, async (req, res) => {
  let calendarConfig = await prisma.calendarConfig.findFirst();
  if (!calendarConfig) {
    calendarConfig = await prisma.calendarConfig.create({ data: {} });
  }
  const [functions, branding] = await Promise.all([
    prisma.customFunction.findMany({ orderBy: { name: 'asc' } }),
    getBranding()
  ]);
  res.render('admin/functions', { token: req.query.token, basePath, branding, calendarConfig, functions });
});

router.post('/admin/functions/calendar', requireAuth, async (req, res) => {
  const {
    provider, enabled, apiKey, calendarId, clientId, clientSecret,
    refreshToken, webhookUrl, defaultDuration, bufferTime, workingHours
  } = req.body;

  let config = await prisma.calendarConfig.findFirst();
  const data = {
    provider: provider || 'google',
    enabled: enabled === 'true',
    apiKey: apiKey || null,
    calendarId: calendarId || null,
    clientId: clientId || null,
    clientSecret: clientSecret || null,
    refreshToken: refreshToken || null,
    webhookUrl: webhookUrl || null,
    defaultDuration: parseInt(defaultDuration) || 30,
    bufferTime: parseInt(bufferTime) || 15,
    workingHours: workingHours || '{"Mon-Fri": {"start": "09:00", "end": "17:00"}}'
  };

  if (config) {
    await prisma.calendarConfig.update({ where: { id: config.id }, data });
  } else {
    await prisma.calendarConfig.create({ data });
  }
  res.json({ success: true });
});

router.post('/admin/functions', requireAuth, async (req, res) => {
  const {
    name, displayName, description, type, endpoint, method, timeout,
    headers, queryParams, parameters, payloadType, customPayload, responseMapping, enabled
  } = req.body;

  await prisma.customFunction.upsert({
    where: { name },
    create: {
      name,
      displayName,
      description,
      type: type || 'custom',
      endpoint: endpoint || null,
      method: method || 'POST',
      timeout: parseInt(timeout) || 120000,
      headers: headers || '{}',
      queryParams: queryParams || '{}',
      parameters: parameters || '{}',
      payloadType: payloadType || 'args_only',
      customPayload: customPayload || null,
      responseMapping: responseMapping || null,
      enabled: enabled === 'true'
    },
    update: {
      displayName,
      description,
      type: type || 'custom',
      endpoint: endpoint || null,
      method: method || 'POST',
      timeout: parseInt(timeout) || 120000,
      headers: headers || '{}',
      queryParams: queryParams || '{}',
      parameters: parameters || '{}',
      payloadType: payloadType || 'args_only',
      customPayload: customPayload || null,
      responseMapping: responseMapping || null,
      enabled: enabled === 'true'
    }
  });
  res.json({ success: true });
});

router.post('/admin/functions/toggle/:name', requireAuth, async (req, res) => {
  const fn = await prisma.customFunction.findUnique({ where: { name: req.params.name } });
  if (fn) {
    await prisma.customFunction.update({
      where: { name: req.params.name },
      data: { enabled: !fn.enabled }
    });
  }
  res.json({ success: true });
});

router.delete('/admin/functions/:name', requireAuth, async (req, res) => {
  await prisma.customFunction.delete({ where: { name: req.params.name } });
  res.json({ success: true });
});

// Seed calendar functions
router.post('/admin/functions/seed-calendar', requireAuth, async (req, res) => {
  const calendarFunctions = [
    {
      name: 'checkCalendarAvailability',
      displayName: 'Check Calendar Availability',
      description: 'Check available time slots on the calendar for a given date range',
      type: 'calendar_check',
      endpoint: '',
      method: 'GET',
      timeout: 30000,
      headers: '{}',
      queryParams: '{}',
      parameters: JSON.stringify({
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date in ISO format' },
          endDate: { type: 'string', description: 'End date in ISO format' },
          duration: { type: 'number', description: 'Appointment duration in minutes' }
        },
        required: ['startDate', 'endDate']
      }),
      payloadType: 'args_only',
      enabled: true
    },
    {
      name: 'bookCalendarAppointment',
      displayName: 'Book Calendar Appointment',
      description: 'Book an appointment on the calendar',
      type: 'calendar_book',
      endpoint: '',
      method: 'POST',
      timeout: 30000,
      headers: '{}',
      queryParams: '{}',
      parameters: JSON.stringify({
        type: 'object',
        properties: {
          dateTime: { type: 'string', description: 'Appointment date/time in ISO format' },
          duration: { type: 'number', description: 'Duration in minutes' },
          name: { type: 'string', description: 'Customer name' },
          email: { type: 'string', description: 'Customer email' },
          phone: { type: 'string', description: 'Customer phone' },
          notes: { type: 'string', description: 'Appointment notes' }
        },
        required: ['dateTime', 'name']
      }),
      payloadType: 'args_only',
      enabled: true
    }
  ];

  for (const fn of calendarFunctions) {
    await prisma.customFunction.upsert({
      where: { name: fn.name },
      create: fn,
      update: fn
    });
  }

  res.json({ success: true, count: calendarFunctions.length });
});

// ============================================
// PAYMENT GATEWAY ROUTES
// ============================================

// Payments page
router.get('/admin/payments', requireAuth, async (req, res) => {
  // Get Stripe config
  let stripeConfig = await prisma.paymentConfig.findUnique({
    where: { provider: 'stripe' }
  });

  // If no config exists, create default
  if (!stripeConfig) {
    stripeConfig = await prisma.paymentConfig.create({
      data: {
        provider: 'stripe',
        displayName: 'Stripe',
        enabled: false,
        testMode: true,
        currency: 'USD',
        // Pull from env if available
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
      }
    });
  }

  const branding = await getBranding();

  // Calculate payment stats
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalTransactions, completedTransactions, revenueResult] = await Promise.all([
    prisma.ticketPurchase.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.ticketPurchase.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'completed'
      }
    }),
    prisma.ticketPurchase.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'completed'
      },
      _sum: { totalPrice: true }
    })
  ]);

  const totalRevenue = Number(revenueResult._sum.totalPrice || 0);
  const successRate = totalTransactions > 0
    ? Math.round((completedTransactions / totalTransactions) * 100)
    : 0;
  const avgTransaction = completedTransactions > 0
    ? totalRevenue / completedTransactions
    : 0;

  // Get webhook URL
  const webhookUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8005}`;

  res.render('admin/payments', {
    token: req.query.token,
    basePath,
    branding,
    stripeConfig,
    webhookUrl,
    stats: {
      totalTransactions,
      totalRevenue,
      successRate,
      avgTransaction
    },
    success: req.query.success,
    error: req.query.error
  });
});

// Save Stripe settings
router.post('/admin/payments/stripe', requireAuth, async (req, res) => {
  const { publicKey, secretKey, webhookSecret, currency, statementDescriptor, testMode } = req.body;

  await prisma.paymentConfig.upsert({
    where: { provider: 'stripe' },
    create: {
      provider: 'stripe',
      displayName: 'Stripe',
      enabled: true,
      testMode: testMode === 'on',
      publicKey: publicKey || null,
      secretKey: secretKey || null,
      webhookSecret: webhookSecret || null,
      currency: currency || 'USD',
      statementDescriptor: statementDescriptor || null
    },
    update: {
      publicKey: publicKey || null,
      secretKey: secretKey || null,
      webhookSecret: webhookSecret || null,
      currency: currency || 'USD',
      statementDescriptor: statementDescriptor || null,
      testMode: testMode === 'on'
    }
  });

  res.redirect(`/admin/payments?token=${req.query.token}&success=Stripe settings saved successfully`);
});

// Toggle gateway enabled/disabled
router.post('/admin/payments/:provider/toggle', requireAuth, async (req, res) => {
  const { provider } = req.params;
  const { enabled } = req.body;

  await prisma.paymentConfig.update({
    where: { provider },
    data: { enabled }
  });

  res.json({ success: true });
});

// Test Stripe connection
router.post('/admin/payments/stripe/test', requireAuth, async (req, res) => {
  try {
    const config = await prisma.paymentConfig.findUnique({
      where: { provider: 'stripe' }
    });

    if (!config?.secretKey) {
      return res.json({ success: false, error: 'No secret key configured' });
    }

    // Dynamic import of Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(config.secretKey, { apiVersion: '2023-10-16' });

    // Test by fetching account
    const account = await stripe.accounts.retrieve();

    res.json({
      success: true,
      account: {
        id: account.id,
        country: account.country,
        email: account.email
      }
    });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

export default router;

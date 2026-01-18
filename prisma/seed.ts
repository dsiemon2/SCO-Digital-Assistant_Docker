import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================
  // BRANDING (Orange Theme)
  // ============================================
  await prisma.branding.upsert({
    where: { id: 'default-branding' },
    update: {},
    create: {
      id: 'default-branding',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#ea580c',
      secondaryColor: '#c2410c',
      accentColor: '#f97316',
      headingFont: 'Inter',
      bodyFont: 'Inter'
    }
  });
  console.log('Created Branding with Orange theme');

  // ============================================
  // STORE INFO
  // ============================================
  await prisma.storeInfo.upsert({
    where: { id: 'default-store' },
    update: {},
    create: {
      id: 'default-store',
      businessName: 'The Soup Cookoff',
      tagline: 'AKT Foundation Events',
      description: 'AI-powered event information and ticket sales assistant for The Soup Cookoff and Great Bake Off events.',
      address: 'Visit soupcookoff.com for event locations',
      phone: '',
      email: 'info@soupcookoff.com',
      website: 'https://soupcookoff.com',
      businessHours: 'Event Days: 11am-3pm',
      timezone: 'America/New_York'
    }
  });
  console.log('Created StoreInfo');

  // ============================================
  // FEATURES (Orange Theme)
  // ============================================
  await prisma.features.upsert({
    where: { id: 'default-features' },
    update: {},
    create: {
      id: 'default-features',
      faqEnabled: false,
      stickyBarEnabled: false,
      stickyBarText: '',
      stickyBarBgColor: '#ea580c',
      stickyBarLink: '',
      stickyBarLinkText: '',
      liveChatEnabled: false,
      chatProvider: 'builtin',
      chatWelcomeMessage: 'Hi! How can we help you with tickets or event information today?',
      chatAgentName: 'Soup Cookoff Support',
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
  console.log('Created Features with Orange theme');

  // ============================================
  // PAYMENT SETTINGS
  // ============================================
  await prisma.paymentSettings.upsert({
    where: { id: 'default-payment' },
    update: {},
    create: {
      id: 'default-payment',
      enabled: false,
      stripeEnabled: false,
      stripePublishableKey: '',
      stripeTestMode: true,
      paypalEnabled: false,
      paypalClientId: '',
      paypalSandbox: true,
      squareEnabled: false,
      squareAppId: '',
      squareSandbox: true
    }
  });
  console.log('Created PaymentSettings');

  // ============================================
  // 24 LANGUAGES (ALL ENABLED)
  // ============================================
  const languages = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: true },
    { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', enabled: true },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', enabled: true },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', enabled: true },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', enabled: true },
    { code: 'en', name: 'English', nativeName: 'English', enabled: true },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', enabled: true },
    { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', enabled: true },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', enabled: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: true },
    { code: 'ko', name: 'Korean', nativeName: '한국어', enabled: true },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', enabled: true },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', enabled: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: true },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', enabled: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', enabled: true },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', enabled: true },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: true }
  ];

  for (const lang of languages) {
    await prisma.supportedLanguage.upsert({
      where: { code: lang.code },
      update: { enabled: true },
      create: lang
    });
  }
  console.log('Created 24 languages (all enabled)');

  // ============================================
  // SAMPLE EVENTS
  // ============================================
  const event1 = await prisma.event.upsert({
    where: { id: 'event-2025-spring' },
    update: {},
    create: {
      id: 'event-2025-spring',
      name: '2025 Spring Soup Cookoff',
      date: new Date('2025-03-15T11:00:00'),
      location: 'Downtown Pavilion',
      address: '123 Main Street, Anytown, TX 75001',
      gaPriceOnline: 15.00,
      gaPriceGate: 20.00,
      vipPriceOnline: 35.00,
      vipPriceGate: 40.00,
      gaCapacity: 500,
      vipCapacity: 100,
      active: true
    }
  });

  const event2 = await prisma.event.upsert({
    where: { id: 'event-2025-fall' },
    update: {},
    create: {
      id: 'event-2025-fall',
      name: '2025 Fall Soup Cookoff',
      date: new Date('2025-10-18T11:00:00'),
      location: 'Community Center',
      address: '456 Oak Avenue, Anytown, TX 75001',
      gaPriceOnline: 15.00,
      gaPriceGate: 20.00,
      vipPriceOnline: 35.00,
      vipPriceGate: 40.00,
      gaCapacity: 600,
      vipCapacity: 150,
      active: true
    }
  });

  console.log('Created events:', event1.name, event2.name);

  // ============================================
  // SAMPLE CALL LOGS FOR ANALYTICS
  // ============================================
  const sampleCalls = [
    {
      id: 'call-sample-1',
      callSid: 'CA' + Math.random().toString(36).substring(2, 15),
      fromNumber: '+15551234567',
      toNumber: '+15559876543',
      callerName: 'John Smith',
      duration: 180,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 180000),
      outcome: 'completed'
    },
    {
      id: 'call-sample-2',
      callSid: 'CA' + Math.random().toString(36).substring(2, 15),
      fromNumber: '+15552223333',
      toNumber: '+15559876543',
      callerName: 'Jane Doe',
      duration: 240,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 48 + 240000),
      outcome: 'ticket_purchase'
    },
    {
      id: 'call-sample-3',
      callSid: 'CA' + Math.random().toString(36).substring(2, 15),
      fromNumber: '+15554445555',
      toNumber: '+15559876543',
      callerName: 'Bob Wilson',
      duration: 120,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 72 + 120000),
      outcome: 'completed'
    }
  ];

  for (const call of sampleCalls) {
    await prisma.callLog.upsert({
      where: { id: call.id },
      update: {},
      create: call
    });
  }
  console.log('Created sample call logs');

  // ============================================
  // SAMPLE INTENT LOGS FOR ANALYTICS
  // ============================================
  const sampleIntents = [
    { id: 'intent-1', callLogId: 'call-sample-1', intent: 'event_info', meta: '{}' },
    { id: 'intent-2', callLogId: 'call-sample-1', intent: 'ticket_inquiry', meta: '{}' },
    { id: 'intent-3', callLogId: 'call-sample-2', intent: 'ticket_purchase', meta: '{}' },
    { id: 'intent-4', callLogId: 'call-sample-2', intent: 'event_info', meta: '{}' },
    { id: 'intent-5', callLogId: 'call-sample-3', intent: 'sponsorship_inquiry', meta: '{}' },
    { id: 'intent-6', intent: 'event_info', meta: '{}' },
    { id: 'intent-7', intent: 'ticket_inquiry', meta: '{}' },
    { id: 'intent-8', intent: 'directions', meta: '{}' }
  ];

  for (const intent of sampleIntents) {
    await prisma.intentLog.upsert({
      where: { id: intent.id },
      update: {},
      create: intent
    });
  }
  console.log('Created sample intent logs');

  // ============================================
  // SAMPLE TRANSCRIPTS FOR ANALYTICS
  // ============================================
  const sampleTranscripts = [
    { id: 'transcript-1', callLogId: 'call-sample-1', text: 'Hi, I would like to know about the upcoming soup cookoff event.' },
    { id: 'transcript-2', callLogId: 'call-sample-1', text: 'The 2025 Spring Soup Cookoff is on March 15th at Downtown Pavilion.' },
    { id: 'transcript-3', callLogId: 'call-sample-2', text: 'I want to purchase VIP tickets for two people.' },
    { id: 'transcript-4', callLogId: 'call-sample-2', text: 'Great! VIP tickets are $35 each when purchased online.' }
  ];

  for (const transcript of sampleTranscripts) {
    await prisma.transcript.upsert({
      where: { id: transcript.id },
      update: {},
      create: transcript
    });
  }
  console.log('Created sample transcripts');

  // ============================================
  // KNOWLEDGE BASE ARTICLES
  // ============================================
  const kbArticles = [
    {
      id: 'kb-about',
      title: 'About The Soup Cookoff',
      slug: 'about',
      language: 'en',
      content: `# About The Soup Cookoff

The Soup Cookoff is a beloved community event that brings together local chefs, restaurants, and soup enthusiasts for a day of delicious competition and charitable giving.

## Our Mission
We support local food banks and hunger relief organizations through our annual fundraising events. 100% of proceeds go directly to fighting hunger in our community.

## History
Founded in 2010, The Soup Cookoff has grown from a small neighborhood gathering to one of the region's most anticipated culinary events. Over the years, we've raised over $500,000 for local charities.

## What to Expect
- Sample soups from 20+ competing chefs
- Live music and entertainment
- Family-friendly activities
- Silent auction
- People's Choice voting
- Professional judging panel`
    },
    {
      id: 'kb-tickets',
      title: 'Ticket Information',
      slug: 'tickets',
      language: 'en',
      content: `# Ticket Information

## Ticket Types

### General Admission ($15 online / $20 at gate)
- Entry to the event
- Soup sampling from all competitors
- One vote for People's Choice award
- Access to entertainment and activities

### VIP Admission ($35 online / $40 at gate)
- All General Admission benefits
- Early entry (30 minutes before GA)
- Exclusive VIP lounge access
- Complimentary beverage
- Meet and greet with competing chefs
- Commemorative tasting spoon

## Purchase Options
- Online at soupcookoff.com
- By phone through our voice assistant
- At the gate on event day (cash and card accepted)

## Refund Policy
Full refunds available up to 48 hours before the event. No refunds within 48 hours of the event.`
    },
    {
      id: 'kb-sponsors',
      title: 'Sponsorship Opportunities',
      slug: 'sponsors',
      language: 'en',
      content: `# Sponsorship Opportunities

Partner with The Soup Cookoff and support our mission while gaining valuable exposure for your business.

## Sponsorship Tiers

### Platinum Sponsor - $5,000
- Premium logo placement on all materials
- 20 VIP tickets
- Exclusive booth location
- Social media feature posts
- Speaking opportunity at event
- Year-round recognition on website

### Gold Sponsor - $2,500
- Logo on event signage
- 10 VIP tickets
- Standard booth space
- Social media mentions
- Website recognition

### Silver Sponsor - $1,000
- Logo on event program
- 6 GA tickets
- Website recognition
- Social media mention

### Bronze Sponsor - $500
- Name in event program
- 4 GA tickets
- Website recognition

## How to Become a Sponsor
Contact us by phone or email to discuss sponsorship opportunities. We're happy to create custom packages to meet your needs.`
    },
    {
      id: 'kb-winners',
      title: 'Past Winners',
      slug: 'winners',
      language: 'en',
      content: `# Past Winners

## 2024 Winners
- **Grand Champion**: Chef Maria's Lobster Bisque - The Blue Kitchen
- **People's Choice**: Grandma's Chicken Noodle - Home Style Cafe
- **Best Presentation**: Thai Coconut Curry - Spice Route
- **Most Creative**: Deconstructed French Onion - The Modern Table

## 2023 Winners
- **Grand Champion**: Smoked Brisket Chili - BBQ Junction
- **People's Choice**: Loaded Potato Soup - Country Kitchen
- **Best Presentation**: Gazpacho Garden - Fresh & Green
- **Most Creative**: Ramen Fusion Bowl - East Meets West

## 2022 Winners
- **Grand Champion**: Classic Tomato Basil - Italiano's
- **People's Choice**: Beer Cheese Soup - The Brew House
- **Best Presentation**: Butternut Squash Elegance - Autumn Harvest
- **Most Creative**: Dessert Soup Trio - Sweet Innovations

## Hall of Fame
Chefs who have won 3 or more times:
- Chef Maria Santos (5 wins)
- Chef Tom Bradley (4 wins)
- Chef Lisa Chen (3 wins)`
    },
    {
      id: 'kb-chefs',
      title: 'Chef Registration',
      slug: 'chefs',
      language: 'en',
      content: `# Chef Registration

## Competition Categories
- Professional Chef Division
- Amateur Chef Division
- Restaurant Team Division
- Student Chef Division

## Registration Requirements
- $50 registration fee (waived for returning champions)
- Valid food handler's certificate
- Proof of liability insurance (for professionals)
- Recipe submission by deadline

## Competition Rules
- Soup must be prepared on-site
- Minimum 5 gallons required
- All ingredients must be disclosed
- No pre-made bases or stocks
- Garnishes encouraged

## Prizes
- Grand Champion: $1,000 + Trophy
- People's Choice: $500 + Trophy
- Category Winners: $250 each
- All participants receive recognition certificate

## How to Register
Visit soupcookoff.com/chefs or call our registration hotline. Registration opens 60 days before each event.`
    }
  ];

  for (const article of kbArticles) {
    await prisma.knowledgeDoc.upsert({
      where: { id: article.id },
      update: { content: article.content },
      create: article
    });
    console.log('Created KB article:', article.title);
  }

  // ============================================
  // BUSINESS CONFIG
  // ============================================
  await prisma.businessConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      organizationName: 'The Soup Cookoff',
      hoursJson: '{"Event Days": "11am-3pm"}',
      address: 'Visit soupcookoff.com for event locations',
      kbMinConfidence: 0.55,
      lowConfidenceAction: 'ask_clarify',
      selectedVoice: 'alloy',
      greeting: 'Thank you for calling AKT Foundation. Home of the Soup Cook Off and the Great Bake Off. I can help you with many things. Would you like to know more or you can tell me how I can help you today.',
      endingEnabled: false,
      endingMessage: 'Thank you for calling. Have a great day!'
    }
  });
  console.log('Created BusinessConfig');

  // ============================================
  // SPONSORSHIP PACKAGES
  // ============================================
  const packages = [
    {
      id: 'pkg-platinum',
      name: 'Platinum',
      subtitle: 'Premier Partner',
      price: 5000,
      available: 2,
      colorClass: 'primary',
      benefits: JSON.stringify([
        'Premium logo placement on all materials',
        '20 VIP tickets',
        'Exclusive booth location',
        'Social media feature posts',
        'Speaking opportunity at event',
        'Year-round recognition on website'
      ])
    },
    {
      id: 'pkg-gold',
      name: 'Gold',
      subtitle: 'Event Sponsor',
      price: 2500,
      available: 5,
      colorClass: 'warning',
      benefits: JSON.stringify([
        'Logo on event signage',
        '10 VIP tickets',
        'Standard booth space',
        'Social media mentions',
        'Website recognition'
      ])
    },
    {
      id: 'pkg-silver',
      name: 'Silver',
      subtitle: 'Community Partner',
      price: 1000,
      available: 10,
      colorClass: 'secondary',
      benefits: JSON.stringify([
        'Logo on event program',
        '6 GA tickets',
        'Website recognition',
        'Social media mention'
      ])
    },
    {
      id: 'pkg-bronze',
      name: 'Bronze',
      subtitle: 'Local Supporter',
      price: 500,
      available: 20,
      colorClass: 'success',
      benefits: JSON.stringify([
        'Name in event program',
        '4 GA tickets',
        'Website recognition'
      ])
    }
  ];

  for (const pkg of packages) {
    await prisma.sponsorshipPackage.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg
    });
  }
  console.log('Created sponsorship packages');

  // ============================================
  // WINNERS
  // ============================================
  const winners = [
    { id: 'winner-1', eventName: '2024 Spring', division: 'Professional', place: 1, chefName: 'Maria Santos', soupName: 'Lobster Bisque', restaurant: 'The Blue Kitchen' },
    { id: 'winner-2', eventName: '2024 Spring', division: 'Professional', place: 2, chefName: 'Tom Bradley', soupName: 'Thai Coconut Curry', restaurant: 'Spice Route' },
    { id: 'winner-3', eventName: '2024 Spring', division: 'Amateur', place: 1, chefName: 'Sarah Johnson', soupName: 'Grandma\'s Chicken Noodle' },
    { id: 'winner-4', eventName: '2023 Fall', division: 'Professional', place: 1, chefName: 'Mike Chen', soupName: 'Smoked Brisket Chili', restaurant: 'BBQ Junction' }
  ];

  for (const winner of winners) {
    await prisma.winner.upsert({
      where: { id: winner.id },
      update: {},
      create: winner
    });
  }
  console.log('Created winners');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

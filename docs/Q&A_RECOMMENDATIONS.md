# Q&A Recommendations - Soup Cookoff Voice Assistant

This document outlines all recommended question-answer pairs that the digital voice assistant should support. Questions are grouped by intent category with sample phrasings and expected responses.

---

## Intent Categories Overview

| Category | Priority | Payment Required |
|----------|----------|------------------|
| Event Information | High | No |
| Ticket Purchase | High | Yes |
| Sponsorship | Medium | No (inquiry) |
| Past Winners | Medium | No |
| Chef Registration | Medium | No |
| About/Mission | Low | No |
| Contact/Transfer | High | No |

---

## 1. Event Information Intent

### Sample Questions (Variations)
```
"When is the next Soup Cook Off?"
"When is the next event?"
"What's the date of the next Soup Cook Off?"
"When is the Harrisburg event?"
"When is the Carlisle event?"
"Where is the next Soup Cook Off?"
"Where is the event held?"
"What's the address?"
"What time does the event start?"
"What time do doors open?"
"How long does the event last?"
"What events do you have coming up?"
"Tell me about your upcoming events"
"Do you have any events in October?"
"Is there an event near me?"
```

### Expected Responses

**When asked about the next event:**
> "Our next Soup Cook Off is in Carlisle on March 2nd, 2025 at the Carlisle Expo Center. Doors open at 11 AM. Would you like to purchase tickets?"

**When asked about Harrisburg specifically:**
> "The Harrisburg Soup Cook Off is on October 19th, 2025 at the Best Western Premier. VIP doors open at 10:30 AM, and general admission at 11 AM. The event runs until 3 PM."

**When asked about event times:**
> "Doors open at 11 AM for general admission. VIP ticket holders get early entry at 10:30 AM. The event runs until 3 PM."

---

## 2. Ticket Purchase Intent

### Sample Questions (Variations)
```
"I'd like to buy tickets"
"How do I get tickets?"
"How much are tickets?"
"What's the ticket price?"
"Can I buy tickets over the phone?"
"I want to purchase tickets"
"What's the difference between GA and VIP?"
"Tell me about VIP tickets"
"Are there discounts?"
"Can I buy tickets at the door?"
"Are children free?"
"I want 2 VIP tickets for Harrisburg"
"Buy tickets"
```

### Expected Responses

**Initial ticket inquiry:**
> "Great! Tickets are available for both our Carlisle and Harrisburg events. General admission is $15 online or $20 at the gate. VIP tickets are $30 to $35 online, or $35 to $40 at the gate, depending on the event. Which event would you like tickets for?"

**GA vs VIP explanation:**
> "General admission includes event entry, a tasting spoon, voting card, and program. VIP tickets add early entry 30 minutes before general admission, plus a commemorative soup bowl, reusable grocery bag, and soup tray. Would you like GA or VIP?"

**Purchase flow start:**
> "Perfect! I can help you purchase tickets right now. Which event - Carlisle on March 2nd or Harrisburg on October 19th?"

**Collecting payment:**
> "Okay, that's [X] VIP tickets for Harrisburg at $35 each, totaling $[total]. I'll need your name, email, and credit card information to complete the purchase. What name should the tickets be under?"

---

## 3. Sponsorship Intent

### Sample Questions (Variations)
```
"How do I become a sponsor?"
"I'm interested in sponsoring"
"What sponsorship levels are available?"
"Tell me about sponsorship opportunities"
"How much does it cost to sponsor?"
"What do I get as a sponsor?"
"Tell me about the Premium package"
"What's included in the Presenting Sponsor package?"
"Can I get a vendor booth?"
"I want to sponsor the event"
"We'd like to be a sponsor"
```

### Expected Responses

**General sponsorship inquiry:**
> "We have four sponsorship levels ranging from $250 to $2,500. The Basic package at $250 includes program advertising and 5 tickets. Our Presenting Sponsor package at $2,500 includes a large vendor booth, 25 tickets, and premium exposure. Would you like details on a specific level?"

**Specific level inquiry (e.g., Premium):**
> "The Premium package is $1,000 and includes a 10 by 10 vendor booth, full-page program ad, 20 complimentary tickets, social media recognition, logo on our banner, and PA announcements during the event. Would you like someone from our team to follow up with you?"

**Capturing sponsor lead:**
> "I'd be happy to have our sponsorship team reach out. Can I get your name, company name, phone number, and which sponsorship level interests you most?"

---

## 4. Past Winners Intent

### Sample Questions (Variations)
```
"Who won the last Soup Cook Off?"
"Who were the winners?"
"Who won?"
"Tell me about past winners"
"What soup won last time?"
"Who won the People's Choice award?"
"Who won at Harrisburg?"
"Have there been any famous winners?"
"What are some winning soups?"
```

### Expected Responses

**Recent winners inquiry:**
> "Our most recent event was the Harrisburg Soup Cook Off in September 2024. You can find the full winner results on our website at soupcookoff.com/winners. Winners are selected by both People's Choice voting and our panel of judges."

**General winners info:**
> "Each event crowns winners in both the People's Choice category, voted by attendees like you, and the Judge's Choice, selected by our professional panel. Categories include Professional Chef and Amateur Chef divisions."

---

## 5. Chef Registration Intent

### Sample Questions (Variations)
```
"How do I enter as a chef?"
"I want to compete"
"How do I register as a chef?"
"What are the chef divisions?"
"Can I enter my soup?"
"How much does it cost to enter as a chef?"
"I'm a professional chef, how do I enter?"
"Can amateurs compete?"
"My kid wants to be a chef, is there a junior division?"
"What are the rules for chefs?"
"How is the competition judged?"
```

### Expected Responses

**General chef inquiry:**
> "We have three chef divisions: Professional for restaurant chefs, Amateur for home cooks at $25 per event, and Junior for young aspiring chefs. To register, visit soupcookoff.com/chef-entry and select your division. Would you like more details about a specific division?"

**Professional chef:**
> "For professional chefs, this is a great opportunity to showcase your restaurant and signature soup. Contact us through our website for registration details and to discuss your entry."

**Amateur chef:**
> "Our Amateur division welcomes home cooks and cooking enthusiasts. Registration is $25 per event. You'll prepare your best soup to be judged on taste, presentation, and creativity. It's a great way to test your skills!"

**Judging criteria:**
> "Soups are judged on taste, presentation, creativity, and overall appeal. There's a People's Choice award voted by attendees and a Judge's Choice selected by our professional panel."

---

## 6. About/Mission Intent

### Sample Questions (Variations)
```
"What is The Soup Cook Off?"
"Tell me about your organization"
"Who benefits from this?"
"Where does the money go?"
"What charity does this support?"
"What is the AKT Foundation?"
"Is this a nonprofit event?"
"How do you help families?"
```

### Expected Responses

**About the event:**
> "The Soup Cook Off is a soup tasting festival featuring over 20 chefs competing for the best soup. It's a fun, family-friendly event where you can taste amazing soups and vote for your favorite."

**About the charity:**
> "All proceeds benefit the AKT Foundation, a 501(c)(3) nonprofit dedicated to providing essential household necessities to families in extreme poverty and those impacted by domestic violence. Your ticket purchase directly helps families in need."

---

## 7. Contact/Transfer Intent

### Sample Questions (Variations)
```
"I'd like to speak to someone"
"Can I talk to a person?"
"Transfer me to a human"
"I need help"
"This isn't helping"
"Get me a real person"
"Let me talk to someone"
"How can I contact you?"
"What's your phone number?"
"Leave a message"
"I want to leave a voicemail"
```

### Expected Responses

**Transfer request:**
> "I'll transfer you to a team member right now. Please hold."

**Contact info request:**
> "You can reach us through our website at soupcookoff.com/contact. We respond to all inquiries within 24 hours. Would you like me to transfer you to someone now, or would you prefer to leave a message?"

**Voicemail:**
> "I'll take a message for our team. Please state your name, phone number, and your message after the beep. Press pound when finished."

---

## 8. Logistics/Practical Questions

### Sample Questions (Variations)
```
"Is parking free?"
"Where do I park?"
"Is the event wheelchair accessible?"
"Can I bring my dog?"
"Are there vegetarian options?"
"Is there seating?"
"What should I bring?"
"Do you take cash?"
"Can I leave and come back?"
"Is there a coat check?"
```

### Expected Responses

**Parking:**
> "Parking varies by venue. The Carlisle Expo Center has free parking. For Harrisburg at the Best Western Premier, please check the event page for parking details."

**Dietary options:**
> "We typically have a variety of soup options including some vegetarian selections. The specific soups vary by event based on our participating chefs."

**What to bring:**
> "Just bring yourself and your appetite! We provide everything you need including a tasting spoon, voting card, and event program. VIP ticket holders receive additional items."

**Payment:**
> "We accept credit cards, PayPal, and Venmo online. Cash is accepted at the door on event day."

---

## 9. Edge Cases & Fallbacks

### Unclear Intent
```
"I have a question"
"Can you help me?"
"Hello?"
"What?"
```

**Response:**
> "I'd be happy to help! I can tell you about our upcoming soup tasting events, help you purchase tickets, provide sponsorship information, or share details about entering as a chef. What would you like to know?"

### Out of Scope Questions
```
"What's the weather?"
"Can you order me a pizza?"
"Tell me a joke"
```

**Response:**
> "I'm the Soup Cook Off assistant, so I can best help with questions about our soup tasting events, tickets, sponsorships, or chef registration. Is there anything about The Soup Cook Off I can help you with?"

### Complaints/Issues
```
"I have a complaint"
"My tickets didn't arrive"
"I need a refund"
"There was a problem"
```

**Response:**
> "I'm sorry to hear you're having an issue. Let me transfer you to a team member who can help resolve this for you. Please hold."

---

## 10. Confirmation & Closing

### After Ticket Purchase
> "Your order is confirmed! You'll receive a confirmation email shortly with your ticket details. Your confirmation number is [CODE]. Is there anything else I can help you with?"

### After Information Query
> "Is there anything else you'd like to know about The Soup Cook Off?"

### Closing
> "Thank you for your interest in The Soup Cook Off! We hope to see you at our next event. Goodbye!"

---

## Voice Response Best Practices

### Do:
- Keep responses concise (aim for under 30 seconds of speech)
- Offer next steps or follow-up options
- Confirm understanding before processing payments
- Use natural, conversational language
- Spell out URLs when needed ("soupcookoff dot com")

### Don't:
- Read long lists verbatim
- Use technical jargon
- Make promises you can't keep
- Skip payment confirmations
- Hang up abruptly

### Confirm Before Actions:
- "Just to confirm, you'd like 2 VIP tickets for the Harrisburg event on October 19th at $35 each, for a total of $70. Is that correct?"
- "I'm going to process your payment now. The charge will appear as 'Soup Cook Off' on your statement."

---

## Recommended IVR Menu Structure

```
Welcome: "Thank you for calling The Soup Cook Off! This call may be recorded."

Main Menu:
  Press 1: Event Information & Tickets
  Press 2: Sponsorship Opportunities
  Press 3: Chef Registration
  Press 4: Speak with Someone
  Press 9: Voice Assistant (AI conversation)

Or say what you need and I'll help you.
```

---

## Metrics to Track

1. **Call Volume**: Total calls per day/week
2. **Intent Distribution**: Which categories get most questions
3. **Resolution Rate**: % of calls resolved without transfer
4. **Ticket Conversion**: % of calls that result in purchase
5. **Average Handle Time**: Duration of calls
6. **Sponsor Leads**: Number of sponsorship inquiries captured
7. **Transfer Rate**: % of calls transferred to human
8. **Voicemail Rate**: % of calls going to voicemail
9. **Repeat Callers**: Returning caller identification
10. **Customer Satisfaction**: Post-call ratings (if implemented)

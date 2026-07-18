import { RequiredDataFromCollectionSlug } from 'payload'

import { richText } from './richtext'

const legalPage = (
  slug: string,
  heading: string,
  blocks: any[],
): RequiredDataFromCollectionSlug<'pages'> => ({
  slug,
  title: heading,
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: richText(heading, 'h1'),
  },
  layout: blocks,
})

export const footerSeedPages = (): RequiredDataFromCollectionSlug<'pages'>[] => [
  {
    slug: 'about',
    title: 'About',
    _status: 'published',
    hero: {
      type: 'lowImpact',
      richText: richText('Our story', 'h1'),
    },
    layout: [
      {
        blockType: 'text',
        content: richText(
          'Naradji is a voice-first commerce layer on a real storefront — speak naturally in any Indian language and complete orders end-to-end, including cash on delivery.',
        ),
      },
      {
        blockType: 'cta',
        richText: richText('Ready to shop by voice?', 'h3'),
        links: [
          {
            link: {
              type: 'custom',
              appearance: 'default',
              label: 'Shop Now',
              url: '/shop',
            },
          },
        ],
      },
    ],
  },
  legalPage('privacy-policy', 'Privacy Policy', [
    { blockType: 'text', content: richText('Last updated: July 2026') },
    {
      blockType: 'text',
      content: richText(
        'Welcome to Naradji. Your privacy is critically important to us. This Privacy Policy details how we collect, use, and protect your personal information when you visit and shop on this storefront.',
      ),
    },
    { blockType: 'text', content: richText('1. Information We Collect', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products, or otherwise contact us. This includes names, phone numbers, email addresses, mailing addresses, billing addresses, and payment information.',
      ),
    },
    { blockType: 'text', content: richText('2. How We Use Your Information', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'We use the information we collect to fulfill and manage your orders, deliver products, and send administrative information. We may also use it to send you marketing and promotional communications (if you have opted in), and to improve our website experience.',
      ),
    },
    { blockType: 'text', content: richText('3. Will Your Information Be Shared?', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We use trusted third-party service providers (like shipping partners) who adhere to strict data security standards.',
      ),
    },
    { blockType: 'text', content: richText('4. Cookies and Tracking Technologies', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'We use cookies and similar tracking technologies to access or store information, personalize your shopping experience, and analyze site traffic.',
      ),
    },
    { blockType: 'text', content: richText('5. Contact Us', 'h3') },
    {
      blockType: 'text',
      content: richText('If you have questions or comments about this policy, you may email us at support@naradji.app.'),
    },
  ]),
  legalPage('shipping-policy', 'Shipping Policy', [
    { blockType: 'text', content: richText('Last updated: July 2026') },
    {
      blockType: 'text',
      content: richText('At Naradji, we strive to deliver your orders as swiftly and safely as possible.'),
    },
    { blockType: 'text', content: richText('1. Processing Time', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'All orders are processed within 2-4 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days.',
      ),
    },
    { blockType: 'text', content: richText('2. Shipping Rates & Delivery Estimates', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'Shipping charges for your order will be calculated and displayed at checkout. We offer Free Standard Shipping on all domestic orders over ₹2000. Delivery typically takes 5-7 business days from the date of dispatch.',
      ),
    },
    { blockType: 'text', content: richText('3. Shipment Confirmation & Order Tracking', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.',
      ),
    },
    { blockType: 'text', content: richText('4. Damages', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'Naradji is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.',
      ),
    },
  ]),
  legalPage('refund-policy', 'Return & Refund Policy', [
    { blockType: 'text', content: richText('Last updated: July 2026') },
    {
      blockType: 'text',
      content: richText(
        'We want you to love your Naradji purchase. If you are not completely satisfied, we are here to help.',
      ),
    },
    { blockType: 'text', content: richText('1. Returns', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'You have 7 calendar days to return an eligible item from the date you received it. Perishable grocery items may not be returnable once delivered. Non-perishable items must be unused and in original packaging where applicable.',
      ),
    },
    { blockType: 'text', content: richText('2. Non-returnable Items', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'Certain items cannot be returned, including custom-made outfits, items purchased during a clearance sale, and accessories for hygiene reasons.',
      ),
    },
    { blockType: 'text', content: richText('3. Refunds', 'h3') },
    {
      blockType: 'text',
      content: richText(
        "Once we receive your item, we will inspect it and notify you that we have received your returned item. If your return is approved, we will initiate a refund to your original method of payment (or provide store credit, depending on your preference). You will receive the credit within a certain amount of days, depending on your card issuer's policies.",
      ),
    },
    { blockType: 'text', content: richText('4. Shipping for Returns', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.',
      ),
    },
  ]),
  legalPage('terms-conditions', 'Terms & Conditions', [
    { blockType: 'text', content: richText('Last updated: July 2026') },
    {
      blockType: 'text',
      content: richText(
        'Please read these terms and conditions carefully before using this website operated by Naradji.',
      ),
    },
    { blockType: 'text', content: richText('1. Conditions of Use', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'By using this website, you certify that you have read and reviewed this Agreement and that you agree to comply with its terms. If you do not want to be bound by the terms of this Agreement, you are advised to leave the website accordingly.',
      ),
    },
    { blockType: 'text', content: richText('2. Intellectual Property', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'You agree that all materials, products, and services provided on this website are the property of Naradji, its affiliates, directors, officers, employees, agents, suppliers, or licensors including all copyrights, trade secrets, trademarks, patents, and other intellectual property. You also agree that you will not reproduce or redistribute Naradji’s intellectual property in any way.',
      ),
    },
    { blockType: 'text', content: richText('3. User Accounts', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'As a user of this website, you may be asked to register with us and provide private information. You are responsible for ensuring the accuracy of this information, and you are responsible for maintaining the safety and security of your identifying information.',
      ),
    },
    { blockType: 'text', content: richText('4. Applicable Law', 'h3') },
    {
      blockType: 'text',
      content: richText(
        'By visiting this website, you agree that the laws of India, without regard to principles of conflict laws, will govern these terms and conditions, or any dispute of any sort that might come between Naradji and you.',
      ),
    },
  ]),
]

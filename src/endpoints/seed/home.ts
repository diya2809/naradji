import type { Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

import { richText } from './richtext'

type HomePageArgs = {
  carouselImages: Media[]
  featuredProductIds: [string, string, string]
  metaImage?: Media | null
}

export const homePageData: (args: HomePageArgs) => RequiredDataFromCollectionSlug<'pages'> = ({
  carouselImages,
  featuredProductIds,
  metaImage,
}) => {
  const [cardOne, cardTwo, cardThree] = carouselImages
  const fallbackImage = cardOne?.id

  return {
    slug: 'home',
    title: 'Home',
    _status: 'published',
    hero: {
      type: 'none',
      links: [],
      richText: null,
      // Clear any previously seeded Asmi/fashion hero uploads.
      media: null,
      mobileMedia: null,
    } as any,
    layout: [
      {
        blockType: 'appleCardsCarousel',
        heading: 'Kitchen staples, ready to order',
        cards: [
          {
            category: 'Dairy',
            title: 'Fresh milk & more',
            image: cardOne?.id ?? fallbackImage,
          },
          {
            category: 'Atta & grains',
            title: 'Daily cooking essentials',
            image: cardTwo?.id ?? fallbackImage,
          },
          {
            category: 'Tea & coffee',
            title: 'Chai time favourites',
            image: cardThree?.id ?? fallbackImage,
          },
          {
            category: 'Snacks',
            title: 'Quick munchies',
            image: cardOne?.id ?? fallbackImage,
          },
        ],
      },
      {
        blockType: 'threeItemGrid',
        heading: 'Popular right now',
        products: featuredProductIds,
      },
      {
        blockType: 'carousel',
        heading: 'More from the kirana',
        populateBy: 'collection',
        relationTo: 'products',
        limit: 8,
      },
      {
        blockType: 'reviews',
        headline: 'What shoppers say',
        reviews: [
          {
            author: 'Priya S.',
            text: 'Bol ke order ho gaya — atta, doodh, chai. COD pe haan pakka, bilkul simple.',
            rating: 5,
          },
          {
            author: 'Ravi M.',
            text: 'Voice se cart banaya, prices clear the. Delivery pe paisa — no app hopping.',
            rating: 5,
          },
          {
            author: 'Meera K.',
            text: 'Gujarat-style Hinglish mein samajh gaya. Kirana list ek baar mein done.',
            rating: 5,
          },
        ],
      },
      {
        blockType: 'faq',
        headline: 'Questions, answered',
        items: [
          {
            question: 'Can I order by voice?',
            answer: richText(
              'Yes. Hold the mic and speak in Hindi, Hinglish, or Gujarati. Say items like atta, doodh, chai — then confirm with “haan pakka”.',
            ),
          },
          {
            question: 'Do you support Cash on Delivery?',
            answer: richText(
              'Yes. Say COD while ordering, then confirm with “haan pakka” to place the order.',
            ),
          },
          {
            question: 'Do you ship across India?',
            answer: richText(
              'Yes. Shipping is calculated at checkout. Free shipping on orders over ₹1,999.',
            ),
          },
          {
            question: 'How long does delivery take?',
            answer: richText('Standard grocery orders typically ship in 2–4 business days.'),
          },
        ],
      },
    ],
    meta: {
      title: 'Naradji — voice grocery',
      description: 'Speak your kirana list. Order with COD. Haan pakka.',
      ...(metaImage ? { image: metaImage.id } : {}),
    },
  }
}

import type { Block } from 'payload'

import { blockTabs } from '@/fields/blockTabs'
import { responsiveMediaFields } from '@/fields/responsiveMedia'
import { mediaBlockStyleFields } from '@/fields/responsiveLayout'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: blockTabs(responsiveMediaFields({ required: true }), mediaBlockStyleFields),
}

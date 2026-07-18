import { cn } from '@/utilities/cn'

export type MobileLayout = 'default' | 'compact' | 'hideMobile' | 'hideDesktop' | null | undefined
export type TextAlign = 'auto' | 'left' | 'center' | 'right' | null | undefined
export type ImagePosition = 'left' | 'right' | 'top' | 'bottom' | null | undefined
export type MobileImagePosition = 'top' | 'bottom' | 'hidden' | null | undefined

export function getBlockVisibilityClasses(mobileLayout?: MobileLayout) {
  switch (mobileLayout) {
    case 'hideMobile':
      return 'hidden md:block'
    case 'hideDesktop':
      return 'block md:hidden'
    default:
      return ''
  }
}

/** Vertical gap between CMS blocks — single stack on RenderBlocks (avoids doubled section padding). */
export function getBlockStackGapClasses() {
  return 'flex flex-col gap-10 md:gap-12'
}

/** Space below block headings — keep consistent across blocks. */
export const blockHeadingSpacingClass = 'mb-6'

export function getTextAlignClasses(textAlign?: TextAlign) {
  switch (textAlign) {
    case 'left':
      return 'text-left'
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return ''
  }
}

const desktopColumnClasses: Record<string, string> = {
  auto: '',
  '1': 'md:grid-cols-1',
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-3',
  '4': 'md:grid-cols-4',
  '6': 'md:grid-cols-6',
}

export function getGridColumnClasses(
  mobileColumns?: string | null,
  desktopColumns?: string | null,
  fallbackDesktop = '',
) {
  const mobile = mobileColumns === '2' ? 'grid-cols-2' : 'grid-cols-1'
  const desktop =
    desktopColumns && desktopColumns !== 'auto'
      ? desktopColumnClasses[desktopColumns] || fallbackDesktop
      : fallbackDesktop

  return cn('grid', mobile, desktop)
}

export function getImagePositionClasses(
  imagePosition?: ImagePosition,
  mobileImagePosition?: MobileImagePosition,
) {
  const desktop =
    imagePosition === 'right'
      ? 'md:flex-row-reverse'
      : imagePosition === 'top'
        ? 'md:flex-col'
        : imagePosition === 'bottom'
          ? 'md:flex-col-reverse'
          : 'md:flex-row'

  const mobile =
    mobileImagePosition === 'bottom'
      ? 'flex-col-reverse'
      : mobileImagePosition === 'hidden'
        ? 'flex-col'
        : 'flex-col'

  return cn('flex', mobile, desktop)
}

export function shouldHideImageOnMobile(mobileImagePosition?: MobileImagePosition) {
  return mobileImagePosition === 'hidden'
}

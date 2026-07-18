import type { PayloadRichText, PayloadRichTextChild } from '@/types/lexical'

const textNode = (text: string) => ({
  type: 'text' as const,
  version: 1,
  text,
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
})

/** Stacked hero lines inside one h1 — each entry renders on its own row. */
export const heroHeadlineStack = (lines: string[]): PayloadRichText => {
  const children = lines.flatMap((line, index) => {
    const nodes: Array<ReturnType<typeof textNode> | { type: 'linebreak'; version: 1 }> = []

    if (index > 0) {
      nodes.push({ type: 'linebreak', version: 1 })
    }

    nodes.push(textNode(line))
    return nodes
  })

  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: [
        {
          type: 'heading',
          tag: 'h1',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children,
        },
      ],
    },
  }
}

export const richText = (text: string, heading?: 'h1' | 'h2' | 'h3' | 'h4'): PayloadRichText => {
  const headingNode: PayloadRichTextChild[] = heading
    ? [
        {
          type: 'heading',
          tag: heading,
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [textNode(text)],
        },
      ]
    : []

  const paragraphNodes: PayloadRichTextChild[] = heading
    ? []
    : [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          children: [textNode(text)],
        },
      ]

  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: [...headingNode, ...paragraphNodes],
    },
  }
}

export type TocLink = {
  id: string
  text: string
  depth?: number
  children?: TocLink[]
}

export type FlatTocLink = TocLink & { depth: number }

export function flattenToc(links: TocLink[] = [], fallbackDepth = 2): FlatTocLink[] {
  return links.flatMap((link) => {
    const depth = link.depth ?? fallbackDepth

    return [
      { ...link, depth },
      ...flattenToc(link.children, depth + 1),
    ]
  })
}

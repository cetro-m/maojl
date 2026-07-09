const entryFields = [
  'path',
  'title',
  'description',
  'date',
  'category',
  'tags',
  'featured',
  'readingTime',
] as const

const navigationFields = [
  'path',
  'title',
  'description',
  'date',
  'category',
  'tags',
] as const

type ContentCollectionName = 'blog' | 'notes'

export function queryPublishedEntries(collection: ContentCollectionName) {
  return queryCollection(collection)
    .select(...entryFields)
    .where('draft', '=', false)
    .order('date', 'DESC')
}

export function queryPublishedNavigation(collection: ContentCollectionName) {
  return queryCollection(collection)
    .select(...navigationFields)
    .where('draft', '=', false)
    .order('date', 'DESC')
}

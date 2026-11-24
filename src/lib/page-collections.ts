// Tina collections that hold a group of designed pages under one URL folder.
// index.md is the folder's own page (e.g. /tires/), every other file is /<folder>/<file-name>/.
export const SECTION_COLLECTIONS = {
  areas: { label: 'Areas', base: 'areas' },
  services: { label: 'Services', base: 'services' },
  tires: { label: 'Tires', base: 'tires' },
  vehicles: { label: 'Vehicles', base: 'vehicles' },
  gallery: { label: 'Gallery', base: 'about/gallery' },
} as const;

export type SectionCollection = keyof typeof SECTION_COLLECTIONS;
export type DesignedCollection = 'page' | SectionCollection;

export const sectionSlug = (collection: SectionCollection, filename: string) =>
  filename === 'index' ? SECTION_COLLECTIONS[collection].base : `${SECTION_COLLECTIONS[collection].base}/${filename}`;

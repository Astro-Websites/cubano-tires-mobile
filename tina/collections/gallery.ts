import type { Collection } from 'tinacms';
import { designedPageFields } from './page';

// The photo gallery: index.md is the gallery page (/about/gallery/), every other file is an
// album (/about/gallery/<file-name>/). Same fields as Pages; new albums start from the album layout.
const albumSections = [
  {
    label: 'Album intro',
    copy: [
      { role: 'Breadcrumb', text: 'New album' },
      { role: 'Eyebrow', text: 'PHOTO ALBUM' },
      { role: 'Main heading', text: 'New album' },
      { role: 'Paragraph', text: 'A short description of this album.' },
    ],
    links: [
      { role: 'Link', label: 'Home', url: '/' },
      { role: 'Link', label: 'Gallery', url: '/about/gallery/' },
      { role: 'Button', label: 'Text Us a Photo of Your Tire', url: 'sms:{{phoneDigits}}' },
      { role: 'Button', label: 'Call {{phone}}', url: 'tel:{{phoneDigits}}' },
    ],
    images: [],
  },
  {
    label: 'Photos',
    copy: [
      { role: 'Eyebrow', text: 'Real Jobs' },
      { role: 'Heading', text: 'Our work' },
      { role: 'Paragraph', text: 'Tap any photo to see it full size.' },
    ],
    links: [],
    images: [],
    cards: [],
  },
  {
    label: 'More albums',
    copy: [{ role: 'Heading', text: 'More albums' }],
    links: [{ role: 'Link', label: '← Back to the gallery', url: '/about/gallery/' }],
    images: [],
    cards: [],
  },
  {
    label: 'CTA',
    copy: [
      { role: 'Heading', text: 'Want your car in our next album? Text us a photo.' },
      { role: 'Paragraph', text: 'Text a photo of the tire and where you are parked. We reply with a price and an arrival time, {{weekdayDays}}, {{weekdayHours}}.' },
    ],
    links: [
      { role: 'Button', label: 'Text Us a Photo of Your Tire', url: 'sms:{{phoneDigits}}' },
      { role: 'Button', label: 'Call {{phone}}', url: 'tel:{{phoneDigits}}' },
    ],
    images: [],
  },
];

export const GalleryCollection: Collection = {
  name: 'gallery',
  label: 'Gallery',
  path: 'src/content/gallery',
  format: 'md',
  defaultItem: () => ({ title: 'New album', description: 'A short description of this album.', demoTemplate: 'gallery-album', demoSections: albumSections }),
  ui: {
    router: ({ document }) => document._sys.filename === 'index' ? '/about/gallery/' : `/about/gallery/${document._sys.filename}/`,
    filename: {
      readonly: false,
      description: 'The file name becomes the album URL: /about/gallery/<file-name>/. "index" is the main Gallery page.',
      slugify: (values) =>
        String(values?.title || 'untitled')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
    },
  },
  fields: designedPageFields,
};

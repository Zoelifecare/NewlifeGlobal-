export type PublishStatus = "draft" | "published" | "archived";

export interface Media {
  id: string;
  /** Resolved public URL (storage public URL, local /media path, or external URL). */
  url: string;
  kind: "image" | "video" | "audio" | "embed" | "document";
  alt: string;
  credit?: string | null;
  sourceUrl?: string | null;
  width?: number | null;
  height?: number | null;
  category?: string | null;
}

export interface ServiceTime {
  name: string;
  day: string;
  time: string;
  location: string;
  note?: string;
  /** Online meeting link (https), e.g. Zoom for Morning Glory prayer. */
  joinUrl?: string;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  tagline: string;
  pillars: string[];
  verse: { ref: string; text: string };
  address: { line1: string; city: string; region: string; postal: string; country: string; mapQuery: string };
  timezone: string;
  services: ServiceTime[];
  contact: { email: string | null; phone: string | null };
  social: { label: string; url: string }[];
  /** One short line in the church's own words (footer, metadata). */
  statement: string;
  logo: { color: string; white: string; alt: string };
  giving: GivingSettings;
  navigation: NavItem[];
  /** Page visibility: hidden pages return 404 and drop out of menus. */
  pages: Record<string, boolean>;
  visitFaq: { q: string; a: string }[];
}

export interface GivingMethod {
  label: string;
  description: string;
  /** Approved external giving link (https only). */
  url: string | null;
  /** Shown when there is no link, e.g. "Give during Sunday service". */
  note: string | null;
}

export interface GivingSettings {
  enabled: boolean;
  methods: GivingMethod[];
}

export interface NavItem {
  label: string;
  href: string;
  visible: boolean;
  description?: string;
  children?: NavItem[];
}

export interface ChurchContentValue {
  title?: string;
  body?: string;
  items?: { title: string; text: string }[];
}

export type ChurchContent = Record<string, ChurchContentValue>;

export interface HeroSlide {
  index: string;
  label: string;
  caption: string;
  headline: string;
  body: string;
  mediaId: string;
}

export interface HomepageSection<T = Record<string, unknown>> {
  key: string;
  kicker: string | null;
  title: string | null;
  body: string | null;
  data: T;
  sortOrder: number;
  isVisible: boolean;
}

export interface Leader {
  id: string;
  slug: string;
  name: string;
  title: string;
  roleGroup: "pastor" | "leader" | "staff";
  bio: string | null;
  photo: Media | null;
  instagram: string | null;
  needsReview: boolean;
  sortOrder: number;
}

export interface Ministry {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  image: Media | null;
  meetingSchedule: string | null;
  location: string | null;
  contactEmail: string | null;
  activities: string[];
  joinUrl: string | null;
  leaders: { leader: Leader; roleTitle: string | null }[];
  sortOrder: number;
  isFeatured: boolean;
}

export interface SermonCategory {
  id: string;
  slug: string;
  name: string;
}

export interface Sermon {
  id: string;
  slug: string;
  title: string;
  speakerName: string;
  speaker: Leader | null;
  description: string | null;
  scripture: string | null;
  series: string | null;
  category: SermonCategory | null;
  videoUrl: string | null;
  audioUrl: string | null;
  thumbnail: string | null;
  preachedOn: string | null;
  isFeatured: boolean;
  sourceNote: string | null;
}

export interface ChurchEvent {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  startsAt: string;
  endsAt: string | null;
  venue: string | null;
  address: string | null;
  registrationUrl: string | null;
  image: Media | null;
  isFeatured: boolean;
  ministryId?: string | null;
}

export interface GalleryCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface GalleryItem {
  id: string;
  media: Media;
  category: GalleryCategory | null;
  title: string | null;
  caption: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isPinned: boolean;
}

export type PaymentKind = "online_link" | "zelle" | "cashapp" | "bank_transfer" | "cash_drop" | "check" | "other";

export interface PaymentMethodPublic {
  id: string;
  kind: PaymentKind;
  label: string;
  description: string | null;
  instructions: string | null;
  handle: string | null;
  url: string | null;
  location: string | null;
  referenceInfo: string | null;
  image: Media | null;
  supportsRecurring: boolean;
}

export interface GivingCatalog {
  designations: { id: string; name: string; description: string | null }[];
  methods: PaymentMethodPublic[];
}

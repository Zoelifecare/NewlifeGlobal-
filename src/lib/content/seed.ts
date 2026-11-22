/**
 * Verified starter content: the single source for `supabase/seed.sql` (see scripts/generate-seed.mjs)
 * and the read-only fallback used when the database is unavailable.
 *
 * IDENTITY RULE (owner feedback 2026-11-20): New Life Global is an independent church in the United States.
 * No Rwanda / Kigali / Africa New Life history, ministries, leadership stories or "25 years" narrative.
 * Every fact here comes from the church's own Instagram (@newlifeglobalaz) or from the owner.
 * Anything not yet confirmed is an unpublished draft (status "needs_confirmation"), never public.
 */
import type {
  Announcement, ChurchContentValue, ChurchEvent, GalleryCategory, GalleryItem, HomepageSection, Leader, Media, Ministry,
  Sermon, SermonCategory, SiteSettings,
} from "./types";

const AZ = "-07:00"; // Arizona (no DST)
const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const MAPS = "https://www.google.com/maps/search/?api=1&query=800+W+Galveston+St+Chandler+AZ+85225";
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

// ------------------------------------------------------------------ media (owner approved, @newlifeglobalaz)
const m = (id: string, file: string, alt: string, category: string, source: string, extra: Partial<Media> = {}): Media => ({
  id, url: `/media/instagram/${file}.jpg`, kind: "image", alt, credit: "New Life Global AZ",
  sourceUrl: `https://www.instagram.com/p/${source}/`, category, ...extra,
});

export const seedMedia: Media[] = [
  ...Array.from({ length: 11 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return m(`ig-rw-${n}`, `refresh-women-2026-${n}`, `Refresh Women 2026 conference at New Life Global, photo ${i + 1}`, "conferences", "DZdhdFGklcE");
  }),
  m("ig-seat-saved", "sunday-seat-saved", "Pastor Fred Katagwa preaching at New Life Global in Chandler", "services", "Dc7f_W0u-5_"),
  m("ig-fellowship", "sunday-fellowship-reel", "Sunday fellowship and praise at New Life Global", "worship", "DcaCLRBOIIi"),
  m("ig-serving", "serving-team", "Members of New Life Global serving on Sunday", "community", "Db9jqlBlA-2"),
  m("ig-sunday-school", "sunday-school-reel", "New Life Global Sunday School", "community", "DaTGyC9uiwW"),
  m("ig-night-prayer", "night-of-prayer-flyer", "Night of Prayer flyer with guest Pastor Edmond Kivuye", "events", "DaQzfhKS0UQ"),
  m("ig-church-family", "church-family", "The New Life Global church family", "community", "DaD-cxNEpRS"),
  m("ig-sundays-chandler", "sundays-chandler-reel", "Sunday service at New Life Global in Chandler, Arizona", "services", "DZqcJlTS2u-"),
  m("ig-rw-promo", "refresh-women-promo-reel", "Refresh Women 2026 worship promo", "conferences", "DY6dF-BuxuT"),
  m("ig-rw-save-date", "refresh-women-save-date-reel", "Refresh Women 2026 save the date", "conferences", "DYvv9hAuI2b"),
  m("ig-anniversary", "anniversary-2026-flyer", "New Life Global 1st Anniversary flyer", "celebrations", "DfKlx2vOXFA", { credit: "New Life Global AZ" }),
  m("ig-program", "church-program-flyer", "New Life Global church program: Sunday Service, Night Prayer, Night of Worship, Morning Glory", "services", "Da07hfnSJe-"),
];

const media = (id: string): Media => {
  const found = seedMedia.find((x) => x.id === id);
  if (!found) throw new Error(`seed media ${id} missing`);
  return found;
};

// ------------------------------------------------------------------ settings
export const seedSettings: SiteSettings = {
  name: "New Life Global",
  shortName: "New Life Global AZ",
  tagline: "Worship • Grow • Serve",
  pillars: ["A Place of Love", "A Family of Faith", "A Future of Hope"],
  verse: {
    ref: "Matthew 28:19",
    text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.",
  },
  address: {
    line1: "800 W Galveston St", city: "Chandler", region: "AZ", postal: "85225", country: "USA",
    mapQuery: "800 W Galveston St, Chandler, AZ 85225",
  },
  timezone: "America/Phoenix",
  services: [
    { name: "Sunday Service", day: "Every Sunday", time: "3:00 to 5:00 PM", location: "800 W Galveston St, Chandler" },
    { name: "Night Prayer", day: "First Friday of the month", time: "9:00 PM to 12:00 AM", location: "800 W Galveston St, Chandler" },
    { name: "Night of Worship", day: "Other Fridays", time: "8:00 to 11:00 PM", location: "Gilbert, AZ", note: "Contact us for the location" },
    { name: "Morning Glory", day: "Daily except Monday & Saturday", time: "5:00 AM", location: "Online on Zoom", joinUrl: "https://us06web.zoom.us/j/86361850934?pwd=FjgiUNYVWfhaBrpRXjPTa4ZgVBVMBL.1" },
  ],
  contact: { email: null, phone: null },
  social: [{ label: "Instagram", url: "https://www.instagram.com/newlifeglobalaz/" }],
  statement: "A place of love, a family of faith and a future of hope in Chandler, Arizona",
  logo: { color: "/media/brand/nlc-logo-color.png", white: "/media/brand/nlc-logo-white.png", alt: "New Life Global" },
  giving: { enabled: true, methods: [] }, // no approved giving provider yet: the Give page says so honestly
  navigation: [
    {
      label: "About", href: "/about", visible: true, children: [
        { label: "Who We Are", href: "/about", visible: true, description: "Welcome to New Life Global" },
        { label: "Our Story", href: "/about#story", visible: true, description: "How our church began" },
        { label: "Mission & Vision", href: "/about#mission", visible: true, description: "Why we exist" },
        { label: "What We Believe", href: "/about#beliefs", visible: true, description: "Our core beliefs" },
        { label: "Leadership", href: "/about#leadership", visible: true, description: "Meet our pastors" },
      ],
    },
    {
      label: "I'm New", href: "/visit", visible: true, children: [
        { label: "Plan Your Visit", href: "/visit", visible: true, description: "Times, location and what to expect" },
        { label: "Events", href: "/events", visible: true, description: "Gatherings and celebrations" },
        { label: "Prayer Requests", href: "/prayer", visible: true, description: "Share a request in confidence" },
      ],
    },
    { label: "Ministries", href: "/ministries", visible: true },
    {
      label: "Messages", href: "/messages", visible: true, children: [
        { label: "Messages", href: "/messages", visible: true, description: "Watch sermons" },
        { label: "Gallery", href: "/gallery", visible: true, description: "Life together in pictures" },
      ],
    },
    { label: "Contact", href: "/contact", visible: true },
  ],
  pages: { about: true, ministries: true, messages: true, events: true, gallery: true, prayer: true, visit: true, contact: true, give: true },
  visitFaq: [
    { q: "When do you meet?", a: "Every Sunday from 3:00 to 5:00 PM." },
    { q: "Where do you meet?", a: "800 W Galveston St, Chandler, AZ 85225." },
    { q: "Is there something for children?", a: "Yes. We have a growing Sunday School. Contact us if you have questions before your visit." },
    { q: "Can I pray with the church during the week?", a: "Yes. Night Prayer is on the first Friday of each month at 9:00 PM, and Morning Glory prayer is at 5:00 AM on Zoom every day except Monday and Saturday. The Zoom link is on the Visit and Prayer pages." },
  ],
};

// ------------------------------------------------------------------ church identity content
// requiresApproval = super admin must approve before it goes public. Empty drafts await Pastor Charles.
export interface SeedChurchContent {
  key: string;
  label: string;
  sortOrder: number;
  requiresApproval: boolean;
  status: "draft" | "pending" | "published" | "needs_confirmation";
  draft: ChurchContentValue;
  published: ChurchContentValue | null;
  note?: string;
}

const welcome: ChurchContentValue = {
  title: "Welcome to New Life Global",
  body: "A place of love, a family of faith, a future of hope. We gather every Sunday at 3:00 PM in Chandler, Arizona to worship, grow and serve together, and there is a seat saved for you.",
};
const expect: ChurchContentValue = {
  title: "What to expect",
  body: "Our Sunday service runs from 3:00 to 5:00 PM with worship, prayer and a message from the Word. Arrive a few minutes early and someone from our team will be glad to welcome you.",
};
const kids: ChurchContentValue = {
  title: "Kids",
  body: "We have a growing Sunday School for children. If you have questions before your visit, let us know in the form below.",
};
const giveIntro: ChurchContentValue = {
  title: "Give",
  body: "Thank you for supporting the ministry of New Life Global.",
};

export const seedChurchContent: SeedChurchContent[] = [
  { key: "about_intro", label: "About New Life Global", sortOrder: 1, requiresApproval: false, status: "published", draft: welcome, published: welcome },
  { key: "our_story", label: "Our Story", sortOrder: 2, requiresApproval: true, status: "needs_confirmation", draft: { title: "Our Story", body: "" }, published: null, note: "Awaiting the official church story from Pastor Charles." },
  { key: "mission", label: "Mission", sortOrder: 3, requiresApproval: true, status: "needs_confirmation", draft: { title: "Our Mission", body: "" }, published: null, note: "Awaiting the official mission statement." },
  { key: "vision", label: "Vision", sortOrder: 4, requiresApproval: true, status: "needs_confirmation", draft: { title: "Our Vision", body: "" }, published: null, note: "Awaiting the official vision statement." },
  {
    key: "core_values", label: "Core Values", sortOrder: 5, requiresApproval: true, status: "needs_confirmation",
    draft: { title: "Our Values", items: [{ title: "Worship", text: "" }, { title: "Grow", text: "" }, { title: "Serve", text: "" }] }, published: null,
    note: "Draft taken from the church program tagline (Worship • Grow • Serve). Confirm and add descriptions before publishing.",
  },
  { key: "beliefs", label: "What We Believe", sortOrder: 6, requiresApproval: true, status: "needs_confirmation", draft: { title: "What We Believe", items: [] }, published: null, note: "Awaiting the church's statement of faith." },
  { key: "visit_intro", label: "Plan Your Visit: introduction", sortOrder: 7, requiresApproval: false, status: "published", draft: { title: "We saved you a seat.", body: "Whether you are new to church or looking for a church family, you are welcome at New Life Global." }, published: { title: "We saved you a seat.", body: "Whether you are new to church or looking for a church family, you are welcome at New Life Global." } },
  { key: "visit_expect", label: "Plan Your Visit: what to expect", sortOrder: 8, requiresApproval: false, status: "published", draft: expect, published: expect },
  { key: "visit_kids", label: "Plan Your Visit: kids", sortOrder: 9, requiresApproval: false, status: "published", draft: kids, published: kids },
  { key: "give_intro", label: "Giving page introduction", sortOrder: 10, requiresApproval: false, status: "published", draft: giveIntro, published: giveIntro },
];

// ------------------------------------------------------------------ people (names and titles from the owner; bios await confirmation)
const leader = (l: Omit<Leader, "photo"> & { photoId?: string }): Leader => ({
  ...l, photo: l.photoId ? media(l.photoId) : null,
});

export const seedLeaders: Leader[] = [
  leader({ id: "ld-charles", slug: "charles-mugisha", name: "Pastor Charles Mugisha", title: "Pastor", roleGroup: "pastor", sortOrder: 1, needsReview: true, instagram: null, bio: null }),
  leader({ id: "ld-florence", slug: "florence-mugisha", name: "Pastor Florence Mugisha", title: "Pastor", roleGroup: "pastor", sortOrder: 2, needsReview: true, instagram: null, bio: null }),
  leader({ id: "ld-augustine", slug: "augustine-ndemezo", name: "Augustine Ndemezo", title: "Church Leadership", roleGroup: "pastor", sortOrder: 3, needsReview: true, instagram: null, bio: null }),
  leader({ id: "ld-enock", slug: "enock-rwakatale", name: "Pastor Enock Rwakatale", title: "Worship Pastor", roleGroup: "pastor", sortOrder: 4, needsReview: true, instagram: null, bio: null }),
];
/** Leaders whose sermons may be published wherever they preached (sermon rule 1). */
export const publishAnywhereLeaders = ["ld-charles"];

// ------------------------------------------------------------------ ministries (from the church program and Instagram captions)
export const seedMinistries: Ministry[] = [
  {
    id: "mn-worship", slug: "worship", name: "Worship", tagline: "Lively, heartfelt worship",
    summary: "Leading the church in worship on Sundays and at our Friday Night of Worship.",
    description: "Our worship team leads the Sunday service and our Friday Night of Worship.",
    image: media("ig-rw-09"), meetingSchedule: "Sundays 3:00 PM · Fridays 8:00 PM", location: "Chandler & Gilbert, AZ",
    contactEmail: null, activities: ["Sunday worship", "Night of Worship"], joinUrl: "/contact?topic=worship",
    leaders: [{ leader: seedLeaders[3], roleTitle: "Worship Pastor" }], sortOrder: 1, isFeatured: true,
  },
  {
    id: "mn-prayer", slug: "prayer", name: "Prayer", tagline: "A praying church",
    summary: "Night Prayer every first Friday and Morning Glory prayer at 5 AM.",
    description: "On the first Friday of each month we gather for Night Prayer, and Morning Glory prayer meets at 5:00 AM every day except Monday and Saturday.",
    image: media("ig-night-prayer"), meetingSchedule: "First Friday 9:00 PM · Morning Glory 5:00 AM", location: "800 W Galveston St, Chandler",
    contactEmail: null, activities: ["Night Prayer", "Morning Glory", "Prayer requests"], joinUrl: "/prayer",
    leaders: [], sortOrder: 2, isFeatured: true,
  },
  {
    id: "mn-women", slug: "women", name: "Women", tagline: "Refresh Women",
    summary: "Women growing in faith together, and home of the Refresh Women conference.",
    description: "In 2026 we hosted Refresh Women: we laughed, worshipped, learned and left refreshed and encouraged.",
    image: media("ig-rw-03"), meetingSchedule: "Announced through our events page", location: "Chandler, AZ",
    contactEmail: null, activities: ["Refresh Women conference"], joinUrl: "/contact?topic=women",
    leaders: [], sortOrder: 3, isFeatured: false,
  },
  {
    id: "mn-children", slug: "children", name: "Children", tagline: "Sunday School",
    summary: "Our growing Sunday School shapes the next generation with God's Word.",
    description: "We believe our children are the next generation that will carry the Gospel to the nations, and our Sunday School is growing every week.",
    image: media("ig-sunday-school"), meetingSchedule: "Sundays", location: "800 W Galveston St, Chandler",
    contactEmail: null, activities: ["Sunday School"], joinUrl: "/visit#kids",
    leaders: [], sortOrder: 4, isFeatured: true,
  },
  {
    id: "mn-serve", slug: "serve", name: "Serve Team", tagline: "Serving God and His people",
    summary: "Serving the Lord and His people is a gift we never take for granted.",
    description: "Serving the Lord and His people is a gift we never take for granted.",
    image: media("ig-serving"), meetingSchedule: "Sundays", location: "800 W Galveston St, Chandler",
    contactEmail: null, activities: ["Sunday serving"], joinUrl: "/contact?topic=serve",
    leaders: [], sortOrder: 5, isFeatured: false,
  },
];

// ------------------------------------------------------------------ messages
// Sermon rules: Pastor Charles' sermons wherever he preached; other preachers only when preached at the
// Arizona church; preacher and location verified before publication.
export const seedSermonCategories: SermonCategory[] = [
  { id: "sc-family", slug: "marriage-family", name: "Marriage & Family" },
  { id: "sc-kinyarwanda", slug: "kinyarwanda", name: "Kinyarwanda" },
];
const cat = (slug: string) => seedSermonCategories.find((c) => c.slug === slug) ?? null;

export interface SeedSermonMeta { location: string; preachedInArizona: boolean; preacherVerified: boolean; locationVerified: boolean }
export const seedSermonMeta: Record<string, SeedSermonMeta> = {};

const sermon = (s: Omit<Sermon, "thumbnail" | "videoUrl" | "audioUrl" | "speaker" | "sourceNote" | "category"> & { yt: string; cat: string; speakerId?: string; location: string }): Sermon => {
  seedSermonMeta[s.id] = { location: s.location, preachedInArizona: false, preacherVerified: true, locationVerified: true };
  return {
    id: s.id, slug: s.slug, title: s.title, speakerName: s.speakerName, description: s.description, scripture: s.scripture,
    series: s.series, preachedOn: s.preachedOn, isFeatured: s.isFeatured,
    videoUrl: yt(s.yt), audioUrl: null, thumbnail: ytThumb(s.yt), category: cat(s.cat), sourceNote: "YouTube",
    speaker: s.speakerId ? seedLeaders.find((l) => l.id === s.speakerId) ?? null : null,
  };
};

const CHARLES = { speakerName: "Pastor Charles Mugisha", speakerId: "ld-charles", location: "Recorded and published on YouTube (preached outside Arizona)" };
export const seedSermons: Sermon[] = [
  sermon({ id: "sm-dev-stages", slug: "the-development-stages-of-marriage", title: "The Development Stages of Marriage", ...CHARLES, description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-10-04", isFeatured: true, yt: "tsNcq0xw4pU", cat: "marriage-family" }),
  sermon({ id: "sm-healing-2", slug: "healing-the-heart-before-building-the-home-part-2", title: "Healing the Heart Before Building the Home, Part II", ...CHARLES, description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-09-27", isFeatured: false, yt: "5mJK1C-Gn28", cat: "marriage-family" }),
  sermon({ id: "sm-healing-1", slug: "healing-the-heart-before-building-the-home", title: "Healing the Heart Before Building the Home", ...CHARLES, description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-09-20", isFeatured: false, yt: "dms4ZG8jnAI", cat: "marriage-family" }),
  sermon({ id: "sm-design-2", slug: "marriage-by-gods-design-part-2", title: "Marriage by God's Design, Part II", ...CHARLES, description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-08-30", isFeatured: false, yt: "oSKpkY-2V9Q", cat: "marriage-family" }),
  sermon({ id: "sm-urushako", slug: "urushako-mu-mugambi-wimana-1", title: "Urushako Mu Mugambi W'Imana, Igice Cya Mbere", ...CHARLES, description: "Message in Kinyarwanda.", scripture: null, series: null, preachedOn: "2026-08-30", isFeatured: false, yt: "1ZUXsY0iy60", cat: "kinyarwanda" }),
];

// ------------------------------------------------------------------ events (from @newlifeglobalaz)
export const seedEvents: ChurchEvent[] = [
  {
    id: "ev-anniversary", slug: "first-anniversary-2026", title: "1st Year Anniversary: For Thy Is The Glory",
    summary: "Celebrate New Life Global's first year with worship and the Word.",
    description: "Big day coming! Celebrate with us at New Life Global's 1st Year Anniversary, hosted by Pastors Charles & Florence Mugisha, with Pastor Alain Muhire and Pastor Enock Rwakatale.\n\nSaturday, December 12: doors open at 4:00 PM.\nSunday, December 13: doors open at 2:00 PM.\n\nCome and be a part of this special celebration, and bring a friend.",
    category: "Celebration", startsAt: `2026-12-12T16:00:00${AZ}`, endsAt: `2026-12-13T19:00:00${AZ}`,
    venue: "New Life Global", address: "800 W Galveston St, Chandler, AZ 85225", registrationUrl: null,
    image: media("ig-anniversary"), isFeatured: true, ministryId: null,
  },
  {
    id: "ev-night-prayer-jul", slug: "night-of-prayer-july-2026", title: "Night of Prayer",
    summary: "Starting the new month with God, with guest Pastor Edmond Kivuye.",
    description: "Come and start the new month with God at our Night of Prayer, with guest Pastor Edmond Kivuye.",
    category: "Prayer", startsAt: `2026-07-03T21:00:00${AZ}`, endsAt: `2026-07-04T00:00:00${AZ}`,
    venue: "New Life Global", address: "800 W Galveston St, Chandler, AZ 85225", registrationUrl: null,
    image: media("ig-night-prayer"), isFeatured: false, ministryId: "mn-prayer",
  },
  {
    id: "ev-refresh-women", slug: "refresh-women-2026", title: "Refresh Women 2026",
    summary: "A revival weekend for women: worship, teaching and fellowship.",
    description: "Refresh Women 2026 was an incredible, life changing experience. We laughed, worshipped, learned and left refreshed and encouraged. Pastor Grace's message taught us to ignite the fire and keep it burning, with worship from Alain Muhire, Lynca Muhire and Pastor Enock.",
    category: "Conference", startsAt: `2026-05-29T18:00:00${AZ}`, endsAt: null,
    venue: "New Life Global", address: "Chandler, AZ", registrationUrl: null,
    image: media("ig-rw-01"), isFeatured: false, ministryId: "mn-women",
  },
];

// ------------------------------------------------------------------ gallery albums
export const seedGalleryCategories: GalleryCategory[] = [
  { id: "gc-worship", slug: "worship", name: "Worship", description: null },
  { id: "gc-services", slug: "services", name: "Church Services", description: null },
  { id: "gc-conferences", slug: "conferences", name: "Conferences", description: "Refresh Women 2026 and other gatherings." },
  { id: "gc-community", slug: "community", name: "Community", description: null },
  { id: "gc-celebrations", slug: "celebrations", name: "Celebrations", description: null },
];

export const seedGallery: GalleryItem[] = seedMedia
  .filter((x) => x.category && !["events"].includes(x.category) && !x.id.startsWith("ig-program"))
  .map((x, i) => ({
    id: `gi-${i + 1}`, media: x, title: null, caption: x.alt,
    category: seedGalleryCategories.find((c) => c.slug === x.category) ?? null,
  }));

export const seedAnnouncements: Announcement[] = [
  {
    id: "an-anniversary", title: "Celebrate our 1st Anniversary, Dec 12 & 13",
    body: "Join us for worship and the Word.", linkUrl: "/events/first-anniversary-2026",
    linkLabel: "Details", isPinned: true,
  },
];

// ------------------------------------------------------------------ homepage
export const seedHomepage: HomepageSection[] = [
  {
    key: "hero", kicker: null, title: null, body: null, sortOrder: 1, isVisible: true,
    data: {
      primaryCta: { label: "Plan Your Visit", href: "/visit" },
      secondaryCta: { label: "Discover Our Church", href: "#about" },
      // Order requested by the owner: Pastor Charles preaching first, then the worship team, then other church life.
      // MISSING ASSET: no clean photo of Pastor Charles preaching is in the media library yet (the sermon
      // thumbnails carry title text, and the Instagram preaching photo is of Pastor Fred Katagwa), so slide 01
      // features his published sermon as a video card until an approved photo is uploaded.
      slides: [
        { label: "One church. One family. One hope.", caption: "Welcome home", headline: "You belong\nhere.", body: "A Church Where the Community Is Looking for You. Find your people, grow in faith, and experience the love of Jesus.", mediaId: null, alt: "", featured: true,
          video: { id: "tsNcq0xw4pU", title: "The Development Stages of Marriage", href: "/messages/the-development-stages-of-marriage" },
          assetNote: "Needs an approved photo of Pastor Charles Mugisha preaching. Upload it in Media and choose it here." },
        { label: "Faith & Worship", caption: "Our worship team", headline: "A place of love.\nA family of faith.", body: "We worship God in a lively and heartfelt atmosphere. Come worship with us every Sunday at 3:00 PM.", mediaId: "ig-rw-05", alt: "The New Life Global worship team leading worship", featured: true },
        { label: "Community & Discipleship", caption: "Growing together as one family", headline: "Worship.\nGrow. Serve.", body: "From Sunday School to Refresh Women, we grow in Christ together and serve one another with joy.", mediaId: "ig-church-family", alt: "", featured: true },
        { label: "Go & Make Disciples", caption: "Matthew 28:19", headline: "Go.\nMake disciples.", body: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost. Matthew 28:19", mediaId: "ig-rw-07", alt: "", featured: true },
      ],
    },
  },
  {
    key: "stats", kicker: null, title: null, body: null, sortOrder: 20, isVisible: false,
    data: {
      items: [
        { value: "3 PM", label: "Every Sunday in Chandler, AZ" },
        { value: "4", label: "Weekly worship and prayer gatherings" },
        { value: "5 AM", label: "Morning Glory prayer" },
        { value: "1", suffix: "st", label: "Anniversary, December 2026" },
      ],
    },
  },
  {
    key: "chapters", kicker: "Who We Are", title: "Three chapters. One story of new life.", sortOrder: 21, isVisible: false,
    body: "New Life Global is a young church in Chandler, Arizona. Here is who we are, in three chapters.",
    data: {
      chapters: [
        { index: "01", title: "Faith & Worship", lead: "We worship God in a lively and heartfelt atmosphere.", body: "Every Sunday we gather to worship, to pray and to hear the Word. Our week is wrapped in prayer, from Morning Glory at 5 AM to Night Prayer on the first Friday of each month.", points: ["Sunday Service · 3:00 PM", "Night Prayer · first Friday", "Night of Worship · Fridays"], mediaId: "ig-rw-03", videoId: "tsNcq0xw4pU", cta: { label: "Watch a message", href: "/messages" } },
        { index: "02", title: "Community & Discipleship", lead: "Worship. Grow. Serve.", body: "We are a family of faith. Children grow in our Sunday School, women are refreshed and encouraged, and everyone has a place to serve the Lord and His people.", points: ["Sunday School", "Refresh Women", "Serve Team"], mediaId: "ig-church-family", cta: { label: "Find your ministry", href: "/ministries" } },
        { index: "03", title: "Go & Make Disciples", lead: "Go ye therefore, and teach all nations.", body: "Matthew 28:19 is the verse at the center of our church. We pray, worship and serve with that call before us.", points: ["Matthew 28:19", "Night Prayer", "Morning Glory"], mediaId: "ig-serving", cta: { label: "Plan your visit", href: "/visit" } },
      ],
    },
  },
  {
    key: "invite-band", kicker: "Your Sunday invitation", title: "There's a seat waiting for you.", body: "Every Sunday at 3:00 PM · Chandler, Arizona", sortOrder: 2, isVisible: true,
    data: { cta: { label: "Get Directions", href: MAPS } },
  },
  {
    key: "about-split", kicker: "More than a Sunday service", title: "New life. Real people. Lasting hope.", sortOrder: 3, isVisible: true,
    body: "New Life Global is a Christ-centered church in Chandler, Arizona, where people from every background can belong, encounter Jesus, and grow together. We believe the church is more than a place you attend; it's a family where you are known, loved, and encouraged.\n\nWhether you're exploring faith or looking for a church home, there's a place for you here.",
    data: { mediaId: "ig-rw-08", cta: { label: "Connect With Us", href: "/contact" } },
  },
  {
    key: "visit-split", kicker: "Come as you are", title: "Come experience New Life Global.", sortOrder: 4, isVisible: true,
    body: "We would love to welcome you and your family. Expect worship, biblical teaching, prayer, and a friendly community ready to meet you.",
    data: {
      mediaId: "ig-fellowship",
      details: [
        { icon: "clock", title: "Sunday Service", text: "Every Sunday at 3:00 PM" },
        { icon: "pin", title: "Where We Meet", text: "Bethel SonRise Campus\n800 W Galveston St\nChandler, AZ 85225" },
      ],
      primary: { label: "Get Directions", href: MAPS },
      secondary: { label: "Let Us Know You're Coming", href: "/visit" },
    },
  },
  {
    key: "connect", kicker: "Get connected", title: "Life is better together.", body: "There is a place to connect, serve, and grow in every season of life.", sortOrder: 5, isVisible: true,
    data: {
      items: [
        { icon: "sparkles", title: "Worship & Prayer", text: "Gather to worship Jesus, seek God in prayer, and encourage one another.", href: "/ministries/worship" },
        { icon: "heart", title: "Families & Community", text: "Build authentic relationships and find a spiritual family that walks with you.", href: "/ministries" },
        { icon: "star", title: "Next Generation", text: "Helping children and young people discover faith, purpose, and belonging.", href: "/ministries/children" },
      ],
    },
  },
  {
    key: "quote", kicker: null, title: "Therefore, if anyone is in Christ, the new creation has come.", body: "2 Corinthians 5:17 · NIV", sortOrder: 6, isVisible: true, data: {},
  },
  {
    key: "messages-tiles", kicker: "Faith for everyday life", title: "Messages that inspire life.", sortOrder: 7, isVisible: true,
    body: "Come hear practical, Christ-centered biblical teaching that encourages you to follow Jesus in everyday life.",
    data: { cta: { label: "Watch Our Messages", href: "/messages" } },
  },
  {
    key: "give-band", kicker: "Live generously", title: "Generosity changes lives.", sortOrder: 8, isVisible: true,
    body: "Your generosity can help share the love of Christ, strengthen our church family, and serve our community.",
    data: { cta: { label: "Give Now", href: "/give" } },
  },
  {
    key: "contact", kicker: "We're here for you", title: "We'd love to hear from you.", sortOrder: 9, isVisible: true,
    body: "Have a question, need prayer, or planning your first visit? Reach out to our church family.",
    data: { venue: "Bethel SonRise Campus" },
  },
  {
    key: "discover", kicker: "Discover New Life", title: "Find your way in.", body: "Seven pathways into the life of our church.", sortOrder: 22, isVisible: false,
    data: {
      items: [
        { title: "About Us", text: "Who we are, what we believe and who leads us.", href: "/about" },
        { title: "Ministries", text: "Worship, prayer, women, children and serving.", href: "/ministries" },
        { title: "Messages", text: "Watch sermons from Pastor Charles.", href: "/messages" },
        { title: "Events", text: "Gatherings, conferences and celebrations.", href: "/events" },
        { title: "Leadership", text: "Meet our pastors.", href: "/about#leadership" },
        { title: "Prayer", text: "Share a request in confidence.", href: "/prayer" },
        { title: "Plan Your Visit", text: "Times, directions and what to expect.", href: "/visit" },
      ],
    },
  },
  {
    key: "pathways", kicker: "Messages & Gatherings", title: "Hear the Word. Gather with us.", body: "A recent message and what's coming up in Chandler.", sortOrder: 23, isVisible: false,
    data: { eventMediaId: "ig-anniversary" },
  },
  {
    key: "ministries", kicker: "Ministries", title: "A place for everyone to belong.", body: null, sortOrder: 24, isVisible: false, data: {},
  },
  {
    key: "testimonies", kicker: "Stories", title: "What God is doing among us.", body: null, sortOrder: 25, isVisible: false,
    data: { items: [], note: "Only approved testimonies with written consent." },
  },
  {
    key: "invitation", kicker: "Come home", title: "Come and experience new life.", sortOrder: 26, isVisible: false,
    body: "Whoever you are and wherever you're from, you are welcome at New Life Global.",
    data: { mediaId: "ig-rw-07", cta: { label: "Plan Your Visit", href: "/visit" }, secondary: { label: "Contact us", href: "/contact" } },
  },
];

export const seed = {
  settings: seedSettings, media: seedMedia, leaders: seedLeaders, ministries: seedMinistries,
  sermonCategories: seedSermonCategories, sermons: seedSermons, events: seedEvents,
  galleryCategories: seedGalleryCategories, gallery: seedGallery, announcements: seedAnnouncements,
  homepage: seedHomepage, churchContent: seedChurchContent,
};

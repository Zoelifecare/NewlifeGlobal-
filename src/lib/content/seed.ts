/**
 * Verified starter content — the single source for `supabase/seed.sql` (see scripts/generate-seed.mjs)
 * and the read-only fallback used when Supabase is not configured.
 *
 * Every fact here is traceable to docs/research/references.md (R#) or owner-decisions.md (OD-#).
 * Edit live content in /admin — not here — once the database is connected.
 */
import type {
  Announcement, ChurchEvent, GalleryCategory, GalleryItem, HomepageSection, Leader, Media, Ministry,
  Sermon, SermonCategory, SiteSettings,
} from "./types";

const AZ = "-07:00"; // Arizona (no DST)
const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

// ------------------------------------------------------------------ media
const m = (id: string, file: string, alt: string, category: string, source: string, extra: Partial<Media> = {}): Media => ({
  id, url: `/media/instagram/${file}.jpg`, kind: "image", alt, credit: "New Life Global AZ",
  sourceUrl: `https://www.instagram.com/p/${source}/`, category, ...extra,
});

export const seedMedia: Media[] = [
  ...Array.from({ length: 11 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return m(`ig-rw-${n}`, `refresh-women-2026-${n}`, `Refresh Women 2026 conference at New Life Global, photo ${i + 1}`, "conferences", "DZdhdFGklcE");
  }),
  m("ig-seat-saved", "sunday-seat-saved", "New Life Global invitation: a seat saved for you this Sunday", "services", "Dc7f_W0u-5_"),
  m("ig-fellowship", "sunday-fellowship-reel", "Sunday fellowship and praise at New Life Global", "worship", "DcaCLRBOIIi"),
  m("ig-serving", "serving-team", "Members of New Life Global serving on Sunday", "community", "Db9jqlBlA-2"),
  m("ig-sunday-school", "sunday-school-reel", "New Life Global Sunday School", "community", "DaTGyC9uiwW"),
  m("ig-night-prayer", "night-of-prayer-flyer", "Night of Prayer flyer with guest Pastor Edmond Kivuye", "events", "DaQzfhKS0UQ"),
  m("ig-church-family", "church-family", "The New Life Global church family", "community", "DaD-cxNEpRS"),
  m("ig-sundays-chandler", "sundays-chandler-reel", "Sunday service at New Life Global in Chandler, Arizona", "services", "DZqcJlTS2u-"),
  m("ig-rw-promo", "refresh-women-promo-reel", "Refresh Women 2026 worship promo", "conferences", "DY6dF-BuxuT"),
  m("ig-rw-save-date", "refresh-women-save-date-reel", "Refresh Women 2026 save the date", "conferences", "DYvv9hAuI2b"),
  m("ig-anniversary", "anniversary-2026-flyer", "New Life Global 1st Anniversary flyer with Pastors Charles and Florence Mugisha", "celebrations", "DfKlx2vOXFA", { credit: "Florence Mugisha & New Life Global AZ" }),
  m("ig-program", "church-program-flyer", "New Life Global church program: Sunday Service, Night Prayer, Night of Worship, Morning Glory", "services", "Da07hfnSJe-"),
  { id: "yt-25-years", url: ytThumb("9-581YAL-Ys"), kind: "image", alt: "Africa New Life 25 Years of Transforming Lives thanksgiving service in Kigali", credit: "New Life Rwanda (YouTube)", sourceUrl: yt("9-581YAL-Ys"), category: "rwanda-ministry" },
  { id: "yt-courage", url: ytThumb("8mEJiF-7SU8"), kind: "image", alt: "Worship at New Life Church, Kigali", credit: "New Life Rwanda (YouTube)", sourceUrl: yt("8mEJiF-7SU8"), category: "rwanda-ministry" },
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
    { name: "Morning Glory", day: "Daily except Monday & Saturday", time: "5:00 AM", location: "Morning prayer", note: "Contact us to join" },
  ],
  contact: { email: null, phone: null },
  social: [
    { label: "Instagram", url: "https://www.instagram.com/newlifeglobalaz/" },
    { label: "New Life Rwanda on YouTube", url: "https://www.youtube.com/@newliferwanda" },
    { label: "Africa New Life", url: "https://www.africanewlife.org/" },
  ],
  affiliation: "A healthy church that transforms lives and nations through the Gospel of Jesus Christ and acts of compassion",
  logo: { color: "/media/brand/nlc-logo-color.png", white: "/media/brand/nlc-logo-white.png", alt: "New Life" },
};

// ------------------------------------------------------------------ people
const leader = (l: Omit<Leader, "photo"> & { photoId?: string }): Leader => ({
  ...l, photo: l.photoId ? media(l.photoId) : null,
});

export const seedLeaders: Leader[] = [
  leader({
    id: "ld-charles", slug: "charles-mugisha", name: "Rev. Dr. Charles Mugisha", title: "Founding Pastor",
    roleGroup: "pastor", sortOrder: 1, needsReview: false, instagram: "https://www.instagram.com/charlesbmugisha/",
    bio: "Pastor Charles Buregeya Mugisha is a pastor, global missionary and educator, and the founder and president of Africa New Life Ministries, which he began with his wife Florence in 2001. Born to a Rwandan family living as refugees, he studied theology at Reformed Theological College in Kampala, earned a master's degree at Multnomah University in Portland, Oregon, and a doctorate from Gordon Conwell Theological Seminary. He serves as lead pastor of New Life Bible Church in Kigali. Charles and Florence have raised five children.",
  }),
  leader({
    id: "ld-florence", slug: "florence-mugisha", name: "Pastor Florence Mugisha", title: "Founding Pastor",
    roleGroup: "pastor", sortOrder: 2, needsReview: false, instagram: "https://www.instagram.com/florence.mugisha/",
    bio: "Pastor Florence Mugisha is a cofounder of Africa New Life Ministries and its Director of Women's Ministry. Growing up a Rwandan refugee in Uganda, she met Charles in college and later earned a master's degree from Multnomah University. She used her own savings to help sponsor the first children when Africa New Life began, and today she is a preacher and motivational speaker with a heart for women and families.",
  }),
  leader({
    id: "ld-augustine", slug: "augustine-ndemezo", name: "Augustine Ndemezo", title: "Pastor",
    roleGroup: "pastor", sortOrder: 3, needsReview: true, instagram: null,
    bio: "Augustine Ndemezo serves on the leadership team of New Life Global and has served with Africa New Life Ministries in Rwanda.",
  }),
  leader({
    id: "ld-enock", slug: "enock-rwakatale", name: "Pastor Enock Rwakatale", title: "Worship Pastor",
    roleGroup: "pastor", sortOrder: 4, needsReview: true, instagram: null,
    bio: "Pastor Enock leads worship at New Life Global, including Refresh Women 2026 and the church's 1st Anniversary celebration.",
  }),
];

// ------------------------------------------------------------------ ministries
export const seedMinistries: Ministry[] = [
  {
    id: "mn-worship", slug: "worship", name: "Worship", tagline: "Lively, heartfelt worship",
    summary: "Leading the church into God's presence on Sundays and at our Friday Night of Worship.",
    description: "Worship sits at the heart of New Life. Our worship team leads the Sunday service and our Friday Night of Worship, where we spend unhurried time in praise and in the presence of God.",
    image: media("ig-rw-09"), meetingSchedule: "Sundays 3:00 PM · Fridays 8:00 PM", location: "Chandler & Gilbert, AZ",
    contactEmail: null, activities: ["Sunday worship", "Night of Worship", "Special services"], joinUrl: "/contact?topic=worship",
    leaders: [{ leader: seedLeaders[3], roleTitle: "Worship Pastor" }], sortOrder: 1,
  },
  {
    id: "mn-prayer", slug: "prayer", name: "Prayer", tagline: "A praying church",
    summary: "Night Prayer every first Friday and Morning Glory prayer at 5 AM.",
    description: "We take God's Word and prayer seriously. On the first Friday of each month we gather for Night Prayer, and Morning Glory prayer meets at 5:00 AM every day except Monday and Saturday.",
    image: media("ig-night-prayer"), meetingSchedule: "First Friday 9:00 PM · Morning Glory 5:00 AM", location: "800 W Galveston St, Chandler",
    contactEmail: null, activities: ["Night Prayer", "Morning Glory", "Prayer requests"], joinUrl: "/prayer",
    leaders: [], sortOrder: 2,
  },
  {
    id: "mn-women", slug: "women", name: "Women", tagline: "Refresh Women",
    summary: "Encouraging women to grow in faith together, and home of the Refresh Women conference.",
    description: "Our women's ministry gathers women of every age to laugh, worship, learn and grow together. In 2026 we hosted Refresh Women, a weekend of worship and teaching that left many refreshed and encouraged.",
    image: media("ig-rw-03"), meetingSchedule: "Announced through our events page", location: "Chandler, AZ",
    contactEmail: null, activities: ["Refresh Women conference", "Fellowship", "Bible teaching"], joinUrl: "/contact?topic=women",
    leaders: [], sortOrder: 3,
  },
  {
    id: "mn-children", slug: "children", name: "Children", tagline: "Sunday School",
    summary: "Our growing Sunday School shapes the next generation with God's Word.",
    description: "We believe our children are the next generation that will carry the Gospel to the nations. Sunday School meets during the Sunday service and is growing every week.",
    image: media("ig-sunday-school"), meetingSchedule: "Sundays during the 3:00 PM service", location: "800 W Galveston St, Chandler",
    contactEmail: null, activities: ["Sunday School", "Bible stories", "Worship for kids"], joinUrl: "/visit#kids",
    leaders: [], sortOrder: 4,
  },
  {
    id: "mn-serve", slug: "serve", name: "Serve Team", tagline: "Serving God and His people",
    summary: "Hospitality, ushering and practical care that make every Sunday feel like home.",
    description: "Serving the Lord and His people is a gift we never take for granted. Our serve team welcomes guests, prepares the room and cares for our church family each week.",
    image: media("ig-serving"), meetingSchedule: "Sundays", location: "800 W Galveston St, Chandler",
    contactEmail: null, activities: ["Welcome & hospitality", "Ushering", "Setup"], joinUrl: "/contact?topic=serve",
    leaders: [], sortOrder: 5,
  },
];

// ------------------------------------------------------------------ messages (New Life Rwanda YouTube, OD-6)
export const seedSermonCategories: SermonCategory[] = [
  { id: "sc-family", slug: "marriage-family", name: "Marriage & Family" },
  { id: "sc-faith", slug: "faith-growth", name: "Faith & Growth" },
  { id: "sc-special", slug: "special-services", name: "Special Services" },
  { id: "sc-kinyarwanda", slug: "kinyarwanda", name: "Kinyarwanda" },
];
const cat = (slug: string) => seedSermonCategories.find((c) => c.slug === slug) ?? null;
const SRC = "New Life Rwanda YouTube";

const sermon = (s: Omit<Sermon, "thumbnail" | "videoUrl" | "audioUrl" | "speaker" | "sourceNote" | "category"> & { yt: string; cat: string; speakerId?: string }): Sermon => ({
  ...s, videoUrl: yt(s.yt), audioUrl: null, thumbnail: ytThumb(s.yt), category: cat(s.cat), sourceNote: SRC,
  speaker: s.speakerId ? seedLeaders.find((l) => l.id === s.speakerId) ?? null : null,
});

export const seedSermons: Sermon[] = [
  sermon({ id: "sm-25-years", slug: "25-years-of-transforming-lives", title: "25 Years of Transforming Lives: Thanksgiving Service", speakerName: "New Life Rwanda", description: "The thanksgiving service celebrating 25 years of Africa New Life Ministries.", scripture: null, series: "Africa New Life at 25", preachedOn: "2026-10-11", isFeatured: true, yt: "9-581YAL-Ys", cat: "special-services" }),
  sermon({ id: "sm-dev-stages", slug: "the-development-stages-of-marriage", title: "The Development Stages of Marriage", speakerName: "Pastor Charles Mugisha", speakerId: "ld-charles", description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-10-04", isFeatured: true, yt: "tsNcq0xw4pU", cat: "marriage-family" }),
  sermon({ id: "sm-healing-2", slug: "healing-the-heart-before-building-the-home-part-2", title: "Healing the Heart Before Building the Home, Part II", speakerName: "Pastor Charles Mugisha", speakerId: "ld-charles", description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-09-27", isFeatured: false, yt: "5mJK1C-Gn28", cat: "marriage-family" }),
  sermon({ id: "sm-healing-1", slug: "healing-the-heart-before-building-the-home", title: "Healing the Heart Before Building the Home", speakerName: "Pastor Charles Mugisha", speakerId: "ld-charles", description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-09-20", isFeatured: false, yt: "dms4ZG8jnAI", cat: "marriage-family" }),
  sermon({ id: "sm-design-2", slug: "marriage-by-gods-design-part-2", title: "Marriage by God's Design, Part II", speakerName: "Pastor Charles Mugisha", speakerId: "ld-charles", description: null, scripture: null, series: "Marriage by God's Design", preachedOn: "2026-08-30", isFeatured: false, yt: "oSKpkY-2V9Q", cat: "marriage-family" }),
  sermon({ id: "sm-courage", slug: "the-courage-to-care", title: "The Courage To Care", speakerName: "Dr. Nathan Chiroma", description: null, scripture: null, series: null, preachedOn: "2026-09-13", isFeatured: true, yt: "8mEJiF-7SU8", cat: "faith-growth" }),
  sermon({ id: "sm-stretch", slug: "trusting-god-for-the-stretch", title: "Trusting God For The Stretch", speakerName: "Rev. Fred Isaac Katagwa", description: null, scripture: null, series: null, preachedOn: "2026-10-25", isFeatured: false, yt: "zlOhdbyPVus", cat: "faith-growth" }),
  sermon({ id: "sm-consecrate", slug: "consecrate-yourself-for-the-next-season", title: "Consecrate Yourself For The Next Season", speakerName: "Rev. Peter Kasirivu", description: null, scripture: null, series: null, preachedOn: "2026-10-18", isFeatured: false, yt: "PtOx86Aufbs", cat: "faith-growth" }),
  sermon({ id: "sm-strength", slug: "finding-strength-in-god-for-the-stretch", title: "Finding Strength in God for the Stretch", speakerName: "Pastor Banda Chrispine", description: null, scripture: null, series: null, preachedOn: "2026-11-08", isFeatured: false, yt: "P1NMbBhuImU", cat: "faith-growth" }),
  sermon({ id: "sm-lengthen", slug: "lengthen-and-strengthen", title: "Lengthen and Strengthen", speakerName: "Pastor Elisee Rugambarara", description: null, scripture: null, series: null, preachedOn: "2026-11-15", isFeatured: false, yt: "HNdzwkeUgXI", cat: "faith-growth" }),
  sermon({ id: "sm-kwizera", slug: "kwizera-imana-ikakwagura", title: "Kwizera Imana Ikakwagura", speakerName: "Rev. Fred Isaac Katagwa", description: "Message in Kinyarwanda.", scripture: null, series: null, preachedOn: "2026-11-01", isFeatured: false, yt: "xr1zKmduajc", cat: "kinyarwanda" }),
  sermon({ id: "sm-urushako", slug: "urushako-mu-mugambi-wimana-1", title: "Urushako Mu Mugambi W'Imana, Igice Cya Mbere", speakerName: "Pastor Charles Mugisha", speakerId: "ld-charles", description: "Message in Kinyarwanda.", scripture: null, series: null, preachedOn: "2026-08-30", isFeatured: false, yt: "1ZUXsY0iy60", cat: "kinyarwanda" }),
];

// ------------------------------------------------------------------ events
export const seedEvents: ChurchEvent[] = [
  {
    id: "ev-anniversary", slug: "first-anniversary-2026", title: "1st Year Anniversary: For Thy Is The Glory",
    summary: "Celebrate New Life Global's first year with worship and the Word.",
    description: "Big day coming! Celebrate with us at New Life Global's 1st Year Anniversary, hosted by Pastors Charles & Florence Mugisha, with Pastor Alain Muhire and Pastor Enock Rwakatale.\n\nSaturday, December 12: doors open at 4:00 PM.\nSunday, December 13: doors open at 2:00 PM.\n\nCome and be a part of this special celebration, and bring a friend.",
    category: "Celebration", startsAt: `2026-12-12T16:00:00${AZ}`, endsAt: `2026-12-13T19:00:00${AZ}`,
    venue: "New Life Global", address: "800 W Galveston St, Chandler, AZ 85225", registrationUrl: null,
    image: media("ig-anniversary"), isFeatured: true,
  },
  {
    id: "ev-night-prayer-jul", slug: "night-of-prayer-july-2026", title: "Night of Prayer",
    summary: "Starting the new month with God, with guest Pastor Edmond Kivuye.",
    description: "Come and start the new month with God at our Night of Prayer, with guest Pastor Edmond Kivuye.",
    category: "Prayer", startsAt: `2026-07-03T21:00:00${AZ}`, endsAt: `2026-07-04T00:00:00${AZ}`,
    venue: "New Life Global", address: "800 W Galveston St, Chandler, AZ 85225", registrationUrl: null,
    image: media("ig-night-prayer"), isFeatured: false,
  },
  {
    id: "ev-refresh-women", slug: "refresh-women-2026", title: "Refresh Women 2026",
    summary: "A revival weekend for women: worship, teaching and fellowship.",
    description: "Refresh Women 2026 was an incredible, life changing experience. We laughed, worshipped, learned and left refreshed and encouraged. Pastor Grace's message taught us to ignite the fire and keep it burning, with worship from Alain Muhire, Lynca Muhire and Pastor Enock.",
    category: "Conference", startsAt: `2026-05-29T18:00:00${AZ}`, endsAt: null,
    venue: "New Life Global", address: "Chandler, AZ", registrationUrl: null,
    image: media("ig-rw-01"), isFeatured: false,
  },
];

// ------------------------------------------------------------------ gallery
export const seedGalleryCategories: GalleryCategory[] = [
  { id: "gc-worship", slug: "worship", name: "Worship" },
  { id: "gc-services", slug: "services", name: "Church Services" },
  { id: "gc-conferences", slug: "conferences", name: "Conferences" },
  { id: "gc-community", slug: "community", name: "Community" },
  { id: "gc-celebrations", slug: "celebrations", name: "Celebrations" },
  { id: "gc-rwanda", slug: "rwanda-ministry", name: "Rwanda Ministry" },
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
    body: "Join Pastors Charles & Florence Mugisha for worship and the Word.", linkUrl: "/events/first-anniversary-2026",
    linkLabel: "Details", isPinned: true,
  },
];

// ------------------------------------------------------------------ homepage
export const seedHomepage: HomepageSection[] = [
  {
    key: "hero", kicker: null, title: null, body: null, sortOrder: 1, isVisible: true,
    data: {
      primaryCta: { label: "Plan Your Visit", href: "/visit" },
      secondaryCta: { label: "Explore New Life", href: "#chapters" },
      slides: [
        { index: "01", label: "Faith & Worship", caption: "Worship, prayer and the Word", headline: "A place of love.\nA family of faith.", body: "We are a healthy church that transforms lives and nations through the Gospel of Jesus Christ and acts of compassion. Come worship with us every Sunday at 3:00 PM.", mediaId: "ig-rw-04" },
        { index: "02", label: "Community & Discipleship", caption: "Growing together as one family", headline: "Worship.\nGrow. Serve.", body: "From Sunday School to Refresh Women, we grow in Christ together and serve one another with joy.", mediaId: "ig-rw-05" },
        { index: "03", label: "Global Mission", caption: "From Rwanda to the nations", headline: "One family.\nTwo continents.", body: "Rooted in New Life Bible Church Kigali, founded by Pastors Charles and Florence Mugisha, and carrying love and hope to families and communities.", mediaId: "yt-25-years" },
      ],
    },
  },
  {
    key: "stats", kicker: null, title: null, body: null, sortOrder: 2, isVisible: true,
    data: {
      items: [
        { value: "3 PM", label: "Every Sunday in Chandler, AZ" },
        { value: "2001", label: "Africa New Life founded in Rwanda" },
        { value: "25", suffix: "yrs", label: "Of transforming lives" },
        { value: "19,000", suffix: "+", label: "Students sponsored by Africa New Life" },
      ],
    },
  },
  {
    key: "chapters", kicker: "Our Story", title: "Three chapters. One story of new life.", sortOrder: 3, isVisible: true,
    body: "New Life Global is a young church with deep roots. Here is who we are, in three chapters.",
    data: {
      chapters: [
        { index: "01", title: "Faith & Worship", lead: "We worship God in a lively and heartfelt atmosphere.", body: "Every Sunday we gather to worship, to pray, and to hear the Bible taught in a way you can live. Our week is wrapped in prayer, from Morning Glory at 5 AM to Night Prayer on the first Friday of each month.", points: ["Sunday Service · 3:00 PM", "Night Prayer · first Friday", "Night of Worship · Fridays"], mediaId: "ig-rw-03", videoId: "8mEJiF-7SU8", cta: { label: "Watch a message", href: "/messages" } },
        { index: "02", title: "Community & Discipleship", lead: "Worship. Grow. Serve.", body: "We are a family of faith. Children grow in our Sunday School, women are refreshed and equipped, and everyone has a place to serve the Lord and His people.", points: ["Sunday School", "Refresh Women", "Serve Team"], mediaId: "ig-church-family", cta: { label: "Find your ministry", href: "/ministries" } },
        { index: "03", title: "Global Mission", lead: "Go and make disciples of all nations.", body: "We share the vision of New Life Bible Church in Kigali, founded by Pastors Charles and Florence Mugisha: a healthy church that transforms lives and nations through the Gospel and acts of compassion. What began in Rwanda in 2001 has grown into churches, schools, a theological college and a hospital.", points: ["Founded 2001 in Rwanda", "New Life Bible Church, Kigali", "Churches across Rwanda"], mediaId: "yt-25-years", cta: { label: "Our Rwanda connection", href: "/about#rwanda" } },
      ],
    },
  },
  {
    key: "invite-band", kicker: "Plan your visit", title: "There's a seat saved just for you.", body: "Sundays at 3:00 PM · 800 W Galveston St, Chandler, AZ", sortOrder: 4, isVisible: true,
    data: { cta: { label: "Plan Your Visit", href: "/visit" } },
  },
  {
    key: "discover", kicker: "Discover New Life", title: "Find your way in.", body: "Seven pathways into the life of our church.", sortOrder: 5, isVisible: true,
    data: {
      items: [
        { title: "About Us", text: "Our story, beliefs and the Rwanda connection.", href: "/about" },
        { title: "Ministries", text: "Worship, prayer, women, children and serving.", href: "/ministries" },
        { title: "Messages", text: "Watch sermons from the New Life family.", href: "/messages" },
        { title: "Events", text: "Gatherings, conferences and celebrations.", href: "/events" },
        { title: "Leadership", text: "Meet our pastors.", href: "/about#leadership" },
        { title: "Prayer", text: "Share a request in confidence.", href: "/prayer" },
        { title: "Plan Your Visit", text: "Times, directions and what to expect.", href: "/visit" },
      ],
    },
  },
  {
    key: "pathways", kicker: "Messages & Gatherings", title: "Hear the Word. Gather with us.", body: "Recent messages from the New Life family and what's coming up in Chandler.", sortOrder: 6, isVisible: true,
    data: { messageMediaId: "yt-courage", eventMediaId: "ig-anniversary" },
  },
  {
    key: "ministries", kicker: "Ministries", title: "A place for everyone to belong.", body: null, sortOrder: 7, isVisible: true, data: {},
  },
  {
    key: "global", kicker: "One Family, Two Continents", title: "Chandler and Kigali, joined in one mission.", sortOrder: 8, isVisible: true,
    body: "New Life began in Rwanda in 2001 with Charles and Florence Mugisha, both raised as Rwandan refugees in Uganda. 25 years later, New Life Bible Churches, schools, the Africa College of Theology and Dream Medical Center serve communities across Rwanda. In Chandler, we carry that same Gospel and compassion.",
    data: {
      facts: [
        { label: "2001", text: "Africa New Life begins in Kayonza, Rwanda" },
        { label: "2003", text: "New Life Bible Church, Kigali is planted" },
        { label: "2013", text: "Africa College of Theology opens" },
        { label: "2018", text: "Dream Medical Center opens" },
        { label: "2025", text: "New Life Global begins in Chandler, Arizona" },
      ],
      mediaId: "yt-25-years", videoId: "9-581YAL-Ys",
      link: { label: "Visit Africa New Life", href: "https://www.africanewlife.org/" },
    },
  },
  {
    key: "testimonies", kicker: "Stories", title: "What God is doing among us.", body: null, sortOrder: 9, isVisible: false,
    data: { items: [], note: "Only approved testimonies with written consent." },
  },
  {
    key: "invitation", kicker: "Come home", title: "Come and experience new life.", sortOrder: 10, isVisible: true,
    body: "Whoever you are and wherever you're from, you are welcome at New Life Global.",
    data: { mediaId: "ig-rw-07", cta: { label: "Plan Your Visit", href: "/visit" }, secondary: { label: "Contact us", href: "/contact" } },
  },
];

export const seed = {
  settings: seedSettings, media: seedMedia, leaders: seedLeaders, ministries: seedMinistries,
  sermonCategories: seedSermonCategories, sermons: seedSermons, events: seedEvents,
  galleryCategories: seedGalleryCategories, gallery: seedGallery, announcements: seedAnnouncements,
  homepage: seedHomepage,
};

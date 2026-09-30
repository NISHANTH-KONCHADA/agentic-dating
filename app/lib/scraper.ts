import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN! });

const INSTAGRAM_ACTOR = 'apify/instagram-profile-scraper';
const LINKEDIN_ACTOR = 'harvestapi/linkedin-profile-scraper';

export interface InstagramData {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  profilePicUrl: string;
  isVerified: boolean;
  externalUrl: string | null;
  category: string | null;
  posts: Array<{
    id: string;
    caption: string;
    likesCount: number;
    commentsCount: number;
    locationName: string | null;
    hashtags: string[];
    mentions: string[];
    imageUrl: string;
    timestamp: string;
    alt: string | null;
  }>;
}

export interface LinkedInData {
  fullName: string;
  headline: string;
  about: string;
  location: string;
  profilePicUrl: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    duration: string;
  }>;
  skills: string[];
  certifications: string[];
  projects: Array<{ name: string; description: string }>;
  languages: string[];
  volunteering: string[];
  posts: Array<{ content: string; likes: number; timestamp: string }>;
}

async function runActorWithRetry<T>(
  actorId: string,
  input: Record<string, unknown>,
  maxRetries = 3
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const run = await client.actor(actorId).call(input, {
        timeout: 120,
        memory: 512,
      });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      if (items && items.length > 0) {
        return items[0] as T;
      }
      return null;
    } catch (err) {
      console.error(`Actor ${actorId} attempt ${attempt + 1} failed:`, err);
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
      }
    }
  }
  return null;
}

export async function scrapeInstagram(profileUrl: string): Promise<InstagramData | null> {
  const username = profileUrl.replace(/\/$/, '').split('/').pop();
  if (!username) return null;

  const raw = await runActorWithRetry<Record<string, unknown>>(INSTAGRAM_ACTOR, {
    usernames: [username],
    resultsLimit: 30,
  });

  if (!raw) return null;

  // Normalize Instagram data
  const posts = ((raw.latestPosts as Record<string, unknown>[]) || []).slice(0, 30).map((p: Record<string, unknown>) => ({
    id: String(p.id || ''),
    caption: String(p.caption || ''),
    likesCount: Number(p.likesCount || 0),
    commentsCount: Number(p.commentsCount || 0),
    locationName: (p.locationName as string) || null,
    hashtags: (p.hashtags as string[]) || [],
    mentions: (p.mentions as string[]) || [],
    imageUrl: String(p.displayUrl || ''),
    timestamp: String(p.timestamp || ''),
    alt: (p.alt as string) || null,
  }));

  return {
    username: String(raw.username || username),
    fullName: String(raw.fullName || ''),
    biography: String(raw.biography || ''),
    followersCount: Number(raw.followersCount || 0),
    followingCount: Number(raw.followingCount || 0),
    postsCount: Number(raw.postsCount || 0),
    profilePicUrl: String(raw.profilePicUrl || ''),
    isVerified: Boolean(raw.verified),
    externalUrl: (raw.externalUrl as string) || null,
    category: (raw.category as string) || null,
    posts,
  };
}

export async function scrapeLinkedIn(profileUrl: string): Promise<LinkedInData | null> {
  const raw = await runActorWithRetry<Record<string, unknown>>(LINKEDIN_ACTOR, {
    profileUrls: [profileUrl],
    proxy: { useApifyProxy: true },
  });

  if (!raw) return null;

  return {
    fullName: String(raw.fullName || raw.name || ''),
    headline: String(raw.headline || ''),
    about: String(raw.about || raw.summary || ''),
    location: String(raw.location || ''),
    profilePicUrl: String(raw.profilePicUrl || raw.photo || ''),
    experience: ((raw.experience as Record<string, unknown>[]) || []).map((e) => ({
      title: String(e.title || ''),
      company: String(e.company || e.companyName || ''),
      duration: String(e.duration || e.dateRange || ''),
      description: String(e.description || ''),
    })),
    education: ((raw.education as Record<string, unknown>[]) || []).map((e) => ({
      school: String(e.school || e.schoolName || ''),
      degree: String(e.degree || e.degreeName || ''),
      field: String(e.field || e.fieldOfStudy || ''),
      duration: String(e.duration || e.dateRange || ''),
    })),
    skills: ((raw.skills as string[]) || []),
    certifications: ((raw.certifications as string[]) || []).map(String),
    projects: ((raw.projects as Record<string, unknown>[]) || []).map((p) => ({
      name: String(p.name || p.title || ''),
      description: String(p.description || ''),
    })),
    languages: ((raw.languages as string[]) || []).map(String),
    volunteering: ((raw.volunteering as string[]) || []).map(String),
    posts: ((raw.posts as Record<string, unknown>[]) || []).slice(0, 10).map((p) => ({
      content: String(p.content || p.text || ''),
      likes: Number(p.likes || p.likesCount || 0),
      timestamp: String(p.timestamp || p.date || ''),
    })),
  };
}

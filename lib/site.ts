/** Public site URL, used on posters and share images. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://codevents.web.app").replace(/\/$/, "");

export const eventUrl = (id: string) => `${SITE_URL}/events/${id}`;

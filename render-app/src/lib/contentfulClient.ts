import { createClient, type ContentfulClientApi } from 'contentful';

let client: ContentfulClientApi<undefined> | undefined;

export function getContentfulClient(): ContentfulClientApi<undefined> {
  if (client) return client;

  const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
  const accessToken = import.meta.env.VITE_CONTENTFUL_DELIVERY_TOKEN;

  if (!spaceId || !accessToken) {
    throw new Error('Missing VITE_CONTENTFUL_SPACE_ID or VITE_CONTENTFUL_DELIVERY_TOKEN');
  }

  client = createClient({ space: spaceId, accessToken });
  return client;
}

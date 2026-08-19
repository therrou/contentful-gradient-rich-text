import 'dotenv/config';
import contentfulManagement from 'contentful-management';

async function main() {
  const {
    CONTENTFUL_MANAGEMENT_TOKEN,
    CONTENTFUL_SPACE_ID,
    CONTENTFUL_ENVIRONMENT_ID = 'master',
    CONTENTFUL_CONTENT_TYPE_ID,
  } = process.env;

  if (!CONTENTFUL_MANAGEMENT_TOKEN || !CONTENTFUL_SPACE_ID || !CONTENTFUL_CONTENT_TYPE_ID) {
    throw new Error(
      'Missing CONTENTFUL_MANAGEMENT_TOKEN, CONTENTFUL_SPACE_ID, or CONTENTFUL_CONTENT_TYPE_ID in .env'
    );
  }

  const client = contentfulManagement.createClient({
    accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
  }) as any;

  const space = await client.getSpace(CONTENTFUL_SPACE_ID);
  const environment = await space.getEnvironment(CONTENTFUL_ENVIRONMENT_ID);
  const contentType = await environment.getContentType(CONTENTFUL_CONTENT_TYPE_ID);

  const fieldId = 'richTextGradient';
  const alreadyExists = contentType.fields.some((f: any) => f.id === fieldId);

  if (alreadyExists) {
    console.log(`Field "${fieldId}" already exists on content type "${CONTENTFUL_CONTENT_TYPE_ID}". Skipping.`);
    return;
  }

  contentType.fields.push({
    id: fieldId,
    name: 'Rich Text (Gradient)',
    type: 'RichText',
    localized: false,
    required: false,
    disabled: false,
    omitted: false,
    validations: [],
  });

  const updated = await contentType.update();
  await updated.publish();

  console.log(`Added and published field "${fieldId}" on content type "${CONTENTFUL_CONTENT_TYPE_ID}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

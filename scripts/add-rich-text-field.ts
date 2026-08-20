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
  });

  const params = {
    spaceId: CONTENTFUL_SPACE_ID,
    environmentId: CONTENTFUL_ENVIRONMENT_ID,
    contentTypeId: CONTENTFUL_CONTENT_TYPE_ID,
  };

  const contentType = await client.contentType.get(params);

  const fieldId = 'richTextGradient';

  // Matches every mark/node type the GradientRichTextEditor can produce.
  // Contentful's RichText field defaults to allowing only bold/italic/
  // underline/code marks and a narrow set of node types when this
  // validation is omitted, so it must be listed explicitly.
  const richTextValidations = [
    {
      enabledMarks: [
        'bold',
        'italic',
        'underline',
        'code',
        'gradient-sunset',
        'gradient-ocean',
        'gradient-mint',
        'gradient-berry',
        'gradient-animated',
        'highlight-sunset',
        'highlight-ocean',
        'highlight-mint',
        'highlight-berry',
      ],
    },
    {
      enabledNodeTypes: [
        'heading-1',
        'heading-2',
        'heading-3',
        'heading-4',
        'heading-5',
        'heading-6',
        'blockquote',
        'unordered-list',
        'ordered-list',
        'list-item',
        'hr',
        'paragraph',
      ],
    },
  ];

  const existingField = contentType.fields.find((f) => f.id === fieldId);

  if (existingField) {
    existingField.validations = richTextValidations;
    console.log(`Field "${fieldId}" already exists on content type "${CONTENTFUL_CONTENT_TYPE_ID}". Updating its validations.`);
  } else {
    contentType.fields.push({
      id: fieldId,
      name: 'Rich Text (Gradient)',
      type: 'RichText',
      localized: false,
      required: false,
      disabled: false,
      omitted: false,
      validations: richTextValidations,
    });
  }

  const updated = await client.contentType.update(params, contentType);
  await client.contentType.publish(params, updated);

  console.log(`Field "${fieldId}" is up to date and published on content type "${CONTENTFUL_CONTENT_TYPE_ID}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

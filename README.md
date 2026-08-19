# Contentful Gradient Text

Two projects:
- `contentful-app/` — custom Contentful app that replaces the stock Rich Text editing UI on a chosen field with a Slate-based editor supporting Bold, Italic, and gradient-fill text marks.
- `render-app/` — standalone React app that fetches an entry via the Content Delivery API and renders that field's gradient marks as real CSS gradients.

See each folder's README for framework-level detail (scripts, structure). This root README is the operator runbook for setting the whole thing up end to end.

## Scope & Limitations

The custom editor in `contentful-app/` **replaces** Contentful's default Rich Text editing UI for the `richTextGradient` field. It supports **only**:
- Paragraph blocks
- Bold and Italic marks
- The 4 built-in gradient marks (see `gradientPresets.ts` in either app)

It does **not** support headings, lists, blockquotes, tables, embedded entries/assets, hyperlinks, or any other Rich Text block/mark type.

If a field already contains non-paragraph content (headings, lists, etc.) when this editor is installed, that content is preserved: the editor snapshots the original document's block order (which slots were paragraphs vs. everything else) when it mounts, and on every write-back it re-merges freshly edited paragraphs back into their original positions while re-emitting non-paragraph blocks unchanged. Non-paragraph blocks themselves are not rendered or editable in this UI — to edit a heading or list, switch the field back to Contentful's default Rich Text editor temporarily, make the change there, then switch back.

## Operator Runbook

### 1. Add the `richTextGradient` field to a content type

At the repo root:

```bash
npm install
cp .env.example .env   # if present, otherwise create .env
```

Fill in `.env` at the repo root with real values:

```
CONTENTFUL_MANAGEMENT_TOKEN=<a Contentful Management API token>
CONTENTFUL_SPACE_ID=<space id>
CONTENTFUL_ENVIRONMENT_ID=master   # optional, defaults to master
CONTENTFUL_CONTENT_TYPE_ID=<content type to add the field to>
```

Then run:

```bash
npx tsx scripts/add-rich-text-field.ts
```

This adds (and publishes) a `richTextGradient` Rich Text field on the given content type, unless it already exists.

### 2. Run and install the editor app (`contentful-app/`)

```bash
cd contentful-app
npm install
npm start
```

This starts the local dev server (typically `https://localhost:3000`).

In the Contentful web app:
1. Go to **Apps → Manage apps → Create app**, and point the app definition's frontend at your local dev URL from above.
2. Restrict the app definition's **locations** to **Entry field** only (this app only implements the Field location).
3. Install the app in your space.
4. Open the content type from step 1, select the `richTextGradient` field, and under **Appearance**, assign this app as the field's custom editor.
5. Open or create an entry of that content type and verify:
   - The toolbar (Bold, Italic, gradient dropdown) appears and the editor is not clipped (the app auto-resizes its iframe).
   - Applying Bold/Italic and each gradient preset renders visibly in the editor.
   - If the field already had headings/lists in it before this app was assigned, confirm they still appear in their original position after a save (see Scope & Limitations above).

### 3. Deploy the editor app

```bash
cd contentful-app
npm run build
npx contentful-app-scripts upload \
  --activate \
  --organization-id <ORG_ID> \
  --definition-id <APP_DEFINITION_ID> \
  --token <CMA_TOKEN>
```

This uploads and activates the built bundle against the app definition created in step 2, so it no longer depends on your local dev server.

### 4. Run the render app (`render-app/`)

Create `render-app/.env`:

```
VITE_CONTENTFUL_SPACE_ID=<space id>
VITE_CONTENTFUL_DELIVERY_TOKEN=<a Content Delivery API token>
VITE_CONTENTFUL_ENTRY_ID=<id of an entry with the richTextGradient field populated>
```

Then:

```bash
cd render-app
npm install
npm run dev
```

Open the printed local URL and verify the entry's gradient text renders with real CSS gradients (and that bold/italic combine correctly with gradients). If any required env var is missing or the fetch fails, the page shows a visible error message (`role="alert"`) instead of a blank page.

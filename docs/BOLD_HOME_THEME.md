# Bold Automotive homepage — 28 August 2026

Implements the approved black / green / white design with the original forest Jeep photograph. The existing photo URL in `styles/home-premium.css` is unchanged. A scoped stylesheet and opt-in `homeTheme` layout prop keep other pages' layout styles unchanged.

The homepage finder submits the catalogue's existing `brand`, `category` and `q` parameters. The mockup's model/year dropdowns are replaced with supported catalogue fields; exact vehicle identification remains available through the existing VIN lookup. Existing account, cart, workshop, featured products and SEO sections are retained. No backend, inventory, payment, migration, deployment configuration or dependency versions were changed.

Category pictures are AI-generated illustrative category artwork, not photographs of specific stocked products. Built-in image generation was used with this prompt template:

> Create a photorealistic automotive category banner for Shilatech Auto Spares. Landscape 3:2 composition. [SUBJECT] Parts grouped only in the RIGHT two thirds; left third pure near-black negative space for website text. Black studio background, dramatic restrained lighting, realistic machined metal, subtle grass green #58b72a highlights. Match a premium black and green auto parts website. No text, labels, lettering, logos, watermarks, borders or UI. Illustrative category image, not an exact product advertisement.

Subjects: metallic brake disc with green caliper and pads; metallic coilover with green spring and control arm; metallic engine timing assembly and pistons. Images are encoded as 768px-wide WebP assets in `public/images/` (about 87 KB combined).

Local verification: Next.js production build completed; all 19 static pages generated. Existing warehouse CSS autoprefixer and local webpack cache warnings remain. Local runtime is Node 24; Railway retains the existing Node 20 configuration. Browser checked the desktop homepage, 390px phone layout without document overflow, loaded category images, original hero, and finder navigation selecting Jeep / Brakes. Local inventory requests require the production database, so inventory-backed results must be checked on the deployed site. No real orders or payments were submitted.

Rollback: revert the theme commit to restore the previous files. Prior main commit: `f8734095c4281ef3f9966ca3e8d6731f7b08a1fb`.

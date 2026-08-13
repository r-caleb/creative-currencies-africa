import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the Creative Currencies Africa landing page content", async () => {
  const page = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /La créativité africaine/);
  assert.match(page, /À propos/);
  assert.match(page, /Faire de la créativité africaine un levier économique/);
  assert.match(page, /plateforme éducative dédiée au développement/);
  assert.match(page, /Journée de formation Creative Currencies 2026/);
  assert.match(page, /cc-teaser-poster-0s\.jpg/);
  assert.match(page, /CC%20TEASER%20web%20720p\.mp4/);
  assert.match(page, /Revivez les moments forts/);
  assert.match(page, /Industries créatives en RDC/);
  assert.match(page, /Transformer la créativité congolaise/);
  assert.match(page, /mode\.jpg/);
  assert.match(page, /photography\.png/);
  assert.match(page, /Cinéma & vidéo/);
  assert.match(page, /Graphisme & design/);
  assert.match(page, /Architecture/);
  assert.match(page, /centre%20culturelle\.jpg/);
  assert.match(page, /conference\.png/);
  assert.match(page, /mode\.png/);
  assert.match(page, /viste%20au%20ministere%20de%20la%20culture\.jpg/);
  assert.match(page, /activites\.png/);
  assert.match(page, /Marketing & communication/);
  assert.match(page, /Innovation créative/);
  assert.match(page, /Koffi Amani[\s\S]*photographie\.jpg/);
  assert.match(page, /Tendai Moyo[\s\S]*portrait-man-practicing-his-profession-celebrate-international-labour-day%20\(1\)\.jpg/);
  assert.match(page, /Bokani T\.[\s\S]*musique\.jpg/);
  assert.match(page, /Communauté Creative Currencies/);
  assert.match(page, /Creative ID/);
  assert.match(page, /Ils nous font confiance/);
  assert.match(page, /transparent\/congo-resilience\.png/);
  assert.match(page, /transparent\/jbn-power\.png/);
  assert.match(page, /transparent\/losako-shop\.png/);
  assert.match(page, /transparent\/partner-zairoots\.png/);
  assert.match(page, /Restons connectés à la communauté créative africaine/);
  assert.match(page, /Adresse officielle de Creative Currencies Africa/);
  assert.doesNotMatch(page, /Le brief prévoit/);
});

test("keeps shared frontend layout components in src", async () => {
  const [layout, header, footer] = await Promise.all([
    readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-footer.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /@\/components\/cca-header/);
  assert.match(layout, /@\/components\/cca-footer/);
  assert.match(header, /cca-theme/);
  assert.match(footer, /Creative Currencies Africa/);
});

test("keeps client visual assets available to the frontend", async () => {
  await Promise.all([
    access(new URL("../public/assets/cca-hero-art.png", import.meta.url)),
    access(new URL("../public/assets/cca-logo-full-transparent.png", import.meta.url)),
    access(new URL("../public/assets/cca-logo-transparent.png", import.meta.url)),
    access(new URL("../public/assets/cca-mask-transparent.png", import.meta.url)),
    access(new URL("../public/assets/cca-mask-gold-transparent.png", import.meta.url)),
    access(new URL("../public/assets/cca-footer-ornament.png", import.meta.url)),
    access(new URL("../public/assets/cca-logo-gold.jpg", import.meta.url)),
    access(new URL("../public/assets/cca-mask-gold.jpg", import.meta.url)),
    access(new URL("../public/assets/cc-event-banner.png", import.meta.url)),
    access(new URL("../public/assets/cc-event-flyer.png", import.meta.url)),
    access(new URL("../public/assets/mode.jpg", import.meta.url)),
    access(new URL("../public/assets/photography.png", import.meta.url)),
    access(new URL("../public/assets/photographie.jpg", import.meta.url)),
    access(new URL("../public/assets/portrait-man-practicing-his-profession-celebrate-international-labour-day (1).jpg", import.meta.url)),
    access(new URL("../public/assets/conference.png", import.meta.url)),
    access(new URL("../public/assets/mode.png", import.meta.url)),
    access(new URL("../public/assets/viste au ministere de la culture.jpg", import.meta.url)),
    access(new URL("../public/assets/activites.png", import.meta.url)),
    access(new URL("../public/assets/cinema.jpg", import.meta.url)),
    access(new URL("../public/assets/musique.jpg", import.meta.url)),
    access(new URL("../public/assets/graphisme.jpg", import.meta.url)),
    access(new URL("../public/assets/partners/centre culturelle.jpg", import.meta.url)),
    access(new URL("../public/assets/art visuel.jpg", import.meta.url)),
    access(new URL("../public/assets/artisanat.jpg", import.meta.url)),
    access(new URL("../public/assets/marketing.jpg", import.meta.url)),
    access(new URL("../public/assets/innovation.jpg", import.meta.url)),
    access(new URL("../public/assets/cc-teaser-poster-0s.jpg", import.meta.url)),
    access(new URL("../public/assets/CC TEASER web 720p.mp4", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/min-culture.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/min-communication.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/min-numerique.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/min-postes.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/logo-arsp.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/silikinvillage.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/congo-resilience.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/jbn-power.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/partner-243-kulture.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/partner-creators.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/losako-shop.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/partner-printing-station.png", import.meta.url)),
    access(new URL("../public/assets/partners/transparent/partner-zairoots.png", import.meta.url))
  ]);
});

test("keeps the approved visual direction on the public page", async () => {
  const [page, header, footer, styles] = await Promise.all([
    readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /cca-hero-art\.png/);
  assert.match(header, /cca-logo-full-transparent\.png/);
  assert.match(footer, /cca-logo-full-transparent\.png/);
  assert.match(footer, /footer-art/);
  assert.match(styles, /\.hero-media img/);
  assert.match(styles, /\.about-section/);
  assert.doesNotMatch(header, /brand-lockup[\s\S]*<strong>/);
  assert.doesNotMatch(page, /Objectif du projet/);
});

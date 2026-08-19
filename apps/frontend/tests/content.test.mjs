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
  const [layout, chrome, header, footer] = await Promise.all([
    readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/site-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-footer.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /@\/components\/site-chrome/);
  assert.match(chrome, /@\/components\/cca-header/);
  assert.match(chrome, /@\/components\/cca-footer/);
  assert.match(chrome, /authPathPrefixes/);
  assert.match(header, /cca-theme/);
  assert.match(footer, /Creative Currencies Africa/);
});

test("keeps the auth and registration entry points available", async () => {
  const [login, register, registerType, forgot, otp, otpClient, reset, authUi, wizard] = await Promise.all([
    readFile(new URL("../src/app/connexion/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/inscription/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/inscription/[type]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/mot-de-passe-oublie/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/verification-otp/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/verification-otp-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/reinitialisation-mot-de-passe/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/auth-ui.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/registration-wizard.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(login, /Accédez à votre espace Creative Currencies/);
  assert.match(register, /Choisissez votre type de compte/);
  assert.match(registerType, /Creative ID/);
  assert.match(forgot, /Recevez un code de vérification/);
  assert.match(otp, /VerificationOtpClient/);
  assert.match(otpClient, /Vérifiez votre adresse e-mail/);
  assert.match(otpClient, /verifyEmail/);
  assert.match(otpClient, /resendVerification/);
  assert.match(otpClient, /onBeforeInput/);
  assert.match(otpClient, /onPaste/);
  assert.match(otpClient, /onKeyDown/);
  assert.match(otpClient, /autoFocus/);
  assert.match(reset, /Réinitialisez votre mot de passe/);
  assert.match(authUi, /Créateur/);
  assert.match(authUi, /Apprenant/);
  assert.match(authUi, /Organisation/);
  assert.match(authUi, /Partenaire/);
  assert.match(wizard, /Profil Creative ID/);
  assert.match(wizard, /registerMember/);
  assert.match(wizard, /verification-otp/);
  assert.match(wizard, /useAppDispatch/);
  assert.match(wizard, /setPendingVerification/);
  assert.match(wizard, /Mode, couture & stylisme/);
  assert.match(wizard, /Beauté, coiffure & esthétique/);
  assert.match(wizard, /getCountryCallingCode/);
  assert.match(wizard, /CountryInput/);
  assert.match(wizard, /PhoneInput/);
  assert.match(wizard, /CountryPickerModal/);
  assert.match(wizard, /LanguageMultiSelect/);
  assert.match(wizard, /avatarFile/);
  assert.match(wizard, /updateAvatarFile/);
  assert.match(wizard, /Ajouter un logo/);
  assert.match(wizard, /Ajouter une photo/);
  assert.match(wizard, /Rechercher un pays/);
  assert.match(wizard, /Rechercher une langue/);
  assert.match(wizard, /Congo RDC/);
  assert.match(wizard, /Lingala/);
  assert.match(wizard, /Tshiluba/);
  assert.match(wizard, /Artisanat/);
  assert.match(wizard, /Arts visuels/);
  assert.match(wizard, /Design & graphisme/);
  assert.match(wizard, /Arts numériques/);
  assert.match(wizard, /Autre/);
  assert.doesNotMatch(wizard, /Questions\/réponses/);
  assert.match(wizard, /Objectif d'apprentissage/);
  assert.match(wizard, /Type de partenaire/);
});

test("keeps the member dashboard preview coherent", async () => {
  const [
    dashboardPage,
    redirectPage,
    creativeIdPage,
    trainingsPage,
    opportunitiesPage,
    resourcesPage,
    agendaPage,
    certificatesPage,
    settingsPage,
    dashboard,
    memberShell,
    creativeId,
    trainings,
    opportunities,
    resources,
    agenda,
    certificates,
    settings,
    chrome,
  ] = await Promise.all([
    readFile(new URL("../src/app/espace-membre/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/creative-id/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/formations/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/opportunites/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/ressources/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/agenda/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/certificats/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/parametres/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/member-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/member-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/creative-id-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/trainings-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/opportunities-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/resources-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/agenda-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/certificates-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/settings-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/site-chrome.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardPage, /MemberDashboard/);
  assert.match(redirectPage, /\/espace-membre/);
  assert.match(creativeIdPage, /CreativeIdPage/);
  assert.match(trainingsPage, /TrainingsPage/);
  assert.match(opportunitiesPage, /OpportunitiesPage/);
  assert.match(resourcesPage, /ResourcesPage/);
  assert.match(agendaPage, /AgendaPage/);
  assert.match(certificatesPage, /CertificatesPage/);
  assert.match(settingsPage, /SettingsPage/);
  assert.match(chrome, /\/espace-membre/);
  assert.match(memberShell, /Community Platform/);
  assert.match(memberShell, /\/espace-membre\/formations/);
  assert.match(memberShell, /\/espace-membre\/opportunites/);
  assert.match(memberShell, /\/espace-membre\/ressources/);
  assert.match(memberShell, /\/espace-membre\/agenda/);
  assert.match(memberShell, /\/espace-membre\/certificats/);
  assert.match(memberShell, /\/espace-membre\/parametres/);
  assert.match(memberShell, /data-dashboard-theme/);
  assert.match(dashboard, /Creative ID/);
  assert.match(dashboard, /Opportunités pour vous/);
  assert.match(dashboard, /Ressources récentes/);
  assert.match(creativeId, /Carte partageable/);
  assert.match(creativeId, /Portfolio/);
  assert.match(creativeId, /Compétences & domaines/);
  assert.match(trainings, /Formation officielle en cours/);
  assert.match(trainings, /Journée de formation Creative Currencies 2026/);
  assert.match(trainings, /Certificat après validation/);
  assert.match(opportunities, /Recommandées pour vous/);
  assert.match(opportunities, /Africa Design Fund/);
  assert.match(opportunities, /Mes candidatures/);
  assert.match(resources, /Ressources récentes/);
  assert.match(resources, /Template portfolio créatif/);
  assert.match(agenda, /Prochains rendez-vous/);
  assert.match(agenda, /Formation officielle Creative Currencies Africa/);
  assert.match(certificates, /Mes certificats/);
  assert.match(certificates, /Badges visibles/);
  assert.match(settings, /Informations du compte/);
  assert.match(settings, /Préférences/);
});

test("keeps client visual assets available to the frontend", async () => {
  await Promise.all([
    access(new URL("../public/assets/cca-hero-art.png", import.meta.url)),
    access(new URL("../public/assets/cca-logo-full-transparent.png", import.meta.url)),
    access(new URL("../public/assets/cca-logo-full-transparent-web.png", import.meta.url)),
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
  const [page, layout, header, footer, styles] = await Promise.all([
    readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /cca-hero-art\.png/);
  assert.match(layout, /cca-mask-gold-transparent\.png/);
  assert.match(header, /cca-logo-full-transparent-web\.png/);
  assert.match(footer, /cca-logo-full-transparent-web\.png/);
  assert.match(footer, /footer-art/);
  assert.match(styles, /\.hero-media img/);
  assert.match(styles, /\.about-section/);
  assert.doesNotMatch(header, /brand-lockup[\s\S]*<strong>/);
  assert.doesNotMatch(page, /Objectif du projet/);
});

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
  const [layout, chrome, header, footer, pageSkeletons] = await Promise.all([
    readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/site-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/cca-footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/page-skeletons.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /@\/components\/site-chrome/);
  assert.match(chrome, /@\/components\/cca-header/);
  assert.match(chrome, /@\/components\/cca-footer/);
  assert.match(chrome, /authPathPrefixes/);
  assert.match(header, /cca-theme/);
  assert.match(footer, /Creative Currencies Africa/);
  assert.match(pageSkeletons, /AuthPageSkeleton/);
  assert.match(pageSkeletons, /MemberPageSkeleton/);
  assert.match(pageSkeletons, /skeleton-line/);
});

test("keeps the auth and registration entry points available", async () => {
  const [login, loginClient, api, passwordValidation, profileOptions, referenceDisciplinesHook, register, registerType, forgot, forgotClient, otp, otpClient, otpCodeInput, reset, resetClient, authUi, wizard] = await Promise.all([
    readFile(new URL("../src/app/connexion/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/login-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/api.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/password-validation.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/profile-options.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/use-reference-disciplines.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/inscription/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/inscription/[type]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/mot-de-passe-oublie/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/forgot-password-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/verification-otp/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/verification-otp-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/otp-code-input.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/reinitialisation-mot-de-passe/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/reset-password-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/auth-ui.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/registration-wizard.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(login, /LoginClient/);
  assert.match(login, /AuthPageSkeleton/);
  assert.match(loginClient, /Accédez à votre espace Creative Currencies/);
  assert.match(loginClient, /loginMember/);
  assert.match(loginClient, /setCredentials/);
  assert.match(loginClient, /getApiErrorMessage/);
  assert.match(loginClient, /redirect/);
  assert.match(loginClient, /inputMode="email"/);
  assert.doesNotMatch(loginClient, /type="email"/);
  assert.doesNotMatch(loginClient, /minLength=\{8\}/);
  assert.match(api, /class ApiError/);
  assert.match(api, /normalizeMessages/);
  assert.match(api, /fallbackMessageByStatus/);
  assert.match(api, /forgotPassword/);
  assert.match(api, /verifyPasswordResetCode/);
  assert.match(api, /resetPassword/);
  assert.match(api, /refreshSession/);
  assert.match(api, /\/auth\/refresh/);
  assert.match(api, /updateMemberProfile/);
  assert.match(api, /\/member\/profile/);
  assert.match(api, /uploadProfileAsset/);
  assert.match(api, /\/member\/uploads/);
  assert.match(api, /FormData/);
  assert.match(api, /getReferenceDisciplines/);
  assert.match(api, /\/reference\/disciplines/);
  assert.match(passwordValidation, /Au moins 8 caractères/);
  assert.match(passwordValidation, /Une majuscule et une minuscule/);
  assert.match(passwordValidation, /Un caractère spécial/);
  assert.match(register, /Choisissez votre type de compte/);
  assert.match(register, /href="\/connexion"/);
  assert.match(registerType, /Creative ID/);
  assert.match(registerType, /brandHref="\/connexion"/);
  assert.match(forgot, /ForgotPasswordClient/);
  assert.match(forgot, /AuthPageSkeleton/);
  assert.match(forgotClient, /Recevez un code de vérification/);
  assert.match(forgotClient, /forgotPassword/);
  assert.match(forgotClient, /pendingPasswordResetExpiresAt/);
  assert.match(forgotClient, /brandHref="\/connexion"/);
  assert.match(otp, /VerificationOtpClient/);
  assert.match(otp, /AuthPageSkeleton/);
  assert.match(otpClient, /Vérifiez votre adresse e-mail/);
  assert.match(otpClient, /verifyEmail/);
  assert.match(otpClient, /resendVerification/);
  assert.match(otpClient, /OtpCodeInput/);
  assert.match(otpCodeInput, /onBeforeInput/);
  assert.match(otpCodeInput, /onPaste/);
  assert.match(otpCodeInput, /onKeyDown/);
  assert.match(otpCodeInput, /autoFocus/);
  assert.match(reset, /ResetPasswordClient/);
  assert.match(reset, /AuthPageSkeleton/);
  assert.match(resetClient, /Réinitialisez votre mot de passe/);
  assert.match(resetClient, /brandHref="\/connexion"/);
  assert.match(resetClient, /type ResetStep = "code" \| "password"/);
  assert.match(resetClient, /verifyPasswordResetCode/);
  assert.match(resetClient, /forgotPassword/);
  assert.match(resetClient, /resendResetCode/);
  assert.match(resetClient, /setStoredExpiresAt/);
  assert.match(resetClient, /Un nouveau code a été envoyé/);
  assert.match(resetClient, /Vérifier le code/);
  assert.match(resetClient, /resetPassword/);
  assert.match(resetClient, /getPasswordValidationMessage/);
  assert.match(resetClient, /Les deux mots de passe ne correspondent pas/);
  assert.match(resetClient, /Code valable encore/);
  assert.doesNotMatch(resetClient, /href="\/mot-de-passe-oublie">Demander un nouveau code/);
  assert.doesNotMatch(resetClient, /PasswordChecklist/);
  assert.match(authUi, /Créateur/);
  assert.match(authUi, /Apprenant/);
  assert.match(authUi, /Organisation/);
  assert.match(authUi, /Public/);
  assert.match(authUi, /structures créatives et partenaires/);
  assert.doesNotMatch(authUi, /title: "Partenaire"/);
  assert.match(wizard, /Profil Creative ID/);
  assert.match(wizard, /registerMember/);
  assert.match(wizard, /inputMode="email"/);
  assert.match(wizard, /getPasswordValidationMessage/);
  assert.match(wizard, /verification-otp/);
  assert.match(wizard, /useAppDispatch/);
  assert.match(wizard, /setPendingVerification/);
  assert.match(wizard, /useReferenceDisciplines/);
  assert.match(wizard, /disciplineOptions/);
  assert.match(wizard, /profileLanguageOptions/);
  assert.match(referenceDisciplinesHook, /getReferenceDisciplines/);
  assert.match(referenceDisciplinesHook, /profileDisciplines/);
  assert.match(referenceDisciplinesHook, /normalizeDisciplineOptions/);
  assert.match(profileOptions, /Mode, couture & stylisme/);
  assert.match(profileOptions, /Beauté, coiffure & esthétique/);
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
  assert.match(profileOptions, /Lingala/);
  assert.match(profileOptions, /Tshiluba/);
  assert.match(profileOptions, /Peul/);
  assert.match(profileOptions, /Luba-Katanga/);
  assert.match(profileOptions, /Shona/);
  assert.match(profileOptions, /Artisanat/);
  assert.match(profileOptions, /Arts visuels/);
  assert.match(profileOptions, /Illustration & bande dessinée/);
  assert.match(profileOptions, /Design & graphisme/);
  assert.match(profileOptions, /Événementiel & production culturelle/);
  assert.match(profileOptions, /Formation & transmission artistique/);
  assert.match(profileOptions, /Gastronomie créative/);
  assert.match(profileOptions, /Arts numériques/);
  assert.match(profileOptions, /Autre/);
  assert.doesNotMatch(wizard, /Questions\/réponses/);
  assert.match(wizard, /Objectif d'apprentissage/);
  assert.match(wizard, /public: "PUBLIC"/);
  assert.doesNotMatch(wizard, /partenaire: "PARTNER"/);
});

test("keeps the member dashboard preview coherent", async () => {
  const [
    dashboardPage,
    redirectPage,
    creativeIdPage,
    networkPage,
    messagesPage,
    groupsPage,
    notificationsPage,
    publishPage,
    trainingsPage,
    opportunitiesPage,
    resourcesPage,
    agendaPage,
    certificatesPage,
    settingsPage,
    dashboard,
    memberShell,
    creativeId,
    network,
    messages,
    groups,
    notifications,
    publish,
    publicCreativeId,
    publicCertificateVerification,
    trainings,
    opportunities,
    resources,
    agenda,
    certificates,
    settings,
    chrome,
    styles,
    memberLoading,
    api,
    storeProvider,
  ] = await Promise.all([
    readFile(new URL("../src/app/espace-membre/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/creative-id/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/reseau/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/messages/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/groupes/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/notifications/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/publier/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/formations/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/opportunites/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/ressources/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/agenda/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/certificats/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/parametres/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/member-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/member-shell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/creative-id-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/network-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/messages-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/groups-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/notifications-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/publish-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/creative-id/[memberNumber]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/certificats/verifier/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/trainings-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/opportunities-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/resources-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/agenda-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/certificates-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/settings-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/site-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../src/app/espace-membre/loading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/api.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/store/provider.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(dashboardPage, /MemberDashboard/);
  assert.match(redirectPage, /\/espace-membre/);
  assert.match(creativeIdPage, /CreativeIdPage/);
  assert.match(networkPage, /NetworkPage/);
  assert.match(messagesPage, /MessagesPage/);
  assert.match(messagesPage, /Suspense/);
  assert.match(groupsPage, /GroupsPage/);
  assert.match(groupsPage, /Suspense/);
  assert.match(notificationsPage, /NotificationsPage/);
  assert.match(publishPage, /PublishPage/);
  assert.match(trainingsPage, /TrainingsPage/);
  assert.match(opportunitiesPage, /OpportunitiesPage/);
  assert.match(resourcesPage, /ResourcesPage/);
  assert.match(agendaPage, /AgendaPage/);
  assert.match(certificatesPage, /CertificatesPage/);
  assert.match(settingsPage, /SettingsPage/);
  assert.match(chrome, /\/espace-membre/);
  assert.match(memberLoading, /MemberPageSkeleton/);
  assert.match(memberShell, /Community Platform/);
  assert.match(memberShell, /href="\/espace-membre"/);
  assert.doesNotMatch(memberShell, /href="\/#accueil"/);
  assert.match(memberShell, /\/espace-membre\/formations/);
  assert.match(memberShell, /\/espace-membre\/reseau/);
  assert.match(memberShell, /\/espace-membre\/messages/);
  assert.match(memberShell, /\/espace-membre\/groupes/);
  assert.match(memberShell, /\/espace-membre\/notifications/);
  assert.match(memberShell, /\/espace-membre\/publier/);
  assert.match(memberShell, /\/espace-membre\/opportunites/);
  assert.match(memberShell, /\/espace-membre\/ressources/);
  assert.match(memberShell, /\/espace-membre\/agenda/);
  assert.match(memberShell, /\/espace-membre\/certificats/);
  assert.match(memberShell, /\/espace-membre\/parametres/);
  assert.match(memberShell, /data-dashboard-theme/);
  assert.match(memberShell, /getCurrentMember/);
  assert.match(api, /authenticatedApiRequest/);
  assert.match(api, /refreshPromise/);
  assert.match(api, /refreshAccessToken/);
  assert.match(api, /onTokensRefreshed/);
  assert.match(api, /getNetworkMembers/);
  assert.match(api, /saveNetworkMember/);
  assert.match(api, /removeNetworkMember/);
  assert.match(api, /\/member\/network/);
  assert.match(api, /getPublicationCapabilities/);
  assert.match(api, /createPublication/);
  assert.match(api, /uploadPublicationAttachment/);
  assert.match(api, /getPublications/);
  assert.match(api, /getPublicationsPage/);
  assert.match(api, /getMyPublications/);
  assert.match(api, /commentPublication/);
  assert.match(api, /reactToPublication/);
  assert.match(api, /CommunityGroup/);
  assert.match(api, /getCommunityGroups/);
  assert.match(api, /createCommunityGroup/);
  assert.match(api, /updateCommunityGroup/);
  assert.match(api, /deleteCommunityGroup/);
  assert.match(api, /joinCommunityGroup/);
  assert.match(api, /leaveCommunityGroup/);
  assert.match(api, /getCommunityGroupMemberCandidates/);
  assert.match(api, /getCommunityGroupMembers/);
  assert.match(api, /uploadCommunityGroupPhoto/);
  assert.match(api, /getMyCommunityGroupInvitations/);
  assert.match(api, /getCommunityGroupInvitations/);
  assert.match(api, /addCommunityGroupMember/);
  assert.match(api, /inviteCommunityGroupMember/);
  assert.match(api, /acceptCommunityGroupInvitation/);
  assert.match(api, /declineCommunityGroupInvitation/);
  assert.match(api, /cancelCommunityGroupInvitation/);
  assert.match(api, /updateCommunityGroupMemberRole/);
  assert.match(api, /removeCommunityGroupMember/);
  assert.match(api, /getCommunityGroupMessages/);
  assert.match(api, /createCommunityGroupMessage/);
  assert.match(api, /deleteCommunityGroupMessage/);
  assert.match(api, /\/publications\/capabilities/);
  assert.match(api, /\/publications\/uploads/);
  assert.match(api, /\/groups/);
  assert.match(storeProvider, /configureAuthTokenHandlers/);
  assert.match(storeProvider, /setTokens/);
  assert.match(memberShell, /MemberPageSkeleton/);
  assert.match(memberShell, /clearStoredAuth/);
  assert.match(memberShell, /Se déconnecter/);
  assert.match(memberShell, /member-profile-dropdown/);
  assert.match(memberShell, /shouldShowCreativeIdPrompt/);
  assert.match(memberShell, /profile\.profileCompletion < 100/);
  assert.match(memberShell, /Un profil précis permet d’être recommandé/);
  assert.match(memberShell, /member-premium-action/);
  assert.match(styles, /\.member-sidebar[\s\S]*overflow: hidden/);
  assert.match(styles, /\.member-nav[\s\S]*flex: 1 1 auto/);
  assert.match(styles, /\.member-nav[\s\S]*overflow-y: auto/);
  assert.match(styles, /\.member-premium-card span[\s\S]*-webkit-line-clamp: 3/);
  assert.match(styles, /\.member-shell \.skeleton-line/);
  assert.match(styles, /\.member-card-skeleton/);
  assert.match(styles, /\.skeleton-card-grid/);
  assert.match(styles, /@keyframes skeleton-shimmer/);
  assert.match(styles, /@media \(min-width: 1081px\) and \(max-height: 860px\)[\s\S]*\.member-nav a[\s\S]*min-height: 40px/);
  assert.match(styles, /@media \(min-width: 1081px\) and \(max-height: 860px\)[\s\S]*\.member-premium-card span[\s\S]*font-size: 0\.78rem/);
  assert.match(dashboard, /Creative ID/);
  assert.match(dashboard, /getMemberDisplayName/);
  assert.match(dashboard, /Bonjour \{displayName\}/);
  assert.match(dashboard, /Fil d'actualité/);
  assert.match(dashboard, /getPublicationsPage\(accessToken, \{/);
  assert.match(dashboard, /IntersectionObserver/);
  assert.match(dashboard, /nextFeedCursor/);
  assert.match(dashboard, /member-feed-load-more/);
  assert.match(dashboard, /reactToPublication/);
  assert.match(dashboard, /getPublicationComments/);
  assert.match(dashboard, /commentPublication/);
  assert.match(dashboard, /Commencer une publication/);
  assert.match(dashboard, /Vue d'ensemble/);
  assert.match(creativeId, /QRCode/);
  assert.match(creativeId, /Lien public actif/);
  assert.match(creativeId, /encodeURIComponent\(memberNumber\)/);
  assert.match(creativeId, /updateMemberProfile\(accessToken, \{ visibility: nextVisibility \}\)/);
  assert.match(creativeId, /getMissingCreativeFields/);
  assert.match(creativeId, /getMemberDisplayName/);
  assert.match(creativeId, /Portfolio & documents/);
  assert.match(creativeId, /Compétences & domaines/);
  assert.match(network, /Annuaire membres/);
  assert.match(network, /getNetworkMembers/);
  assert.match(network, /saveNetworkMember/);
  assert.match(network, /removeNetworkMember/);
  assert.match(network, /Relations/);
  assert.match(network, /\/espace-membre\/messages\?memberId=/);
  assert.match(network, /getPublicationsPage\(accessToken, \{/);
  assert.match(network, /networkPublicationCursor/);
  assert.match(network, /Publications du réseau/);
  assert.match(network, /Recherchez par discipline, pays, ville, langues parlées et disponibilité/);
  assert.match(network, /scoreNetworkMember/);
  assert.match(network, /Se connecter/);
  assert.match(network, /Message/);
  assert.match(messages, /Une messagerie claire/);
  assert.match(messages, /useSearchParams/);
  assert.match(messages, /requestedGroupId/);
  assert.match(messages, /requestedMemberId/);
  assert.match(messages, /getNetworkMembers/);
  assert.match(messages, /memberId/);
  assert.match(messages, /getCommunityGroups/);
  assert.match(messages, /getCommunityGroupMessages/);
  assert.match(messages, /createCommunityGroupMessage/);
  assert.match(messages, /avatarUrl: group\.avatarUrl/);
  assert.match(messages, /useVisibleItems\(filteredConversations, 14\)/);
  assert.match(messages, /MessageAvatar/);
  assert.match(messages, /versionedImageUrl/);
  assert.match(messages, /groupId/);
  assert.match(messages, /messages-composer/);
  assert.match(groups, /Groupes communautaires/);
  assert.match(groups, /useSearchParams/);
  assert.match(groups, /requestedGroupId/);
  assert.match(groups, /getCommunityGroups/);
  assert.match(groups, /createCommunityGroup/);
  assert.match(groups, /updateCommunityGroup/);
  assert.match(groups, /deleteCommunityGroup/);
  assert.match(groups, /joinCommunityGroup/);
  assert.match(groups, /leaveCommunityGroup/);
  assert.match(groups, /addCommunityGroupMember/);
  assert.match(groups, /inviteCommunityGroupMember/);
  assert.match(groups, /getMyCommunityGroupInvitations/);
  assert.match(groups, /getCommunityGroupInvitations/);
  assert.match(groups, /acceptCommunityGroupInvitation/);
  assert.match(groups, /declineCommunityGroupInvitation/);
  assert.match(groups, /cancelCommunityGroupInvitation/);
  assert.match(groups, /getCommunityGroupMemberCandidates/);
  assert.match(groups, /getCommunityGroupMembers/);
  assert.match(groups, /updateCommunityGroupMemberRole/);
  assert.match(groups, /removeCommunityGroupMember/);
  assert.match(groups, /uploadCommunityGroupPhoto/);
  assert.match(groups, /getCommunityGroupMessages/);
  assert.match(groups, /createCommunityGroupMessage/);
  assert.match(groups, /deleteCommunityGroupMessage/);
  assert.match(groups, /getPublications\(accessToken, \{ destination: "groups"/);
  assert.match(groups, /useVisibleItems\(filteredGroups, 12\)/);
  assert.match(groups, /Discussions publiées/);
  assert.match(groups, /Business créatif/);
  assert.match(groups, /Créer un groupe/);
  assert.match(groups, /Discussion du groupe/);
  assert.match(groups, /Messagerie à plusieurs/);
  assert.match(groups, /Ajouter ou inviter un membre/);
  assert.match(groups, /Invitations reçues/);
  assert.match(groups, /Invitations en attente/);
  assert.match(groups, /Inviter/);
  assert.match(groups, /Ajouter une photo/);
  assert.match(groups, /Changer la photo/);
  assert.match(groups, /Accepter/);
  assert.match(groups, /Refuser/);
  assert.match(groups, /Membres du groupe/);
  assert.match(groups, /Nommer admin/);
  assert.match(groups, /Retirer admin/);
  assert.match(groups, /Aucun groupe réel pour le moment/);
  assert.match(groups, /Aucune discussion sélectionnée/);
  assert.match(groups, /\/espace-membre\/messages\?groupId=/);
  assert.match(groups, /Ouvrir la discussion/);
  assert.match(styles, /social-group-form/);
  assert.match(styles, /social-group-photo-action/);
  assert.match(styles, /social-group-icon\.has-image/);
  assert.match(styles, /social-member-add-panel/);
  assert.match(styles, /social-invitations-card/);
  assert.match(styles, /social-member-inline-actions/);
  assert.match(styles, /social-pending-invites/);
  assert.match(styles, /social-members-panel/);
  assert.match(styles, /social-role-pill/);
  assert.match(styles, /social-member-option/);
  assert.match(styles, /social-message-thread/);
  assert.match(styles, /messages-empty-state/);
  assert.match(styles, /message-avatar\.has-image/);
  assert.match(styles, /message-avatar img/);
  assert.match(styles, /member-danger-button/);
  assert.match(notifications, /Activité récente/);
  assert.match(notifications, /Tout marquer lu/);
  assert.match(notifications, /useVisibleItems\(filteredNotifications, 12\)/);
  assert.match(notifications, /Automatique/);
  assert.match(publish, /Que voulez-vous publier/);
  assert.match(publish, /Composer la publication/);
  assert.match(publish, /Création \/ œuvre/);
  assert.match(publish, /Je veux montrer mon travail/);
  assert.match(publish, /Je cherche quelqu'un/);
  assert.match(publish, /Mission \/ emploi/);
  assert.match(publish, /Ressource utile/);
  assert.match(publish, /Enregistrer brouillon/);
  assert.match(publish, /getPublicationCapabilities/);
  assert.match(publish, /createPublication/);
  assert.match(publish, /uploadPublicationAttachment/);
  assert.match(publish, /attachments: attachments\.map/);
  assert.match(publish, /Informations utiles aux autres onglets/);
  assert.match(publish, /opportunityDeadline/);
  assert.match(publish, /opportunityLocation/);
  assert.match(publish, /budgetRange/);
  assert.match(publish, /contactEmail/);
  assert.match(publish, /Votre type de compte ne peut pas publier ce type de contenu/);
  assert.match(publish, /destinationToHref/);
  assert.match(publish, /Publication envoyée/);
  assert.match(publicCreativeId, /PublicCreativeIdPage/);
  assert.match(publicCreativeId, /force-dynamic/);
  assert.match(publicCreativeId, /member\/creative-id/);
  assert.match(publicCreativeId, /Creative ID public/);
  assert.match(publicCertificateVerification, /CertificateVerificationPage/);
  assert.match(publicCertificateVerification, /member\/certificates\/verify/);
  assert.match(publicCertificateVerification, /Vérification certificat CCA/);
  assert.match(publicCertificateVerification, /Certificat valide/);
  assert.match(trainings, /getMemberTrainings/);
  assert.match(trainings, /useVisibleItems\(filteredTrainings, 10\)/);
  assert.match(trainings, /enrollInTraining/);
  assert.match(trainings, /Catalogue formations/);
  assert.match(trainings, /Officielles CCA/);
  assert.match(trainings, /Mes inscriptions/);
  assert.match(trainings, /Mes formations publiées/);
  assert.match(trainings, /Publier une formation/);
  assert.match(trainings, /Certificat après validation/);
  assert.match(opportunities, /getMemberOpportunities/);
  assert.match(opportunities, /useVisibleItems\(filteredOpportunities, 10\)/);
  assert.match(opportunities, /applyToOpportunity/);
  assert.match(opportunities, /Opportunités disponibles/);
  assert.match(opportunities, /Publier une opportunité/);
  assert.match(opportunities, /Mes candidatures/);
  assert.match(opportunities, /Mes opportunités publiées/);
  assert.match(opportunities, /Préparer le dossier/);
  assert.match(opportunities, /Candidature envoyée/);
  assert.match(resources, /getMemberResources/);
  assert.match(resources, /useVisibleItems\(filteredResources, 12\)/);
  assert.match(resources, /Bibliothèque/);
  assert.match(resources, /Mes ressources publiées/);
  assert.match(resources, /Droits & visibilité/);
  assert.match(resources, /Publier une ressource/);
  assert.match(resources, /Ressources officielles/);
  assert.match(resources, /Mes formations/);
  assert.match(api, /getMemberAgenda/);
  assert.match(api, /registerAgendaEvent/);
  assert.match(api, /getMemberCertificates/);
  assert.match(agenda, /getMemberAgenda/);
  assert.match(agenda, /useVisibleItems\(filteredItems, 12\)/);
  assert.match(agenda, /registerAgendaEvent/);
  assert.match(agenda, /Prochains rendez-vous/);
  assert.match(agenda, /Tout ce qui a une date connue/);
  assert.match(agenda, /Agenda automatique/);
  assert.match(agenda, /Les formations, opportunités et événements avec une date apparaissent ici automatiquement/);
  assert.match(agenda, /Les publications sans date ne peuvent pas remonter/);
  assert.match(certificates, /Mes certificats/);
  assert.match(certificates, /Badges visibles/);
  assert.match(certificates, /getMemberCertificates/);
  assert.match(certificates, /Certificats réservés aux apprenants et créateurs/);
  assert.match(certificates, /Validation CCA/);
  assert.match(settings, /Informations du compte/);
  assert.match(settings, /settingsTabs/);
  assert.match(settings, /SettingsAccountPanel/);
  assert.match(settings, /SettingsSecurityPanel/);
  assert.match(settings, /SettingsAccessibilityPanel/);
  assert.match(settings, /SettingsActivityPanel/);
  assert.match(settings, /Confidentialité/);
  assert.match(settings, /Accessibilité/);
  assert.match(settings, /Activité du compte/);
  assert.match(settings, /SettingsProfileEditor/);
  assert.match(settings, /updateMemberProfile/);
  assert.match(settings, /setCurrentMember/);
  assert.match(settings, /Profil mis à jour avec succès/);
  assert.match(settings, /Creative ID/);
  assert.match(settings, /Nom affiché sur le profil/);
  assert.match(settings, /useReferenceDisciplines/);
  assert.match(settings, /disciplineOptions/);
  assert.match(settings, /SettingsLanguageMultiSelect/);
  assert.match(settings, /Rechercher ou ajouter une langue/);
  assert.match(settings, /Compétences clés/);
  assert.match(settings, /Langues parlées/);
  assert.match(settings, /Visibilité du Creative ID/);
  assert.match(settings, /value="PUBLIC"/);
  assert.match(settings, /SettingsFileUpload/);
  assert.match(settings, /uploadProfileAsset/);
  assert.match(settings, /Photo de profil/);
  assert.match(settings, /label="CV"/);
  assert.match(settings, /featuredUpload/);
  assert.match(settings, /label: "Logo"/);
  assert.match(settings, /settings-file-upload--featured/);
  assert.match(settings, /Profil organisation/);
  assert.match(settings, /Profil partenaire/);
  assert.match(settings, /profileCompletion/);
  assert.match(settings, /buildSettingsForm/);
  assert.doesNotMatch(settings, /label="Prénom"[\s\S]*?required \/>/);
  assert.doesNotMatch(settings, /label="Discipline"[\s\S]*?required>/);
  assert.match(styles, /\.network-toolbar/);
  assert.match(styles, /\.network-filter-grid/);
  assert.match(styles, /\.network-member-card/);
  assert.match(styles, /\.network-detail-card/);
  assert.match(styles, /\.social-toolbar/);
  assert.match(styles, /\.social-group-card/);
  assert.match(styles, /\.messages-shell-card/);
  assert.match(styles, /\.notification-card/);
  assert.match(styles, /\.publish-type-grid/);
  assert.match(styles, /\.publish-composer-card/);
  assert.match(styles, /\.publish-preview-card/);
  assert.match(styles, /\.settings-profile-form/);
  assert.match(styles, /\.settings-tabs/);
  assert.match(styles, /\.settings-panel/);
  assert.match(styles, /\.settings-segmented/);
  assert.match(styles, /\.settings-activity-list/);
  assert.match(styles, /\.settings-form-grid/);
  assert.match(styles, /\.settings-language-tag/);
  assert.match(styles, /\.settings-file-upload/);
  assert.match(styles, /\.settings-language-options/);
  assert.match(styles, /\.settings-language-options[\s\S]*background-color: #111827/);
  assert.match(styles, /\.settings-language-options[\s\S]*background-image: none/);
  assert.match(styles, /\.settings-language-field \.settings-language-options[\s\S]*background-color: #111827/);
  assert.match(styles, /\.member-shell\[data-dashboard-theme="light"\] \.settings-language-options[\s\S]*background-color: #ffffff/);
  assert.match(styles, /\.country-picker-backdrop \.language-picker-modal[\s\S]*background-color: #070913/);
  assert.match(styles, /\.language-picker-list[\s\S]*background-color: #0b1020/);
  assert.match(styles, /\.settings-section-title/);
  assert.match(styles, /\.member-shell\[data-dashboard-theme="light"\] \.auth-form-error/);
  assert.match(styles, /color: #7f1d1d/);
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

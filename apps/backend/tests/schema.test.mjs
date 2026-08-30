import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("defines the PostgreSQL Prisma datasource", async () => {
  const [schema, config] = await Promise.all([
    readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8"),
    readFile(new URL("../prisma.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(schema, /provider\s+=\s+"postgresql"/);
  assert.doesNotMatch(schema, /url\s+=\s+env/);
  assert.match(config, /env\("DATABASE_URL"\)/);
});

test("defines core Creative Currencies platform models", async () => {
  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

  for (const model of [
    "User",
    "AuthSession",
    "UserIdentity",
    "VerificationToken",
    "Discipline",
    "CreativeProfile",
    "OrganizationProfile",
    "PartnerProfile",
    "PortfolioItem",
    "Training",
    "TrainingEnrollment",
    "Opportunity",
    "OpportunityApplication",
    "Event",
    "EventRegistration",
    "Resource",
    "Certificate",
    "Partner",
    "Notification",
    "Publication",
    "PublicationAttachment",
    "PublicationComment",
    "PublicationReaction",
    "NetworkConnection",
    "CommunityGroup",
    "CommunityGroupMembership",
    "CommunityGroupInvitation",
    "CommunityGroupMessage",
  ]) {
    assert.match(schema, new RegExp(`model ${model} `));
  }

  assert.match(schema, /enum AuthProvider/);
  assert.match(schema, /GOOGLE/);
  assert.match(schema, /APPLE/);
  assert.match(schema, /FACEBOOK/);
  assert.match(schema, /enum VerificationPurpose/);
  assert.match(schema, /EMAIL_VERIFICATION/);
  assert.match(schema, /PASSWORD_RESET/);
  assert.match(schema, /enum PublicationType/);
  assert.match(schema, /GROUP_DISCUSSION/);
  assert.match(schema, /ANNOUNCEMENT/);
  assert.match(schema, /enum PublicationAudience/);
  assert.match(schema, /MEMBERS/);
  assert.match(schema, /PUBLIC/);
  assert.match(schema, /enum PublicationReactionType/);
  assert.match(schema, /SUPPORT/);
  assert.match(schema, /SAVE/);
  assert.match(schema, /enum CommunityGroupVisibility/);
  assert.match(schema, /enum CommunityGroupRole/);
  assert.match(schema, /enum CommunityGroupInvitationStatus/);
  assert.match(schema, /enum CommunityGroupMessageType/);
  assert.match(schema, /model CommunityGroup[\s\S]*?avatarUrl\s+String\?/);
  assert.match(schema, /model NetworkConnection/);
  assert.match(schema, /@@unique\(\[ownerId, memberId\]\)/);
  assert.match(schema, /OWNER/);
  assert.match(schema, /MODERATOR/);
  assert.match(schema, /PENDING/);
  assert.match(schema, /SYSTEM/);
  assert.match(schema, /email\s+String\s+@unique/);
  assert.match(schema, /phone\s+String\?/);
  assert.match(schema, /cvUrl\s+String\?/);
  assert.match(schema, /model OrganizationProfile[\s\S]*?logoUrl\s+String\?/);
  assert.match(schema, /model PartnerProfile[\s\S]*?logoUrl\s+String\?/);
  assert.match(schema, /model Discipline/);
  assert.match(schema, /slug\s+String\s+@unique/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /sortOrder\s+Int\s+@default\(0\)/);
});

test("keeps backend bootstrap aligned with the frontend and API contract", async () => {
  const [
    main,
    appModule,
    controller,
    envExample,
    authController,
    authService,
    verificationService,
    forgotPasswordDto,
    loginDto,
    resetPasswordDto,
    verifyPasswordResetCodeDto,
    emailService,
    memberController,
    memberService,
    updateMemberProfileDto,
    createDisciplineDto,
    updateDisciplineDto,
    referenceController,
    referenceService,
    publicationController,
    publicationService,
    createPublicationDto,
    updatePublicationDto,
    publicationQueryDto,
    publicationMigration,
    groupController,
    groupService,
    createGroupDto,
    updateGroupDto,
    groupQueryDto,
    addGroupMemberDto,
    createGroupInvitationDto,
    groupMemberCandidateQueryDto,
    updateGroupMemberRoleDto,
    createGroupMessageDto,
    updateGroupMessageDto,
    groupMigration,
    groupInvitationMigration,
    groupAvatarMigration,
    disciplineMigration,
    uploadMigration,
  ] =
    await Promise.all([
    readFile(new URL("../src/main.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app.module.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/auth.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/auth.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/verification.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/dto/forgot-password.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/dto/login.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/dto/reset-password.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/auth/dto/verify-password-reset-code.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/email/email.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/member/member.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/member/member.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/member/dto/update-member-profile.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/reference/dto/create-discipline.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/reference/dto/update-discipline.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/reference/reference.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/reference/reference.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/publication/publication.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/publication/publication.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/publication/dto/create-publication.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/publication/dto/update-publication.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/publication/dto/publication-query.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260821093000_add_publications_hub/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../src/group/group.controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/group.service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/create-group.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/update-group.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/group-query.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/add-group-member.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/create-group-invitation.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/group-member-candidate-query.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/update-group-member-role.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/create-group-message.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/group/dto/update-group-message.dto.ts", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260821113000_add_community_groups/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260825143000_add_community_group_invitations/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260825151500_add_community_group_avatar/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260819124500_add_disciplines_reference/migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../prisma/migrations/20260819191000_add_profile_logo_uploads/migration.sql", import.meta.url), "utf8"),
  ]);

  assert.match(main, /setGlobalPrefix\("api"\)/);
  assert.match(main, /SwaggerModule/);
  assert.match(main, /api\/docs/);
  assert.match(main, /addBearerAuth/);
  assert.match(main, /FRONTEND_ORIGINS/);
  assert.match(main, /stopAtFirstError/);
  assert.match(main, /exceptionFactory/);
  assert.match(main, /validationMessages/);
  assert.match(main, /Une information du formulaire n'est pas reconnue/);
  assert.match(main, /useStaticAssets/);
  assert.match(main, /UPLOADS_DIR/);
  assert.match(appModule, /AuthModule/);
  assert.match(appModule, /ReferenceModule/);
  assert.match(appModule, /MemberModule/);
  assert.match(appModule, /PublicationModule/);
  assert.match(appModule, /GroupModule/);
  assert.match(controller, /Phase 2 - backend foundation/);
  assert.match(controller, /member-dashboard/);
  assert.match(controller, /creative-id/);
  assert.match(controller, /back-office/);
  assert.match(authController, /@Controller\("auth"\)/);
  assert.match(authController, /@Post\("register"\)/);
  assert.match(authController, /@Post\("verify-email"\)/);
  assert.match(authController, /@Post\("resend-verification"\)/);
  assert.match(authController, /@Post\("forgot-password"\)/);
  assert.match(authController, /@Post\("verify-password-reset-code"\)/);
  assert.match(authController, /@Post\("reset-password"\)/);
  assert.match(authController, /@Post\("login"\)/);
  assert.match(authController, /Email ou mot de passe incorrect/);
  assert.match(authController, /@Post\("refresh"\)/);
  assert.match(authController, /@Post\("logout"\)/);
  assert.match(authController, /@Get\("me"\)/);
  assert.match(authService, /argon2\.hash/);
  assert.match(authService, /argon2\.verify/);
  assert.match(authService, /issueTokens/);
  assert.match(authService, /refreshTokenHash/);
  assert.match(authService, /AccountStatus\.PENDING/);
  assert.match(authService, /verifyEmail/);
  assert.match(authService, /PrismaClientKnownRequestError/);
  assert.match(authService, /createRegistrationWithMemberNumberRetry/);
  assert.match(authService, /isMemberNumberUniqueConflict/);
  assert.match(authService, /memberNumber/);
  assert.match(authService, /100000 \+ Math\.random\(\) \* 900000/);
  assert.match(authService, /Email ou mot de passe incorrect/);
  assert.match(authService, /Votre connexion a expiré/);
  assert.doesNotMatch(authService, /Identifiants invalides/);
  assert.doesNotMatch(authService, /Session invalide/);
  assert.doesNotMatch(authService, /Refresh token invalide/);
  assert.match(authService, /forgotPassword/);
  assert.match(authService, /verifyPasswordResetCode/);
  assert.match(authService, /resetPassword/);
  assert.match(authService, /checkPasswordResetCode/);
  assert.match(authService, /Une majuscule et une minuscule/);
  assert.match(authService, /Un caractère spécial/);
  assert.match(authService, /authSession\.updateMany/);
  assert.match(memberController, /@Get\("creative-id\/:memberNumber"\)/);
  assert.match(memberService, /getPublicCreativeId/);
  assert.match(memberService, /ProfileVisibility\.PUBLIC/);
  assert.match(updateMemberProfileDto, /ProfileVisibility/);
  assert.match(updateMemberProfileDto, /visibility/);
  assert.match(verificationService, /VerificationPurpose\.EMAIL_VERIFICATION/);
  assert.match(verificationService, /VerificationPurpose\.PASSWORD_RESET/);
  assert.match(verificationService, /generateOtpCode/);
  assert.match(verificationService, /maxAttempts/);
  assert.match(verificationService, /Le code saisi est incorrect/);
  assert.match(verificationService, /Ce code a expiré/);
  assert.match(verificationService, /Trop de codes demandés/);
  assert.match(verificationService, /Trop de tentatives/);
  assert.match(forgotPasswordDto, /ForgotPasswordDto/);
  assert.match(loginDto, /LoginDto/);
  assert.doesNotMatch(loginDto, /MinLength/);
  assert.doesNotMatch(loginDto, /mot de passe doit contenir/);
  assert.match(resetPasswordDto, /ResetPasswordDto/);
  assert.doesNotMatch(resetPasswordDto, /MinLength/);
  assert.doesNotMatch(resetPasswordDto, /Adresse e-mail est invalide/);
  assert.match(verifyPasswordResetCodeDto, /VerifyPasswordResetCodeDto/);
  assert.match(verifyPasswordResetCodeDto, /Le code de vérification doit contenir 6 chiffres/);
  assert.match(emailService, /EMAIL_PROVIDER/);
  assert.match(emailService, /console/);
  assert.match(emailService, /sendPasswordResetCode/);
  assert.match(memberController, /@Controller\("member"\)/);
  assert.match(memberController, /@Patch\("profile"\)/);
  assert.match(memberController, /@Post\("uploads"\)/);
  assert.match(memberController, /FileInterceptor\("file"/);
  assert.match(memberController, /JwtAuthGuard/);
  assert.match(memberController, /updateProfile/);
  assert.match(memberController, /@Get\("dashboard"\)/);
  assert.match(memberController, /@Get\("opportunities"\)/);
  assert.match(memberController, /@Post\("network\/:userId\/save"\)/);
  assert.match(memberController, /@Delete\("network\/:userId\/save"\)/);
  assert.match(memberController, /@Get\("certificates"\)/);
  assert.match(memberController, /getCertificates\(req\.user\)/);
  assert.match(memberController, /@Get\("certificates\/verify\/:number"\)/);
  assert.match(memberController, /@Post\("certificates\/issue"\)/);
  assert.match(memberService, /async updateProfile/);
  assert.match(memberService, /async getCertificates/);
  assert.match(memberService, /async issueCertificate/);
  assert.match(memberService, /async saveNetworkMember/);
  assert.match(memberService, /async removeNetworkMember/);
  assert.match(memberService, /networkConnection\.upsert/);
  assert.match(memberService, /generateCertificateNumber/);
  assert.match(memberService, /canViewCertificates/);
  assert.match(memberService, /calculateCreativeProfileCompletion/);
  assert.match(memberService, /profileCompletion/);
  assert.match(memberService, /toAuthUserResponse/);
  assert.match(memberService, /uploadProfileAsset/);
  assert.match(memberService, /validateUploadedFile/);
  assert.match(memberService, /PUBLIC_BACKEND_URL/);
  assert.match(memberService, /writeFile/);
  assert.match(updateMemberProfileDto, /UpdateMemberProfileDto/);
  assert.match(updateMemberProfileDto, /organizationName/);
  assert.match(updateMemberProfileDto, /partnerName/);
  assert.match(updateMemberProfileDto, /languages/);
  assert.match(updateMemberProfileDto, /skills/);
  assert.match(updateMemberProfileDto, /ValidateIf/);
  assert.match(updateMemberProfileDto, /value !== ""/);
  assert.match(referenceController, /@Controller\("reference"\)/);
  assert.match(referenceController, /@Get\("disciplines"\)/);
  assert.match(referenceController, /@Post\("disciplines"\)/);
  assert.match(referenceController, /@Patch\("disciplines\/:id"\)/);
  assert.match(referenceController, /JwtAuthGuard/);
  assert.match(referenceController, /@Get\("onboarding-fields"\)/);
  assert.match(referenceService, /prisma\.discipline\.findMany/);
  assert.match(referenceService, /ensureDefaultDisciplines/);
  assert.match(referenceService, /createDiscipline/);
  assert.match(referenceService, /updateDiscipline/);
  assert.match(referenceService, /AccountType\.ADMIN/);
  assert.match(referenceService, /Arts numériques/);
  assert.match(referenceService, /Mode, couture & stylisme/);
  assert.match(referenceService, /Beauté, coiffure & esthétique/);
  assert.match(referenceService, /Artisanat/);
  assert.match(referenceService, /Arts visuels/);
  assert.match(referenceService, /Illustration & bande dessinée/);
  assert.match(referenceService, /Design & graphisme/);
  assert.match(referenceService, /Événementiel & production culturelle/);
  assert.match(referenceService, /Formation & transmission artistique/);
  assert.match(referenceService, /Gastronomie créative/);
  assert.match(referenceService, /Autre/);
  assert.doesNotMatch(referenceService, /Questions\/réponses/);
  assert.match(publicationController, /@Controller\("publications"\)/);
  assert.match(publicationController, /@Get\("capabilities"\)/);
  assert.match(publicationController, /@Post\(\)/);
  assert.match(publicationController, /@Post\("uploads"\)/);
  assert.match(publicationController, /FileInterceptor\("file"/);
  assert.match(publicationController, /@Get\("mine"\)/);
  assert.match(publicationController, /@Post\(":id\/comments"\)/);
  assert.match(publicationController, /@Post\(":id\/reactions"\)/);
  assert.match(publicationController, /JwtAuthGuard/);
  assert.match(publicationService, /publicationPolicies/);
  assert.match(publicationService, /PublicationType\.PROJECT/);
  assert.match(publicationService, /PublicationType\.OPPORTUNITY/);
  assert.match(publicationService, /PublicationType\.GROUP_DISCUSSION/);
  assert.match(publicationService, /PublicationType\.TRAINING/);
  assert.match(publicationService, /PublicationType\.ANNOUNCEMENT/);
  assert.match(publicationService, /AccountType\.PUBLIC/);
  assert.match(publicationService, /AccountType\.CREATOR/);
  assert.match(publicationService, /AccountType\.LEARNER/);
  assert.match(publicationService, /AccountType\.ORGANIZATION/);
  assert.match(publicationService, /AccountType\.PARTNER/);
  assert.match(publicationService, /getCapabilities/);
  assert.match(publicationService, /createPublication/);
  assert.match(publicationService, /uploadPublicationAttachment/);
  assert.match(publicationService, /storePublicationFile/);
  assert.match(publicationService, /PublicationAttachmentType\.IMAGE/);
  assert.match(publicationService, /Le fichier ne doit pas dépasser 20 Mo/);
  assert.match(publicationService, /listPublications/);
  assert.match(publicationService, /toggleReaction/);
  assert.match(publicationService, /routingDestinations/);
  assert.match(publicationService, /Ajoutez un lien ou un fichier pour publier une ressource/);
  assert.match(createPublicationDto, /CreatePublicationDto/);
  assert.match(createPublicationDto, /PublicationAttachmentDto/);
  assert.match(createPublicationDto, /publishNow/);
  assert.match(createPublicationDto, /opportunityDeadline/);
  assert.match(createPublicationDto, /budgetRange/);
  assert.match(updatePublicationDto, /PartialType\(CreatePublicationDto\)/);
  assert.match(publicationQueryDto, /PublicationQueryDto/);
  assert.match(publicationQueryDto, /destination/);
  assert.match(publicationMigration, /CREATE TABLE "Publication"/);
  assert.match(publicationMigration, /CREATE TABLE "PublicationAttachment"/);
  assert.match(publicationMigration, /CREATE TABLE "PublicationComment"/);
  assert.match(publicationMigration, /CREATE TABLE "PublicationReaction"/);
  assert.match(publicationMigration, /PublicationReaction_publicationId_userId_type_key/);
  assert.match(groupController, /@Controller\("groups"\)/);
  assert.match(groupController, /@Post\(\)/);
  assert.match(groupController, /@Patch\(":id"\)/);
  assert.match(groupController, /@Delete\(":id"\)/);
  assert.match(groupController, /@Post\(":id\/join"\)/);
  assert.match(groupController, /@Post\(":id\/leave"\)/);
  assert.match(groupController, /@Get\(":id\/member-candidates"\)/);
  assert.match(groupController, /@Get\(":id\/members"\)/);
  assert.match(groupController, /@Post\(":id\/members"\)/);
  assert.match(groupController, /@Post\(":id\/photo"\)/);
  assert.match(groupController, /FileInterceptor\("file"/);
  assert.match(groupController, /@Get\("invitations"\)/);
  assert.match(groupController, /@Patch\("invitations\/:invitationId\/accept"\)/);
  assert.match(groupController, /@Patch\("invitations\/:invitationId\/decline"\)/);
  assert.match(groupController, /@Get\(":id\/invitations"\)/);
  assert.match(groupController, /@Post\(":id\/invitations"\)/);
  assert.match(groupController, /@Delete\(":id\/invitations\/:invitationId"\)/);
  assert.match(groupController, /@Patch\(":id\/members\/:memberUserId"\)/);
  assert.match(groupController, /@Delete\(":id\/members\/:memberUserId"\)/);
  assert.match(groupController, /AddGroupMemberDto/);
  assert.match(groupController, /CreateGroupInvitationDto/);
  assert.match(groupController, /GroupMemberCandidateQueryDto/);
  assert.match(groupController, /UpdateGroupMemberRoleDto/);
  assert.match(groupController, /@Get\(":id\/messages"\)/);
  assert.match(groupController, /@Post\(":id\/messages"\)/);
  assert.match(groupController, /@Patch\(":id\/messages\/:messageId"\)/);
  assert.match(groupController, /@Delete\(":id\/messages\/:messageId"\)/);
  assert.match(groupController, /JwtAuthGuard/);
  assert.match(groupService, /createGroup/);
  assert.match(groupService, /updateGroup/);
  assert.match(groupService, /archiveGroup/);
  assert.match(groupService, /joinGroup/);
  assert.match(groupService, /leaveGroup/);
  assert.match(groupService, /listMemberCandidates/);
  assert.match(groupService, /listMembers/);
  assert.match(groupService, /addMember/);
  assert.match(groupService, /uploadGroupPhoto/);
  assert.match(groupService, /validateGroupPhoto/);
  assert.match(groupService, /storeGroupPhoto/);
  assert.match(groupService, /listMyInvitations/);
  assert.match(groupService, /listGroupInvitations/);
  assert.match(groupService, /inviteMember/);
  assert.match(groupService, /acceptInvitation/);
  assert.match(groupService, /declineInvitation/);
  assert.match(groupService, /cancelInvitation/);
  assert.match(groupService, /updateMemberRole/);
  assert.match(groupService, /removeMember/);
  assert.match(groupService, /listMessages/);
  assert.match(groupService, /createMessage/);
  assert.match(groupService, /deleteMessage/);
  assert.match(groupService, /CommunityGroupRole\.OWNER/);
  assert.match(groupService, /CommunityGroupRole\.MODERATOR/);
  assert.match(groupService, /CommunityGroupInvitationStatus\.PENDING/);
  assert.match(groupService, /CommunityGroupMessageType\.SYSTEM/);
  assert.match(groupService, /Ce membre est déjà dans le groupe/);
  assert.match(groupService, /memberHeadline/);
  assert.match(groupService, /a été ajouté au groupe/);
  assert.match(groupService, /La photo du groupe ne doit pas dépasser 3 Mo/);
  assert.match(groupService, /Une invitation est déjà en attente/);
  assert.match(groupService, /Une invitation a été envoyée/);
  assert.match(groupService, /a accepté l'invitation et rejoint le groupe/);
  assert.match(groupService, /est maintenant admin du groupe/);
  assert.match(groupService, /n'est plus admin du groupe/);
  assert.match(groupService, /a été retiré du groupe/);
  assert.match(groupService, /canAssignRoles/);
  assert.match(groupService, /Rejoignez le groupe pour participer/);
  assert.match(createGroupDto, /CreateGroupDto/);
  assert.match(createGroupDto, /CommunityGroupVisibility/);
  assert.match(updateGroupDto, /PartialType\(CreateGroupDto\)/);
  assert.match(groupQueryDto, /GroupQueryDto/);
  assert.match(groupQueryDto, /mine/);
  assert.match(addGroupMemberDto, /AddGroupMemberDto/);
  assert.match(addGroupMemberDto, /userId/);
  assert.match(addGroupMemberDto, /CommunityGroupRole\.MODERATOR/);
  assert.match(createGroupInvitationDto, /CreateGroupInvitationDto/);
  assert.match(createGroupInvitationDto, /message/);
  assert.match(createGroupInvitationDto, /CommunityGroupRole\.MODERATOR/);
  assert.match(groupMemberCandidateQueryDto, /GroupMemberCandidateQueryDto/);
  assert.match(groupMemberCandidateQueryDto, /limit/);
  assert.match(updateGroupMemberRoleDto, /UpdateGroupMemberRoleDto/);
  assert.match(updateGroupMemberRoleDto, /CommunityGroupRole\.MODERATOR/);
  assert.match(createGroupMessageDto, /CreateGroupMessageDto/);
  assert.match(createGroupMessageDto, /attachmentUrl/);
  assert.match(updateGroupMessageDto, /PickType\(CreateGroupMessageDto/);
  assert.match(groupMigration, /CREATE TABLE "CommunityGroup"/);
  assert.match(groupMigration, /CREATE TABLE "CommunityGroupMembership"/);
  assert.match(groupMigration, /CREATE TABLE "CommunityGroupMessage"/);
  assert.match(groupMigration, /CommunityGroupMembership_groupId_userId_key/);
  assert.match(groupAvatarMigration, /ALTER TABLE "CommunityGroup" ADD COLUMN "avatarUrl" TEXT/);
  assert.match(groupInvitationMigration, /CREATE TYPE "CommunityGroupInvitationStatus"/);
  assert.match(groupInvitationMigration, /CREATE TABLE "CommunityGroupInvitation"/);
  assert.match(groupInvitationMigration, /CommunityGroupInvitation_inviteeId_status_idx/);
  assert.match(createDisciplineDto, /CreateDisciplineDto/);
  assert.match(createDisciplineDto, /sortOrder/);
  assert.match(updateDisciplineDto, /UpdateDisciplineDto/);
  assert.match(updateDisciplineDto, /isActive/);
  assert.match(disciplineMigration, /CREATE TABLE "Discipline"/);
  assert.match(disciplineMigration, /Discipline_slug_key/);
  assert.match(disciplineMigration, /INSERT INTO "Discipline"/);
  assert.match(uploadMigration, /ALTER TABLE "OrganizationProfile" ADD COLUMN "logoUrl" TEXT/);
  assert.match(uploadMigration, /ALTER TABLE "PartnerProfile" ADD COLUMN "logoUrl" TEXT/);
  assert.match(envExample, /creative_currencies/);
  assert.match(envExample, /https:\/\/\*\.vercel\.app/);
  assert.match(envExample, /JWT_ACCESS_SECRET/);
  assert.match(envExample, /JWT_REFRESH_SECRET/);
  assert.match(envExample, /EMAIL_PROVIDER/);
  assert.match(envExample, /PUBLIC_BACKEND_URL/);
  assert.match(envExample, /UPLOADS_DIR/);
  assert.match(envExample, /EMAIL_VERIFICATION_OTP_TTL_MINUTES/);
  assert.match(envExample, /PASSWORD_RESET_OTP_TTL_MINUTES/);
});

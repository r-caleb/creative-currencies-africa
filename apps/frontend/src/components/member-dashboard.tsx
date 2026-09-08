"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flag,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  MessageCircle,
  Newspaper,
  Repeat2,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { commentPublication, deletePublicationComment, getApiErrorMessage, getPublicationCapabilities, getPublicationComments, getPublicationReactions, getPublicationsPage, reactToPublication, reportPublication, saveNetworkMember, sharePublication } from "@/lib/api";
import type { MemberProfile, OrganizationProfile, PartnerProfile, Publication, PublicationCapability, PublicationComment, PublicationReactionUser, PublicationType } from "@/lib/api";
import { accountTypeLabel, buildInitials, getMemberDisplayName, getMemberProfileTitle } from "@/lib/member-display";
import { useAppSelector } from "@/store/hooks";

type RelationStatus = "PENDING" | "ACCEPTED" | "DECLINED";
type FeedAuthor = Publication["author"];
type ReportReason = "SPAM" | "INAPPROPRIATE" | "MISLEADING" | "HARASSMENT" | "OTHER";
type QuickPublishAction = {
  type: PublicationType;
  label: string;
  href: string;
  icon: LucideIcon;
};
type DashboardRoleConfig = {
  kicker: string;
  heroTitle: (name: string) => string;
  heroDescription: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
  prioritiesTitle: string;
  prioritiesDescription: string;
  priorities: Array<{ title: string; description: string; href: string; icon: LucideIcon }>;
  insightTitle: string;
  insightDescription: string;
  insights: Array<{ label: string; icon: LucideIcon; value: (posts: Publication[]) => number }>;
  notificationsText: string;
};

const quickPublishActions: QuickPublishAction[] = [
  { type: "CREATION", label: "Création", href: "/espace-membre/publier?type=CREATION", icon: ImageIcon },
  { type: "PROJECT", label: "Projet", href: "/espace-membre/publier?type=PROJECT", icon: Sparkles },
  { type: "OPPORTUNITY", label: "Opportunité", href: "/espace-membre/publier?type=OPPORTUNITY", icon: Lightbulb },
  { type: "QUESTION", label: "Question", href: "/espace-membre/publier?type=QUESTION", icon: MessageCircle },
  { type: "COLLABORATION", label: "Collaboration", href: "/espace-membre/publier?type=COLLABORATION", icon: UserPlus },
  { type: "RESOURCE", label: "Ressource", href: "/espace-membre/publier?type=RESOURCE", icon: FileText },
  { type: "EVENT", label: "Événement", href: "/espace-membre/publier?type=EVENT", icon: CalendarDays },
  { type: "TRAINING", label: "Formation", href: "/espace-membre/publier?type=TRAINING", icon: Newspaper },
];
const feedPageSize = 12;
const reportReasons: Array<{ value: ReportReason; label: string }> = [
  { value: "SPAM", label: "Spam ou contenu répétitif" },
  { value: "MISLEADING", label: "Information trompeuse" },
  { value: "INAPPROPRIATE", label: "Contenu inapproprié" },
  { value: "HARASSMENT", label: "Harcèlement" },
  { value: "OTHER", label: "Autre raison" },
];

const creatorDashboardConfig: DashboardRoleConfig = {
  kicker: "Espace créateur",
  heroTitle: (name) => `Bonjour ${name}, construisez votre visibilité créative.`,
  heroDescription: "Votre accueil rassemble Creative ID, portfolio, réseau, opportunités et publications pour transformer votre travail en parcours professionnel visible.",
  primaryAction: { label: "Publier une création", href: "/espace-membre/publier?type=CREATION" },
  secondaryAction: { label: "Voir mon Creative ID", href: "/espace-membre/creative-id" },
  prioritiesTitle: "Vos priorités créateur",
  prioritiesDescription: "Les actions qui donnent de la valeur à votre profil public et à vos candidatures.",
  priorities: [
    { title: "Renforcer le portfolio", description: "Ajoutez vos œuvres, projets, vidéos ou références pour crédibiliser votre Creative ID.", href: "/espace-membre/creative-id", icon: ImageIcon },
    { title: "Postuler aux opportunités", description: "Repérez les concours, résidences, financements et missions liés à votre discipline.", href: "/espace-membre/opportunites", icon: Lightbulb },
    { title: "Développer le réseau", description: "Connectez-vous aux créatifs, structures, partenaires et profils qui peuvent faire avancer vos projets.", href: "/espace-membre/reseau", icon: UsersRound },
  ],
  insightTitle: "Repères créateur",
  insightDescription: "Activité utile pour suivre les opportunités et la dynamique du réseau.",
  insights: [
    { label: "Créations", icon: ImageIcon, value: (posts) => posts.filter((post) => post.type === "CREATION").length },
    { label: "Opportunités", icon: Lightbulb, value: (posts) => posts.filter((post) => post.routingDestinations.includes("opportunities")).length },
    { label: "Réseau", icon: UsersRound, value: (posts) => new Set(posts.map((post) => post.author.id)).size },
  ],
  notificationsText: "Candidatures, commentaires, messages, invitations et rappels liés à votre parcours arrivent ici.",
};

const learnerDashboardConfig: DashboardRoleConfig = {
  kicker: "Espace apprenant",
  heroTitle: (name) => `Bonjour ${name}, avancez dans votre parcours d'apprentissage.`,
  heroDescription: "Votre accueil vous aide à suivre les formations, ressources, certificats et opportunités qui renforcent vos compétences créatives.",
  primaryAction: { label: "Explorer les formations", href: "/espace-membre/formations" },
  secondaryAction: { label: "Voir mes certificats", href: "/espace-membre/certificats" },
  prioritiesTitle: "Vos priorités apprenant",
  prioritiesDescription: "Un parcours clair pour apprendre, pratiquer, documenter et progresser vers un profil créatif plus solide.",
  priorities: [
    { title: "Choisir une formation", description: "Inscrivez-vous aux ateliers, masterclass et parcours alignés avec votre niveau.", href: "/espace-membre/formations", icon: GraduationCap },
    { title: "Consulter les ressources", description: "Retrouvez supports, guides, modèles et replays accessibles selon vos formations.", href: "/espace-membre/ressources", icon: BookOpen },
    { title: "Préparer la suite", description: "Construisez votre Creative ID pour passer progressivement vers un profil créateur.", href: "/espace-membre/creative-id", icon: FileText },
  ],
  insightTitle: "Repères apprenant",
  insightDescription: "Ce qui vous aide à suivre formations, ressources et échéances.",
  insights: [
    { label: "Formations", icon: GraduationCap, value: (posts) => posts.filter((post) => post.routingDestinations.includes("trainings")).length },
    { label: "Ressources", icon: BookOpen, value: (posts) => posts.filter((post) => post.routingDestinations.includes("resources")).length },
    { label: "Échéances", icon: CalendarDays, value: (posts) => posts.filter((post) => post.routingDestinations.includes("agenda")).length },
  ],
  notificationsText: "Inscriptions, ressources disponibles, certificats, messages et rappels de formations arrivent ici.",
};

const publicDashboardConfig: DashboardRoleConfig = {
  kicker: "Espace découverte",
  heroTitle: (name) => `Bonjour ${name}, choisissez votre parcours CCA.`,
  heroDescription: "Votre compte public vous permet de découvrir la communauté, les formations, les ressources ouvertes et les opportunités avant de passer vers un profil apprenant, créateur ou structure.",
  primaryAction: { label: "Choisir mon parcours", href: "/espace-membre/parametres" },
  secondaryAction: { label: "Découvrir les formations", href: "/espace-membre/formations" },
  prioritiesTitle: "Vos prochaines étapes",
  prioritiesDescription: "L'objectif est de transformer ce compte d'accès en vrai profil utile pour la plateforme.",
  priorities: [
    { title: "Définir le profil", description: "Choisissez si vous avancez comme apprenant, créateur ou structure pour débloquer les bons outils.", href: "/espace-membre/parametres", icon: FileText },
    { title: "Explorer les contenus", description: "Consultez les ressources publiques, formations et opportunités déjà visibles.", href: "/espace-membre/ressources", icon: BookOpen },
    { title: "Comprendre la communauté", description: "Découvrez les profils, échanges et activités qui structurent l'écosystème CCA.", href: "/espace-membre/reseau", icon: UsersRound },
  ],
  insightTitle: "Repères découverte",
  insightDescription: "Aperçu des contenus ouverts pour vous aider à choisir le bon parcours.",
  insights: [
    { label: "Publications", icon: Newspaper, value: (posts) => posts.length },
    { label: "Formations", icon: GraduationCap, value: (posts) => posts.filter((post) => post.routingDestinations.includes("trainings")).length },
    { label: "Opportunités", icon: Lightbulb, value: (posts) => posts.filter((post) => post.routingDestinations.includes("opportunities")).length },
  ],
  notificationsText: "Actualités publiques, confirmations importantes et rappels liés à votre compte arrivent ici.",
};

const structureDashboardConfig: DashboardRoleConfig = {
  kicker: "Espace structure",
  heroTitle: (name) => `Bonjour ${name}, pilotez vos actions avec la communauté CCA.`,
  heroDescription: "Votre accueil centralise formations, événements, opportunités, ressources et collaborations pour structurer vos actions auprès des créatifs.",
  primaryAction: { label: "Créer une activité", href: "/espace-membre/publier?type=TRAINING" },
  secondaryAction: { label: "Voir les opportunités", href: "/espace-membre/opportunites" },
  prioritiesTitle: "Vos priorités structure",
  prioritiesDescription: "Des entrées rapides pour publier, soutenir, mobiliser et suivre les interactions avec les créatifs.",
  priorities: [
    { title: "Publier une formation", description: "Présentez un atelier, une masterclass ou un parcours avec ses ressources liées.", href: "/espace-membre/publier?type=TRAINING", icon: GraduationCap },
    { title: "Partager une opportunité", description: "Diffusez appels, missions, résidences ou financements utiles aux créatifs.", href: "/espace-membre/publier?type=OPPORTUNITY", icon: BriefcaseBusiness },
    { title: "Animer le réseau", description: "Documentez vos activités et trouvez des partenaires ou participants qualifiés.", href: "/espace-membre/reseau", icon: UsersRound },
  ],
  insightTitle: "Repères structure",
  insightDescription: "Vue rapide sur les contenus d'action visibles dans la communauté.",
  insights: [
    { label: "Activités", icon: CalendarDays, value: (posts) => posts.filter((post) => post.routingDestinations.includes("agenda") || post.routingDestinations.includes("trainings")).length },
    { label: "Opportunités", icon: Lightbulb, value: (posts) => posts.filter((post) => post.routingDestinations.includes("opportunities")).length },
    { label: "Ressources", icon: BookOpen, value: (posts) => posts.filter((post) => post.routingDestinations.includes("resources")).length },
  ],
  notificationsText: "Inscriptions, messages, collaborations, candidatures et rappels liés à vos activités arrivent ici.",
};

const adminDashboardConfig: DashboardRoleConfig = {
  kicker: "Pilotage CCA",
  heroTitle: (name) => `Bonjour ${name}, pilotez la plateforme et la communauté.`,
  heroDescription: "Votre accueil donne accès aux contenus, membres, modération, candidatures, formations et ressources qui structurent l'écosystème CCA.",
  primaryAction: { label: "Ouvrir le back-office", href: "/espace-membre/admin" },
  secondaryAction: { label: "Publier une annonce", href: "/espace-membre/publier?type=ANNOUNCEMENT" },
  prioritiesTitle: "Priorités administrateur",
  prioritiesDescription: "Les zones à surveiller pour garder la plateforme claire, vivante et professionnelle.",
  priorities: [
    { title: "Alimenter la vitrine", description: "Gérez événements, formations, galeries, ressources, partenaires et opportunités publiques.", href: "/espace-membre/admin", icon: Building2 },
    { title: "Suivre les dossiers", description: "Traitez inscriptions aux formations, candidatures aux opportunités et certificats.", href: "/espace-membre/admin", icon: FileText },
    { title: "Modérer la communauté", description: "Surveillez signalements, messages, publications et comptes à risque.", href: "/espace-membre/admin", icon: ShieldCheck },
  ],
  insightTitle: "Repères admin",
  insightDescription: "Vue rapide sur le contenu publié et les signaux communautaires.",
  insights: [
    { label: "Publications", icon: Newspaper, value: (posts) => posts.length },
    { label: "Opportunités", icon: Lightbulb, value: (posts) => posts.filter((post) => post.routingDestinations.includes("opportunities")).length },
    { label: "Auteurs actifs", icon: UsersRound, value: (posts) => new Set(posts.map((post) => post.author.id)).size },
  ],
  notificationsText: "Signalements, nouveaux dossiers, demandes membres, messages et alertes de gestion arrivent ici.",
};

export function MemberDashboard() {
  const { accessToken, user, profile, organizationProfile, partnerProfile } = useAppSelector((state) => state.auth);
  const [feedPosts, setFeedPosts] = useState<Publication[]>([]);
  const [feedError, setFeedError] = useState("");
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isLoadingMoreFeed, setIsLoadingMoreFeed] = useState(false);
  const [nextFeedCursor, setNextFeedCursor] = useState<string | null>(null);
  const [hasMoreFeed, setHasMoreFeed] = useState(false);
  const [reactingPostId, setReactingPostId] = useState("");
  const [sharingPostId, setSharingPostId] = useState("");
  const [reportingPostId, setReportingPostId] = useState("");
  const [reportMenuPostId, setReportMenuPostId] = useState("");
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(() => new Set());
  const [feedNotice, setFeedNotice] = useState("");
  const [authorRelationStatuses, setAuthorRelationStatuses] = useState<Map<string, RelationStatus>>(() => new Map());
  const [connectingAuthorId, setConnectingAuthorId] = useState("");
  const [openCommentsPostId, setOpenCommentsPostId] = useState("");
  const [commentsByPostId, setCommentsByPostId] = useState<Map<string, PublicationComment[]>>(() => new Map());
  const [commentDrafts, setCommentDrafts] = useState<Map<string, string>>(() => new Map());
  const [replyTargets, setReplyTargets] = useState<Map<string, PublicationComment>>(() => new Map());
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState("");
  const [submittingCommentPostId, setSubmittingCommentPostId] = useState("");
  const [openReactionsPostId, setOpenReactionsPostId] = useState("");
  const [reactionUsersByPostId, setReactionUsersByPostId] = useState<Map<string, PublicationReactionUser[]>>(() => new Map());
  const [reactionErrorsByPostId, setReactionErrorsByPostId] = useState<Map<string, string>>(() => new Map());
  const [loadingReactionsPostId, setLoadingReactionsPostId] = useState("");
  const [publicationCapabilities, setPublicationCapabilities] = useState<PublicationCapability[]>([]);
  const feedLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const displayName = getMemberDisplayName({ user, profile, organizationProfile, partnerProfile });
  const profileTitle = getMemberProfileTitle({ user, profile, organizationProfile, partnerProfile });
  const location = [profile?.city ?? organizationProfile?.city, profile?.country ?? organizationProfile?.country].filter(Boolean).join(", ");
  const profileCompletion = profile?.profileCompletion ?? 0;
  const memberNumber = profile?.memberNumber ?? "En cours";
  const avatarUrl = profile?.avatarUrl ?? organizationProfile?.logoUrl ?? partnerProfile?.logoUrl ?? "";
  const dashboardConfig = getDashboardRoleConfig(user?.type);

  const profileTasks = useMemo(
    () => buildProfileTasks({
      userType: user?.type,
      profile,
      organizationProfile,
      partnerProfile,
    }),
    [organizationProfile, partnerProfile, profile, user?.type],
  );

  const recommendedAuthors = useMemo(() => {
    const authors = new Map<string, FeedAuthor>();

    feedPosts.forEach((post) => {
      if (post.author.id !== user?.id && !isOfficialAccount(post.author.accountType) && !authors.has(post.author.id)) {
        authors.set(post.author.id, post.author);
      }
    });

    return Array.from(authors.values()).slice(0, 4);
  }, [feedPosts, user?.id]);
  const visibleQuickPublishActions = useMemo(() => {
    const allowedTypes = publicationCapabilities.length
      ? new Set(publicationCapabilities.filter((capability) => capability.allowed).map((capability) => capability.value))
      : getFallbackAllowedQuickTypes(user?.type);

    return quickPublishActions.filter((action) => allowedTypes.has(action.type)).slice(0, 4);
  }, [publicationCapabilities, user?.type]);
  const feedInsights = useMemo(
    () => dashboardConfig.insights.map((insight) => ({
      label: insight.label,
      value: insight.value(feedPosts),
      icon: insight.icon,
    })),
    [dashboardConfig, feedPosts],
  );

  useEffect(() => {
    if (!accessToken) {
      setPublicationCapabilities([]);
      return;
    }

    let isActive = true;

    getPublicationCapabilities(accessToken)
      .then((response) => {
        if (isActive) {
          setPublicationCapabilities(response.types);
        }
      })
      .catch(() => {
        if (isActive) {
          setPublicationCapabilities([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, [accessToken]);

  const loadFeedPage = useCallback(async (cursor: string | null = null, append = false) => {
    if (!accessToken) {
      return;
    }

    if (append) {
      setIsLoadingMoreFeed(true);
    } else {
      setIsFeedLoading(true);
    }

    try {
      const page = await getPublicationsPage(accessToken, {
        status: "PUBLISHED",
        limit: feedPageSize,
        cursor: cursor ?? undefined,
      });

      setFeedPosts((current) => {
        if (!append) {
          return page.items;
        }

        const seenIds = new Set(current.map((post) => post.id));
        const nextItems = page.items.filter((post) => !seenIds.has(post.id));
        return [...current, ...nextItems];
      });
      setNextFeedCursor(page.nextCursor);
      setHasMoreFeed(page.hasMore);
      setFeedError("");
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible de charger le fil d'actualité pour le moment."));
    } finally {
      if (append) {
        setIsLoadingMoreFeed(false);
      } else {
        setIsFeedLoading(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    setFeedPosts([]);
    setNextFeedCursor(null);
    setHasMoreFeed(false);
    void loadFeedPage();
  }, [loadFeedPage]);

  useEffect(() => {
    const target = feedLoadMoreRef.current;

    if (!target || !hasMoreFeed || !nextFeedCursor || isFeedLoading || isLoadingMoreFeed) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadFeedPage(nextFeedCursor, true);
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreFeed, isFeedLoading, isLoadingMoreFeed, loadFeedPage, nextFeedCursor]);

  async function reactToPost(post: Publication) {
    if (!accessToken || reactingPostId) {
      return;
    }

    setReactingPostId(post.id);

    try {
      const response = await reactToPublication(accessToken, post.id, "LIKE");
      setFeedPosts((current) => current.map((item) => item.id === post.id ? {
        ...item,
        counts: { ...item.counts, reactions: response.count },
        viewerReaction: response.active ? response.type : null,
      } : item));
      setReactionUsersByPostId((current) => {
        if (!current.has(post.id)) {
          return current;
        }

        const next = new Map(current);
        next.delete(post.id);
        return next;
      });
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible de mettre à jour la réaction pour le moment."));
    } finally {
      setReactingPostId("");
    }
  }

  async function toggleReactions(post: Publication) {
    if (!accessToken || loadingReactionsPostId) {
      return;
    }

    if (openReactionsPostId === post.id) {
      setOpenReactionsPostId("");
      return;
    }

    setOpenReactionsPostId(post.id);

    if (reactionUsersByPostId.has(post.id)) {
      return;
    }

    setLoadingReactionsPostId(post.id);
    setReactionErrorsByPostId((current) => {
      const next = new Map(current);
      next.delete(post.id);
      return next;
    });

    try {
      const response = await getPublicationReactions(accessToken, post.id);
      setReactionUsersByPostId((current) => {
        const next = new Map(current);
        next.set(post.id, response.items);
        return next;
      });
    } catch (requestError) {
      setReactionErrorsByPostId((current) => {
        const next = new Map(current);
        next.set(post.id, getApiErrorMessage(requestError, "Impossible de charger les réactions pour le moment."));
        return next;
      });
    } finally {
      setLoadingReactionsPostId("");
    }
  }

  async function sharePost(post: Publication) {
    if (!accessToken || sharingPostId) {
      return;
    }

    setSharingPostId(post.id);

    try {
      const response = await sharePublication(accessToken, post.id);
      setFeedPosts((current) => current.map((item) => item.id === post.id ? {
        ...item,
        counts: { ...item.counts, shares: response.count },
      } : item));

      const shareUrl = `${window.location.origin}${postDestinationHref(post)}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
      }
      setFeedNotice("Publication partagée. Le lien a été copié si votre navigateur l’autorise.");
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible de partager cette publication pour le moment."));
    } finally {
      setSharingPostId("");
    }
  }

  async function reportPost(post: Publication, reason: ReportReason) {
    if (!accessToken || reportingPostId || reportedPostIds.has(post.id)) {
      return;
    }

    setReportingPostId(post.id);

    try {
      await reportPublication(accessToken, post.id, reason);
      setReportedPostIds((current) => new Set(current).add(post.id));
      setReportMenuPostId("");
      setFeedNotice("Merci, le signalement a été transmis à l’équipe CCA.");
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible d’envoyer ce signalement pour le moment."));
    } finally {
      setReportingPostId("");
    }
  }

  async function connectToAuthor(author: FeedAuthor) {
    if (!accessToken || author.id === user?.id || connectingAuthorId) {
      return;
    }

    setConnectingAuthorId(author.id);

    try {
      const response = await saveNetworkMember(accessToken, author.id);
      setAuthorRelationStatuses((current) => new Map(current).set(author.id, response.connectionStatus));
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible de mettre à jour votre réseau pour le moment."));
    } finally {
      setConnectingAuthorId("");
    }
  }

  async function toggleComments(postId: string) {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId("");
      return;
    }

    setOpenCommentsPostId(postId);

    if (!accessToken || commentsByPostId.has(postId)) {
      return;
    }

    setLoadingCommentsPostId(postId);

    try {
      const comments = await getPublicationComments(accessToken, postId);
      setCommentsByPostId((current) => new Map(current).set(postId, comments));
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible de charger les commentaires pour le moment."));
    } finally {
      setLoadingCommentsPostId("");
    }
  }

  function updateCommentDraft(postId: string, value: string) {
    setCommentDrafts((current) => {
      const next = new Map(current);
      next.set(postId, value);
      return next;
    });
  }

  function selectReplyTarget(postId: string, comment: PublicationComment) {
    setReplyTargets((current) => new Map(current).set(postId, comment));
    setCommentDrafts((current) => {
      const next = new Map(current);
      if (!next.get(postId)?.trim()) {
        next.set(postId, `@${comment.author.displayName} `);
      }
      return next;
    });
  }

  function clearReplyTarget(postId: string) {
    setReplyTargets((current) => {
      const next = new Map(current);
      next.delete(postId);
      return next;
    });
  }

  async function submitComment(event: FormEvent<HTMLFormElement>, post: Publication) {
    event.preventDefault();

    if (!accessToken || submittingCommentPostId) {
      return;
    }

    const content = commentDrafts.get(post.id)?.trim() ?? "";
    if (!content) {
      return;
    }

    const replyTarget = replyTargets.get(post.id);
    setSubmittingCommentPostId(post.id);

    try {
      const comment = await commentPublication(accessToken, post.id, content, replyTarget?.id);
      setCommentsByPostId((current) => {
        const next = new Map(current);
        next.set(post.id, [...(next.get(post.id) ?? []), comment]);
        return next;
      });
      setFeedPosts((current) => current.map((item) => item.id === post.id ? {
        ...item,
        counts: { ...item.counts, comments: item.counts.comments + 1 },
      } : item));
      setCommentDrafts((current) => {
        const next = new Map(current);
        next.set(post.id, "");
        return next;
      });
      clearReplyTarget(post.id);
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible d’ajouter ce commentaire pour le moment."));
    } finally {
      setSubmittingCommentPostId("");
    }
  }

  async function removeComment(post: Publication, comment: PublicationComment) {
    if (!accessToken) {
      return;
    }

    try {
      await deletePublicationComment(accessToken, post.id, comment.id);
      setCommentsByPostId((current) => {
        const next = new Map(current);
        const removedIds = new Set([comment.id]);
        let changed = true;
        const currentComments = next.get(post.id) ?? [];

        while (changed) {
          changed = false;
          currentComments.forEach((item) => {
            if (item.parentId && removedIds.has(item.parentId) && !removedIds.has(item.id)) {
              removedIds.add(item.id);
              changed = true;
            }
          });
        }

        next.set(post.id, currentComments.filter((item) => !removedIds.has(item.id)));
        setFeedPosts((items) => items.map((item) => item.id === post.id ? {
          ...item,
          counts: { ...item.counts, comments: Math.max(0, item.counts.comments - removedIds.size) },
        } : item));
        return next;
      });
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible de supprimer ce commentaire pour le moment."));
    }
  }

  return (
    <MemberShell activeItem="Accueil">
      <div className="member-dashboard-home">
        <section className="member-hero-card member-home-hero">
          <div className="member-hero-copy">
            <span className="member-kicker">{dashboardConfig.kicker}</span>
            <h1>{dashboardConfig.heroTitle(displayName)}</h1>
            <p>{dashboardConfig.heroDescription}</p>
            <div className="member-hero-actions">
              <Link className="member-create-button" href={dashboardConfig.primaryAction.href}>
                {dashboardConfig.primaryAction.label}
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </Link>
              <Link className="member-secondary-button" href={dashboardConfig.secondaryAction.href}>{dashboardConfig.secondaryAction.label}</Link>
            </div>
          </div>
          <section className="member-identity-card member-home-identity-card" aria-label="Résumé du profil">
            <span className="member-home-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(displayName)}
            </span>
            <strong>{displayName}</strong>
            <span>{[accountTypeLabel(user?.type), profileTitle, location].filter(Boolean).join(" · ")}</span>
            <div>
              <small>Creative ID</small>
              <b>{memberNumber}</b>
            </div>
          </section>
        </section>

        <section className="member-card member-home-role-card">
          <div className="member-card-title">
            <div>
              <h2>{dashboardConfig.prioritiesTitle}</h2>
              <p>{dashboardConfig.prioritiesDescription}</p>
            </div>
          </div>
          <div className="member-home-priority-grid">
            {dashboardConfig.priorities.map((priority) => {
              const Icon = priority.icon;

              return (
                <Link key={priority.title} href={priority.href}>
                  <span><Icon aria-hidden="true" strokeWidth={1.8} /></span>
                  <strong>{priority.title}</strong>
                  <p>{priority.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="member-dashboard-grid member-dashboard-grid--feed">
          <section className="member-home-feed-column" aria-label="Fil d'actualité membre">
          <section className="member-card member-feed-composer">
            <div className="member-feed-composer-row">
              <span className="member-feed-composer-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(displayName)}
              </span>
              <Link href="/espace-membre/publier">Commencer une publication</Link>
            </div>
            <div className="member-feed-composer-actions">
              {visibleQuickPublishActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link href={action.href} key={action.label}>
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {recommendedAuthors.length ? (
            <section className="member-card member-home-recommendations">
              <div className="member-card-title">
                <div>
                  <h2>À suivre dans le réseau</h2>
                  <p>Comptes actifs que vous croisez dans les publications récentes.</p>
                </div>
              </div>
              <div className="member-home-recommendation-list">
                {recommendedAuthors.slice(0, 3).map((author) => (
                  <RecommendedAuthor
                    key={author.id}
                    author={author}
                    relationStatus={authorRelationStatuses.get(author.id) ?? null}
                    isConnecting={connectingAuthorId === author.id}
                    onConnect={() => connectToAuthor(author)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="member-card member-feed-card">
            <div className="member-card-title">
              <div>
                <h2>Fil d'actualité</h2>
                <p>Projets, créations, questions, collaborations et annonces du réseau CCA.</p>
              </div>
              <Link href="/espace-membre/reseau">Voir le réseau</Link>
            </div>

            {feedError ? <p className="auth-form-error">{feedError}</p> : null}
            {feedNotice ? <p className="member-feed-notice">{feedNotice}</p> : null}

            {isFeedLoading ? (
              <div className="member-feed-loading">
                <Loader2 aria-hidden="true" strokeWidth={1.8} />
                <span>Chargement des publications...</span>
              </div>
            ) : feedPosts.length ? (
              <div className="member-feed-list">
                {feedPosts.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    relationStatus={authorRelationStatuses.get(post.author.id) ?? null}
                    isConnecting={connectingAuthorId === post.author.id}
                    isReacting={reactingPostId === post.id}
                    isSharing={sharingPostId === post.id}
                    isReporting={reportingPostId === post.id}
                    isReportMenuOpen={reportMenuPostId === post.id}
                    isReported={reportedPostIds.has(post.id)}
                    isCommentsOpen={openCommentsPostId === post.id}
                    isCommentsLoading={loadingCommentsPostId === post.id}
                    isCommentSubmitting={submittingCommentPostId === post.id}
                    isReactionsOpen={openReactionsPostId === post.id}
                    isReactionsLoading={loadingReactionsPostId === post.id}
                    comments={commentsByPostId.get(post.id) ?? []}
                    commentDraft={commentDrafts.get(post.id) ?? ""}
                    replyTarget={replyTargets.get(post.id) ?? null}
                    reactionUsers={reactionUsersByPostId.get(post.id) ?? []}
                    reactionsError={reactionErrorsByPostId.get(post.id) ?? ""}
                    getRelationStatus={(authorId) => authorRelationStatuses.get(authorId) ?? null}
                    getIsConnecting={(authorId) => connectingAuthorId === authorId}
                    onConnect={() => connectToAuthor(post.author)}
                    onConnectAuthor={connectToAuthor}
                    onReact={() => reactToPost(post)}
                    onToggleReactions={() => toggleReactions(post)}
                    onShare={() => sharePost(post)}
                    onToggleReportMenu={() => setReportMenuPostId((current) => current === post.id ? "" : post.id)}
                    onReport={(reason) => reportPost(post, reason)}
                    onToggleComments={() => toggleComments(post.id)}
                    onCommentDraftChange={(value) => updateCommentDraft(post.id, value)}
                    onSubmitComment={(event) => submitComment(event, post)}
                    onReply={(comment) => selectReplyTarget(post.id, comment)}
                    onCancelReply={() => clearReplyTarget(post.id)}
                    onDeleteComment={(comment) => removeComment(post, comment)}
                  />
                ))}
                {hasMoreFeed ? (
                  <div className="member-feed-load-more" ref={feedLoadMoreRef}>
                    <Loader2 aria-hidden="true" strokeWidth={1.8} />
                    <span>{isLoadingMoreFeed ? "Chargement de nouvelles publications..." : "Continuez à défiler"}</span>
                  </div>
                ) : (
                  <div className="member-feed-end">
                    <span>Vous êtes à jour pour le moment.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="member-feed-empty member-feed-empty--guided">
                <Sparkles aria-hidden="true" strokeWidth={1.8} />
                <strong>Aucune publication pour le moment</strong>
                <p>Le fil se remplira avec les contenus utiles à votre type de compte et aux droits associés à votre profil.</p>
                <div>
                  <Link className="member-create-button" href={dashboardConfig.primaryAction.href}>{dashboardConfig.primaryAction.label}</Link>
                  <Link className="member-secondary-button" href={dashboardConfig.secondaryAction.href}>{dashboardConfig.secondaryAction.label}</Link>
                  <Link className="member-secondary-button" href="/espace-membre/reseau">Explorer le réseau</Link>
                </div>
              </div>
            )}
          </section>
        </section>

        <aside className="member-home-right-rail" aria-label="Repères CCA">
          <section className="member-card member-home-insights-card">
            <div className="member-card-title">
              <div>
                <h2>{dashboardConfig.insightTitle}</h2>
                <p>{dashboardConfig.insightDescription}</p>
              </div>
            </div>
            <div className="member-home-insights-grid">
              {feedInsights.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.label}>
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="member-card member-profile-progress-card">
            <div className="member-card-title">
              <div>
                <h2>Creative ID</h2>
                <p>{profileCompletion}% complété</p>
              </div>
              <Link href="/espace-membre/creative-id">Ouvrir</Link>
            </div>
            <div className="member-profile-progress" aria-label={`Creative ID complété à ${profileCompletion}%`}>
              <span style={{ width: `${profileCompletion}%` }} />
            </div>
            <div className="member-profile-checks">
              {profileTasks.map((task) => (
                <article key={task.label} className={task.done ? "is-done" : undefined}>
                  <CheckCircle2 aria-hidden="true" strokeWidth={1.8} />
                  <div>
                    <strong>{task.label}</strong>
                    <span>{task.state}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="member-card member-home-alert-card">
            <div className="list-icon is-soft">
              <Bell aria-hidden="true" strokeWidth={1.8} />
            </div>
            <div>
              <h2>Notifications</h2>
              <p>{dashboardConfig.notificationsText}</p>
            </div>
            <Link className="member-secondary-button" href="/espace-membre/notifications">Ouvrir</Link>
          </section>
        </aside>
      </div>
      </div>
    </MemberShell>
  );
}

function getDashboardRoleConfig(accountType?: string): DashboardRoleConfig {
  if (accountType === "PUBLIC") {
    return publicDashboardConfig;
  }

  if (accountType === "LEARNER") {
    return learnerDashboardConfig;
  }

  if (accountType === "ORGANIZATION" || accountType === "PARTNER") {
    return structureDashboardConfig;
  }

  if (accountType === "ADMIN") {
    return adminDashboardConfig;
  }

  return creatorDashboardConfig;
}

function buildProfileTasks({
  userType,
  profile,
  organizationProfile,
  partnerProfile,
}: {
  userType?: string;
  profile: MemberProfile | null;
  organizationProfile: OrganizationProfile | null;
  partnerProfile: PartnerProfile | null;
}) {
  if (userType === "ADMIN") {
    return [
      { label: "Back-office", state: "Actif", done: true },
      { label: "Modération", state: "À surveiller", done: true },
      { label: "Vitrine publique", state: "À alimenter", done: true },
    ];
  }

  if (userType === "ORGANIZATION") {
    return [
      { label: "Profil organisation", state: organizationProfile?.name ? "Actif" : "À compléter", done: !!organizationProfile?.name },
      { label: "Coordonnées", state: organizationProfile?.websiteUrl ? "Ajoutées" : "À compléter", done: !!organizationProfile?.websiteUrl },
      { label: "Vérification", state: organizationProfile?.verifiedAt ? "Vérifiée" : "En attente", done: !!organizationProfile?.verifiedAt },
    ];
  }

  if (userType === "PARTNER") {
    return [
      { label: "Profil partenaire", state: partnerProfile?.name ? "Actif" : "À compléter", done: !!partnerProfile?.name },
      { label: "Type de soutien", state: partnerProfile?.partnerType ? "Renseigné" : "À compléter", done: !!partnerProfile?.partnerType },
      { label: "Vérification", state: partnerProfile?.verifiedAt ? "Vérifiée" : "En attente", done: !!partnerProfile?.verifiedAt },
    ];
  }

  if (userType === "PUBLIC") {
    return [
      { label: "Compte public", state: "Actif", done: true },
      { label: "Parcours", state: "À choisir", done: false },
      { label: "Accès membre", state: "Limité", done: false },
    ];
  }

  if (userType === "LEARNER") {
    return [
      { label: "Creative ID", state: profile?.memberNumber ? "Actif" : "En cours", done: !!profile?.memberNumber },
      { label: "Discipline", state: profile?.discipline ? "Renseignée" : "À choisir", done: !!profile?.discipline },
      { label: "Certificats", state: "À construire", done: false },
    ];
  }

  return [
    { label: "Creative ID", state: profile?.memberNumber ? "Actif" : "En cours", done: !!profile?.memberNumber },
    { label: "Portfolio", state: profile?.portfolioUrl || profile?.websiteUrl ? "Ajouté" : "À compléter", done: !!(profile?.portfolioUrl || profile?.websiteUrl) },
    { label: "Langues", state: profile?.languages?.length ? `${profile.languages.length} renseignée${profile.languages.length > 1 ? "s" : ""}` : "À compléter", done: !!profile?.languages?.length },
  ];
}

function RecommendedAuthor({
  author,
  relationStatus,
  isConnecting,
  onConnect,
}: {
  author: FeedAuthor;
  relationStatus: RelationStatus | null;
  isConnecting: boolean;
  onConnect: () => void;
}) {
  const action = getRelationAction(author, relationStatus);
  const authorLocation = [author.city, author.country].filter(Boolean).join(", ");

  return (
    <article className="member-home-recommendation">
      <span className="feed-avatar">
        {author.avatarUrl ? <img src={author.avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(author.displayName)}
      </span>
      <div>
        <strong>{author.displayName}</strong>
        <span>{[author.discipline, authorLocation].filter(Boolean).join(" · ") || accountTypeLabel(author.accountType)}</span>
      </div>
      <button type="button" disabled={action.disabled || isConnecting} onClick={onConnect}>
        {isStructureAccount(author.accountType) ? <Bell aria-hidden="true" strokeWidth={1.8} /> : <UserPlus aria-hidden="true" strokeWidth={1.8} />}
        {isConnecting ? "..." : action.label}
      </button>
    </article>
  );
}

function FeedPost({
  post,
  currentUserId,
  relationStatus,
  isConnecting,
  isReacting,
  isSharing,
  isReporting,
  isReportMenuOpen,
  isReported,
  isCommentsOpen,
  isCommentsLoading,
  isCommentSubmitting,
  isReactionsOpen,
  isReactionsLoading,
  comments,
  commentDraft,
  replyTarget,
  reactionUsers,
  reactionsError,
  getRelationStatus,
  getIsConnecting,
  onConnect,
  onConnectAuthor,
  onReact,
  onToggleReactions,
  onShare,
  onToggleReportMenu,
  onReport,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
  onReply,
  onCancelReply,
  onDeleteComment,
}: {
  post: Publication;
  currentUserId?: string;
  relationStatus: RelationStatus | null;
  isConnecting: boolean;
  isReacting: boolean;
  isSharing: boolean;
  isReporting: boolean;
  isReportMenuOpen: boolean;
  isReported: boolean;
  isCommentsOpen: boolean;
  isCommentsLoading: boolean;
  isCommentSubmitting: boolean;
  isReactionsOpen: boolean;
  isReactionsLoading: boolean;
  comments: PublicationComment[];
  commentDraft: string;
  replyTarget: PublicationComment | null;
  reactionUsers: PublicationReactionUser[];
  reactionsError: string;
  getRelationStatus: (authorId: string) => RelationStatus | null;
  getIsConnecting: (authorId: string) => boolean;
  onConnect: () => void;
  onConnectAuthor: (author: FeedAuthor) => void;
  onReact: () => void;
  onToggleReactions: () => void;
  onShare: () => void;
  onToggleReportMenu: () => void;
  onReport: (reason: ReportReason) => void;
  onToggleComments: () => void;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  onReply: (comment: PublicationComment) => void;
  onCancelReply: () => void;
  onDeleteComment: (comment: PublicationComment) => void;
}) {
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const isOwnPost = post.author.id === currentUserId;
  const isOfficialPost = isOfficialAccount(post.author.accountType);
  const action = getRelationAction(post.author, relationStatus);
  const authorLocation = [post.author.city, post.author.country].filter(Boolean).join(", ");
  const shareCount = post.counts.shares ?? 0;
  const postContent = post.content || post.excerpt || "";
  const shouldClampContent = postContent.length > 260 || postContent.split(/\s+/).length > 42;
  const isLiked = post.viewerReaction === "LIKE";
  const rootComments = comments.filter((comment) => !comment.parentId);
  const repliesByParentId = comments.reduce<Map<string, PublicationComment[]>>((groups, comment) => {
    if (!comment.parentId) {
      return groups;
    }

    const replies = groups.get(comment.parentId) ?? [];
    replies.push(comment);
    groups.set(comment.parentId, replies);
    return groups;
  }, new Map());

  return (
    <article className="feed-post member-feed-post">
      <header>
        <span className="feed-avatar">
          {post.author.avatarUrl ? <img src={post.author.avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(post.author.displayName)}
        </span>
        <div>
          <strong>
            {post.author.displayName}
            {post.author.verified ? <BadgeCheck aria-label="Profil vérifié" strokeWidth={1.8} /> : null}
          </strong>
          <span>{[accountTypeLabel(post.author.accountType), post.author.discipline, authorLocation].filter(Boolean).join(" · ")}</span>
        </div>
        {!isOwnPost && !isOfficialPost ? (
          <button className="feed-follow-button" type="button" disabled={action.disabled || isConnecting} onClick={onConnect}>
            {isStructureAccount(post.author.accountType) ? <Bell aria-hidden="true" strokeWidth={1.8} /> : <UserPlus aria-hidden="true" strokeWidth={1.8} />}
            {isConnecting ? "..." : action.label}
          </button>
        ) : null}
      </header>

      <div className="feed-post-body">
        <div className="feed-post-meta">
          <span>{post.typeLabel}</span>
          {post.category ? <span>{post.category}</span> : null}
          {post.publishedAt ? <time>{formatFeedDate(post.publishedAt)}</time> : null}
        </div>
        <h3>{post.title}</h3>
        <p className={isContentExpanded ? "is-expanded" : undefined}>{postContent}</p>
        {shouldClampContent ? (
          <button className="feed-post-read-toggle" type="button" onClick={() => setIsContentExpanded((current) => !current)}>
            {isContentExpanded ? "Lire moins" : "Lire plus"}
          </button>
        ) : null}
        {post.mentions?.length ? <span className="feed-post-mentions">Avec {formatMentionedAuthors(post.mentions)}</span> : null}
      </div>

      {post.coverImageUrl ? <img src={post.coverImageUrl} alt="" loading="lazy" decoding="async" /> : null}

      <footer className="feed-post-actions">
        <button type="button" className={isLiked ? "is-active" : undefined} disabled={isReacting} aria-pressed={isLiked} onClick={onReact}>
          <Heart aria-hidden="true" fill={isLiked ? "currentColor" : "none"} strokeWidth={1.8} />
          {post.counts.reactions} réaction{post.counts.reactions > 1 ? "s" : ""}
        </button>
        {isOwnPost && post.counts.reactions > 0 ? (
          <button type="button" className="feed-reactions-toggle" aria-expanded={isReactionsOpen} disabled={isReactionsLoading} onClick={onToggleReactions}>
            <UsersRound aria-hidden="true" strokeWidth={1.8} />
            {isReactionsLoading ? "Chargement..." : "Voir les likes"}
          </button>
        ) : null}
        <button type="button" aria-expanded={isCommentsOpen} onClick={onToggleComments}>
          <MessageCircle aria-hidden="true" strokeWidth={1.8} />
          {post.counts.comments} commentaire{post.counts.comments > 1 ? "s" : ""}
        </button>
        <button type="button" disabled={isSharing} onClick={onShare}>
          <Repeat2 aria-hidden="true" strokeWidth={1.8} />
          {isSharing ? "Partage..." : `${shareCount} partage${shareCount > 1 ? "s" : ""}`}
        </button>
        <Link href={postDestinationHref(post)}>
          <Send aria-hidden="true" strokeWidth={1.8} />
          Ouvrir
        </Link>
        {!isOwnPost ? (
          <button type="button" className="feed-report-toggle" disabled={isReported} aria-expanded={isReportMenuOpen} onClick={onToggleReportMenu}>
            <Flag aria-hidden="true" strokeWidth={1.8} />
            {isReported ? "Signalé" : "Signaler"}
          </button>
        ) : null}
      </footer>

      {isReportMenuOpen && !isOwnPost && !isReported ? (
        <section className="feed-report-panel" aria-label={`Signaler ${post.title}`}>
          <div>
            <strong>Pourquoi signaler cette publication ?</strong>
            <span>L’équipe CCA la vérifiera sans prévenir publiquement l’auteur.</span>
          </div>
          <div>
            {reportReasons.map((reason) => (
              <button key={reason.value} type="button" disabled={isReporting} onClick={() => onReport(reason.value)}>
                {isReporting ? "Envoi..." : reason.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {isReactionsOpen ? (
        <section className="feed-reactions-panel" aria-label={`Personnes qui ont aimé ${post.title}`}>
          <div>
            <strong>Personnes qui ont aimé</strong>
            <span>{post.counts.reactions} réaction{post.counts.reactions > 1 ? "s" : ""} sur cette publication.</span>
          </div>
          {isReactionsLoading ? (
            <div className="feed-reactions-loading">
              <Loader2 aria-hidden="true" strokeWidth={1.8} />
              <span>Chargement des profils...</span>
            </div>
          ) : reactionsError ? (
            <p className="auth-form-error" role="alert">{reactionsError}</p>
          ) : reactionUsers.length ? (
            <div className="feed-reactions-list">
              {reactionUsers.map((reactionUser) => (
                <article key={`${post.id}-${reactionUser.id}`}>
                  <span className="feed-comment-avatar">
                    {reactionUser.avatarUrl ? <img src={reactionUser.avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(reactionUser.displayName)}
                  </span>
                  <div>
                    <strong>
                      {reactionUser.displayName}
                      {reactionUser.verified ? <BadgeCheck aria-label="Profil vérifié" strokeWidth={1.8} /> : null}
                    </strong>
                    <small>{[accountTypeLabel(reactionUser.accountType), reactionUser.discipline, reactionUser.city].filter(Boolean).join(" · ") || "Membre CCA"}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="feed-reactions-empty">Aucune réaction à afficher pour le moment.</p>
          )}
        </section>
      ) : null}

      {isCommentsOpen ? (
        <section className="feed-comments-panel" aria-label={`Commentaires sur ${post.title}`}>
          {isCommentsLoading ? (
            <div className="feed-comments-loading">
              <Loader2 aria-hidden="true" strokeWidth={1.8} />
              <span>Chargement des commentaires...</span>
            </div>
          ) : rootComments.length ? (
            <div className="feed-comments-list">
              {rootComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={repliesByParentId.get(comment.id) ?? []}
                  currentUserId={currentUserId}
                  relationStatus={getRelationStatus(comment.author.id)}
                  isConnecting={getIsConnecting(comment.author.id)}
                  getRelationStatus={getRelationStatus}
                  getIsConnecting={getIsConnecting}
                  onConnectAuthor={onConnectAuthor}
                  onReply={onReply}
                  onDelete={onDeleteComment}
                />
              ))}
            </div>
          ) : (
            <p className="feed-comments-empty">Soyez le premier à commenter cette publication.</p>
          )}

          <form className="feed-comment-form" onSubmit={onSubmitComment}>
            {replyTarget ? (
              <div className="feed-reply-target">
                <span>Réponse à {replyTarget.author.displayName}</span>
                <button type="button" onClick={onCancelReply}>Annuler</button>
              </div>
            ) : null}
            <textarea
              value={commentDraft}
              maxLength={3000}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={2}
            />
            <div>
              <span>{commentDraft.trim().length ? `${commentDraft.trim().length}/3000` : " "}</span>
              <button type="submit" disabled={isCommentSubmitting || !commentDraft.trim()}>
                {isCommentSubmitting ? "Envoi..." : "Commenter"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </article>
  );
}

function CommentItem({
  comment,
  replies,
  currentUserId,
  relationStatus,
  isConnecting,
  getRelationStatus,
  getIsConnecting,
  onConnectAuthor,
  onReply,
  onDelete,
}: {
  comment: PublicationComment;
  replies: PublicationComment[];
  currentUserId?: string;
  relationStatus: RelationStatus | null;
  isConnecting: boolean;
  getRelationStatus: (authorId: string) => RelationStatus | null;
  getIsConnecting: (authorId: string) => boolean;
  onConnectAuthor: (author: FeedAuthor) => void;
  onReply: (comment: PublicationComment) => void;
  onDelete: (comment: PublicationComment) => void;
}) {
  const action = getRelationAction(comment.author, relationStatus);
  const canConnect = comment.author.id !== currentUserId && !isOfficialAccount(comment.author.accountType) && !action.disabled;

  return (
    <article className="feed-comment">
      <span className="feed-comment-avatar">
        {comment.author.avatarUrl ? <img src={comment.author.avatarUrl} alt="" loading="lazy" decoding="async" /> : buildInitials(comment.author.displayName)}
      </span>
      <div className="feed-comment-content">
        <div className="feed-comment-bubble">
          <strong>
            {comment.author.displayName}
            {comment.author.verified ? <BadgeCheck aria-label="Profil vérifié" strokeWidth={1.8} /> : null}
            {canConnect ? (
              <button type="button" disabled={isConnecting} onClick={() => onConnectAuthor(comment.author)}>
                {isConnecting ? "..." : action.label}
              </button>
            ) : null}
          </strong>
          <small>{[accountTypeLabel(comment.author.accountType), comment.author.discipline].filter(Boolean).join(" · ")}</small>
          <p>{comment.content}</p>
        </div>
        <div className="feed-comment-actions">
          <time>{formatFeedDate(comment.createdAt)}</time>
          <button type="button" onClick={() => onReply(comment)}>Répondre</button>
          {comment.permissions.canDelete ? (
            <button type="button" onClick={() => onDelete(comment)}>Supprimer</button>
          ) : null}
        </div>
        {replies.length ? (
          <div className="feed-comment-replies">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                replies={[]}
                currentUserId={currentUserId}
                relationStatus={getRelationStatus(reply.author.id)}
                isConnecting={getIsConnecting(reply.author.id)}
                getRelationStatus={getRelationStatus}
                getIsConnecting={getIsConnecting}
                onConnectAuthor={onConnectAuthor}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function getRelationAction(author: FeedAuthor, relationStatus: RelationStatus | null) {
  if (isOfficialAccount(author.accountType)) {
    return { label: "Officiel", disabled: true };
  }

  if (relationStatus === "ACCEPTED") {
    return { label: isStructureAccount(author.accountType) ? "Suivi" : "Connecté", disabled: true };
  }

  if (relationStatus === "PENDING") {
    return { label: "Invitation envoyée", disabled: true };
  }

  return { label: isStructureAccount(author.accountType) ? "Suivre" : "Se connecter", disabled: false };
}

function isStructureAccount(accountType: string) {
  return accountType === "ORGANIZATION" || accountType === "PARTNER";
}

function isOfficialAccount(accountType: string) {
  return accountType === "ADMIN";
}

function getFallbackAllowedQuickTypes(accountType?: string) {
  if (accountType === "PUBLIC") {
    return new Set<PublicationType>(["QUESTION"]);
  }

  if (accountType === "LEARNER") {
    return new Set<PublicationType>(["CREATION", "PROJECT", "QUESTION", "COLLABORATION", "RESOURCE"]);
  }

  if (accountType === "ORGANIZATION" || accountType === "PARTNER") {
    return new Set<PublicationType>(["PROJECT", "OPPORTUNITY", "JOB", "RESOURCE", "TRAINING", "EVENT", "QUESTION", "COLLABORATION"]);
  }

  if (accountType === "ADMIN") {
    return new Set<PublicationType>(["CREATION", "PROJECT", "OPPORTUNITY", "RESOURCE", "TRAINING", "EVENT", "ANNOUNCEMENT", "QUESTION", "COLLABORATION"]);
  }

  return new Set<PublicationType>(["CREATION", "PROJECT", "QUESTION", "COLLABORATION"]);
}

function formatMentionedAuthors(authors: FeedAuthor[]) {
  const names = authors.map((author) => author.displayName).filter(Boolean);

  if (names.length <= 2) {
    return names.join(", ");
  }

  const remainingCount = names.length - 2;

  return `${names.slice(0, 2).join(", ")} et ${remainingCount} autre${remainingCount > 1 ? "s" : ""}`;
}

function postDestinationHref(post: Publication) {
  if (post.routingDestinations.includes("opportunities")) {
    return "/espace-membre/opportunites";
  }

  if (post.routingDestinations.includes("resources")) {
    return "/espace-membre/ressources";
  }

  if (post.routingDestinations.includes("trainings")) {
    return "/espace-membre/formations";
  }

  if (post.routingDestinations.includes("agenda")) {
    return "/espace-membre/agenda";
  }

  if (post.routingDestinations.includes("groups")) {
    return "/espace-membre/groupes";
  }

  return "/espace-membre/reseau";
}

function formatFeedDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

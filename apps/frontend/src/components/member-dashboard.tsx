"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flag,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  MessageCircle,
  Newspaper,
  Repeat2,
  Send,
  Sparkles,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { commentPublication, getApiErrorMessage, getPublicationCapabilities, getPublicationComments, getPublicationsPage, reactToPublication, reportPublication, saveNetworkMember, sharePublication } from "@/lib/api";
import type { Publication, PublicationCapability, PublicationComment, PublicationType } from "@/lib/api";
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
  const [publicationCapabilities, setPublicationCapabilities] = useState<PublicationCapability[]>([]);
  const feedLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const displayName = getMemberDisplayName({ user, profile, organizationProfile, partnerProfile });
  const profileTitle = getMemberProfileTitle({ user, profile, organizationProfile, partnerProfile });
  const location = [profile?.city ?? organizationProfile?.city, profile?.country ?? organizationProfile?.country].filter(Boolean).join(", ");
  const profileCompletion = profile?.profileCompletion ?? 0;
  const memberNumber = profile?.memberNumber ?? "En cours";
  const avatarUrl = profile?.avatarUrl ?? organizationProfile?.logoUrl ?? partnerProfile?.logoUrl ?? "";

  const profileTasks = useMemo(
    () => [
      { label: "Creative ID", state: profile?.memberNumber ? "Actif" : "En cours", done: !!profile?.memberNumber },
      { label: "Portfolio", state: profile?.portfolioUrl || profile?.websiteUrl ? "Ajouté" : "À compléter", done: !!(profile?.portfolioUrl || profile?.websiteUrl) },
      { label: "Langues", state: profile?.languages?.length ? `${profile.languages.length} renseignée${profile.languages.length > 1 ? "s" : ""}` : "À compléter", done: !!profile?.languages?.length },
    ],
    [profile],
  );

  const recommendedAuthors = useMemo(() => {
    const authors = new Map<string, FeedAuthor>();

    feedPosts.forEach((post) => {
      if (post.author.id !== user?.id && !authors.has(post.author.id)) {
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
    () => [
      { label: "Publications", value: feedPosts.length, icon: Newspaper },
      { label: "Opportunités", value: feedPosts.filter((post) => post.routingDestinations.includes("opportunities")).length, icon: Lightbulb },
      { label: "Échéances", value: feedPosts.filter((post) => post.routingDestinations.includes("agenda")).length, icon: CalendarDays },
    ],
    [feedPosts],
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
      } : item));
    } catch (requestError) {
      setFeedError(getApiErrorMessage(requestError, "Impossible de mettre à jour la réaction pour le moment."));
    } finally {
      setReactingPostId("");
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

  return (
    <MemberShell activeItem="Accueil">
      <div className="member-dashboard-home">
        <section className="member-hero-card member-home-hero">
          <div className="member-hero-copy">
            <span className="member-kicker">Espace {accountTypeLabel(user?.type).toLowerCase()}</span>
            <h1>Bonjour {displayName}, suivez ce qui bouge dans le réseau CCA.</h1>
            <p>
              Retrouvez les projets, créations, questions, collaborations, opportunités,
              ressources et annonces visibles par la communauté.
            </p>
            <div className="member-hero-actions">
              <Link className="member-create-button" href="/espace-membre/publier">
                Publier
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </Link>
              <Link className="member-secondary-button" href="/espace-membre/creative-id">Voir mon Creative ID</Link>
            </div>
          </div>
          <section className="member-identity-card member-home-identity-card" aria-label="Résumé du profil">
            <span className="member-home-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : buildInitials(displayName)}
            </span>
            <strong>{displayName}</strong>
            <span>{[accountTypeLabel(user?.type), profileTitle, location].filter(Boolean).join(" · ")}</span>
            <div>
              <small>Creative ID</small>
              <b>{memberNumber}</b>
            </div>
          </section>
        </section>

        <div className="member-dashboard-grid member-dashboard-grid--feed">
          <section className="member-home-feed-column" aria-label="Fil d'actualité membre">
          <section className="member-card member-feed-composer">
            <div className="member-feed-composer-row">
              <span className="member-feed-composer-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : buildInitials(displayName)}
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
                    comments={commentsByPostId.get(post.id) ?? []}
                    commentDraft={commentDrafts.get(post.id) ?? ""}
                    replyTarget={replyTargets.get(post.id) ?? null}
                    onConnect={() => connectToAuthor(post.author)}
                    onReact={() => reactToPost(post)}
                    onShare={() => sharePost(post)}
                    onToggleReportMenu={() => setReportMenuPostId((current) => current === post.id ? "" : post.id)}
                    onReport={(reason) => reportPost(post, reason)}
                    onToggleComments={() => toggleComments(post.id)}
                    onCommentDraftChange={(value) => updateCommentDraft(post.id, value)}
                    onSubmitComment={(event) => submitComment(event, post)}
                    onReply={(comment) => selectReplyTarget(post.id, comment)}
                    onCancelReply={() => clearReplyTarget(post.id)}
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
                <p>Le fil se remplira avec les projets, créations, opportunités, ressources et annonces visibles par votre compte.</p>
                <div>
                  <Link className="member-create-button" href="/espace-membre/publier">Publier maintenant</Link>
                  <Link className="member-secondary-button" href="/espace-membre/creative-id">Compléter mon Creative ID</Link>
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
                <h2>Vue d'ensemble</h2>
                <p>Repères calculés à partir des publications visibles.</p>
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
              <p>Messages, invitations, commentaires et rappels importants arrivent ici.</p>
            </div>
            <Link className="member-secondary-button" href="/espace-membre/notifications">Ouvrir</Link>
          </section>
        </aside>
      </div>
      </div>
    </MemberShell>
  );
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
        {author.avatarUrl ? <img src={author.avatarUrl} alt="" /> : buildInitials(author.displayName)}
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
  comments,
  commentDraft,
  replyTarget,
  onConnect,
  onReact,
  onShare,
  onToggleReportMenu,
  onReport,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
  onReply,
  onCancelReply,
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
  comments: PublicationComment[];
  commentDraft: string;
  replyTarget: PublicationComment | null;
  onConnect: () => void;
  onReact: () => void;
  onShare: () => void;
  onToggleReportMenu: () => void;
  onReport: (reason: ReportReason) => void;
  onToggleComments: () => void;
  onCommentDraftChange: (value: string) => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
  onReply: (comment: PublicationComment) => void;
  onCancelReply: () => void;
}) {
  const isOwnPost = post.author.id === currentUserId;
  const action = getRelationAction(post.author, relationStatus);
  const authorLocation = [post.author.city, post.author.country].filter(Boolean).join(", ");
  const shareCount = post.counts.shares ?? 0;
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
          {post.author.avatarUrl ? <img src={post.author.avatarUrl} alt="" /> : buildInitials(post.author.displayName)}
        </span>
        <div>
          <strong>
            {post.author.displayName}
            {post.author.verified ? <BadgeCheck aria-label="Profil vérifié" strokeWidth={1.8} /> : null}
          </strong>
          <span>{[accountTypeLabel(post.author.accountType), post.author.discipline, authorLocation].filter(Boolean).join(" · ")}</span>
        </div>
        {!isOwnPost ? (
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
        <p>{post.excerpt || post.content}</p>
        {post.mentions?.length ? <span className="feed-post-mentions">Avec {formatMentionedAuthors(post.mentions)}</span> : null}
      </div>

      {post.coverImageUrl ? <img src={post.coverImageUrl} alt="" /> : null}

      <footer className="feed-post-actions">
        <button type="button" disabled={isReacting} onClick={onReact}>
          <Heart aria-hidden="true" strokeWidth={1.8} />
          {post.counts.reactions} réaction{post.counts.reactions > 1 ? "s" : ""}
        </button>
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
                  onReply={onReply}
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
  onReply,
}: {
  comment: PublicationComment;
  replies: PublicationComment[];
  onReply: (comment: PublicationComment) => void;
}) {
  return (
    <article className="feed-comment">
      <span className="feed-comment-avatar">
        {comment.author.avatarUrl ? <img src={comment.author.avatarUrl} alt="" /> : buildInitials(comment.author.displayName)}
      </span>
      <div className="feed-comment-content">
        <div className="feed-comment-bubble">
          <strong>
            {comment.author.displayName}
            {comment.author.verified ? <BadgeCheck aria-label="Profil vérifié" strokeWidth={1.8} /> : null}
          </strong>
          <small>{[accountTypeLabel(comment.author.accountType), comment.author.discipline].filter(Boolean).join(" · ")}</small>
          <p>{comment.content}</p>
        </div>
        <div className="feed-comment-actions">
          <time>{formatFeedDate(comment.createdAt)}</time>
          <button type="button" onClick={() => onReply(comment)}>Répondre</button>
        </div>
        {replies.length ? (
          <div className="feed-comment-replies">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} replies={[]} onReply={onReply} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function getRelationAction(author: FeedAuthor, relationStatus: RelationStatus | null) {
  if (relationStatus === "ACCEPTED") {
    return { label: isStructureAccount(author.accountType) ? "Suivi" : "Connecté", disabled: true };
  }

  if (relationStatus === "PENDING") {
    return { label: "Invitation envoyée", disabled: true };
  }

  return { label: isStructureAccount(author.accountType) ? "Suivre" : "Se connecter", disabled: false };
}

function isStructureAccount(accountType: string) {
  return accountType === "ORGANIZATION" || accountType === "PARTNER" || accountType === "ADMIN";
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

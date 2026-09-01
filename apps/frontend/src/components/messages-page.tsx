"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUp,
  Hash,
  Image as ImageIcon,
  Link as LinkIcon,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  SquarePen,
  UsersRound,
  Wifi,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useVisibleItems } from "@/hooks/use-visible-items";
import {
  createCommunityGroupMessage,
  createDirectConversation,
  createDirectMessage,
  getApiErrorMessage,
  getCommunityGroupMessages,
  getCommunityGroups,
  getDirectConversationMessages,
  getDirectConversations,
  getNetworkMembers,
  markDirectConversationRead,
} from "@/lib/api";
import type { CommunityGroup, CommunityGroupMessage, DirectConversation, DirectMessage, NetworkMember } from "@/lib/api";
import { buildInitials } from "@/lib/member-display";
import { normalizeProfileOption } from "@/lib/profile-options";
import { connectRealtimeSocket } from "@/lib/realtime";
import { useAppSelector } from "@/store/hooks";

type ConversationMessage = {
  id: string;
  author: "me" | "them";
  body: string;
  time: string;
  attachment?: string;
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  avatarVersion?: string;
  unread: number;
  online: boolean;
  context: string;
  kind: "member" | "group" | "direct";
  memberId?: string;
  memberNumber?: string;
  directConversationId?: string;
  groupId?: string;
  isJoined?: boolean;
  messages: ConversationMessage[];
};

const emptyConversation: Conversation = {
  id: "empty",
  name: "Aucune conversation",
  role: "Sélectionnez un membre ou un groupe pour commencer.",
  unread: 0,
  online: false,
  context: "Messagerie CCA",
  kind: "member",
  messages: [],
};

export function MessagesPage() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get("conversationId");
  const requestedGroupId = searchParams.get("groupId");
  const requestedMemberId = searchParams.get("memberId");
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const openedMemberRef = useRef<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [manualSelectedId, setManualSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([]);
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>({});
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [networkMembers, setNetworkMembers] = useState<NetworkMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<Record<string, CommunityGroupMessage[]>>({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [startingMemberId, setStartingMemberId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const loadGroups = async () => {
      setIsLoadingGroups(true);
      setError("");

      try {
        const [communityGroups, conversations, members] = await Promise.all([
          getCommunityGroups(accessToken, { limit: 80 }),
          getDirectConversations(accessToken),
          getNetworkMembers(accessToken),
        ]);

        if (isMounted) {
          setGroups(communityGroups);
          setDirectConversations(conversations);
          setNetworkMembers(members.filter((member) => !member.isCurrentMember));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, "Les conversations de groupe ne sont pas disponibles pour le moment."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroups(false);
        }
      }
    };

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const groupConversations = useMemo<Conversation[]>(() => {
    return groups
      .filter((group) => group.isJoined && (group.posts > 0 || group.id === requestedGroupId || groupMessages[group.id]?.length))
      .map((group) => ({
        id: `group:${group.id}`,
        name: group.name,
        role: `Groupe · ${group.members} membre${group.members > 1 ? "s" : ""}`,
        avatarUrl: group.avatarUrl,
        avatarVersion: group.updatedAt,
        unread: 0,
        online: group.isJoined,
        context: [group.category, group.city ?? group.country].filter(Boolean).join(" · ") || "Discussion de groupe",
        kind: "group",
        groupId: group.id,
        isJoined: group.isJoined,
        messages: toConversationMessages(groupMessages[group.id] ?? [], user?.id),
      }));
  }, [groupMessages, groups, requestedGroupId, user?.id]);

  const activeDirectConversationId = manualSelectedId?.startsWith("direct:")
    ? manualSelectedId.replace("direct:", "")
    : requestedConversationId;

  const directConversationItems = useMemo<Conversation[]>(() => {
    return directConversations
      .filter((conversation) => conversation.target)
      .filter((conversation) =>
        conversation.lastMessage ||
        conversation.id === activeDirectConversationId ||
        conversation.target?.id === requestedMemberId
      )
      .map((conversation) => ({
        id: `direct:${conversation.id}`,
        name: conversation.target?.displayName ?? "Conversation",
        role: conversation.target?.headline || "Membre CCA",
        avatarUrl: conversation.target?.avatarUrl,
        avatarVersion: conversation.updatedAt,
        unread: conversation.unread,
        online: false,
        context: conversation.lastMessage?.content ?? "Nouvelle conversation",
        kind: "direct",
        memberId: conversation.target?.id,
        memberNumber: conversation.target?.memberNumber ?? undefined,
        directConversationId: conversation.id,
        messages: toDirectConversationMessages(directMessages[conversation.id] ?? [], user?.id),
      }));
  }, [activeDirectConversationId, directConversations, directMessages, requestedMemberId, user?.id]);

  const memberSuggestions = useMemo(() => {
    const directMemberIds = new Set(
      directConversations
        .filter((conversation) => conversation.lastMessage || conversation.id === activeDirectConversationId)
        .map((conversation) => conversation.target?.id)
        .filter(Boolean),
    );
    const normalizedQuery = normalizeProfileOption(query);

    if (!normalizedQuery) {
      return [];
    }

    return networkMembers
      .filter((member) => !directMemberIds.has(member.userId))
      .filter((member) => {
        const searchable = normalizeProfileOption([
          member.publicName,
          member.profession,
          member.discipline,
          member.city,
          member.country,
        ].filter(Boolean).join(" "));

        return searchable.includes(normalizedQuery);
      })
      .slice(0, 6);
  }, [activeDirectConversationId, directConversations, networkMembers, query]);

  const requestedMemberConversation = useMemo<Conversation | null>(() => {
    if (!requestedMemberId) {
      return null;
    }

    const member = networkMembers.find((item) => item.userId === requestedMemberId);

    if (!member) {
      return null;
    }

    return {
      id: `member:${member.userId}`,
      name: member.publicName,
      role: [member.profession, member.discipline, member.city].filter(Boolean).join(" · ") || "Membre CCA",
      avatarUrl: member.avatarUrl,
      avatarVersion: member.updatedAt,
      unread: 0,
      online: Boolean(member.availability?.toLowerCase().includes("disponible")),
      context: "Nouvelle conversation",
      kind: "member",
      memberId: member.userId,
      memberNumber: member.memberNumber,
      messages: [],
    };
  }, [networkMembers, requestedMemberId]);

  const conversations = useMemo(() => {
    const hasRequestedDirectConversation = requestedMemberConversation
      ? directConversationItems.some((conversation) => conversation.memberId === requestedMemberConversation.memberId)
      : false;

    return [
      ...groupConversations,
      ...directConversationItems,
      ...(requestedMemberConversation && !hasRequestedDirectConversation ? [requestedMemberConversation] : []),
    ];
  }, [directConversationItems, groupConversations, requestedMemberConversation]);
  const defaultSelectedId = requestedConversationId
    ? `direct:${requestedConversationId}`
    : requestedGroupId
      ? `group:${requestedGroupId}`
      : requestedMemberId
        ? `member:${requestedMemberId}`
        : conversations[0]?.id;
  const selectedId = manualSelectedId ?? defaultSelectedId;

  const filteredConversations = useMemo(() => {
    const normalizedQuery = normalizeProfileOption(query);

    return conversations.filter((conversation) => {
      const searchable = normalizeProfileOption([conversation.name, conversation.role, conversation.context].join(" "));
      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [conversations, query]);

  const visibleConversations = useVisibleItems(filteredConversations, 14);
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ??
    filteredConversations[0] ??
    conversations[0] ??
    emptyConversation;
  const selectedGroupId = selectedConversation.groupId;
  const selectedDirectConversationId = selectedConversation.directConversationId;
  const isGroupConversation = selectedConversation.kind === "group" && Boolean(selectedGroupId);
  const isDirectConversation = selectedConversation.kind === "direct" && Boolean(selectedDirectConversationId);
  const messages = selectedConversation.messages;
  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unread, 0);
  const canWriteMessage = selectedConversation.id !== emptyConversation.id && selectedConversation.isJoined !== false;

  const startConversationWithMember = async (member: NetworkMember) => {
    if (!accessToken) {
      setError("Connectez-vous pour écrire à ce membre.");
      return;
    }

    setStartingMemberId(member.userId);
    setError("");

    try {
      const conversation = await createDirectConversation(accessToken, { memberId: member.userId });

      setDirectConversations((current) => mergeDirectConversation(current, conversation));
      setManualSelectedId(`direct:${conversation.id}`);
      setQuery("");
    } catch (startError) {
      setError(getApiErrorMessage(startError, "Impossible d'ouvrir cette conversation."));
    } finally {
      setStartingMemberId(null);
    }
  };

  useEffect(() => {
    if (!accessToken || !requestedMemberId || openedMemberRef.current === requestedMemberId) {
      return;
    }

    let isMounted = true;
    openedMemberRef.current = requestedMemberId;
    setError("");

    createDirectConversation(accessToken, { memberId: requestedMemberId })
      .then((conversation) => {
        if (!isMounted) {
          return;
        }

        setDirectConversations((current) => mergeDirectConversation(current, conversation));
        setManualSelectedId(`direct:${conversation.id}`);
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getApiErrorMessage(requestError, "Impossible d'ouvrir cette conversation."));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, requestedMemberId]);

  useEffect(() => {
    if (!accessToken || !selectedGroupId || !selectedConversation.isJoined || groupMessages[selectedGroupId]) {
      return;
    }

    let isMounted = true;

    const loadThread = async () => {
      setIsLoadingThread(true);
      setError("");

      try {
        const messages = await getCommunityGroupMessages(accessToken, selectedGroupId);

        if (isMounted) {
          setGroupMessages((current) => ({ ...current, [selectedGroupId]: messages }));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, "Impossible d'ouvrir la discussion de ce groupe."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingThread(false);
        }
      }
    };

    void loadThread();

    return () => {
      isMounted = false;
    };
  }, [accessToken, groupMessages, selectedConversation.isJoined, selectedGroupId]);

  useEffect(() => {
    if (selectedConversation.id === emptyConversation.id) {
      return;
    }

    composerInputRef.current?.focus();
  }, [selectedConversation.id]);

  useEffect(() => {
    const shouldLoadMessages = selectedDirectConversationId && !directMessages[selectedDirectConversationId];

    if (!accessToken || !selectedDirectConversationId || !shouldLoadMessages) {
      return;
    }

    let isMounted = true;

    const loadThread = async () => {
      setIsLoadingThread(true);
      setError("");

      try {
        const messages = await getDirectConversationMessages(accessToken, selectedDirectConversationId);

        if (isMounted) {
          setDirectMessages((current) => ({ ...current, [selectedDirectConversationId]: messages }));
          setDirectConversations((current) =>
            current.map((conversation) =>
              conversation.id === selectedDirectConversationId ? { ...conversation, unread: 0 } : conversation,
            ),
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getApiErrorMessage(loadError, "Impossible d'ouvrir cette conversation."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingThread(false);
        }
      }
    };

    void loadThread();

    return () => {
      isMounted = false;
    };
  }, [accessToken, directMessages, selectedDirectConversationId]);

  useEffect(() => {
    if (!accessToken || !selectedDirectConversationId || selectedConversation.unread <= 0) {
      return;
    }

    let isMounted = true;

    markDirectConversationRead(accessToken, selectedDirectConversationId)
      .then(() => {
        if (!isMounted) {
          return;
        }

        setDirectConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedDirectConversationId ? { ...conversation, unread: 0 } : conversation,
          ),
        );
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedConversation.unread, selectedDirectConversationId]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = connectRealtimeSocket(accessToken);

    socket.on("direct.conversation.updated", (payload: { conversation?: DirectConversation }) => {
      const conversation = payload.conversation;

      if (!conversation) {
        return;
      }

      setDirectConversations((current) => mergeDirectConversation(current, conversation));
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedDirectConversationId) {
      return;
    }

    const socket = connectRealtimeSocket(accessToken);
    socket.emit("direct.join", { conversationId: selectedDirectConversationId });

    const syncMessage = (payload: { conversationId?: string; message?: DirectMessage }) => {
      const message = payload.message;

      if (payload.conversationId !== selectedDirectConversationId || !message) {
        return;
      }

      setDirectMessages((current) => ({
        ...current,
        [selectedDirectConversationId]: mergeDirectMessage(current[selectedDirectConversationId] ?? [], message),
      }));
    };

    socket.on("direct.message.created", syncMessage);
    socket.on("direct.message.updated", syncMessage);
    socket.on("direct.message.deleted", syncMessage);

    return () => {
      socket.emit("direct.leave", { conversationId: selectedDirectConversationId });
      socket.disconnect();
    };
  }, [accessToken, selectedDirectConversationId]);

  useEffect(() => {
    if (!accessToken || !selectedGroupId || !selectedConversation.isJoined) {
      return;
    }

    const socket = connectRealtimeSocket(accessToken);
    socket.emit("group.join", { groupId: selectedGroupId });

    socket.on("group.message.created", (payload: { groupId?: string; message?: CommunityGroupMessage }) => {
      const message = payload.message;

      if (payload.groupId !== selectedGroupId || !message) {
        return;
      }

      setGroupMessages((current) => ({
        ...current,
        [selectedGroupId]: mergeGroupMessage(current[selectedGroupId] ?? [], message),
      }));

      if (message.author.id !== user?.id) {
        getCommunityGroupMessages(accessToken, selectedGroupId)
          .then((messages) => {
            setGroupMessages((current) => ({ ...current, [selectedGroupId]: messages }));
          })
          .catch(() => undefined);
      }
    });

    socket.on("group.message.updated", (payload: { groupId?: string; message?: CommunityGroupMessage }) => {
      const message = payload.message;

      if (payload.groupId !== selectedGroupId || !message) {
        return;
      }

      setGroupMessages((current) => ({
        ...current,
        [selectedGroupId]: mergeGroupMessage(current[selectedGroupId] ?? [], message),
      }));
    });

    socket.on("group.message.deleted", (payload: { groupId?: string; message?: CommunityGroupMessage }) => {
      const message = payload.message;

      if (payload.groupId !== selectedGroupId || !message) {
        return;
      }

      setGroupMessages((current) => ({
        ...current,
        [selectedGroupId]: mergeGroupMessage(current[selectedGroupId] ?? [], message),
      }));
    });

    return () => {
      socket.emit("group.leave", { groupId: selectedGroupId });
      socket.disconnect();
    };
  }, [accessToken, selectedConversation.isJoined, selectedGroupId, user?.id]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();

    if (!body) {
      return;
    }

    if (isGroupConversation && selectedGroupId) {
      if (!accessToken) {
        setError("Connectez-vous pour envoyer un message.");
        return;
      }

      if (!selectedConversation.isJoined) {
        setError("Rejoignez ce groupe avant de participer à la discussion.");
        return;
      }

      setIsSending(true);
      setError("");

      try {
        const message = await createCommunityGroupMessage(accessToken, selectedGroupId, { content: body });
        setGroupMessages((current) => ({
          ...current,
          [selectedGroupId]: mergeGroupMessage(current[selectedGroupId] ?? [], message),
        }));
        setDraft("");
      } catch (sendError) {
        setError(getApiErrorMessage(sendError, "Impossible d'envoyer ce message pour le moment."));
      } finally {
        setIsSending(false);
      }

      return;
    }

    if (!accessToken) {
      setError("Connectez-vous pour envoyer un message.");
      return;
    }

    if (isDirectConversation && selectedDirectConversationId) {
      setIsSending(true);
      setError("");

      try {
        const message = await createDirectMessage(accessToken, selectedDirectConversationId, { content: body });
        setDirectMessages((current) => ({
          ...current,
          [selectedDirectConversationId]: mergeDirectMessage(current[selectedDirectConversationId] ?? [], message),
        }));
        setDraft("");
      } catch (sendError) {
        setError(getApiErrorMessage(sendError, "Impossible d'envoyer ce message pour le moment."));
      } finally {
        setIsSending(false);
      }

      return;
    }

    if (selectedConversation.memberId) {
      setIsSending(true);
      setError("");

      try {
        const conversation = await createDirectConversation(accessToken, {
          memberId: selectedConversation.memberId,
          initialMessage: body,
        });
        const conversationMessages = await getDirectConversationMessages(accessToken, conversation.id);

        setDirectConversations((current) => mergeDirectConversation(current, conversation));
        setDirectMessages((current) => ({ ...current, [conversation.id]: conversationMessages }));
        setManualSelectedId(`direct:${conversation.id}`);
        setDraft("");
      } catch (sendError) {
        setError(getApiErrorMessage(sendError, "Impossible d'envoyer ce message pour le moment."));
      } finally {
        setIsSending(false);
      }

      return;
    }

    setError("Sélectionnez un membre ou un groupe avant d'écrire.");
  };

  return (
    <MemberShell activeItem="Messages">
      <div className="social-layout messages-layout">
        <section className="member-module-hero social-hero">
          <div>
            <span className="member-kicker">Messages</span>
            <h1>Une messagerie claire pour avancer avec vos contacts.</h1>
            <p>
              Les conversations membres et groupes se centralisent ici. Les discussions de groupe ouvertes depuis
              l’onglet Groupes arrivent directement dans ce fil.
            </p>
          </div>
          <div className="member-module-highlight-grid">
            <article><MessageCircle aria-hidden="true" /><strong>{conversations.length}</strong><span>Conversations</span></article>
            <article><ArrowUp aria-hidden="true" /><strong>{unreadTotal}</strong><span>Non lus</span></article>
            <article><Wifi aria-hidden="true" /><strong>À jour</strong><span>Automatique</span></article>
          </div>
        </section>

        {error ? <p className="auth-form-error">{error}</p> : null}

        <section className="member-card messages-shell-card">
          <aside className="messages-inbox">
            <div className="messages-inbox-head">
              <div>
                <strong>Conversations</strong>
                <span>Membres et groupes</span>
              </div>
              <button
                type="button"
                aria-label="Démarrer un nouveau message"
                onClick={() => searchInputRef.current?.focus()}
              >
                <SquarePen aria-hidden="true" strokeWidth={1.8} />
              </button>
              {unreadTotal > 0 ? <em>{unreadTotal}</em> : null}
            </div>

            <label className="social-search messages-search">
              <Search aria-hidden="true" strokeWidth={1.8} />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher ou écrire à un membre..."
              />
            </label>

            <div className="messages-conversation-list" aria-busy={isLoadingGroups}>
              {visibleConversations.visibleItems.length ? visibleConversations.visibleItems.map((conversation) => (
                <button
                  key={conversation.id}
                  className={conversation.id === selectedConversation.id ? "messages-conversation is-selected" : "messages-conversation"}
                  type="button"
                  onClick={() => setManualSelectedId(conversation.id)}
                >
                  <MessageAvatar
                    name={conversation.name}
                    avatarUrl={conversation.avatarUrl}
                    avatarVersion={conversation.avatarVersion}
                    online={conversation.online}
                    isGroup={conversation.kind === "group"}
                  />
                  <div>
                    <strong>{conversation.name}</strong>
                    <span>{conversation.role}</span>
                    <small>{conversation.context}</small>
                  </div>
                  {conversation.unread ? <em>{conversation.unread}</em> : null}
                </button>
              )) : !memberSuggestions.length ? (
                <div className="messages-inbox-empty">
                  <MessageCircle aria-hidden="true" />
                  <strong>{query.trim() ? "Aucune conversation trouvée" : "Aucune conversation pour le moment"}</strong>
                  <span>{query.trim() ? "Essayez un autre nom ou démarrez une nouvelle conversation." : "Recherchez un membre pour lui écrire, ou ouvrez une discussion de groupe."}</span>
                </div>
              ) : null}
              {visibleConversations.hasMore ? (
                <div className="member-feed-load-more" ref={visibleConversations.loadMoreRef}>
                  <LoaderCircle aria-hidden="true" className="spin-icon" />
                  <span>Défilez pour afficher plus de conversations</span>
                </div>
              ) : null}
              {memberSuggestions.length ? (
                <div className="messages-suggestions">
                  <span>Démarrer un message</span>
                  {memberSuggestions.map((member) => (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => startConversationWithMember(member)}
                      disabled={startingMemberId === member.userId}
                    >
                      <MessageAvatar
                        name={member.publicName}
                        avatarUrl={member.avatarUrl}
                        avatarVersion={member.updatedAt}
                        online={Boolean(member.availability?.toLowerCase().includes("disponible"))}
                      />
                      <div>
                        <strong>{member.publicName}</strong>
                        <small>{[member.profession, member.discipline, member.city].filter(Boolean).join(" · ") || "Membre CCA"}</small>
                      </div>
                      {startingMemberId === member.userId ? <LoaderCircle aria-hidden="true" className="spin-icon" /> : <SquarePen aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="messages-thread">
            <header className="messages-thread-header">
              <MessageAvatar
                name={selectedConversation.name}
                avatarUrl={selectedConversation.avatarUrl}
                avatarVersion={selectedConversation.avatarVersion}
                online={selectedConversation.online}
                isGroup={selectedConversation.kind === "group"}
              />
              <div>
                <strong>{selectedConversation.name}</strong>
                <span>{selectedConversation.role}</span>
                <small>{isGroupConversation ? "Conversation de groupe" : "Conversation privée"}</small>
              </div>
              {isGroupConversation && selectedGroupId ? (
                <Link className="member-secondary-button" href={`/espace-membre/groupes?groupId=${selectedGroupId}`}>
                  <UsersRound aria-hidden="true" strokeWidth={1.8} />
                  Groupe
                </Link>
              ) : selectedConversation.memberNumber ? (
                <Link className="member-secondary-button" href={`/espace-membre/reseau/membre/${encodeURIComponent(selectedConversation.memberNumber)}`}>
                  <UsersRound aria-hidden="true" strokeWidth={1.8} />
                  Profil
                </Link>
              ) : (
                <button className="member-secondary-button" type="button">
                  <UsersRound aria-hidden="true" strokeWidth={1.8} />
                  Profil
                </button>
              )}
            </header>

            <div className="messages-thread-body" aria-label="Messages de la conversation" aria-busy={isLoadingThread}>
              {isLoadingThread ? (
                <div className="messages-empty-state">
                  <LoaderCircle aria-hidden="true" className="spin-icon" />
                  <strong>Ouverture de la discussion...</strong>
                </div>
              ) : messages.length ? (
                messages.map((message) => (
                  <article key={message.id} className={message.author === "me" ? "message-bubble is-mine" : "message-bubble"}>
                    <p>{message.body}</p>
                    {message.attachment ? (
                      <span><Paperclip aria-hidden="true" /> {message.attachment}</span>
                    ) : null}
                    <small>{message.time}</small>
                  </article>
                ))
              ) : (
                <div className="messages-empty-state">
                  <MessageCircle aria-hidden="true" />
                  <strong>Aucun message pour le moment</strong>
                  <span>Lancez la conversation avec un besoin, une question ou une proposition claire.</span>
                </div>
              )}
            </div>

            <form className="messages-composer" onSubmit={sendMessage}>
              <button type="button" aria-label="Joindre un fichier"><Paperclip aria-hidden="true" /></button>
              <button type="button" aria-label="Ajouter une image"><ImageIcon aria-hidden="true" /></button>
              <button type="button" aria-label="Ajouter un lien"><LinkIcon aria-hidden="true" /></button>
              <input
                ref={composerInputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={selectedConversation.isJoined === false ? "Rejoignez le groupe pour écrire..." : "Écrire un message..."}
                disabled={!canWriteMessage || isSending}
              />
              <button className="member-create-button" type="submit" aria-label="Envoyer" disabled={!canWriteMessage || isSending}>
                {isSending ? <LoaderCircle aria-hidden="true" className="spin-icon" /> : <Send aria-hidden="true" />}
              </button>
            </form>
          </section>
        </section>
      </div>
    </MemberShell>
  );
}

function MessageAvatar({
  name,
  avatarUrl,
  avatarVersion,
  online,
  isGroup,
}: {
  name: string;
  avatarUrl?: string | null;
  avatarVersion?: string;
  online: boolean;
  isGroup?: boolean;
}) {
  return (
    <span className={avatarUrl ? "message-avatar has-image" : "message-avatar"}>
      {avatarUrl ? (
        <img src={versionedImageUrl(avatarUrl, avatarVersion)} alt="" />
      ) : isGroup ? (
        <Hash aria-hidden="true" />
      ) : (
        <span>{buildInitials(name)}</span>
      )}
      {online ? <i aria-label="En ligne" /> : null}
    </span>
  );
}

function versionedImageUrl(url: string, version?: string) {
  if (!version) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function toConversationMessages(messages: CommunityGroupMessage[], currentUserId?: string): ConversationMessage[] {
  return messages.map((message) => ({
    id: message.id,
    author: message.author.id === currentUserId ? "me" : "them",
    body: message.content,
    time: formatMessageTime(message.createdAt),
    attachment: message.attachmentName ?? undefined,
  }));
}

function toDirectConversationMessages(messages: DirectMessage[], currentUserId?: string): ConversationMessage[] {
  return messages.map((message) => ({
    id: message.id,
    author: message.author.id === currentUserId ? "me" : "them",
    body: message.content,
    time: formatMessageTime(message.createdAt),
    attachment: message.attachmentName ?? undefined,
  }));
}

function mergeGroupMessage(messages: CommunityGroupMessage[], message: CommunityGroupMessage) {
  const existingIndex = messages.findIndex((item) => item.id === message.id);

  if (existingIndex === -1) {
    return [...messages, message].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  }

  return messages.map((item) => item.id === message.id ? message : item);
}

function mergeDirectMessage(messages: DirectMessage[], message: DirectMessage) {
  const existingIndex = messages.findIndex((item) => item.id === message.id);

  if (existingIndex === -1) {
    return [...messages, message].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  }

  return messages.map((item) => item.id === message.id ? message : item);
}

function mergeDirectConversation(conversations: DirectConversation[], conversation: DirectConversation) {
  const existingIndex = conversations.findIndex((item) => item.id === conversation.id);
  const nextConversations = existingIndex === -1
    ? [...conversations, conversation]
    : conversations.map((item) => item.id === conversation.id ? conversation : item);

  return nextConversations.sort(
    (left, right) => directConversationTime(right) - directConversationTime(left),
  );
}

function directConversationTime(conversation: DirectConversation) {
  const value = conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt;
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Maintenant";
  }

  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

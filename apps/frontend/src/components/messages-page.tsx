"use client";

import { type ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUp,
  Archive,
  Ban,
  Flag,
  Hash,
  Image as ImageIcon,
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
  archiveDirectConversation,
  createCommunityGroupMessage,
  createDirectConversation,
  createDirectMessage,
  blockDirectMessageUser,
  getApiErrorMessage,
  getArchivedDirectConversations,
  getCommunityGroupMessages,
  getCommunityGroups,
  getDirectConversationAttachments,
  getDirectConversationMessages,
  getDirectConversations,
  getNetworkMembers,
  markDirectConversationRead,
  reportCommunityGroupMessage,
  reportDirectMessage,
  searchDirectMessages,
  unarchiveDirectConversation,
  uploadMessageAttachment,
} from "@/lib/api";
import type { CommunityGroup, CommunityGroupMessage, DirectConversation, DirectConversationAttachment, DirectMessage, DirectMessageSearchResponse, NetworkMember } from "@/lib/api";
import { buildInitials } from "@/lib/member-display";
import { normalizeProfileOption } from "@/lib/profile-options";
import { connectRealtimeSocket } from "@/lib/realtime";
import type { RealtimeSocket } from "@/lib/realtime";
import { useAppSelector } from "@/store/hooks";

type ConversationMessage = {
  id: string;
  author: "me" | "them";
  body: string;
  time: string;
  readAt?: string | null;
  source?: DirectMessage;
  groupSource?: CommunityGroupMessage;
  attachment?: {
    url: string;
    name: string;
    mimeType?: string | null;
  };
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
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const activeRoomSocketRef = useRef<RealtimeSocket | null>(null);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [manualSelectedId, setManualSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<ConversationMessage["attachment"] | null>(null);
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([]);
  const [archivedDirectConversations, setArchivedDirectConversations] = useState<DirectConversation[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [messageSearchResults, setMessageSearchResults] = useState<DirectMessageSearchResponse["results"]>([]);
  const [conversationAttachments, setConversationAttachments] = useState<DirectConversationAttachment[]>([]);
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>({});
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [networkMembers, setNetworkMembers] = useState<NetworkMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<Record<string, CommunityGroupMessage[]>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set());
  const [typingByRoom, setTypingByRoom] = useState<Record<string, string>>({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isBlockingUser, setIsBlockingUser] = useState(false);
  const [reportedDirectMessageIds, setReportedDirectMessageIds] = useState<Set<string>>(() => new Set());
  const [reportedGroupMessageIds, setReportedGroupMessageIds] = useState<Set<string>>(() => new Set());
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
        const [communityGroups, conversations, archivedConversations, members] = await Promise.all([
          getCommunityGroups(accessToken, { limit: 80 }),
          getDirectConversations(accessToken),
          getArchivedDirectConversations(accessToken),
          getNetworkMembers(accessToken),
        ]);

        if (isMounted) {
          setGroups(communityGroups);
          setDirectConversations(conversations);
          setArchivedDirectConversations(archivedConversations);
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
  const directConversationSource = showArchived ? archivedDirectConversations : directConversations;

  const directConversationItems = useMemo<Conversation[]>(() => {
    return directConversationSource
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
        online: conversation.target?.id ? onlineUserIds.has(conversation.target.id) : false,
        context: conversation.lastMessage?.content ?? "Nouvelle conversation",
        kind: "direct",
        memberId: conversation.target?.id,
        memberNumber: conversation.target?.memberNumber ?? undefined,
        directConversationId: conversation.id,
        messages: toDirectConversationMessages(directMessages[conversation.id] ?? [], user?.id),
      }));
  }, [activeDirectConversationId, directConversationSource, directMessages, onlineUserIds, requestedMemberId, user?.id]);

  const memberSuggestions = useMemo(() => {
    const directMemberIds = new Set(
      directConversationSource
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
  }, [activeDirectConversationId, directConversationSource, networkMembers, query]);

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
      online: onlineUserIds.has(member.userId),
      context: "Nouvelle conversation",
      kind: "member",
      memberId: member.userId,
      memberNumber: member.memberNumber,
      messages: [],
    };
  }, [networkMembers, onlineUserIds, requestedMemberId]);

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
  const activeRoomKey = selectedDirectConversationId
    ? `direct:${selectedDirectConversationId}`
    : selectedGroupId
      ? `group:${selectedGroupId}`
      : null;
  const activeTypingLabel = activeRoomKey ? typingByRoom[activeRoomKey] : undefined;
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
    if (!accessToken || query.trim().length < 2) {
      setMessageSearchResults([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      searchDirectMessages(accessToken, { q: query.trim(), limit: 8 })
        .then((response) => {
          if (isMounted) {
            setMessageSearchResults(response.results);
          }
        })
        .catch(() => {
          if (isMounted) {
            setMessageSearchResults([]);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [accessToken, query]);

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
    if (!accessToken || !selectedDirectConversationId) {
      setConversationAttachments([]);
      return;
    }

    let isMounted = true;

    getDirectConversationAttachments(accessToken, selectedDirectConversationId)
      .then((response) => {
        if (isMounted) {
          setConversationAttachments(response.attachments);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConversationAttachments([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedDirectConversationId, directMessages]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = connectRealtimeSocket(accessToken);

    socket.on("presence.snapshot", (payload: { onlineUserIds?: string[] }) => {
      setOnlineUserIds(new Set(payload.onlineUserIds ?? []));
    });

    socket.on("presence.updated", (payload: { userId?: string; online?: boolean }) => {
      const onlineUserId = payload.userId;

      if (!onlineUserId) {
        return;
      }

      setOnlineUserIds((current) => {
        const next = new Set(current);

        if (payload.online) {
          next.add(onlineUserId);
        } else {
          next.delete(onlineUserId);
        }

        return next;
      });
    });

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
    activeRoomSocketRef.current = socket;
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
    socket.on("direct.typing", (payload: { conversationId?: string; userId?: string; isTyping?: boolean }) => {
      if (payload.conversationId !== selectedDirectConversationId || payload.userId === user?.id) {
        return;
      }

      setTypingByRoom((current) => ({
        ...current,
        [`direct:${selectedDirectConversationId}`]: payload.isTyping ? `${selectedConversation.name} écrit...` : "",
      }));
    });
    socket.on("direct.conversation.read", (payload: { conversationId?: string; userId?: string; readAt?: string }) => {
      if (payload.conversationId !== selectedDirectConversationId || !payload.readAt || payload.userId === user?.id) {
        return;
      }

      const readAtTime = new Date(payload.readAt).getTime();

      setDirectMessages((current) => ({
        ...current,
        [selectedDirectConversationId]: (current[selectedDirectConversationId] ?? []).map((message) => {
          if (message.author.id !== user?.id || new Date(message.createdAt).getTime() > readAtTime) {
            return message;
          }

          return { ...message, readAt: payload.readAt };
        }),
      }));
    });

    return () => {
      socket.emit("direct.leave", { conversationId: selectedDirectConversationId });
      socket.emit("direct.typing", { conversationId: selectedDirectConversationId, isTyping: false });
      if (activeRoomSocketRef.current === socket) {
        activeRoomSocketRef.current = null;
      }
      setTypingByRoom((current) => ({ ...current, [`direct:${selectedDirectConversationId}`]: "" }));
      socket.disconnect();
    };
  }, [accessToken, selectedConversation.name, selectedDirectConversationId, user?.id]);

  useEffect(() => {
    if (!accessToken || !selectedGroupId || !selectedConversation.isJoined) {
      return;
    }

    const socket = connectRealtimeSocket(accessToken);
    activeRoomSocketRef.current = socket;
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
    socket.on("group.typing", (payload: { groupId?: string; userId?: string; isTyping?: boolean }) => {
      if (payload.groupId !== selectedGroupId || payload.userId === user?.id) {
        return;
      }

      setTypingByRoom((current) => ({
        ...current,
        [`group:${selectedGroupId}`]: payload.isTyping ? "Un membre écrit..." : "",
      }));
    });

    return () => {
      socket.emit("group.leave", { groupId: selectedGroupId });
      socket.emit("group.typing", { groupId: selectedGroupId, isTyping: false });
      if (activeRoomSocketRef.current === socket) {
        activeRoomSocketRef.current = null;
      }
      setTypingByRoom((current) => ({ ...current, [`group:${selectedGroupId}`]: "" }));
      socket.disconnect();
    };
  }, [accessToken, selectedConversation.isJoined, selectedGroupId, user?.id]);

  const emitTyping = (isTyping: boolean) => {
    const socket = activeRoomSocketRef.current;

    if (!socket) {
      return;
    }

    if (selectedDirectConversationId) {
      socket.emit("direct.typing", { conversationId: selectedDirectConversationId, isTyping });
      return;
    }

    if (selectedGroupId && selectedConversation.isJoined) {
      socket.emit("group.typing", { groupId: selectedGroupId, isTyping });
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (!canWriteMessage) {
      return;
    }

    emitTyping(Boolean(value.trim()));

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1400);
  };

  const attachRemoteFile = async (file: File) => {
    if (!accessToken) {
      setError("Connectez-vous pour joindre un fichier.");
      return;
    }

    setIsUploadingAttachment(true);
    setError("");

    try {
      const uploaded = await uploadMessageAttachment(accessToken, file);
      setAttachment({
        url: uploaded.url,
        name: uploaded.name,
        mimeType: uploaded.mimeType,
      });
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Impossible d'importer ce fichier pour le moment."));
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      void attachRemoteFile(file);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();

    if (!body && !attachment) {
      return;
    }

    const messagePayload = {
      content: body || `Pièce jointe : ${attachment?.name ?? "fichier"}`,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      attachmentMimeType: attachment?.mimeType ?? undefined,
    };
    emitTyping(false);

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
        const message = await createCommunityGroupMessage(accessToken, selectedGroupId, messagePayload);
        setGroupMessages((current) => ({
          ...current,
          [selectedGroupId]: mergeGroupMessage(current[selectedGroupId] ?? [], message),
        }));
        setDraft("");
        setAttachment(null);
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
        const message = await createDirectMessage(accessToken, selectedDirectConversationId, messagePayload);
        setDirectMessages((current) => ({
          ...current,
          [selectedDirectConversationId]: mergeDirectMessage(current[selectedDirectConversationId] ?? [], message),
        }));
        setDraft("");
        setAttachment(null);
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
          initialMessage: attachment ? undefined : body,
        });
        if (attachment) {
          await createDirectMessage(accessToken, conversation.id, messagePayload);
        }
        const conversationMessages = await getDirectConversationMessages(accessToken, conversation.id);

        setDirectConversations((current) => mergeDirectConversation(current, conversation));
        setDirectMessages((current) => ({ ...current, [conversation.id]: conversationMessages }));
        setManualSelectedId(`direct:${conversation.id}`);
        setDraft("");
        setAttachment(null);
      } catch (sendError) {
        setError(getApiErrorMessage(sendError, "Impossible d'envoyer ce message pour le moment."));
      } finally {
        setIsSending(false);
      }

      return;
    }

    setError("Sélectionnez un membre ou un groupe avant d'écrire.");
  };

  const handleReportDirectMessage = async (message: ConversationMessage) => {
    if (!accessToken || !selectedDirectConversationId || !message.source) {
      return;
    }

    setError("");

    try {
      await reportDirectMessage(accessToken, selectedDirectConversationId, message.id, {
        reason: "INAPPROPRIATE",
        message: "Signalement depuis la messagerie membre.",
      });
      setReportedDirectMessageIds((current) => new Set(current).add(message.id));
    } catch (reportError) {
      setError(getApiErrorMessage(reportError, "Impossible de signaler ce message pour le moment."));
    }
  };

  const handleReportGroupMessage = async (message: ConversationMessage) => {
    if (!accessToken || !selectedGroupId || !message.groupSource) {
      return;
    }

    setError("");

    try {
      await reportCommunityGroupMessage(accessToken, selectedGroupId, message.id, {
        reason: "INAPPROPRIATE",
        message: "Signalement depuis une discussion de groupe.",
      });
      setReportedGroupMessageIds((current) => new Set(current).add(message.id));
    } catch (reportError) {
      setError(getApiErrorMessage(reportError, "Impossible de signaler ce message de groupe pour le moment."));
    }
  };

  const handleArchiveSelectedConversation = async () => {
    if (!accessToken || !selectedDirectConversationId) {
      return;
    }

    setError("");

    try {
      if (showArchived) {
        const response = await unarchiveDirectConversation(accessToken, selectedDirectConversationId);
        setArchivedDirectConversations((current) => current.filter((conversation) => conversation.id !== selectedDirectConversationId));
        setDirectConversations((current) => mergeDirectConversation(current, response.conversation));
        setShowArchived(false);
        setManualSelectedId(`direct:${response.conversation.id}`);
        return;
      }

      await archiveDirectConversation(accessToken, selectedDirectConversationId);
      const archivedConversation = directConversations.find((conversation) => conversation.id === selectedDirectConversationId);
      setDirectConversations((current) => current.filter((conversation) => conversation.id !== selectedDirectConversationId));
      if (archivedConversation) {
        setArchivedDirectConversations((current) => mergeDirectConversation(current, { ...archivedConversation, archived: true }));
      }
      setManualSelectedId(null);
    } catch (archiveError) {
      setError(getApiErrorMessage(archiveError, "Impossible de mettre à jour cette conversation."));
    }
  };

  const handleBlockSelectedMember = async () => {
    if (!accessToken || !selectedConversation.memberId) {
      return;
    }

    setIsBlockingUser(true);
    setError("");

    try {
      await blockDirectMessageUser(accessToken, selectedConversation.memberId, "Blocage depuis la messagerie membre.");
      setManualSelectedId(null);
      setDirectConversations((current) => current.filter((conversation) => conversation.target?.id !== selectedConversation.memberId));
    } catch (blockError) {
      setError(getApiErrorMessage(blockError, "Impossible de bloquer ce membre pour le moment."));
    } finally {
      setIsBlockingUser(false);
    }
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
                <strong>{showArchived ? "Archives" : "Conversations"}</strong>
                <span>{showArchived ? `${archivedDirectConversations.length} conversations` : "Membres et groupes"}</span>
              </div>
              <button
                type="button"
                aria-label="Démarrer un nouveau message"
                onClick={() => searchInputRef.current?.focus()}
              >
                <SquarePen aria-hidden="true" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                aria-label={showArchived ? "Voir les conversations actives" : "Voir les archives"}
                onClick={() => {
                  setShowArchived((current) => !current);
                  setManualSelectedId(null);
                }}
              >
                <Archive aria-hidden="true" strokeWidth={1.8} />
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

            {messageSearchResults.length ? (
              <div className="messages-search-results">
                <span>Dans les messages</span>
                {messageSearchResults.map((result) => (
                  <button
                    key={`${result.conversation.id}-${result.message.id}`}
                    type="button"
                    onClick={() => {
                      setShowArchived(Boolean(result.conversation.archived));
                      if (result.conversation.archived) {
                        setArchivedDirectConversations((current) => mergeDirectConversation(current, result.conversation));
                      } else {
                        setDirectConversations((current) => mergeDirectConversation(current, result.conversation));
                      }
                      setManualSelectedId(`direct:${result.conversation.id}`);
                    }}
                  >
                    <Search aria-hidden="true" strokeWidth={1.8} />
                    <div>
                      <strong>{result.conversation.target?.displayName ?? "Conversation"}</strong>
                      <small>{result.message.content}</small>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

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
                <div className="messages-thread-actions">
                  <button className="member-secondary-button" type="button" onClick={handleArchiveSelectedConversation}>
                    <Archive aria-hidden="true" strokeWidth={1.8} />
                    {showArchived ? "Restaurer" : "Archiver"}
                  </button>
                  <button className="member-secondary-button" type="button" onClick={handleBlockSelectedMember} disabled={isBlockingUser}>
                    {isBlockingUser ? <LoaderCircle aria-hidden="true" className="spin-icon" /> : <Ban aria-hidden="true" strokeWidth={1.8} />}
                    Bloquer
                  </button>
                  <Link className="member-secondary-button" href={`/espace-membre/reseau/membre/${encodeURIComponent(selectedConversation.memberNumber)}`}>
                    <UsersRound aria-hidden="true" strokeWidth={1.8} />
                    Profil
                  </Link>
                </div>
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
                <>
                  {messages.map((message) => (
                    <article key={message.id} className={message.author === "me" ? "message-bubble is-mine" : "message-bubble"}>
                      <p>{message.body}</p>
                      {message.attachment ? <MessageAttachment attachment={message.attachment} /> : null}
                      {message.author === "them" && isDirectConversation && message.source && !message.source.deletedAt ? (
                        <button
                          className="message-report-button"
                          type="button"
                          disabled={reportedDirectMessageIds.has(message.id)}
                          onClick={() => handleReportDirectMessage(message)}
                        >
                          <Flag aria-hidden="true" strokeWidth={1.8} />
                          {reportedDirectMessageIds.has(message.id) ? "Signalé" : "Signaler"}
                        </button>
                      ) : null}
                      {message.author === "them" && isGroupConversation && message.groupSource && !message.groupSource.deletedAt ? (
                        <button
                          className="message-report-button"
                          type="button"
                          disabled={reportedGroupMessageIds.has(message.id)}
                          onClick={() => handleReportGroupMessage(message)}
                        >
                          <Flag aria-hidden="true" strokeWidth={1.8} />
                          {reportedGroupMessageIds.has(message.id) ? "Signalé" : "Signaler"}
                        </button>
                      ) : null}
                      <small>
                        {message.time}
                        {message.author === "me" && isDirectConversation ? (
                          <em>{message.readAt ? "Vu" : "Envoyé"}</em>
                        ) : null}
                      </small>
                    </article>
                  ))}
                  {activeTypingLabel ? (
                    <div className="messages-typing-indicator">
                      <span />
                      <span />
                      <span />
                      <strong>{activeTypingLabel}</strong>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="messages-empty-state">
                  <MessageCircle aria-hidden="true" />
                  <strong>Aucun message pour le moment</strong>
                  <span>Lancez la conversation avec un besoin, une question ou une proposition claire.</span>
                </div>
              )}
            </div>

            {isDirectConversation && conversationAttachments.length ? (
              <aside className="messages-attachments-panel">
                <div>
                  <strong>Pièces jointes</strong>
                  <span>{conversationAttachments.length} fichier{conversationAttachments.length > 1 ? "s" : ""}</span>
                </div>
                <div>
                  {conversationAttachments.slice(0, 6).map((item) => (
                    <a key={item.id} href={item.url ?? "#"} target="_blank" rel="noreferrer">
                      {item.kind === "image" ? <ImageIcon aria-hidden="true" /> : <Paperclip aria-hidden="true" />}
                      <span>{item.name}</span>
                    </a>
                  ))}
                </div>
              </aside>
            ) : null}

            {attachment ? (
              <div className="messages-attachment-preview">
                <MessageAttachment attachment={attachment} />
                <button type="button" onClick={() => setAttachment(null)} disabled={isSending}>
                  Retirer
                </button>
              </div>
            ) : null}
            <form className="messages-composer" onSubmit={sendMessage}>
              <input ref={attachmentInputRef} className="messages-composer-file" type="file" onChange={handleAttachmentChange} />
              <input ref={imageInputRef} className="messages-composer-file" type="file" accept="image/*" onChange={handleAttachmentChange} />
              <button type="button" aria-label="Joindre un fichier" onClick={() => attachmentInputRef.current?.click()} disabled={!canWriteMessage || isUploadingAttachment || isSending}>
                {isUploadingAttachment ? <LoaderCircle aria-hidden="true" className="spin-icon" /> : <Paperclip aria-hidden="true" />}
              </button>
              <button type="button" aria-label="Ajouter une image" onClick={() => imageInputRef.current?.click()} disabled={!canWriteMessage || isUploadingAttachment || isSending}>
                <ImageIcon aria-hidden="true" />
              </button>
              <input
                ref={composerInputRef}
                value={draft}
                onChange={(event) => handleDraftChange(event.target.value)}
                placeholder={selectedConversation.isJoined === false ? "Rejoignez le groupe pour écrire..." : "Écrire un message..."}
                disabled={!canWriteMessage || isSending}
              />
              <button className="member-create-button" type="submit" aria-label="Envoyer" disabled={!canWriteMessage || isSending || isUploadingAttachment || (!draft.trim() && !attachment)}>
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
        <img src={versionedImageUrl(avatarUrl, avatarVersion)} alt="" loading="lazy" decoding="async" />
      ) : isGroup ? (
        <Hash aria-hidden="true" />
      ) : (
        <span>{buildInitials(name)}</span>
      )}
      {online ? <i aria-label="En ligne" /> : null}
    </span>
  );
}

function MessageAttachment({ attachment }: { attachment: NonNullable<ConversationMessage["attachment"]> }) {
  const isImage = attachment.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(attachment.url);

  return (
    <a className={isImage ? "message-attachment is-image" : "message-attachment"} href={attachment.url} target="_blank" rel="noreferrer">
      {isImage ? (
        <img src={attachment.url} alt="" loading="lazy" decoding="async" />
      ) : (
        <Paperclip aria-hidden="true" />
      )}
      <span>{attachment.name}</span>
    </a>
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
    groupSource: message,
    attachment: message.attachmentUrl ? {
      url: message.attachmentUrl,
      name: message.attachmentName ?? "Pièce jointe",
      mimeType: message.attachmentMimeType,
    } : undefined,
  }));
}

function toDirectConversationMessages(messages: DirectMessage[], currentUserId?: string): ConversationMessage[] {
  return messages.map((message) => ({
    id: message.id,
    author: message.author.id === currentUserId ? "me" : "them",
    body: message.content,
    time: formatMessageTime(message.createdAt),
    readAt: message.readAt,
    source: message,
    attachment: message.attachmentUrl ? {
      url: message.attachmentUrl,
      name: message.attachmentName ?? "Pièce jointe",
      mimeType: message.attachmentMimeType,
    } : undefined,
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

"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Edit3,
  Hash,
  LoaderCircle,
  MailCheck,
  MailPlus,
  MessageCircle,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UserMinus,
  UsersRound,
  X,
} from "lucide-react";
import { MemberShell } from "@/components/member-shell";
import { useVisibleItems } from "@/hooks/use-visible-items";
import {
  acceptCommunityGroupInvitation,
  addCommunityGroupMember,
  cancelCommunityGroupInvitation,
  createCommunityGroup,
  createCommunityGroupMessage,
  deleteCommunityGroup,
  deleteCommunityGroupMessage,
  declineCommunityGroupInvitation,
  getApiErrorMessage,
  getCommunityGroupInvitations,
  getCommunityGroupMemberCandidates,
  getCommunityGroupMembers,
  getCommunityGroupMessages,
  getCommunityGroups,
  getMyCommunityGroupInvitations,
  getPublications,
  inviteCommunityGroupMember,
  joinCommunityGroup,
  leaveCommunityGroup,
  removeCommunityGroupMember,
  updateCommunityGroup,
  updateCommunityGroupMemberRole,
  uploadCommunityGroupPhoto,
} from "@/lib/api";
import type {
  CommunityGroup,
  CommunityGroupInvitation,
  CommunityGroupMember,
  CommunityGroupMemberCandidate,
  CommunityGroupMessage,
  CommunityGroupVisibility,
  Publication,
} from "@/lib/api";
import { normalizeProfileOption } from "@/lib/profile-options";
import { useAppSelector } from "@/store/hooks";

type FallbackDiscussion = {
  title: string;
  author: string;
  replies: number;
  kind: "Projet" | "Question" | "Collaboration" | "Annonce";
};

type DisplayGroup = CommunityGroup & {
  isFallback?: boolean;
  discussions?: FallbackDiscussion[];
};

type GroupFormState = {
  name: string;
  category: string;
  description: string;
  city: string;
  country: string;
  tags: string;
  visibility: CommunityGroupVisibility;
};

const groupFilters = ["Tous", "Mes groupes", "Disciplines", "Villes", "Collaborations", "Questions"];

const emptyGroupForm: GroupFormState = {
  name: "",
  category: "Disciplines",
  description: "",
  city: "Kinshasa",
  country: "Congo RDC",
  tags: "",
  visibility: "MEMBERS",
};

const fallbackGroups: DisplayGroup[] = [
  {
    id: "kin-art-visuel",
    ownerId: "demo",
    name: "Arts visuels Kinshasa",
    slug: "arts-visuels-kinshasa",
    category: "Disciplines",
    description: "Peinture, illustration, photographie, scénographie et expositions locales.",
    avatarUrl: null,
    members: 142,
    posts: 38,
    city: "Kinshasa",
    country: "Congo RDC",
    isJoined: true,
    currentUserRole: "MEMBER",
    canManage: false,
    tags: ["Arts visuels", "Exposition", "Portfolio"],
    visibility: "MEMBERS",
    status: "ACTIVE",
    lastActivity: new Date("2026-08-20T19:48:00.000Z").toISOString(),
    owner: { id: "demo", accountType: "ORGANIZATION", displayName: "CCA Studio", avatarUrl: null },
    createdAt: new Date("2026-08-18T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-08-20T19:48:00.000Z").toISOString(),
    isFallback: true,
    discussions: [
      { title: "Préparer un dossier pour une exposition collective", author: "Amina K.", replies: 12, kind: "Question" },
      { title: "Recherche photographe pour résidence courte", author: "CCA Studio", replies: 7, kind: "Collaboration" },
    ],
  },
  {
    id: "mode-couture-rdc",
    ownerId: "demo",
    name: "Mode, couture & stylisme",
    slug: "mode-couture-stylisme",
    category: "Disciplines",
    description: "Créateurs textile, stylistes, mannequins, ateliers et marques émergentes.",
    avatarUrl: null,
    members: 96,
    posts: 27,
    city: "Kinshasa",
    country: "Congo RDC",
    isJoined: false,
    currentUserRole: null,
    canManage: false,
    tags: ["Mode", "Textile", "Défilé"],
    visibility: "PUBLIC",
    status: "ACTIVE",
    lastActivity: new Date("2026-08-20T19:25:00.000Z").toISOString(),
    owner: { id: "demo", accountType: "CREATOR", displayName: "Nadine M.", avatarUrl: null },
    createdAt: new Date("2026-08-18T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-08-20T19:25:00.000Z").toISOString(),
    isFallback: true,
    discussions: [
      { title: "Casting modèle pour lookbook capsule", author: "Nadine M.", replies: 18, kind: "Annonce" },
      { title: "Partage fournisseurs tissus à Kinshasa", author: "Grace Atelier", replies: 9, kind: "Question" },
    ],
  },
  {
    id: "creative-business",
    ownerId: "demo",
    name: "Business créatif",
    slug: "business-creatif",
    category: "Collaborations",
    description: "Prix, devis, contrats, ventes, partenariats et gestion des missions.",
    avatarUrl: null,
    members: 188,
    posts: 44,
    city: "Afrique francophone",
    country: null,
    isJoined: true,
    currentUserRole: "MEMBER",
    canManage: false,
    tags: ["Contrat", "Devis", "Mission"],
    visibility: "MEMBERS",
    status: "ACTIVE",
    lastActivity: new Date("2026-08-20T16:00:00.000Z").toISOString(),
    owner: { id: "demo", accountType: "PARTNER", displayName: "Creative Hub", avatarUrl: null },
    createdAt: new Date("2026-08-18T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-08-20T16:00:00.000Z").toISOString(),
    isFallback: true,
    discussions: [
      { title: "Comment facturer une direction artistique ?", author: "Junior L.", replies: 21, kind: "Question" },
      { title: "Besoin de profils pour campagne culturelle", author: "Creative Hub", replies: 14, kind: "Projet" },
    ],
  },
  {
    id: "lingala-content",
    ownerId: "demo",
    name: "Création de contenu & voix",
    slug: "creation-contenu-voix",
    category: "Questions",
    description: "Vidéos, podcasts, narration, voix off, réseaux sociaux et storytelling.",
    avatarUrl: null,
    members: 74,
    posts: 19,
    city: "En ligne",
    country: null,
    isJoined: false,
    currentUserRole: null,
    canManage: false,
    tags: ["Podcast", "Voix", "Contenu"],
    visibility: "PUBLIC",
    status: "ACTIVE",
    lastActivity: new Date("2026-08-19T15:00:00.000Z").toISOString(),
    owner: { id: "demo", accountType: "CREATOR", displayName: "Blaise N.", avatarUrl: null },
    createdAt: new Date("2026-08-18T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-08-19T15:00:00.000Z").toISOString(),
    isFallback: true,
    discussions: [
      { title: "Identifier un monteur vidéo disponible", author: "Merveille P.", replies: 5, kind: "Collaboration" },
      { title: "Format court en Lingala : bonnes pratiques", author: "Blaise N.", replies: 11, kind: "Question" },
    ],
  },
];

export function GroupsPage() {
  const searchParams = useSearchParams();
  const requestedGroupId = searchParams.get("groupId");
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const groupPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [apiGroups, setApiGroups] = useState<CommunityGroup[]>([]);
  const [fallbackJoinedIds, setFallbackJoinedIds] = useState(
    fallbackGroups.filter((group) => group.isJoined).map((group) => group.id),
  );
  const [publishedDiscussions, setPublishedDiscussions] = useState<Publication[]>([]);
  const [messages, setMessages] = useState<CommunityGroupMessage[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [selectedId, setSelectedId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [messageDraft, setMessageDraft] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [groupMembers, setGroupMembers] = useState<CommunityGroupMember[]>([]);
  const [memberOptions, setMemberOptions] = useState<CommunityGroupMemberCandidate[]>([]);
  const [myInvitations, setMyInvitations] = useState<CommunityGroupInvitation[]>([]);
  const [groupInvitations, setGroupInvitations] = useState<CommunityGroupInvitation[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [hasLoadedGroups, setHasLoadedGroups] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingGroupMembers, setIsLoadingGroupMembers] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMemberOptions, setIsLoadingMemberOptions] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState("");
  const [invitingMemberId, setInvitingMemberId] = useState("");
  const [uploadingGroupPhotoId, setUploadingGroupPhotoId] = useState("");
  const [memberActionId, setMemberActionId] = useState("");
  const [invitationActionId, setInvitationActionId] = useState("");
  const [groupError, setGroupError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [memberAddError, setMemberAddError] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const [notice, setNotice] = useState("");

  const allGroups = useMemo<DisplayGroup[]>(() => {
    if (apiGroups.length) {
      return apiGroups.map((group) => ({ ...group, isFallback: false }));
    }

    if (accessToken) {
      return [];
    }

    const liveGroups = buildGroupsWithPublications(publishedDiscussions);
    return liveGroups.length ? liveGroups : withFallbackJoinState(fallbackGroups, fallbackJoinedIds);
  }, [accessToken, apiGroups, fallbackJoinedIds, publishedDiscussions]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const loadGroups = async () => {
      setIsLoadingGroups(true);
      setHasLoadedGroups(false);
      setGroupError("");

      try {
        const [groups, publications] = await Promise.all([
          getCommunityGroups(accessToken, { limit: 60 }),
          getPublications(accessToken, { destination: "groups", status: "PUBLISHED", limit: 20 }).catch(
            () => [] as Publication[],
          ),
        ]);

        if (!isMounted) {
          return;
        }

        setApiGroups(groups);
        setPublishedDiscussions(publications);
        setSelectedId((current) => {
          if (requestedGroupId && groups.some((group) => group.id === requestedGroupId)) {
            return requestedGroupId;
          }

          return current || groups[0]?.id || "";
        });
      } catch (error) {
        if (isMounted) {
          setGroupError(getApiErrorMessage(error, "Les groupes ne sont pas disponibles pour le moment."));
        }
      } finally {
        if (isMounted) {
          setHasLoadedGroups(true);
          setIsLoadingGroups(false);
        }
      }
    };

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, [accessToken, requestedGroupId]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = normalizeProfileOption(query);

    return allGroups.filter((group) => {
      const matchesFilter =
        activeFilter === "Tous" ||
        (activeFilter === "Mes groupes" && group.isJoined) ||
        group.category === activeFilter;
      const searchable = normalizeProfileOption([
        group.name,
        group.category,
        group.description,
        group.city ?? "",
        group.country ?? "",
        group.tags.join(" "),
      ].join(" "));

      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeFilter, allGroups, query]);

  const selectedGroup =
    filteredGroups.find((group) => group.id === selectedId) ??
    filteredGroups.find((group) => group.id === requestedGroupId) ??
    filteredGroups[0] ??
    null;
  const visibleGroups = useVisibleItems(filteredGroups, 12);
  const joinedGroupsCount = allGroups.filter((group) => group.isJoined).length;
  const selectedGroupId = selectedGroup?.id ?? "";
  const selectedGroupIsFallback = Boolean(selectedGroup?.isFallback);
  const selectedGroupIsJoined = Boolean(selectedGroup?.isJoined);
  const selectedGroupCanManage = Boolean(selectedGroup?.canManage && !selectedGroup.isFallback);
  const displayMessages = selectedGroup?.isFallback
    ? fallbackMessages(selectedGroup)
    : selectedGroup?.isJoined
      ? messages
      : [];
  const currentGroupInvitations = selectedGroupId
    ? groupInvitations.filter((invitation) => invitation.groupId === selectedGroupId)
    : [];

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const loadMyInvitations = async () => {
      setIsLoadingInvitations(true);
      setInvitationError("");

      try {
        const invitations = await getMyCommunityGroupInvitations(accessToken);

        if (isMounted) {
          setMyInvitations(invitations);
        }
      } catch (error) {
        if (isMounted) {
          setInvitationError(getApiErrorMessage(error, "Impossible de charger vos invitations pour le moment."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingInvitations(false);
        }
      }
    };

    void loadMyInvitations();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!selectedGroupId || selectedGroupIsFallback || !accessToken || !selectedGroupIsJoined) {
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setMessageError("");

      try {
        const groupMessages = await getCommunityGroupMessages(accessToken, selectedGroupId);

        if (isMounted) {
          setMessages(groupMessages);
        }
      } catch (error) {
        if (isMounted) {
          setMessageError(getApiErrorMessage(error, "Les messages du groupe ne sont pas disponibles pour le moment."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedGroupId, selectedGroupIsFallback, selectedGroupIsJoined]);

  useEffect(() => {
    if (!selectedGroupId || selectedGroupIsFallback || !accessToken || !selectedGroupIsJoined) {
      return;
    }

    let isMounted = true;

    const loadGroupMembers = async () => {
      setIsLoadingGroupMembers(true);

      try {
        const members = await getCommunityGroupMembers(accessToken, selectedGroupId);

        if (isMounted) {
          setGroupMembers(members);
        }
      } catch (error) {
        if (isMounted) {
          setMemberAddError(getApiErrorMessage(error, "Les membres du groupe ne sont pas disponibles pour le moment."));
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroupMembers(false);
        }
      }
    };

    void loadGroupMembers();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedGroupId, selectedGroupIsFallback, selectedGroupIsJoined]);

  useEffect(() => {
    if (!accessToken || !selectedGroupId || !selectedGroupCanManage) {
      return;
    }

    let isMounted = true;

    const loadGroupInvitations = async () => {
      try {
        const invitations = await getCommunityGroupInvitations(accessToken, selectedGroupId);

        if (isMounted) {
          setGroupInvitations(invitations);
        }
      } catch (error) {
        if (isMounted) {
          setMemberAddError(getApiErrorMessage(error, "Impossible de charger les invitations du groupe."));
        }
      }
    };

    void loadGroupInvitations();

    return () => {
      isMounted = false;
    };
  }, [accessToken, selectedGroupCanManage, selectedGroupId]);

  useEffect(() => {
    if (!accessToken || !selectedGroupId || !selectedGroupCanManage) {
      return;
    }

    let isMounted = true;
    const timer = window.setTimeout(() => {
      setIsLoadingMemberOptions(true);

      getCommunityGroupMemberCandidates(accessToken, selectedGroupId, { q: memberQuery, limit: 6 })
        .then((members) => {
          if (!isMounted) {
            return;
          }

          setMemberOptions(members.filter((member) => member.userId !== user?.id));
        })
        .catch((error) => {
          if (isMounted) {
            setMemberAddError(getApiErrorMessage(error, "Impossible de charger les membres pour le moment."));
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingMemberOptions(false);
          }
        });
    }, 220);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [accessToken, memberQuery, selectedGroupCanManage, selectedGroupId, user?.id]);

  const openCreateForm = () => {
    setEditingGroupId(null);
    setGroupForm(emptyGroupForm);
    setShowForm(true);
    setGroupError("");
    setNotice("");
  };

  const openEditForm = (group: DisplayGroup) => {
    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name,
      category: group.category,
      description: group.description,
      city: group.city ?? "",
      country: group.country ?? "",
      tags: group.tags.join(", "),
      visibility: group.visibility,
    });
    setShowForm(true);
    setGroupError("");
    setNotice("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGroupId(null);
    setGroupForm(emptyGroupForm);
  };

  const handleGroupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setGroupError("Connectez-vous pour gérer un groupe.");
      return;
    }

    setIsSubmittingGroup(true);
    setGroupError("");
    setNotice("");

    const payload = {
      name: groupForm.name,
      category: groupForm.category,
      description: groupForm.description,
      city: groupForm.city,
      country: groupForm.country,
      tags: parseTags(groupForm.tags),
      visibility: groupForm.visibility,
    };

    try {
      const savedGroup =
        editingGroupId
          ? await updateCommunityGroup(accessToken, editingGroupId, payload)
          : await createCommunityGroup(accessToken, payload);

      setApiGroups((current) =>
        current.some((group) => group.id === savedGroup.id)
          ? current.map((group) => (group.id === savedGroup.id ? savedGroup : group))
          : [savedGroup, ...current],
      );
      setSelectedId(savedGroup.id);
      setNotice(editingGroupId ? "Groupe modifié." : "Groupe créé. Vous pouvez lancer la discussion.");
      closeForm();
    } catch (error) {
      setGroupError(getApiErrorMessage(error, "Impossible d'enregistrer ce groupe pour le moment."));
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleArchiveGroup = async (group: DisplayGroup) => {
    if (!accessToken || group.isFallback) {
      return;
    }

    const confirmed = window.confirm("Archiver ce groupe ? Il ne sera plus visible dans l'annuaire.");
    if (!confirmed) {
      return;
    }

    setGroupError("");
    setNotice("");

    try {
      await deleteCommunityGroup(accessToken, group.id);
      setApiGroups((current) => current.filter((item) => item.id !== group.id));
      setSelectedId("");
      setNotice("Groupe archivé.");
    } catch (error) {
      setGroupError(getApiErrorMessage(error, "Impossible d'archiver ce groupe pour le moment."));
    }
  };

  const handleJoinToggle = async (group: DisplayGroup) => {
    if (group.isFallback) {
      setFallbackJoinedIds((current) =>
        current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id],
      );
      return;
    }

    if (!accessToken) {
      setGroupError("Connectez-vous pour rejoindre ce groupe.");
      return;
    }

    setGroupError("");
    setNotice("");

    try {
      const updatedGroup = group.isJoined
        ? await leaveCommunityGroup(accessToken, group.id)
        : await joinCommunityGroup(accessToken, group.id);
      setApiGroups((current) => current.map((item) => (item.id === updatedGroup.id ? updatedGroup : item)));
    } catch (error) {
      setGroupError(getApiErrorMessage(error, "Impossible de mettre à jour votre adhésion pour le moment."));
    }
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken || !selectedGroup || selectedGroup.isFallback) {
      setMessageError("Créez ou rejoignez un groupe réel pour envoyer un message.");
      return;
    }

    if (!selectedGroup.isJoined) {
      setMessageError("Rejoignez le groupe pour participer à la discussion.");
      return;
    }

    setIsSendingMessage(true);
    setMessageError("");

    try {
      const message = await createCommunityGroupMessage(accessToken, selectedGroup.id, { content: messageDraft });
      setMessages((current) => [...current, message]);
      setMessageDraft("");
      setApiGroups((current) =>
        current.map((group) =>
          group.id === selectedGroup.id
            ? { ...group, posts: group.posts + 1, lastActivity: message.createdAt, updatedAt: message.createdAt }
            : group,
        ),
      );
    } catch (error) {
      setMessageError(getApiErrorMessage(error, "Impossible d'envoyer ce message pour le moment."));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleGroupPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file || !accessToken || !selectedGroup || selectedGroup.isFallback) {
      return;
    }

    setUploadingGroupPhotoId(selectedGroup.id);
    setGroupError("");
    setNotice("");

    try {
      const updatedGroup = await uploadCommunityGroupPhoto(accessToken, selectedGroup.id, file);
      setApiGroups((current) => current.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
      setSelectedId(updatedGroup.id);
      setNotice("Photo du groupe mise à jour.");
    } catch (error) {
      setGroupError(getApiErrorMessage(error, "Impossible d'envoyer la photo du groupe pour le moment."));
    } finally {
      setUploadingGroupPhotoId("");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!accessToken || !selectedGroup || selectedGroup.isFallback) {
      return;
    }

    try {
      const deleted = await deleteCommunityGroupMessage(accessToken, selectedGroup.id, messageId);
      setMessages((current) => current.map((message) => (message.id === deleted.id ? deleted : message)));
    } catch (error) {
      setMessageError(getApiErrorMessage(error, "Impossible de supprimer ce message pour le moment."));
    }
  };

  const refreshGroupMembers = async (groupId: string) => {
    if (!accessToken) {
      return;
    }

    const members = await getCommunityGroupMembers(accessToken, groupId);
    setGroupMembers(members);
  };

  const refreshGroupMessages = async (groupId: string) => {
    if (!accessToken) {
      return;
    }

    const groupMessages = await getCommunityGroupMessages(accessToken, groupId);
    setMessages(groupMessages);
  };

  const refreshMyInvitations = async () => {
    if (!accessToken) {
      return;
    }

    const invitations = await getMyCommunityGroupInvitations(accessToken);
    setMyInvitations(invitations);
  };

  const refreshGroupInvitations = async (groupId: string) => {
    if (!accessToken || !selectedGroupCanManage) {
      return;
    }

    const invitations = await getCommunityGroupInvitations(accessToken, groupId);
    setGroupInvitations(invitations);
  };

  const handleAddMember = async (member: CommunityGroupMemberCandidate) => {
    if (!accessToken || !selectedGroup || selectedGroup.isFallback) {
      setMemberAddError("Sélectionnez un groupe réel pour ajouter un membre.");
      return;
    }

    setAddingMemberId(member.userId);
    setMemberAddError("");
    setNotice("");

    try {
      const updatedGroup = await addCommunityGroupMember(accessToken, selectedGroup.id, {
        userId: member.userId,
        role: "MEMBER",
      });

      setApiGroups((current) => current.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
      setMemberOptions((current) => current.filter((option) => option.userId !== member.userId));
      setMemberQuery("");
      setNotice(`${member.displayName} a été ajouté au groupe.`);
      await refreshGroupMembers(selectedGroup.id);
      await refreshGroupInvitations(selectedGroup.id);

      if (selectedGroup.isJoined) {
        await refreshGroupMessages(selectedGroup.id);
      }
    } catch (error) {
      setMemberAddError(getApiErrorMessage(error, "Impossible d'ajouter ce membre pour le moment."));
    } finally {
      setAddingMemberId("");
    }
  };

  const handleInviteMember = async (member: CommunityGroupMemberCandidate) => {
    if (!accessToken || !selectedGroup || selectedGroup.isFallback) {
      setMemberAddError("Sélectionnez un groupe réel pour inviter un membre.");
      return;
    }

    setInvitingMemberId(member.userId);
    setMemberAddError("");
    setNotice("");

    try {
      const invitation = await inviteCommunityGroupMember(accessToken, selectedGroup.id, {
        userId: member.userId,
        role: "MEMBER",
      });

      setMemberOptions((current) =>
        current.map((option) =>
          option.userId === member.userId
            ? { ...option, pendingInvitationId: invitation.id, pendingInvitationStatus: invitation.status }
            : option,
        ),
      );
      setNotice(`Invitation envoyée à ${member.displayName}.`);
      await refreshGroupInvitations(selectedGroup.id);

      if (selectedGroup.isJoined) {
        await refreshGroupMessages(selectedGroup.id);
      }
    } catch (error) {
      setMemberAddError(getApiErrorMessage(error, "Impossible d'envoyer cette invitation pour le moment."));
    } finally {
      setInvitingMemberId("");
    }
  };

  const handleAcceptInvitation = async (invitation: CommunityGroupInvitation) => {
    if (!accessToken) {
      setInvitationError("Connectez-vous pour répondre à cette invitation.");
      return;
    }

    setInvitationActionId(`${invitation.id}:accept`);
    setInvitationError("");
    setNotice("");

    try {
      const result = await acceptCommunityGroupInvitation(accessToken, invitation.id);
      setMyInvitations((current) => current.filter((item) => item.id !== invitation.id));
      setApiGroups((current) =>
        current.some((group) => group.id === result.group.id)
          ? current.map((group) => (group.id === result.group.id ? result.group : group))
          : [result.group, ...current],
      );
      setSelectedId(result.group.id);
      setNotice(`Vous avez rejoint le groupe ${result.group.name}.`);
    } catch (error) {
      setInvitationError(getApiErrorMessage(error, "Impossible d'accepter cette invitation pour le moment."));
    } finally {
      setInvitationActionId("");
    }
  };

  const handleDeclineInvitation = async (invitation: CommunityGroupInvitation) => {
    if (!accessToken) {
      setInvitationError("Connectez-vous pour répondre à cette invitation.");
      return;
    }

    setInvitationActionId(`${invitation.id}:decline`);
    setInvitationError("");
    setNotice("");

    try {
      await declineCommunityGroupInvitation(accessToken, invitation.id);
      setMyInvitations((current) => current.filter((item) => item.id !== invitation.id));
      setNotice(`Invitation au groupe ${invitation.group.name} refusée.`);
    } catch (error) {
      setInvitationError(getApiErrorMessage(error, "Impossible de refuser cette invitation pour le moment."));
    } finally {
      setInvitationActionId("");
    }
  };

  const handleCancelInvitation = async (invitation: CommunityGroupInvitation) => {
    if (!accessToken || !selectedGroup) {
      return;
    }

    setInvitationActionId(`${invitation.id}:cancel`);
    setMemberAddError("");
    setNotice("");

    try {
      await cancelCommunityGroupInvitation(accessToken, selectedGroup.id, invitation.id);
      setGroupInvitations((current) => current.filter((item) => item.id !== invitation.id));
      setMemberOptions((current) =>
        current.map((option) =>
          option.pendingInvitationId === invitation.id
            ? { ...option, pendingInvitationId: null, pendingInvitationStatus: null }
            : option,
        ),
      );
      setNotice(`Invitation annulée pour ${invitation.invitee.displayName}.`);
    } catch (error) {
      setMemberAddError(getApiErrorMessage(error, "Impossible d'annuler cette invitation pour le moment."));
    } finally {
      setInvitationActionId("");
    }
  };

  const handleUpdateMemberRole = async (member: CommunityGroupMember, role: "MEMBER" | "MODERATOR") => {
    if (!accessToken || !selectedGroup || selectedGroup.isFallback) {
      setMemberAddError("Sélectionnez un groupe réel pour gérer les rôles.");
      return;
    }

    setMemberActionId(`${member.userId}:${role}`);
    setMemberAddError("");
    setNotice("");

    try {
      const updatedGroup = await updateCommunityGroupMemberRole(accessToken, selectedGroup.id, member.userId, role);
      setApiGroups((current) => current.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
      await refreshGroupMembers(selectedGroup.id);
      await refreshGroupMessages(selectedGroup.id);
      setNotice(
        role === "MODERATOR"
          ? `${member.displayName} est maintenant admin du groupe.`
          : `${member.displayName} n'est plus admin du groupe.`,
      );
    } catch (error) {
      setMemberAddError(getApiErrorMessage(error, "Impossible de modifier le rôle de ce membre pour le moment."));
    } finally {
      setMemberActionId("");
    }
  };

  const handleRemoveMember = async (member: CommunityGroupMember) => {
    if (!accessToken || !selectedGroup || selectedGroup.isFallback) {
      setMemberAddError("Sélectionnez un groupe réel pour retirer un membre.");
      return;
    }

    const confirmed = window.confirm(`Retirer ${member.displayName} de ce groupe ?`);
    if (!confirmed) {
      return;
    }

    setMemberActionId(`${member.userId}:remove`);
    setMemberAddError("");
    setNotice("");

    try {
      const updatedGroup = await removeCommunityGroupMember(accessToken, selectedGroup.id, member.userId);
      setApiGroups((current) => current.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
      await refreshGroupMembers(selectedGroup.id);
      await refreshGroupMessages(selectedGroup.id);
      setNotice(`${member.displayName} a été retiré du groupe.`);
    } catch (error) {
      setMemberAddError(getApiErrorMessage(error, "Impossible de retirer ce membre pour le moment."));
    } finally {
      setMemberActionId("");
    }
  };

  return (
    <MemberShell activeItem="Groupes">
      <div className="social-layout">
        <section className="member-module-hero social-hero">
          <div>
            <span className="member-kicker">Groupes</span>
            <h1>Des espaces de discussion pour transformer le réseau en collaborations.</h1>
            <p>
              Créez des groupes par discipline, ville ou besoin, puis échangez en messagerie collective autour des
              projets, questions, offres et opportunités.
            </p>
            <div className="member-hero-actions">
              <button className="member-create-button" type="button" onClick={openCreateForm}>
                <Plus aria-hidden="true" strokeWidth={1.8} />
                Créer un groupe
              </button>
              <a className="member-secondary-button" href="#groupes-communautaires">
                Explorer
                <ArrowRight aria-hidden="true" strokeWidth={1.8} />
              </a>
            </div>
          </div>
          <div className="member-module-highlight-grid">
            <article>
              <UsersRound aria-hidden="true" />
              <strong>{allGroups.length}</strong>
              <span>groupes actifs</span>
            </article>
            <article>
              <MessageCircle aria-hidden="true" />
              <strong>{allGroups.reduce((total, group) => total + group.posts, 0)}</strong>
              <span>messages</span>
            </article>
            <article>
              <Sparkles aria-hidden="true" />
              <strong>{joinedGroupsCount}</strong>
              <span>rejoints</span>
            </article>
          </div>
        </section>

        {showForm ? (
          <section className="member-card social-group-form-card">
            <div className="member-card-title">
              <div>
                <h2>{editingGroupId ? "Modifier le groupe" : "Créer un groupe"}</h2>
                <p>Définissez un espace clair pour que les membres sachent pourquoi participer.</p>
              </div>
              <button className="member-icon-button" type="button" onClick={closeForm} aria-label="Fermer">
                <X aria-hidden="true" />
              </button>
            </div>
            <form className="social-group-form" onSubmit={handleGroupSubmit}>
              <label>
                Nom du groupe
                <input
                  value={groupForm.name}
                  onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex. Photographes Kinshasa"
                  required
                />
              </label>
              <label>
                Catégorie
                <select
                  value={groupForm.category}
                  onChange={(event) => setGroupForm((current) => ({ ...current, category: event.target.value }))}
                >
                  <option>Disciplines</option>
                  <option>Villes</option>
                  <option>Collaborations</option>
                  <option>Questions</option>
                  <option>Opportunités</option>
                </select>
              </label>
              <label className="social-field-wide">
                Description
                <textarea
                  value={groupForm.description}
                  onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Ex. Espace pour partager des projets photo, demander conseil et trouver des partenaires."
                  rows={4}
                  required
                />
              </label>
              <label>
                Ville
                <input
                  value={groupForm.city}
                  onChange={(event) => setGroupForm((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Kinshasa"
                />
              </label>
              <label>
                Pays
                <input
                  value={groupForm.country}
                  onChange={(event) => setGroupForm((current) => ({ ...current, country: event.target.value }))}
                  placeholder="Congo RDC"
                />
              </label>
              <label>
                Mots-clés
                <input
                  value={groupForm.tags}
                  onChange={(event) => setGroupForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="mode, textile, défilé"
                />
              </label>
              <label>
                Visibilité
                <select
                  value={groupForm.visibility}
                  onChange={(event) =>
                    setGroupForm((current) => ({
                      ...current,
                      visibility: event.target.value as CommunityGroupVisibility,
                    }))
                  }
                >
                  <option value="MEMBERS">Membres CCA</option>
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privé</option>
                </select>
              </label>
              <div className="social-field-wide social-form-actions">
                <button className="member-create-button" type="submit" disabled={isSubmittingGroup}>
                  {isSubmittingGroup ? <LoaderCircle aria-hidden="true" className="spin-icon" /> : <Save aria-hidden="true" />}
                  {editingGroupId ? "Enregistrer" : "Créer le groupe"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="member-card social-toolbar">
          <label className="social-search">
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un groupe, une ville, une discipline..."
            />
          </label>
          <div className="social-filter-row" aria-label="Filtres groupes">
            {groupFilters.map((filter) => (
              <button
                key={filter}
                className={filter === activeFilter ? "is-active" : undefined}
                type="button"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {groupError ? <p className="auth-form-error">{groupError}</p> : null}
        {invitationError ? <p className="auth-form-error">{invitationError}</p> : null}
        {notice ? <p className="auth-form-success">{notice}</p> : null}

        {myInvitations.length || isLoadingInvitations ? (
          <section className="member-card social-invitations-card">
            <div className="member-card-title">
              <div>
                <h2>Invitations reçues</h2>
                <p>
                  {isLoadingInvitations
                    ? "Chargement..."
                    : `${myInvitations.length} invitation${myInvitations.length > 1 ? "s" : ""} en attente`}
                </p>
              </div>
              <MailCheck aria-hidden="true" />
            </div>
            <div className="social-invitation-list">
              {myInvitations.map((invitation) => (
                <article key={invitation.id} className="social-invitation-card">
                  <span
                    className={invitation.inviter.avatarUrl ? "social-avatar has-image" : "social-avatar"}
                    style={
                      invitation.inviter.avatarUrl
                        ? { backgroundImage: `url(${invitation.inviter.avatarUrl})` }
                        : undefined
                    }
                  >
                    {invitation.inviter.avatarUrl ? null : initials(invitation.inviter.displayName)}
                  </span>
                  <div>
                    <strong>{invitation.group.name}</strong>
                    <small>
                      Invitation de {invitation.inviter.displayName} · {formatRelativeDate(invitation.createdAt)}
                    </small>
                    {invitation.message ? <p>{invitation.message}</p> : null}
                  </div>
                  <div className="social-invitation-actions">
                    <button
                      className="member-create-button"
                      type="button"
                      onClick={() => handleAcceptInvitation(invitation)}
                      disabled={invitationActionId === `${invitation.id}:accept`}
                    >
                      {invitationActionId === `${invitation.id}:accept` ? (
                        <LoaderCircle aria-hidden="true" className="spin-icon" />
                      ) : (
                        <CheckCircle2 aria-hidden="true" />
                      )}
                      Accepter
                    </button>
                    <button
                      className="member-secondary-button"
                      type="button"
                      onClick={() => handleDeclineInvitation(invitation)}
                      disabled={invitationActionId === `${invitation.id}:decline`}
                    >
                      Refuser
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="social-grid social-groups-grid">
          <section className="social-main" id="groupes-communautaires">
            <section className="member-card">
              <div className="member-card-title">
                <div>
                  <h2>Groupes communautaires</h2>
                  <p>
                    {isLoadingGroups ? "Chargement..." : `${filteredGroups.length} groupe${filteredGroups.length > 1 ? "s" : ""} trouvé${filteredGroups.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <div className="social-group-list">
                {visibleGroups.visibleItems.map((group) => (
                  <button
                    key={group.id}
                    className={group.id === selectedGroup?.id ? "social-group-card is-selected" : "social-group-card"}
                    type="button"
                    onClick={() => setSelectedId(group.id)}
                  >
                    <span className={group.avatarUrl ? "social-group-icon has-image" : "social-group-icon"}>
                      {group.avatarUrl ? (
                        <img src={versionedImageUrl(group.avatarUrl, group.updatedAt)} alt="" />
                      ) : (
                        <Hash aria-hidden="true" strokeWidth={1.8} />
                      )}
                    </span>
                    <div>
                      <span>
                        {group.category} · {group.city ?? group.country ?? "En ligne"}
                      </span>
                      <strong>{group.name}</strong>
                      <p>{group.description}</p>
                      <div className="social-meta-row">
                        <small>{group.members} membres</small>
                        <small>{group.posts} messages</small>
                        <small>{formatRelativeDate(group.lastActivity)}</small>
                      </div>
                    </div>
                    <span className={group.isJoined ? "social-state-pill is-on" : "social-state-pill"}>
                      {group.isJoined ? "Membre" : "Ouvert"}
                    </span>
                  </button>
                ))}
                {visibleGroups.hasMore ? (
                  <div className="member-feed-load-more" ref={visibleGroups.loadMoreRef}>
                    <LoaderCircle aria-hidden="true" className="spin-icon" />
                    <span>Défilez pour afficher plus de groupes</span>
                  </div>
                ) : null}
                {!filteredGroups.length ? (
                  <div className="social-empty-state social-empty-state--card">
                    <UsersRound aria-hidden="true" />
                    <strong>
                      {isLoadingGroups
                        ? "Chargement des groupes..."
                        : hasLoadedGroups
                          ? "Aucun groupe réel pour le moment"
                          : "Préparation des groupes..."}
                    </strong>
                    <p>Créez le premier espace de discussion pour lancer les échanges entre membres.</p>
                    <button className="member-create-button" type="button" onClick={openCreateForm}>
                      <Plus aria-hidden="true" />
                      Créer un groupe
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </section>

          <aside className="social-side">
            {selectedGroup ? (
              <>
                <section className="member-card social-detail-card">
                  <div className="social-detail-heading">
                    <span className={selectedGroup.avatarUrl ? "social-group-icon has-image" : "social-group-icon"}>
                      {selectedGroup.avatarUrl ? (
                        <img src={versionedImageUrl(selectedGroup.avatarUrl, selectedGroup.updatedAt)} alt="" />
                      ) : (
                        <Hash aria-hidden="true" strokeWidth={1.8} />
                      )}
                    </span>
                    <div>
                      <span>{selectedGroup.category}</span>
                      <h2>{selectedGroup.name}</h2>
                      <p>{selectedGroup.description}</p>
                      {selectedGroupCanManage ? (
                        <div className="social-group-photo-tools">
                          <button
                            className="social-group-photo-action"
                            type="button"
                            onClick={() => groupPhotoInputRef.current?.click()}
                            disabled={uploadingGroupPhotoId === selectedGroup.id}
                          >
                            {uploadingGroupPhotoId === selectedGroup.id ? (
                              <LoaderCircle aria-hidden="true" className="spin-icon" />
                            ) : (
                              <Camera aria-hidden="true" />
                            )}
                            {selectedGroup.avatarUrl ? "Changer la photo" : "Ajouter une photo"}
                          </button>
                          <input
                            ref={groupPhotoInputRef}
                            className="social-group-photo-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleGroupPhotoChange}
                            disabled={uploadingGroupPhotoId === selectedGroup.id}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="social-chip-row">
                    {selectedGroup.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="social-group-owner">
                    <span>{selectedGroup.owner.displayName}</span>
                    <small>
                      {selectedGroup.visibility === "PRIVATE"
                        ? "Groupe privé"
                        : selectedGroup.visibility === "PUBLIC"
                          ? "Visible publiquement"
                          : "Réservé aux membres CCA"}
                    </small>
                  </div>
                  <div className="social-management-row">
                    <button
                      className={selectedGroup.isJoined ? "member-secondary-button" : "member-create-button"}
                      type="button"
                      onClick={() => handleJoinToggle(selectedGroup)}
                    >
                      {selectedGroup.isJoined ? <CheckCircle2 aria-hidden="true" /> : <Plus aria-hidden="true" />}
                      {selectedGroup.isJoined ? "Quitter" : "Rejoindre"}
                    </button>
                    {selectedGroup.canManage ? (
                      <>
                        <button className="member-secondary-button" type="button" onClick={() => openEditForm(selectedGroup)}>
                          <Edit3 aria-hidden="true" />
                          Modifier
                        </button>
                        <button className="member-danger-button" type="button" onClick={() => handleArchiveGroup(selectedGroup)}>
                          <Trash2 aria-hidden="true" />
                          Archiver
                        </button>
                      </>
                    ) : null}
                    {!selectedGroup.isFallback ? (
                      <Link className="member-secondary-button" href={`/espace-membre/messages?groupId=${selectedGroup.id}`}>
                        <MessageCircle aria-hidden="true" />
                        Ouvrir la discussion
                      </Link>
                    ) : null}
                  </div>
                  {selectedGroupCanManage ? (
                    <div className="social-member-add-panel">
                      <div className="social-member-add-head">
                        <div>
                          <strong>Ajouter ou inviter un membre</strong>
                          <small>Ajoutez directement si vous gérez le groupe, ou envoyez une invitation à accepter.</small>
                        </div>
                        <UserPlus aria-hidden="true" />
                      </div>
                      <label className="social-member-search">
                        <Search aria-hidden="true" strokeWidth={1.8} />
                        <input
                          value={memberQuery}
                          onChange={(event) => setMemberQuery(event.target.value)}
                          placeholder="Nom, discipline, ville..."
                        />
                      </label>
                      {memberAddError ? <p className="auth-form-error">{memberAddError}</p> : null}
                      <div className="social-member-results">
                        {isLoadingMemberOptions ? (
                          <span className="social-member-muted">Recherche des membres...</span>
                        ) : memberOptions.length ? (
                          memberOptions.map((member) => (
                            <article key={member.userId} className="social-member-option">
                              <span
                                className={member.avatarUrl ? "social-avatar has-image" : "social-avatar"}
                                style={member.avatarUrl ? { backgroundImage: `url(${member.avatarUrl})` } : undefined}
                              >
                                {member.avatarUrl ? null : initials(member.displayName)}
                              </span>
                              <div>
                                <strong>{member.displayName}</strong>
                                <small>
                                  {[member.headline, member.city, member.country].filter(Boolean).join(" · ")}
                                </small>
                              </div>
                              <div className="social-member-inline-actions">
                                <button
                                  className="member-secondary-button"
                                  type="button"
                                  onClick={() => handleAddMember(member)}
                                  disabled={addingMemberId === member.userId}
                                >
                                  {addingMemberId === member.userId ? (
                                    <LoaderCircle aria-hidden="true" className="spin-icon" />
                                  ) : (
                                    <UserPlus aria-hidden="true" />
                                  )}
                                  Ajouter
                                </button>
                                <button
                                  className="member-secondary-button"
                                  type="button"
                                  onClick={() => handleInviteMember(member)}
                                  disabled={Boolean(member.pendingInvitationId) || invitingMemberId === member.userId}
                                >
                                  {invitingMemberId === member.userId ? (
                                    <LoaderCircle aria-hidden="true" className="spin-icon" />
                                  ) : (
                                    <MailPlus aria-hidden="true" />
                                  )}
                                  {member.pendingInvitationId ? "Invité" : "Inviter"}
                                </button>
                              </div>
                            </article>
                          ))
                        ) : (
                          <span className="social-member-muted">
                            {memberQuery.trim() ? "Aucun membre trouvé." : "Tapez pour filtrer les profils."}
                          </span>
                        )}
                      </div>
                      {currentGroupInvitations.length ? (
                        <div className="social-pending-invites">
                          <strong>Invitations en attente</strong>
                          {currentGroupInvitations.map((invitation) => (
                            <article key={invitation.id}>
                              <span>{invitation.invitee.displayName}</span>
                              <small>{formatRelativeDate(invitation.createdAt)}</small>
                              {invitation.permissions.canCancel ? (
                                <button
                                  type="button"
                                  onClick={() => handleCancelInvitation(invitation)}
                                  disabled={invitationActionId === `${invitation.id}:cancel`}
                                >
                                  Annuler
                                </button>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {selectedGroupIsJoined ? (
                    <div className="social-members-panel">
                      <div className="social-member-add-head">
                        <div>
                          <strong>Membres du groupe</strong>
                          <small>
                            {isLoadingGroupMembers
                              ? "Chargement des rôles..."
                              : `${groupMembers.length} membre${groupMembers.length > 1 ? "s" : ""}`}
                          </small>
                        </div>
                        <UsersRound aria-hidden="true" />
                      </div>
                      <div className="social-member-results">
                        {isLoadingGroupMembers ? (
                          <span className="social-member-muted">Chargement des membres...</span>
                        ) : groupMembers.length ? (
                          groupMembers.map((member) => (
                            <article key={member.userId} className="social-member-option social-member-option--managed">
                              <span
                                className={member.avatarUrl ? "social-avatar has-image" : "social-avatar"}
                                style={member.avatarUrl ? { backgroundImage: `url(${member.avatarUrl})` } : undefined}
                              >
                                {member.avatarUrl ? null : initials(member.displayName)}
                              </span>
                              <div>
                                <strong>
                                  {member.displayName}
                                  {member.isCurrentUser ? " · Vous" : ""}
                                </strong>
                                <small>{[member.headline, member.city, member.country].filter(Boolean).join(" · ")}</small>
                              </div>
                              <span className={`social-role-pill ${roleClassName(member.role)}`}>
                                {roleLabel(member.role)}
                              </span>
                              <div className="social-member-actions">
                                {member.permissions.canPromote ? (
                                  <button
                                    className="member-secondary-button"
                                    type="button"
                                    onClick={() => handleUpdateMemberRole(member, "MODERATOR")}
                                    disabled={memberActionId === `${member.userId}:MODERATOR`}
                                  >
                                    {memberActionId === `${member.userId}:MODERATOR` ? (
                                      <LoaderCircle aria-hidden="true" className="spin-icon" />
                                    ) : (
                                      <ShieldCheck aria-hidden="true" />
                                    )}
                                    Nommer admin
                                  </button>
                                ) : null}
                                {member.permissions.canDemote ? (
                                  <button
                                    className="member-secondary-button"
                                    type="button"
                                    onClick={() => handleUpdateMemberRole(member, "MEMBER")}
                                    disabled={memberActionId === `${member.userId}:MEMBER`}
                                  >
                                    {memberActionId === `${member.userId}:MEMBER` ? (
                                      <LoaderCircle aria-hidden="true" className="spin-icon" />
                                    ) : (
                                      <ShieldCheck aria-hidden="true" />
                                    )}
                                    Retirer admin
                                  </button>
                                ) : null}
                                {member.permissions.canRemove ? (
                                  <button
                                    className="member-danger-button"
                                    type="button"
                                    onClick={() => handleRemoveMember(member)}
                                    disabled={memberActionId === `${member.userId}:remove`}
                                  >
                                    {memberActionId === `${member.userId}:remove` ? (
                                      <LoaderCircle aria-hidden="true" className="spin-icon" />
                                    ) : (
                                      <UserMinus aria-hidden="true" />
                                    )}
                                    Retirer
                                  </button>
                                ) : null}
                              </div>
                            </article>
                          ))
                        ) : (
                          <span className="social-member-muted">Aucun membre à afficher pour le moment.</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="member-card social-thread-card">
                  <div className="member-card-title">
                    <div>
                      <h2>Discussion du groupe</h2>
                      <p>{selectedGroup.isJoined ? "Messagerie à plusieurs" : "Rejoignez le groupe pour participer"}</p>
                    </div>
                  </div>
                  {messageError ? <p className="auth-form-error">{messageError}</p> : null}
                  <div className="social-message-thread" aria-busy={isLoadingMessages}>
                    {displayMessages.length ? (
                      displayMessages.map((message) => (
                        <article
                          key={message.id}
                          className={message.permissions.canEdit ? "social-message is-mine" : "social-message"}
                        >
                          <span className="social-avatar">{initials(message.author.displayName)}</span>
                          <div>
                            <div className="social-message-head">
                              <strong>{message.author.displayName}</strong>
                              <small>{formatRelativeDate(message.createdAt)}</small>
                            </div>
                            <p>{message.content}</p>
                            {message.attachmentName ? <a href={message.attachmentUrl ?? "#"}>{message.attachmentName}</a> : null}
                            {message.permissions.canDelete ? (
                              <button type="button" onClick={() => handleDeleteMessage(message.id)}>
                                <Trash2 aria-hidden="true" />
                                Supprimer
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="social-empty-state">
                        <MessageCircle aria-hidden="true" />
                        <strong>Aucun message pour le moment</strong>
                        <p>Lancez la conversation avec une question, une annonce ou un besoin concret.</p>
                      </div>
                    )}
                  </div>
                  <form className="social-message-composer" onSubmit={handleSendMessage}>
                    <textarea
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      placeholder={
                        selectedGroup.isJoined
                          ? "Écrire un message au groupe..."
                          : "Rejoignez ce groupe pour écrire..."
                      }
                      disabled={!selectedGroup.isJoined || selectedGroup.isFallback}
                      rows={3}
                      required
                    />
                    <button
                      className="member-create-button"
                      type="submit"
                      disabled={!messageDraft.trim() || !selectedGroup.isJoined || selectedGroup.isFallback || isSendingMessage}
                    >
                      {isSendingMessage ? <LoaderCircle aria-hidden="true" className="spin-icon" /> : <Send aria-hidden="true" />}
                      Envoyer
                    </button>
                  </form>
                </section>
              </>
            ) : (
              <section className="member-card social-detail-card">
                <div className="social-empty-state">
                  <MessageCircle aria-hidden="true" />
                  <strong>Aucune discussion sélectionnée</strong>
                  <p>Créez ou sélectionnez un groupe pour voir sa fiche, gérer ses informations et ouvrir sa conversation.</p>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </MemberShell>
  );
}

function buildGroupsWithPublications(publications: Publication[]): DisplayGroup[] {
  if (!publications.length) {
    return [];
  }

  return [
    {
      id: "published-discussions",
      ownerId: "publications",
      name: "Discussions publiées",
      slug: "discussions-publiees",
      category: "Questions",
      description: "Sujets créés depuis le bouton Publier et visibles par la communauté CCA.",
      avatarUrl: null,
      members: Math.max(1, new Set(publications.map((publication) => publication.author.id)).size),
      posts: publications.length,
      city: "CCA",
      country: null,
      isJoined: true,
      currentUserRole: "MEMBER",
      canManage: false,
      tags: ["Projet", "Question", "Collaboration", "Ressource"],
      visibility: "MEMBERS",
      status: "ACTIVE",
      lastActivity: publications[0]?.publishedAt ?? publications[0]?.updatedAt ?? new Date().toISOString(),
      owner: { id: "publications", accountType: "ORGANIZATION", displayName: "Communauté CCA", avatarUrl: null },
      createdAt: publications[0]?.createdAt ?? new Date().toISOString(),
      updatedAt: publications[0]?.updatedAt ?? new Date().toISOString(),
      isFallback: true,
      discussions: publications.slice(0, 8).map((publication) => ({
        title: publication.title,
        author: publication.author.displayName,
        replies: publication.counts.comments,
        kind: publicationKind(publication),
      })),
    },
  ];
}

function withFallbackJoinState(groups: DisplayGroup[], joinedIds: string[]) {
  return groups.map((group) => ({
    ...group,
    isJoined: joinedIds.includes(group.id),
    currentUserRole: joinedIds.includes(group.id) ? group.currentUserRole ?? "MEMBER" : null,
  }));
}

function fallbackMessages(group: DisplayGroup): CommunityGroupMessage[] {
  return (group.discussions ?? []).map((discussion, index) => ({
    id: `${group.id}-${index}`,
    groupId: group.id,
    type: "TEXT",
    content: discussion.title,
    attachmentUrl: null,
    attachmentName: null,
    attachmentMimeType: null,
    editedAt: null,
    deletedAt: null,
    createdAt: group.updatedAt,
    author: {
      id: `${group.id}-${discussion.author}`,
      accountType: "CREATOR",
      displayName: discussion.author,
      avatarUrl: null,
    },
    permissions: { canEdit: false, canDelete: false },
  }));
}

function publicationKind(publication: Publication): FallbackDiscussion["kind"] {
  if (publication.type === "PROJECT" || publication.type === "CREATION") {
    return "Projet";
  }

  if (publication.type === "COLLABORATION" || publication.type === "JOB") {
    return "Collaboration";
  }

  if (publication.type === "OPPORTUNITY" || publication.type === "ANNOUNCEMENT") {
    return "Annonce";
  }

  return "Question";
}

function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleLabel(role: CommunityGroup["currentUserRole"]) {
  if (role === "OWNER") {
    return "Propriétaire";
  }

  if (role === "MODERATOR") {
    return "Admin";
  }

  return "Membre";
}

function roleClassName(role: CommunityGroup["currentUserRole"]) {
  if (role === "OWNER") {
    return "is-owner";
  }

  if (role === "MODERATOR") {
    return "is-admin";
  }

  return "";
}

function versionedImageUrl(url: string, version: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function formatRelativeDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Récent";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `Il y a ${diffDays} j`;
  }

  return "Récent";
}

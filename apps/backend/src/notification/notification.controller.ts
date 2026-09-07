import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationQueryDto } from "./dto/notification-query.dto";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";
import { NotificationService } from "./notification.service";

type AuthedRequest = Request & {
  user: AuthUser;
};

@Controller("notifications")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Lister mes notifications" })
  @ApiOkResponse({ description: "Notifications du membre connecté" })
  list(@Req() req: AuthedRequest, @Query() query: NotificationQueryDto) {
    return this.notifications.listForUser(req.user, query);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Compter mes notifications non lues" })
  @ApiOkResponse({ description: "Nombre de notifications non lues" })
  unreadCount(@Req() req: AuthedRequest) {
    return this.notifications.getUnreadSummary(req.user);
  }

  @Get("summary")
  @ApiOperation({ summary: "Résumer mon historique de notifications" })
  @ApiOkResponse({ description: "Résumé par type, état de lecture et dernières alertes" })
  summary(@Req() req: AuthedRequest) {
    return this.notifications.getSmartSummary(req.user);
  }

  @Get("preferences")
  @ApiOperation({ summary: "Lister mes préférences de notifications" })
  @ApiOkResponse({ description: "Préférences de notifications du membre connecté" })
  preferences(@Req() req: AuthedRequest) {
    return this.notifications.listPreferences(req.user);
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Mettre à jour mes préférences de notifications" })
  @ApiBody({ type: UpdateNotificationPreferencesDto })
  @ApiOkResponse({ description: "Préférences de notifications mises à jour" })
  updatePreferences(@Req() req: AuthedRequest, @Body() body: UpdateNotificationPreferencesDto) {
    return this.notifications.updatePreferences(req.user, body);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Marquer toutes mes notifications comme lues" })
  @ApiOkResponse({ description: "Notifications marquées comme lues" })
  markAllAsRead(@Req() req: AuthedRequest) {
    return this.notifications.markAllAsRead(req.user);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Marquer une notification comme lue" })
  @ApiOkResponse({ description: "Notification mise à jour" })
  markAsRead(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.notifications.markAsRead(req.user, id);
  }
}

import { Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationQueryDto } from "./dto/notification-query.dto";
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

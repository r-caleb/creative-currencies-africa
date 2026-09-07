import { Module } from "@nestjs/common";
import { NotificationModule } from "../notification/notification.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { GroupController } from "./group.controller";
import { GroupService } from "./group.service";

@Module({
  imports: [PrismaModule, RealtimeModule, NotificationModule],
  controllers: [GroupController],
  providers: [GroupService],
})
export class GroupModule {}

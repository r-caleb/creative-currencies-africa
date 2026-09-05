import { Module } from "@nestjs/common";
import { NotificationModule } from "../notification/notification.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [PrismaModule, NotificationModule, RealtimeModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

import { Module } from "@nestjs/common";
import { NotificationModule } from "../notification/notification.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { MessageController } from "./message.controller";
import { MessageService } from "./message.service";

@Module({
  imports: [NotificationModule, RealtimeModule],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}

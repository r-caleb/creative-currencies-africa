import { Module } from "@nestjs/common";
import { NotificationModule } from "../notification/notification.module";
import { PublicationController } from "./publication.controller";
import { PublicationService } from "./publication.service";

@Module({
  imports: [NotificationModule],
  controllers: [PublicationController],
  providers: [PublicationService],
})
export class PublicationModule {}

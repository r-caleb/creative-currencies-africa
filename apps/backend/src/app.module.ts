import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { GroupModule } from "./group/group.module";
import { MemberModule } from "./member/member.module";
import { MessageModule } from "./message/message.module";
import { NotificationModule } from "./notification/notification.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublicationModule } from "./publication/publication.module";
import { ReferenceModule } from "./reference/reference.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StorageModule,
    AdminModule,
    AuthModule,
    ReferenceModule,
    RealtimeModule,
    NotificationModule,
    MemberModule,
    PublicationModule,
    GroupModule,
    MessageModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

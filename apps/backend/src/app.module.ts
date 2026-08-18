import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { MemberModule } from "./member/member.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReferenceModule } from "./reference/reference.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ReferenceModule,
    MemberModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

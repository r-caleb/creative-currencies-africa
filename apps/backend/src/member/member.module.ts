import { Module } from "@nestjs/common";
import { NotificationModule } from "../notification/notification.module";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";

@Module({
  imports: [NotificationModule],
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}

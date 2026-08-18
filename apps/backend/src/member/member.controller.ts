import { Controller, Get } from "@nestjs/common";
import { MemberService } from "./member.service";

@Controller("member")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get("dashboard")
  dashboard() {
    return this.memberService.getDashboard();
  }

  @Get("creative-id")
  creativeId() {
    return this.memberService.getCreativeId();
  }

  @Get("trainings")
  trainings() {
    return this.memberService.getTrainings();
  }

  @Get("opportunities")
  opportunities() {
    return this.memberService.getOpportunities();
  }

  @Get("resources")
  resources() {
    return this.memberService.getResources();
  }

  @Get("agenda")
  agenda() {
    return this.memberService.getAgenda();
  }

  @Get("certificates")
  certificates() {
    return this.memberService.getCertificates();
  }
}

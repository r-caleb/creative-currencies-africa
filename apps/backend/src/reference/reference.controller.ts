import { Controller, Get } from "@nestjs/common";
import { ReferenceService } from "./reference.service";

@Controller("reference")
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get("account-types")
  accountTypes() {
    return this.referenceService.getAccountTypes();
  }

  @Get("disciplines")
  disciplines() {
    return this.referenceService.getDisciplines();
  }

  @Get("onboarding-fields")
  onboardingFields() {
    return this.referenceService.getOnboardingFields();
  }
}

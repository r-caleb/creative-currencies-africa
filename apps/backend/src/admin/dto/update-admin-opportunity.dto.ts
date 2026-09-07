import { PartialType } from "@nestjs/swagger";
import { CreateAdminOpportunityDto } from "./create-admin-opportunity.dto";

export class UpdateAdminOpportunityDto extends PartialType(CreateAdminOpportunityDto) {}

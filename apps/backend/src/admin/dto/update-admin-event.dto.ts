import { PartialType } from "@nestjs/swagger";
import { CreateAdminEventDto } from "./create-admin-event.dto";

export class UpdateAdminEventDto extends PartialType(CreateAdminEventDto) {}

import { PartialType } from "@nestjs/swagger";
import { CreateAdminResourceDto } from "./create-admin-resource.dto";

export class UpdateAdminResourceDto extends PartialType(CreateAdminResourceDto) {}

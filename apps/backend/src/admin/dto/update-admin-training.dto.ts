import { PartialType } from "@nestjs/swagger";
import { CreateAdminTrainingDto } from "./create-admin-training.dto";

export class UpdateAdminTrainingDto extends PartialType(CreateAdminTrainingDto) {}

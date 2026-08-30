import { PickType } from "@nestjs/swagger";
import { CreateDirectMessageDto } from "./create-direct-message.dto";

export class UpdateDirectMessageDto extends PickType(CreateDirectMessageDto, ["content"] as const) {}

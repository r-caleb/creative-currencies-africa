import { PickType } from "@nestjs/swagger";
import { CreateGroupMessageDto } from "./create-group-message.dto";

export class UpdateGroupMessageDto extends PickType(CreateGroupMessageDto, ["content"] as const) {}

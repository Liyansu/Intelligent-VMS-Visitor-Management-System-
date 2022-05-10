import { UseGuards } from "@nestjs/common";
import { Query, Resolver } from "@nestjs/graphql";
import { AuthService } from "@vms/auth";
import { GqlAuthGuard } from "@vms/auth/guards/GqlAuthGuard.guard";

import { RolesGuard } from "@vms/user/guards/roles.guard";
import { Roles } from "@vms/user/decorators/roles.decorator";

import { Resident } from "./models/resident.model";
import { ResidentService } from "./resident.service";
import { CurrentUser } from "@vms/auth/decorators/CurrentUserDecorator.decorator";
import { User } from "@vms/user/schema/user.schema";

@Resolver((of) => Resident)
export class ResidentResolver {
    constructor(
        private authService: AuthService,
        private residentService: ResidentService,
    ) {}

    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles("resident")
    @Query((returns) => String, { name: "helloResident" })
    async hello(@CurrentUser() user: User) {
        return "👋 from resident resolver " + user.email;
    }
}

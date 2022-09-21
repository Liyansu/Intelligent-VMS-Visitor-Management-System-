import { forwardRef, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { QueryBus, CommandBus } from "@nestjs/cqrs";
import { SearchUserQuery } from "./queries/impl/searchUser.query";
import { GetUserQuery } from "./queries/impl/getUser.query";
import { GetUnAuthUsersQuery } from "./queries/impl/getUnAuthUsers.query";
import { CreateUserCommand } from "./commands/impl/createUser.command";
import { DeleteUserCommand } from "./commands/impl/deleteUser.command";
import { AuthorizeUserCommand } from "./commands/impl/authorizeUser.command";
import { DeauthorizeUserAccountCommand } from "./commands/impl/deauthorizeUserAccount.command";
import { GetUsersByTypeQuery } from "./queries/impl/getUsersByType.query";
import { GetNumInvitesQuery } from "./queries/impl/getNumInvites.query";
import { GetMaxInvitesPerResidentQuery } from "./queries/impl/getMaxInvitesPerResident.query";
import { UpdateMaxInvitesCommand } from "./commands/impl/updateMaxInvites.command";
import { RewardsService } from "@vms/rewards";
import { Badge } from "@vms/rewards/models/badge.model";
import { VisitorInviteService } from "@vms/visitor-invite";
import { GetCurfewTimeQuery } from "./queries/impl/getCurfewTime.query";
import { UpdateMaxCurfewTimeCommand } from "./commands/impl/updateMaxCurfewTime.command";
import { GetMaxCurfewTimePerResidentQuery } from "./queries/impl/getMaxCurfewTimePerResident.query";
import { UpdateUserCommand } from "./commands/impl/updateUser.command";
import { GetDaysWithVMSQuery } from "./queries/impl/getDaysWithVMS.query";
import { IncreaseSuggestionsCommand } from "./commands/impl/increaseSuggestions.command";
import { GetNumSuggestionsQuery } from "./queries/impl/getNumSuggestions.query";
import { UpdatePrivilegesCommand } from "./commands/impl/updatePrivileges.command";

@Injectable()
export class UserService{
    constructor(private queryBus: QueryBus, 
                private commandBus: CommandBus, 
                private rewardService: RewardsService,
                @Inject(forwardRef(() => {return VisitorInviteService}))
                private visitorInviteService: VisitorInviteService
                ) {}

    async findOne(email: string) {
        return this.queryBus.execute(new GetUserQuery(email));
    }

    async createUser(email: string, password: string, permission: number, idNumber: string, idDocType: string, name: string) {
        let dateString = (new Date).toLocaleDateString();
        return this.commandBus.execute(new CreateUserCommand(email, password, permission, idNumber, idDocType, name, dateString));
    }

    async searchUser(searchQuery: string) {
        return this.queryBus.execute(new SearchUserQuery(searchQuery));
    }

    async getUserByEmail(email: string) {
        return this.queryBus.execute(new GetUserQuery(email));
    }

    async getNumInvites(email: string) {
        return this.queryBus.execute(new GetNumInvitesQuery(email));
    }

    async getMaxInvitesPerResident() {
        return this.queryBus.execute(new GetMaxInvitesPerResidentQuery());
    }

    async updateMaxInvites(difference: number) {
        return this.commandBus.execute(new UpdateMaxInvitesCommand(difference));
    }

    async getCurfewTime(email: string) {
        return this.queryBus.execute(new GetCurfewTimeQuery(email));
    }

    async getNumSuggestions(email: string) {
        return this.queryBus.execute(new GetNumSuggestionsQuery(email));
    }

    async getMaxCurfewTimePerResident() {
        return this.queryBus.execute(new GetMaxCurfewTimePerResidentQuery());
    }

    async updateMaxCurfewTime(difference: number) {
        this.visitorInviteService.setCurfewDetails(difference);
        return this.commandBus.execute(new UpdateMaxCurfewTimeCommand(difference));
    }
    
    async getUnAuthorizedUsers(permission: number) {
        return this.queryBus.execute(new GetUnAuthUsersQuery(permission === 0 ? -1 : -2));
    }

    async increaseSuggestions(email: string){
        this.commandBus.execute(new IncreaseSuggestionsCommand(email));
    }

    async deleteUserAccount(email: string) {
        const res = await this.commandBus.execute(new DeleteUserCommand(email));
        return res.deletedCount > 0;
    }

    async authorizeUserAccount(email: string) {
        const res = await this.commandBus.execute(new AuthorizeUserCommand(email));        
        return res.modifiedCount > 0;
    }

    async deauthorizeUserAccount(email: string) {
        const res = await this.commandBus.execute(new DeauthorizeUserAccountCommand(email));
        return res.modifiedCount > 0;
    }

    async getUsersByType(permission: number) {
        const users = await this.queryBus.execute(new GetUsersByTypeQuery(permission));
        return users;
    }

    async getDaysWithVMS(email: string) {
        return await this.queryBus.execute(new GetDaysWithVMSQuery(email));
    }

    async updateUser(email: string, badges:string, xp:number) {
        this.commandBus.execute(new UpdateUserCommand(email,badges,xp));
    }

    async updatePrivileges(email:string,xpOld:number,xpCurrent:number){
        const allRewards = await this.rewardService.getAllRewards();
        var invites = 0;
        var sleepovers = 0;
        var themes = 0;
        var curfewHours = 0;

        for await ( let reward of allRewards){
            if(reward.xp>=xpCurrent){
                switch(reward.type){
                    case "invite":
                        if(reward.xp>xpOld){
                            invites++;
                        } else {
                            invites--;
                        }
                        break;
                    case "sleepover":
                        if(reward.xp>xpOld){
                            sleepovers++;
                        } else {
                            sleepovers--;
                        }
                        break;
                    case "theme":
                        if(reward.xp>xpOld){
                            themes++;
                        } else {
                            themes--;
                        }
                        break;
                    case "curfew":
                        if(reward.xp>xpOld){
                            curfewHours++;
                        } else {
                            curfewHours--;
                        }
                        break;
                }
            }
        }

        if(sleepovers!=0 && themes!=0 && invites!=0 && curfewHours){
            this.queryBus.execute(new UpdatePrivilegesCommand(email, sleepovers, themes, invites, curfewHours));
        }

    }

    async calculateBadges(email:string){
        const user = await this.getUserByEmail(email);
        const allBadges = await this.rewardService.getAllBadges();
        let badges = user.badges;

        let variable:number;
        let change = false;
        let xp = 0;
        // let i=0;
        for await ( let [i,badge] of allBadges.entries()){
            if(parseInt(badges.charAt(i))<badge.levels){
                switch(badge.type){
                    case "invite":
                        variable = await this.visitorInviteService.getTotalNumberOfInvitesOfResident(email);
                        break;
                    // case "concept":
                    //     //for now it is just given
                    //     break;
                    case "cancellation":
                        variable = await this.visitorInviteService.getTotalNumberOfCancellationsOfResident(email);
                        break;
    //             case "sleepover":
    //                 break;
                    case "time":
                        variable = await this.getDaysWithVMS(email);
                        break;
                    case "visits":
                        variable = await this.visitorInviteService.getTotalNumberOfVisitsOfResident(email);
                        break;
                    case "suggestion":
                        //variable = await this.getNumSuggestions(email);
                        break;
                }
                let level = parseInt(badges.charAt(i))+1;
                while(level<=badge.levels){
                    if(badge.requirements[level-1]<=variable){
                        change = true;
                        badges = badges.slice(0,i)+level.toString()+badges.slice(i+1);
                        xp += badge.xp[level-1];
                    }else{
                        break;
                    }
                level++;
                }   
        }
       // i++;
        }

        if(change){
            this.updateUser(email,badges,xp);
            this.updatePrivileges(email,user.xp,user.xp+xp);
        }
    }
}

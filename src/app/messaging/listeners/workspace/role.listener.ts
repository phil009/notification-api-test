import { Injectable } from '@matchmakerjs/di';
import { MessageListener } from '@matchmakerjs/matchmaker-kafkajs';
import { Activity } from '@matchmakerjs/typeorm-audit';
import { EntityManager } from 'typeorm';
import { RbacRoleApiResponse } from '../../../../sdk/rbac-api-sdk';
import { ROLE_TOPIC } from '../../../constants/topics.constant';
import { Role } from '../../../data/entities/external/workspace/role.entity';
import { RoleService } from '../../services/workspace/role.service';

@Injectable()
export class RoleMessageListener implements MessageListener {
    constructor(private entityManager: EntityManager, private roleService: RoleService) {}

    @Activity('ROLE NOTIFICATION')
    async processMessage(message: Buffer): Promise<void> {
        const dto: RbacRoleApiResponse = JSON.parse(message.toString());

        const entity = await this.entityManager.getRepository(Role).findOne(dto.id.toString());

        if (!entity) {
            await this.roleService.createRole(dto);
        } else if (entity.audit.version <= dto.version) {
            await this.roleService.updateRole(entity, dto);
        }
    }

    getTopic(): string {
        return ROLE_TOPIC;
    }
}

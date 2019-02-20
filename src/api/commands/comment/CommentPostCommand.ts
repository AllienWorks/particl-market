import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands } from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { RpcCommandFactory } from '../../factories/RpcCommandFactory';
import { NotImplementedException } from '../../exceptions/NotImplementedException';
import { MissingParamException } from '../../exceptions/MissingParamException';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { NotFoundException } from '../../exceptions/NotFoundException';

import { Comment } from '../../models/Comment';
import { CommentService } from '../../services/CommentService';
import { CommentActionService } from '../../services/CommentActionService';
import { MarketService } from '../../services/MarketService';
import { ProfileService } from '../../services/ProfileService';
import { CommentCreateRequest } from '../../requests/CommentCreateRequest';
import { CommentMessageType } from '../../enums/CommentMessageType';

export class CommentPostCommand extends BaseCommand implements RpcCommandInterface<Comment> {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.CommentActionService) public commentActionService: CommentActionService,
        @inject(Types.Service) @named(Targets.Service.CommentService) public commentService: CommentService,
        @inject(Types.Service) @named(Targets.Service.ProfileService) public profileService: ProfileService,
        @inject(Types.Service) @named(Targets.Service.MarketService) public marketService: MarketService
    ) {
        super(Commands.COMMENT_POST);
        this.log = new Logger(__filename);
    }

    /**
     * command description
     *
     * @param data, RpcRequest
     * @param rpcCommandFactory, RpcCommandFactory
     * @returns {Promise<any>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest, rpcCommandFactory: RpcCommandFactory): Promise<any> {
        const commentRequest = {
            marketId: data.params[0],
            profileId: data.params[1],
            type: data.params[2],
            target: data.params[3],
            message: data.params[4],
            parentHash: data.params[5]
        } as CommentCreateRequest;

        this.commentActionService.send(commentRequest);
    }

    public async validate(data: RpcRequest): Promise<RpcRequest> {
        if (data.params.length < 1) {
            throw new MissingParamException('marketId');
        }
        if (data.params.length < 2) {
            throw new MissingParamException('profileId');
        }
        if (data.params.length < 3) {
            throw new MissingParamException('type');
        }
        if (data.params.length < 4) {
            throw new MissingParamException('target');
        }
        if (data.params.length < 5) {
            throw new MissingParamException('message');
        }

        const marketId = data.params[0];
        if (typeof marketId !== 'number') {
            throw new InvalidParamException('marketId', 'number');
        }
        const profileId = data.params[1];
        if (typeof profileId !== 'number') {
            throw new InvalidParamException('profileId', 'number');
        }
        const type = data.params[2];
        if (typeof type !== 'string' || !CommentMessageType[type]) {
            throw new InvalidParamException('type', 'CommentMessageType');
        }

        const target = data.params[3];
        if (typeof target !== 'string') {
            throw new InvalidParamException('target', 'string');
        }

        const message = data.params[4];
        if (typeof message !== 'string') {
            throw new InvalidParamException('message', 'string');
        }

        let parentHash;
        if (data.params.length > 5) {
            parentHash = data.params[5];
            if (typeof parentHash !== 'string') {
                throw new InvalidParamException('parentHash', 'string');
            }
        }

        // Throws NotFoundException
        this.profileService.findOne(profileId);

        // Throws NotFoundException
        this.marketService.findOne(marketId);

        // Throws NotFoundException
        if (parentHash) {
            this.commentService.findOneByHash(parentHash);
        }

        return data;
    }

    public help(): string {
        return this.getName() + ' post <marketId> <profileId> <type> <target> <message> [<parentHash>]';
    }

    public description(): string {
        return 'Commands for posting comments.';
    }

    public example(): string {
        return this.getName() + ' post example';
    }
}

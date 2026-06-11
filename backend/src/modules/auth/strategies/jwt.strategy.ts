import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { RequestUser } from '../../../common/types/request-user.type';
import { getJwtSecret } from '../config/jwt.config';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(
        configService.get<string>('JWT_SECRET'),
        configService.get<string>('NODE_ENV'),
      ),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return {
      id: payload.sub,
      role: payload.role,
      branchId: payload.branchId,
    };
  }
}

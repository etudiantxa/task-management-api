import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; // ✅ AJOUT
import { jwtConstants } from './utils/constant';
import { JwtStrategy } from './jwt.strategy'; // ✅ AJOUT
import { EmailModule } from '../email/email.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // ✅ TRÈS IMPORTANT
  ],
  imports: [
    UsersModule,
    PassportModule, // ✅ TRÈS IMPORTANT
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '216000s' }, 
    }),
    EmailModule,
  ],
  exports: [JwtModule, PassportModule], // ✅ recommandé
})
export class AuthModule {}
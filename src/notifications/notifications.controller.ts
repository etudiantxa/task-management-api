import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Notifications')
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ✨ GET toutes les notifications
  @Get()
  async findAll(@Req() req) {
    return this.notificationsService.findAll(req.user.sub);
  }

  // ✨ GET une notification
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    return this.notificationsService.findOne(+id, req.user.sub);
  }

  // ✨ GET nombre de notifications non lues
  @Get('count/unread')
  async countUnread(@Req() req) {
    const count = await this.notificationsService.countUnread(req.user.sub);
    return { unreadCount: count };
  }

  // ✨ GET notifications non lues
  @Get('list/unread')
  async findUnread(@Req() req) {
    return this.notificationsService.findUnread(req.user.sub);
  }

  // ✨ PATCH marquer comme lue
  @Patch(':id/read')
  async markAsRead(@Req() req, @Param('id') id: string) {
    const notificationId = parseInt(id, 10); // Convertir correctement en nombre
    if (isNaN(notificationId)) {
      throw new BadRequestException('Invalid notification ID');
    }
    return this.notificationsService.markAsRead(notificationId, req.user.sub);
  }

  // ✨ PATCH marquer toutes les notifications comme lues
  @Patch('all/read')
  async markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  // ✨ DELETE une notification
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const notificationId = parseInt(id, 10); // Convertir correctement
    if (isNaN(notificationId)) {
      throw new BadRequestException('Invalid notification ID');
    }
    await this.notificationsService.remove(notificationId, req.user.sub);
    return { message: 'Notification deleted successfully' };
  }
}
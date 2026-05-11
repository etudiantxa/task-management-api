import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Task')
@UseGuards(AuthGuard('jwt')) // 🔥 protège tout le controller
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Req() req, @Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(req.user, createTaskDto);
  }

  // ✨ PAGINATION + FILTRAGE + RECHERCHE
  @Get()
  findAll(
    @Req() req,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pageLimit = limit ? parseInt(limit) : 10; // Default 10
    const pageOffset = offset ? parseInt(offset) : 0; // Default 0
    return this.taskService.findAll(req.user, priority, status, pageLimit, pageOffset);
  }

  // ✨ RECHERCHE PAR TITRE (doit être AVANT @Get(':id'))
  @Get('search/:query')
  search(@Req() req, @Param('query') query: string) {
    return this.taskService.search(req.user, query);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.taskService.findOne(+id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(+id, req.user.sub, updateTaskDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.taskService.remove(+id, req.user.sub);
  }
}
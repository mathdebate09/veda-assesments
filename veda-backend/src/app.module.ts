import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ExamsModule } from './modules/exams/exams.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AnswerSheetsModule } from './modules/answer-sheets/answer-sheets.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { GradingModule } from './modules/grading/grading.module';
import { StorageModule } from './modules/storage/storage.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';
import { StudentsModule } from './modules/students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
      }),
    }),
    AuthModule,
    ExamsModule,
    QuestionsModule,
    AnswerSheetsModule,
    ExtractionModule,
    GradingModule,
    StorageModule,
    ClassroomsModule,
    StudentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

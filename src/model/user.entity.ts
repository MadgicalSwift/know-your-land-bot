import { IsString, IsNumber, IsOptional } from 'class-validator';

export class User {
  @IsString()
  mobileNumber: string;

  @IsString()
  language: string;

  @IsString()
  Botid: string;

  @IsString()
  selectedMainTopic: string | null;

  @IsString()
  selectedSubtopic: string | null;

  @IsString()
  selectedDifficulty: string | null;

  @IsString()
  selectedSet: string | null;

  @IsString()
  questionsAnswered: number = 0;

  @IsString()
  score: number = 0;
}

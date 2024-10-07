import { IsString, IsNumber, IsOptional } from 'class-validator';

export class User {
  @IsString()
  mobileNumber: string;

  @IsString()
  language: string;

  @IsString()
  Botid: string;

  @IsString()
  name:string;  

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

  challenges:Challenge[];
}
export class Challenge{
  @IsString()
  topic:string;

  @IsString()
  subTopic:string;

  @IsString()
  level:string;

  question:Question[];
}
export class Question{
  @IsNumber()
  setnumber:number;

  @IsNumber()
  score:number;
  
  @IsString()
  badge:string;
}
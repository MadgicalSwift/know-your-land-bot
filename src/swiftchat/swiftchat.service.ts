import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { LocalizationService } from 'src/localization/localization.service';
import { MessageService } from 'src/message/message.service';
import { localised } from 'src/i18n/en/localised-strings';
import data from '../datasource/data.json';
import axios from 'axios';
import {
  createMainTopicButtons,
  createSubTopicButtons,
  createButtonWithExplanation,
  createDifficultyButtons,
  createTestYourSelfButton,
  questionButton,
  answerFeedback,
  optionButton,
  buttonWithScore
} from 'src/i18n/buttons/button';
dotenv.config();

@Injectable()
export class SwiftchatMessageService extends MessageService {
  private botId = process.env.BOT_ID;
  private apiKey = process.env.API_KEY;
  private apiUrl = process.env.API_URL;
  private baseUrl = `${this.apiUrl}/${this.botId}/messages`;

  private prepareRequestData(from: string, requestBody: string): any {
    return {
      to: from,
      type: 'text',
      text: {
        body: requestBody,
      },
    };
  }

  async sendWelcomeMessage(from: string, language: string) {
    
    const message= localised.welcomeMessage;
    const requestData= this.prepareRequestData(from, message);
    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }
  async endMessage(from: string) {
    
    const message= localised.endMessage;
    const requestData= this.prepareRequestData(from, message);
    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }
  async sendInitialTopics(from:string){
    const messageData = createMainTopicButtons(from);
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return response;
  }
  async sendName(from:string){
    const message= "Can you please tell me your name?";
    const requestData= this.prepareRequestData(from, message);
    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }

  async sendSubTopics(from: string, topicName: string) {
  
    const messageData = createSubTopicButtons(from, topicName);
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return response;
  }

  async difficultyButtons(from: string) {
    const messageData = createDifficultyButtons(from);
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return response;
  }
  async newscorecard(from: string, score: number, totalQuestions: number, badge:string) {
    //const messageData = createDifficultyButtons(from);
    const currentDate = new Date()
    const date =currentDate.getDate()
    const month =currentDate.getMonth()+1
    const year =currentDate.getFullYear()%100


    console.log(currentDate.getDate())
    const payload= {
      to: from,
      type: "scorecard",
      scorecard: {
          theme: "theme4",
          background: "blue",
          performance: "high",
          share_message:  "I got a badge! Take the quiz: https://web.convegenius.ai/bots?botId=0255358219043557",
          text1:  `Quiz-${date}-${month}-${year}`,
          text2: "Good job! Keep pushing!",
          text3: `${score*10}%`,
          text4: `${badge} `,
          score: `${score}/10`,
          animation: "confetti"
      }
  }
  
  const response = await axios.post(this.baseUrl, payload, {
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
    await this.sendScore(from,score,totalQuestions,badge);
    console.log(response)
    return response;
  }

  async sendQuestion(
    from: string,
    selectedMainTopic: string,
    selectedSubtopic: string,
  ) {
    const { messageData, randomSet } = await questionButton(
      from,
      selectedMainTopic,
      selectedSubtopic,
    );
    if (!messageData) {
      return;
    }
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return { response, randomSet };
  }

  async sendExplanation(
    from: string,
    description: string,
    subtopicName: string,
  ) {
    const messageData = createButtonWithExplanation(
      from,
      description,
      subtopicName,
    );
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return response;
  }

  async sendCompleteExplanation(
    from: string,
    description: string[],
    subtopicName: string,
  ) {
    let completeDescription = '';
    description.slice(1).forEach((desc, index) => {
      // Add each element to the string, ensuring no commas are added
      completeDescription += desc;
    });
    const messageData = createTestYourSelfButton(
      from,
      completeDescription,
      subtopicName,
    );
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return response;
  }

  async checkAnswer(
    from: string,
    answer: string,
    selectedMainTopic: string,
    selectedSubtopic: string,
    randomSet: string,
    currentQuestionIndex: number,
  ) {
    const { feedbackMessage, result } = answerFeedback(
      from,
      answer,
      selectedMainTopic,
      selectedSubtopic,
      randomSet,
      currentQuestionIndex,
    );

    const requestData = this.prepareRequestData(from, feedbackMessage);
    try {
      const response = await this.sendMessage(
        this.baseUrl,
        requestData,
        this.apiKey,
      );
      return { response, result };
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async getQuestionBySet(
    from: string,
    answer: string,
    selectedMainTopic: string,
    selectedSubtopic: string,
    randomSet: string,
    currentQuestionIndex: number,
  ) {
    const messageData = optionButton(
      from,
      selectedMainTopic,
      selectedSubtopic,
      randomSet,
      currentQuestionIndex,
    );
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return { response, randomSet };
  }

  async sendScore(from: string, score: number, totalQuestions: number, badge:string) {
  

    const messageData = buttonWithScore(from, score, totalQuestions, badge);
    const response = await this.sendMessage(
      this.baseUrl,
      messageData,
      this.apiKey,
    );
    return response;
  }

  async sendLanguageChangedMessage(from: string, language: string) {
    const localisedStrings = LocalizationService.getLocalisedString(language);
    const requestData = this.prepareRequestData(
      from,
      localisedStrings.select_language,
    );

    const response = await this.sendMessage(
      this.baseUrl,
      requestData,
      this.apiKey,
    );
    return response;
  }
}
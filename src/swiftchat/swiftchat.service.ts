import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { LocalizationService } from 'src/localization/localization.service';
import { MessageService } from 'src/message/message.service';
import { localised } from 'src/i18n/en/localised-strings';
import data from '../datasource/data.json';
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

  async sendQuestion(
    from: string,
    selectedMainTopic: string,
    selectedSubtopic: string,
    selectedDifficulty: string,
  ) {
    const { messageData, randomSet } = await questionButton(
      from,
      selectedMainTopic,
      selectedSubtopic,
      selectedDifficulty,
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
    description.forEach((desc, index) => {
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
  // async handleViewChallenges(from: string, userData: any): Promise<void>{
  //   try {
      
  //     const topStudents = await this.userService.getTopStudents(
  //       userData.Botid,
  //       userData.currentTopic,
  //       userData.setNumber,
  //     );
  //     if (topStudents.length === 0) {
  
  //       await this.swiftchatMessageService.sendMessage({
  //         to: from,
  //         type: 'text',
  //         text: { body: 'No challenges have been completed yet.' },
  //       });
  //       return;
  //     }
  //     // Format the response message with the top 3 students
  //     let message = 'Top 3 Users:\n\n';
  //     topStudents.forEach((student, index) => {
  //       const totalScore = student.score || 0;
  //       const studentName = student.name || 'Unknown';
      
  //       let badge = '';
  //       if (totalScore === 10) {
  //         badge = 'Gold 🥇';
  //       } else if (totalScore >= 7) {
  //         badge = 'Silver 🥈';
  //       } else if (totalScore >= 5) {
  //         badge = 'Bronze 🥉';
  //       } else {
  //         badge = 'No';
  //       }

  //       message += `${index + 1}. ${studentName}\n`;
  //       message += `    Score: ${totalScore}\n`;
  //       message += `    Badge: ${badge}\n\n`;
  //     });

  //     // Send the message with the top students' names, scores, and badges
  //     await this.sendMessage(this.baseUrl,{
  //       to: from,
  //       type: 'text',
  //       text: { body: message },
  //     }, this.apiKey);
  //   } catch (error) {
  //     console.error('Error handling View Challenges:', error);
  //     await this.sendMessage(this.baseUrl,{
  //       to: from,
  //       type: 'text',
  //       text: {
  //         body: 'An error occurred while fetching challenges. Please try again later.',
  //       },
  //     }, this.apiKey);
  //   }
  // }
  async checkAnswer(
    from: string,
    answer: string,
    selectedMainTopic: string,
    selectedSubtopic: string,
    selectedDifficulty: string,
    randomSet: string,
    currentQuestionIndex: number,
  ) {
    const { feedbackMessage, result } = answerFeedback(
      from,
      answer,
      selectedMainTopic,
      selectedSubtopic,
      selectedDifficulty,
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
    selectedDifficulty: string,
    randomSet: string,
    currentQuestionIndex: number,
  ) {
    const messageData = optionButton(
      from,
      selectedMainTopic,
      selectedSubtopic,
      selectedDifficulty,
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

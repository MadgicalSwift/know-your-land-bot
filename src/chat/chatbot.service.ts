import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/model/user.service';
import { localised } from 'src/i18n/en/localised-strings';
import data from '../datasource/data.json';
import { plainToClass } from 'class-transformer';
import { User } from 'src/model/user.entity';
import { MixpanelService } from 'src/mixpanel/mixpanel.service';

@Injectable()
export class ChatbotService {
  private readonly intentClassifier: IntentClassifier;
  private readonly message: MessageService;
  private readonly userService: UserService;
  private readonly topics: any[] = data.topics;
  private readonly mixpanel: MixpanelService;

  constructor(
    intentClassifier: IntentClassifier,
    message: MessageService,
    userService: UserService,
    mixpanel: MixpanelService,
  ) {
    this.intentClassifier = intentClassifier;
    this.message = message;
    this.userService = userService;
    this.mixpanel = mixpanel;
  }

  public async processMessage(body: any): Promise<any> {
    // Destructure 'from', 'text', and 'button_response' from the body
    const { from, text, button_response } = body;

    // Retrieve botID from environment variables
    const botID = process.env.BOT_ID;
    let userData = await this.userService.findUserByMobileNumber(from, botID);

    // If no user data is found, create a new user
    if (!userData) {
      console.log('User not found, creating a new user.');
      userData = await this.userService.createUser(from, 'english', botID);
    }

    // if (userData === undefined) {
    //   console.log('Userdata is undefined');
    //   return 'ok';
    // } else {
    //   console.log('User data====', userData);
    //  await this.userService.deleteUser(from, botID);
    //  return 'ok';
    // }

    // Convert plain user data to a User class instance
    const user = plainToClass(User, userData);

    // Handle button response from the user
    if (button_response) {
      const buttonBody = button_response.body;

      // Mixpanel tracking data
      const trackingData = {
        distinct_id: from,
        button: buttonBody,
        botID: botID,
      };

      this.mixpanel.track('Button_Click', trackingData);

      // Handle 'Main Menu' button - reset user quiz data and send welcome message
      if (buttonBody === 'Main Menu') {
        user.selectedDifficulty = null;
        user.selectedSet = null;
        user.questionsAnswered = 0;
        user.score = 0;
        await this.userService.saveUser(user);
        await this.message.sendWelcomeMessage(from, user.language);
        return 'ok';
      }
      // Handle 'Retake Quiz' button - reset quiz progress and send the first question
      if (buttonBody === 'Retake Quiz') {
        user.questionsAnswered = 0;
        user.score = 0;
        await this.userService.saveUser(user);
        const selectedMainTopic = user.selectedMainTopic;
        const selectedSubtopic = user.selectedSubtopic;
        const selectedDifficulty = user.selectedDifficulty;
        const randomSet = user.selectedSet;
        await this.message.getQuestionBySet(
          from,
          buttonBody,
          selectedMainTopic,
          selectedSubtopic,
          selectedDifficulty,
          randomSet,
          user.questionsAnswered,
        );
        return 'ok';
      }
      // Handle 'More Explanation' button - send complete explanation for the subtopic
      if (buttonBody === 'More Explanation') {
        const topic = user.selectedSubtopic;
        // Find the selected subtopic in the list of topics
        const subtopic = this.topics
          .flatMap((topic) => topic.subtopics)
          .find((subtopic) => subtopic.subtopicName === topic);
        if (subtopic) {
          const description = subtopic.description;

          await this.message.sendCompleteExplanation(from, description, topic);
        } else {
          console.error('Subtopic not found');
        }
        return 'ok';
      }
      // Handle 'Test Yourself' button - show difficulty options to the user

      if (buttonBody === 'Test Yourself') {
        await this.message.difficultyButtons(from);
        return 'ok';
      }
      // Handle difficulty selection buttons (Easy, Medium, Hard) - save the selected difficulty and send the first question
      if (['Easy', 'Medium', 'Hard'].includes(buttonBody)) {
        user.selectedDifficulty = buttonBody;

        await this.userService.saveUser(user);

        const selectedMainTopic = user.selectedMainTopic;
        const selectedSubtopic = user.selectedSubtopic;
        const selectedDifficulty = user.selectedDifficulty;
        const { randomSet } = await this.message.sendQuestion(
          from,
          selectedMainTopic,
          selectedSubtopic,
          selectedDifficulty,
        );

        user.selectedSet = randomSet;

        await this.userService.saveUser(user);

        return 'ok';
      }
      // Handle quiz answer submission - check if the user is answering a quiz question
      if (user.selectedDifficulty && user.selectedSet) {
        const selectedMainTopic = user.selectedMainTopic;
        const selectedSubtopic = user.selectedSubtopic;
        const selectedDifficulty = user.selectedDifficulty;
        const randomSet = user.selectedSet;
        const currentQuestionIndex = user.questionsAnswered;
        const { result } = await this.message.checkAnswer(
          from,
          buttonBody,
          selectedMainTopic,
          selectedSubtopic,
          selectedDifficulty,
          randomSet,
          currentQuestionIndex,
        );

        // Update user score and questions answered
        user.score += result;
        user.questionsAnswered += 1;
        await this.userService.saveUser(user);

        // If the user has answered 10 questions, send their final score
        if (user.questionsAnswered >= 10) {
          await this.message.sendScore(
            from,
            user.score,
            user.questionsAnswered,
          );

          return 'ok';
        }
        // Send the next quiz question
        await this.message.getQuestionBySet(
          from,
          buttonBody,
          selectedMainTopic,
          selectedSubtopic,
          selectedDifficulty,
          randomSet,
          user.questionsAnswered,
        );

        return 'ok';
      }

      // Handle topic selection - find the main topic and save it to the user data
      const topic = this.topics.find((topic) => topic.topicName === buttonBody);

      if (topic) {
        const mainTopic = topic.topicName;

        user.selectedMainTopic = mainTopic;

        await this.userService.saveUser(user);

        await this.message.sendSubTopics(from, mainTopic);
      } else {
        // Handle subtopic selection - find the subtopic and send an explanation
        const subtopic = this.topics
          .flatMap((topic) => topic.subtopics)
          .find((subtopic) => subtopic.subtopicName === buttonBody);
        if (subtopic) {
          const subtopicName = subtopic.subtopicName;
          const description = subtopic.description[0];
          if (!description) {
            console.error('Description not found');
          }

          user.selectedSubtopic = subtopicName;

          await this.userService.saveUser(user);

          await this.message.sendExplanation(from, description, subtopicName);
        } else {
          console.error('Not found');
        }
      }

      return 'ok';
    }

    // Handle text message input - reset user data and send a welcome message
    if (localised.validText.includes(text.body)) {
     /*  user.mobileNumber = from;
      user.language = 'english';
      user.Botid = botID;
      user.selectedMainTopic = null;
      user.selectedSubtopic = null;
      user.selectedDifficulty = null;
      user.selectedSet = null;
      user.questionsAnswered = 0;
      user.score = 0; */
      //await this.userService.saveUser(user);

      await this.message.sendWelcomeMessage(from, user.language);
      return 'ok';
    }

    return 'ok';
  }
}
export default ChatbotService;

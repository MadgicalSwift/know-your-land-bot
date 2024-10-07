import { Injectable } from '@nestjs/common';
import IntentClassifier from '../intent/intent.classifier';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/model/user.service';
import { localised } from 'src/i18n/en/localised-strings';
import data from '../datasource/data.json';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import { plainToClass } from 'class-transformer';
import { User } from 'src/model/user.entity';
import { MixpanelService } from 'src/mixpanel/mixpanel.service';



@Injectable()
export class ChatbotService {
  private apiKey = process.env.API_KEY;
  private apiUrl = process.env.API_URL;
  private botId = process.env.BOT_ID;
  private baseUrl = `${this.apiUrl}/${this.botId}/messages`;

  private readonly intentClassifier: IntentClassifier;
  private readonly message: MessageService;
  private readonly userService: UserService;
  private readonly swiftchatMessageService: SwiftchatMessageService;
  private readonly topics: any[] = data.topics;
  private readonly mixpanel: MixpanelService;

  constructor(
    intentClassifier: IntentClassifier,
    message: MessageService,
    userService: UserService,
    swiftchatMessageService: SwiftchatMessageService,
    mixpanel: MixpanelService,
  ) {
    this.intentClassifier = intentClassifier;
    this.message = message;
    this.swiftchatMessageService = swiftchatMessageService;
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
      await this.userService.createUser(from, 'english', botID);
      userData = await this.userService.findUserByMobileNumber(from, botID);
    }
  
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
      if (buttonBody === localised.mainMenu) {
        user.selectedDifficulty = null;
        user.selectedSet = null;
        user.questionsAnswered = 0;
        user.score = 0;
        await this.userService.saveUser(user);
        await this.message.sendWelcomeMessage(from, user.language);
        await this.message.sendInitialTopics(from);
        return 'ok';
      }
      // Handle 'Retake Quiz' button - reset quiz progress and send the first question
      if (buttonBody === localised.retakeQuiz) {
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
      if(buttonBody=== localised.viewChallenge){
        await this.handleViewChallenges(from, userData);
        await this.message.endMessage(from);
        return 'ok';
      }
      // Handle 'More Explanation' button - send complete explanation for the subtopic
      if (buttonBody === localised.Moreexplanation) {
        const topic = user.selectedSubtopic;
        // Find the selected subtopic in the list of topics
        const subtopic = this.topics
          .flatMap((topic) => topic.subtopics)
          .find((subtopic) => subtopic.subtopicName === topic);
        if (subtopic) {
          const description = subtopic.description;

          await this.message.sendCompleteExplanation(from, description, topic);
        } else {
          
          
        }
        return 'ok';
      }
      // Handle 'Test Yourself' button - show difficulty options to the user

      if (buttonBody === localised.testYourself) {
        await this.message.difficultyButtons(from);
        return 'ok';
      }
      // Handle difficulty selection buttons (Easy, Medium, Hard) - save the selected difficulty and send the first question
      if (['Easy', 'Medium', 'Hard'].includes(buttonBody)) {
        user.selectedDifficulty = buttonBody;
        user.questionsAnswered=0;
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

          let badge = '';
          if (user.score=== 10) {
            badge = 'Gold 🥇';
          } else if (user.score>= 7) {
            badge = 'Silver 🥈';
          } else if (user.score >= 5) {
            badge = 'Bronze 🥉';
          } else {
            badge = 'No';
          }

          // Store the data to be stored in database
          const challengeData = {
            topic: selectedMainTopic,
            subTopic:selectedSubtopic,
            level:selectedDifficulty,
            question: [
              {
                setNumber: randomSet,
                score: user.score,
                badge: badge,
              },
            ],
          };
          // Save the challenge data into the database
          await this.userService.saveUserChallenge(
            from,
            userData.Botid,
            challengeData,
          );
          console.log("Challenge Data:",challengeData)
          // console.log("user:", user )
          
          await this.message.sendScore(
            from,
            user.score,
            user.questionsAnswered,
            badge
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
            
          }

          user.selectedSubtopic = subtopicName;

          await this.userService.saveUser(user);

          await this.message.sendExplanation(from, description, subtopicName);
        } else {
          
        }
      }

      return 'ok';
    }

    // Handle text message input - reset user data and send a welcome message
    else{

      if (localised.validText.includes(text.body)) {
        const userData = await this.userService.findUserByMobileNumber(
          from,
          botID,
        );
        if (!userData) {
          await this.userService.createUser(from, 'English', botID);
        }
        user.selectedDifficulty=null;
        user.selectedSet= null;   
        user.selectedMainTopic=null;
        user.selectedSubtopic=null;
        user.score=0; 
        user.questionsAnswered=0;
        await this.userService.saveUser(user);   
        console.log("user data -",userData)
        if(userData.name==null){
          await this.message.sendWelcomeMessage(from, user.language);
          await this.message.sendName(from);
        }
        else{
          await this.message.sendWelcomeMessage(from, user.language);
          await this.message.sendInitialTopics(from);
        }
      }
      else{

        await this.userService.saveUserName(from, botID, text.body);
        await this.message.sendInitialTopics(from);
      }
       
    }

    return 'ok';
  }
  async handleViewChallenges(from: string, userData: any): Promise<void>{
    try { 
      console.log(userData)
      const topStudents = await this.userService.getTopStudents(
        userData.Botid,
        userData.selectedMainTopic,
        userData.selectedSet,
        userData.selectedSubtopic, 
        userData.selectedDifficulty
      );
      if (topStudents.length === 0) {
  
        await this.swiftchatMessageService.sendMessage(this.baseUrl,{
          to: from,
          type: 'text',
          text: { body: 'No challenges have been completed yet.' },
        }, this.apiKey);
        return;
      }
      // Format the response message with the top 3 students
      let message = 'Top 3 Users:\n\n';
      topStudents.forEach((student, index) => {
        const totalScore = student.score || 0;
        const studentName = student.name || 'Unknown';
      
        let badge = '';
        if (totalScore === 10) {
          badge = 'Gold 🥇';
        } else if (totalScore >= 7) {
          badge = 'Silver 🥈';
        } else if (totalScore >= 5) {
          badge = 'Bronze 🥉';
        } else {
          badge = 'No';
        }

        message += `${index + 1}. ${studentName}\n`;
        message += `    Score: ${totalScore}\n`;
        message += `    Badge: ${badge}\n\n`;
      });

      // Send the message with the top students' names, scores, and badges
      await this.swiftchatMessageService.sendMessage(this.baseUrl,{
        to: from,
        type: 'text',
        text: { body: message },
      }, this.apiKey);
    } catch (error) {
      console.error('Error handling View Challenges:', error);
      await this.swiftchatMessageService.sendMessage(this.baseUrl,{
        to: from,
        type: 'text',
        text: {
          body: 'An error occurred while fetching challenges. Please try again later.',
        },
      }, this.apiKey);
    }
  }

}
export default ChatbotService;



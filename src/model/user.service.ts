import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { dynamoDBClient } from 'src/config/database-config.service';
import { v4 as uuidv4 } from 'uuid';
const { USERS_TABLE } = process.env;

@Injectable()
export class UserService {
  async createUser(
    mobileNumber: string,
    language: string,
    botID: string,
  ): Promise<User | any> {
    try {
      let user = await this.findUserByMobileNumber(mobileNumber, botID);

      if (user) {
        const updateUser = {
          TableName: USERS_TABLE,
          Item: user,
        };
        await dynamoDBClient().put(updateUser).promise();
        return user;
      } else {
        const newUser = {
          TableName: USERS_TABLE,
          Item: {
            id: uuidv4(),
            mobileNumber: mobileNumber,
            language: language,
            Botid: botID,
            name:null,
          },
        };
        await dynamoDBClient().put(newUser).promise();
        return newUser;
      }
    } catch (error) {
      console.error('Error in createUser:', error);
    }
  }

  async findUserByMobileNumber(mobileNumber, Botid) {
    try {
     
      const params = {
        TableName: USERS_TABLE,
        KeyConditionExpression:
          'mobileNumber = :mobileNumber and Botid = :Botid',
        ExpressionAttributeValues: {
          ':mobileNumber': mobileNumber,
          ':Botid': Botid,
        },
      };
      const result = await dynamoDBClient().query(params).promise();
      return result.Items?.[0] || null; // Return the first item or null if none found
    } catch (error) {
      console.error('Error querying user from DynamoDB:', error);
      return null;
    }
  }
  async saveUserName(
    mobileNumber: string,
    botID: string,
    name: string
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(mobileNumber, botID);
      if (existingUser) {
        existingUser.name = name;
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      }
    } catch (error) {
      console.error('Error saving user name:', error);
      throw error;
    }
  }

  async getTopStudents(Botid: string, topic: string, setNumber: number, subTopic:string, level:string): Promise<User[] | any> {
    try {
        const params = {
            TableName: USERS_TABLE,
            KeyConditionExpression: 'Botid = :Botid',
            ExpressionAttributeValues: {
                ':Botid': Botid,
            },
        };
        console.log(Botid, topic, subTopic, level, setNumber);
        const result = await dynamoDBClient().query(params).promise();
        // console.log(result)
        const users = result.Items || [];
        // console.log("users-", users);
        const filteredUsers = users.filter(user => user.Botid === Botid);
        // console.log("filtered-", filteredUsers);
        if (filteredUsers.length === 0) {
            return [];  
        }
  
        filteredUsers.forEach(user => {
            user['totalScore'] = 0;  
  
            if (user.challenges && Array.isArray(user.challenges)) {
                console.log("User's challenges:", JSON.stringify(user.challenges, null, 2));  
                user.challenges.forEach(challenge => {
                    if (challenge.topic === topic && challenge.subTopic=== subTopic && challenge.level=== level) {
                        if (challenge.question && Array.isArray(challenge.question)) {
                            challenge.question.forEach(question => {
                                if (Number(question.setNumber) === Number(setNumber) && question.score != null) {
                                    user['totalScore'] += question.score;  
                                } else {
                                    console.log(`No match for setNumber or score is missing: setNumber ${question.setNumber}, score ${question.score}`);
                                }
                            });
                        } else {
                            console.log(`No questions found or questions is not an array for user ${user.mobileNumber}`);
                        }
                    } else {
                        console.log(`Topic does not match for user ${user.mobileNumber}: ${challenge.topic} != ${topic}, ${challenge.subtopic} != ${subTopic}, ${challenge.level}!= ${level}`);
                    }
                });
            } else {
                console.log(`User ${user.mobileNumber} has no challenges or challenges is not an array.`);
            }
        });
  
        const topUsers = filteredUsers
            .filter(user => user['totalScore'] > 0)  
            .sort((a, b) => b['totalScore'] - a['totalScore']) 
            .slice(0, 3);  
        return topUsers;
    } catch (error) {
        console.error('Error retrieving top students:', error);
        throw error;
    }
  }

  async saveUserChallenge(mobileNumber: string, botID: string, challengeData: any): Promise<any> {
    const params = {
      TableName: USERS_TABLE,
      Key: {
        mobileNumber: mobileNumber,
        Botid: botID
      },
      UpdateExpression: 'SET challenges = list_append(if_not_exists(challenges, :emptyList), :challengeData)',
      ExpressionAttributeValues: {
        ':challengeData': [challengeData], 
        ':emptyList': []
      }
    };

    try {
      await dynamoDBClient().update(params).promise();
      console.log(`User challenge data updated for ${mobileNumber}`);
    } catch (error) {
      console.error('Error saving challenge data:', error);
      throw error;
    }
  }
  async saveUser(user: User): Promise<User | any> {
    const updateUser = {
      TableName: USERS_TABLE,
      Item: {
        mobileNumber: user.mobileNumber,
        language: user.language,
        Botid: user.Botid,
        name: user.name,
        selectedMainTopic: user.selectedMainTopic,
        selectedSubtopic: user.selectedSubtopic,
        selectedDifficulty: user.selectedDifficulty,
        selectedSet: user.selectedSet,
        questionsAnswered: user.questionsAnswered,
        score: user.score,
      },
    };
    return await dynamoDBClient().put(updateUser).promise();
  }
  async deleteUser(mobileNumber: string, Botid: string): Promise<void> {
    try {
      const params = {
        TableName: USERS_TABLE,
        Key: {
          mobileNumber: mobileNumber,
          Botid: Botid,
        },
      };
      await dynamoDBClient().delete(params).promise();
      console.log(
        `User with mobileNumber ${mobileNumber} and Botid ${Botid} deleted successfully.`,
      );
    } catch (error) {
      console.error('Error deleting user from DynamoDB:', error);
    }
  }
}

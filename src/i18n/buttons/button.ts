import data from '../../datasource/data.json';
import { localised } from '../historyquiz/localised-strings';
import _ from 'lodash';

export function createMainTopicButtons(from: string) {
  // Extract topic names from the data
  const topics = data.topics.map((topic) => topic.topicName);

  // Create buttons for each topic
  const buttons = topics.map((topicName) => ({
    type: 'solid',
    body: topicName,
    reply: topicName,
  }));

  return {
    to: from,
    type: 'button',
    button: {
      body: {
        type: 'text',
        text: {
          body: localised.welcomeMessage,
        },
      },
      buttons: buttons,
      allow_custom_response: false,
    },
  };
}

export function createSubTopicButtons(from: string, topicName: string) {
  // Find the topic in the data
  const topic = data.topics.find((topic) => topic.topicName === topicName);

  // If the topic exists, create buttons for each subtopic
  if (topic && topic.subtopics) {
    const buttons = topic.subtopics.map((subtopic) => ({
      type: 'solid',
      body: subtopic.subtopicName,
      reply: subtopic.subtopicName,
    }));

    return {
      to: from,
      type: 'button',
      button: {
        body: {
          type: 'text',
          text: {
            body: localised.selectSubtopic(topicName),
          },
        },
        buttons: buttons,
        allow_custom_response: false,
      },
    };
  } else {
    console.log(`No subtopics found for ${topicName}`);
    return null;
  }
}

export function createButtonWithExplanation(
  from: string,
  description: string,
  subtopicName: string,
) {
  const buttons = [
    {
      type: 'solid',
      body: 'More Explanation',
      reply: 'More Explanation',
    },
    {
      type: 'solid',
      body: 'Test Yourself',
      reply: 'Test Yourself',
    },
  ];
  return {
    to: from,
    type: 'button',
    button: {
      body: {
        type: 'text',
        text: {
          body: localised.explanation(subtopicName, description),
        },
      },
      buttons: buttons,
      allow_custom_response: false,
    },
  };
}
export function createTestYourSelfButton(
  from: string,
  description: string,
  subtopicName: string,
) {
  const buttons = [
    {
      type: 'solid',
      body: 'Test Yourself',
      reply: 'Test Yourself',
    },
  ];
  return {
    to: from,
    type: 'button',
    button: {
      body: {
        type: 'text',
        text: {
          body: localised.moreExplanation(subtopicName, description),
        },
      },
      buttons: buttons,
      allow_custom_response: false,
    },
  };
}
export function createDifficultyButtons(from: string) {
  const buttons = [
    {
      type: 'solid',
      body: 'Easy',
      reply: 'Easy',
    },
    {
      type: 'solid',
      body: 'Medium',
      reply: 'Medium',
    },
    {
      type: 'solid',
      body: 'Hard',
      reply: 'Hard',
    },
  ];
  return {
    to: from,
    type: 'button',
    button: {
      body: {
        type: 'text',
        text: {
          body: localised.difficulty,
        },
      },
      buttons: buttons,
      allow_custom_response: false,
    },
  };
}

export function questionButton(
  from: string,
  selectedMainTopic: string,
  selectedSubtopic: string,
  selectedDifficulty: string,
) {
  const topic = data.topics.find(
    (topic) => topic.topicName === selectedMainTopic,
  );
  if (!topic) {
    console.error('Topic not found');
  }

  const subtopic = topic.subtopics.find(
    (subtopic) => subtopic.subtopicName === selectedSubtopic,
  );
  if (!subtopic) {
    console.error('Subtopic not found');
  }

  // const questionSet = subtopic.questionSets.find(
  //   (set) => set.level === selectedDifficulty,
  // );
  // if (!questionSet) {
  //   console.error('Question set not found');
  // }

  // const question = questionSet.questions[0];
  // const randomSet = questionSet.setNumber;
  // Filter question sets based on the selected difficulty
  const questionSets = subtopic.questionSets.filter(
    (set) => set.level === selectedDifficulty,
  );

  if (questionSets.length === 0) {
    console.error('No question sets found for the selected difficulty');
    return;
  }

  // Randomly select a question set based on difficulty level
  const questionSet = _.sample(questionSets);
  if (!questionSet) {
    console.error('Question set not found');
    return;
  }

  const randomSet = questionSet.setNumber;
  const question = questionSet.questions[0];

  const shuffledOptions = _.shuffle(question.options);
  const buttons = shuffledOptions.map((option: string) => ({
    type: 'solid',
    body: option,
    reply: option,
  }));

  const messageData = {
    to: from,
    type: 'button',
    button: {
      body: {
        type: 'text',
        text: {
          body: question.question,
        },
      },
      buttons: buttons,
      allow_custom_response: false,
    },
  };

  return { messageData, randomSet };
}

export function answerFeedback(
  from: string,
  answer: string,
  selectedMainTopic: string,
  selectedSubtopic: string,
  selectedDifficulty: string,
  randomSet: string,
  currentQuestionIndex: number,
) {
  const topic = data.topics.find((t) => t.topicName === selectedMainTopic);
  if (!topic) {
    console.error('Topic not found');
  }

  const subtopic = topic.subtopics.find(
    (st) => st.subtopicName === selectedSubtopic,
  );
  if (!subtopic) {
    console.error('Subtopic not found');
  }

  // Find the question set by its level and set number
  const questionSet = subtopic.questionSets.find(
    (qs) =>
      qs.level === selectedDifficulty && qs.setNumber === parseInt(randomSet),
  );

  if (!questionSet) {
    console.log('Question set not found');
  }

  const question = questionSet.questions[currentQuestionIndex];
  if (!question) {
    console.error('Question not found');
  }

  const explanation = question.explanation;
  if (!explanation) {
    console.error('Explanation not found');
  }

  if (!question.answer) {
    console.error('answer not found');
  }
  const correctAnswer = question.answer;
  const isCorrect = answer === correctAnswer;
  // const feedbackMessage =
  //   answer === correctAnswer
  //     ? `Right answer. \n${explanation}`
  //     : `Wrong answer.\n Right answer: **${correctAnswer}** \n${explanation}`;
  const feedbackMessage =
    answer === correctAnswer
      ? localised.rightAnswer(explanation)
      : localised.wrongAnswer(answer, explanation);
  const result = isCorrect ? 1 : 0;
  return { feedbackMessage, result };
}

export function buttonWithScore(
  from: string,
  score: number,
  totalQuestions: number,
) {
  return {
    to: from,
    type: 'button',
    button: {
      body: {
        type: 'text',
        text: {
          body: localised.score(score, totalQuestions),
        },
      },
      buttons: [
        {
          type: 'solid',
          body: 'Main Menu',
          reply: 'Main Menu',
        },
        {
          type: 'solid',
          body: 'Retake Quiz',
          reply: 'Retake Quiz',
        },
      ],
      allow_custom_response: false,
    },
  };
}
export function optionButton(
  from: string,
  selectedMainTopic: string,
  selectedSubtopic: string,
  selectedDifficulty: string,
  randomSet: string,
  currentQuestionIndex: number,
) {
  // Find the selected topic
  const topic = data.topics.find(
    (topic) => topic.topicName === selectedMainTopic,
  );
  if (!topic) {
    console.error('Topic not found');
    return;
  }

  // Find the selected subtopic
  const subtopic = topic.subtopics.find(
    (subtopic) => subtopic.subtopicName === selectedSubtopic,
  );
  if (!subtopic) {
    console.error('Subtopic not found');
    return;
  }

  // Find the question set based on difficulty and set number
  const questionSet = subtopic.questionSets.find(
    (set) =>
      set.level === selectedDifficulty && set.setNumber === parseInt(randomSet),
  );
  if (!questionSet) {
    console.error('Question set not found');
    return;
  }

  // Check if the current question index is valid
  if (
    currentQuestionIndex < 0 ||
    currentQuestionIndex >= questionSet.questions.length
  ) {
    console.error('Invalid question index');
    return;
  }

  // Retrieve the question at the current index
  const question = questionSet.questions[currentQuestionIndex];
  const shuffledOptions = _.shuffle(question.options);

  const buttons = shuffledOptions.map((option: string) => ({
    type: 'solid',
    body: option,
    reply: option,
  }));
  return {
    to: from,
    type: 'button',
    button: {
      body: {
        type: 'text',
        text: {
          body: question.question,
        },
      },
      buttons: buttons,
      allow_custom_response: false,
    },
  };
}

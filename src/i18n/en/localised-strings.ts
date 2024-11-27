export const localised = {
  seeMoreMessage: 'See More Data',
  language_hindi: 'हिन्दी',
  language_english: 'English',
  language_changed: 'Language changed to English',
  welcomeMessage: "Welcome to 🕰️the Facts About Your State Bot! 🌏 Discover fascinating facts about the diverse states of India. Ready to explore? Let’s start our journey!🕰️",
  validText: ['hi', 'Hi', 'HI', 'hI', 'Hello', 'hello', 'hola'],
  selectSubtopic: (topicName: string) =>
  `📜Ready to dive into the unique traditions and fascinating stories of ${topicName}:🌍✨ Let’s explore the rich heritage and culture that make it stand out!":`,
  mainMenu:'Main Menu',
  chooseTopic:"🌍 Ready for an adventure? Pick a topic below and let the exploration begin! 🎉!!",
  retakeQuiz:'Retake Quiz',
  startQuiz: 'Start Quiz',
  Moreexplanation:'More Explanation',
  Scorecard:"Scorecard",
  endMessage:"Whenever you're ready to continue, just type 'Hi' to start the bot again. Looking forward to helping you out! 😊",
  explanation: (subtopicName: string, description: string) =>
  `📖 **Explanation of ${subtopicName}:**\n${description}`,
  moreExplanation: (subtopicName: string, description: string) =>
  `📝 More Explanation of **${subtopicName}:**\n${description}`,
  difficulty: `🎯 Choose your quiz level to get started!🚀`,
  rightAnswer: (explanation: string) =>
  `🌟 Fantastic! You got it 👍right!\nCheck this out: **${explanation}**`,
  wrongAnswer: (correctAnswer: string, explanation: string) =>
 `👎Not quite right, but you’re learning! 💪\nThe correct answer is: **${correctAnswer}**\nHere’s the explanation: **${explanation}**`,
  score: (score: number, totalQuestions: number,  badge:string) =>
  `🌟 Wow! You did an awesome job. **${score}** out of **${totalQuestions}**.\n\n💪 Congratulations! You earned ${ badge} badge! `,
   
  
};
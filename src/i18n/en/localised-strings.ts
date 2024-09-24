export const localised = {
  seeMoreMessage: 'See More Data',
  language_hindi: 'हिन्दी',
  language_english: 'English',
  language_changed: 'Language changed to English',
  welcomeMessage: `😊**Welcome to the Indian Medieval History Chatbot!** 🏰\n🔎 Explore the history of India by selecting a 📖 topic from the list below.`,
  validText: ['hi', 'Hi', 'HI', 'hI', 'Hello', 'hello', 'hola'],
  selectSubtopic: (topicName: string) =>
  `📜 Please select a topic for **${topicName}**:`,
  explanation: (subtopicName: string, description: string) =>
  `📖 **Explanation of ${subtopicName}:**\n${description}`,
  moreExplanation: (subtopicName: string, description: string) =>
  `📝 More Explanation of **${subtopicName}:**\n**${description}**`,
  difficulty: `🎯 Choose your quiz level to get started!🚀`,
  rightAnswer: (explanation: string) =>
  `🌟 Fantastic! You got it 👍right!\nCheck this out: **${explanation}**`,
  wrongAnswer: (correctAnswer: string, explanation: string) =>
 `👎Not quite right, but you’re learning! 💪\nThe correct answer is: **${correctAnswer}**\nHere’s the explanation: **${explanation}**`,
  score: (score: number, totalQuestions: number) =>
  `🏅 Great job! Your score is **${score}** out of **${totalQuestions}**.`,
   
  
};

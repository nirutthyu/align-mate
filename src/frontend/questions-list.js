// eslint-disable-next-line import/no-anonymous-default-export
export default [
  // Lifestyle Choices
  {
    qid: 'food-preference',
    question: 'Would you be okay with a roommate eating food that you don’t consume?',
    type: 'options',
    answers: ['Yes', 'No', 'Depends'],
    button: 'Next',
  },
  {
    qid: 'substances',
    question: 'What are your views on smoking, drinking, or recreational substances?',
    type: 'options',
    answers: ['Okay with it', 'Not okay', 'Occasionally fine'],
    button: 'Next',
  },
  {
    qid: 'free-time-activities',
    question: 'What are your favorite activities in your free time?',
    type: 'options',
    answers: ['Reading', 'Gaming', 'Watching Movies', 'Going out', 'Working out'],
    button: 'Next',
  },
  {
    qid: 'gaming',
    question: 'Do you enjoy gaming?',
    type: 'options',
    answers: ['Yes', 'No', 'Sometimes'],
    button: 'Next',
  },
  {
    qid: 'movies-frequency',
    question: 'How often do you watch movies/TV shows?',
    type: 'options',
    answers: ['Everyday', 'Few times a week', 'Rarely'],
    button: 'Next',
  },
  {
    qid: 'pet-peeve',
    question: 'What’s something small that annoys you a lot?',
    type: 'options',
    answers: ['Loud noises', 'Messy rooms', 'Interruptions', 'Other'],
    button: 'Next',
  },

  // Environment and Personal Preferences
  {
    qid: 'cleanliness',
    question: 'How clean do you like your living space?',
    type: 'options',
    answers: ['Very Clean', 'Moderate', 'Messy'],
    button: 'Next',
  },
  {
    qid: 'sleep-style',
    question: 'How do you prefer to sleep?',
    type: 'options',
    answers: ['In complete silence', 'With white noise', 'With lights on'],
    button: 'Next',
  },
  {
    qid: 'environment-type',
    question: 'Do you prefer a quiet or lively living environment?',
    type: 'options',
    answers: ['Quiet', 'Lively', 'Flexible'],
    button: 'Next',
  },
  {
    qid: 'extrovert-introvert',
    question: 'Are you an extrovert or an introvert?',
    type: 'options',
    answers: ['Extrovert', 'Introvert', 'Ambivert'],
    button: 'Next',
  },
  {
    qid: 'friends-over',
    question: 'How do you feel about having friends over in the room?',
    type: 'options',
    answers: ['Often', 'Sometimes', 'Prefer not'],
    button: 'Next',
  },
  {
    qid: 'weekend-activity',
    question: 'Do you prefer going out or staying in on weekends?',
    type: 'options',
    answers: ['Going out', 'Staying in', 'Depends'],
    button: 'Next',
  },
  {
    qid: 'alone-time',
    question: 'How often do you need ‘alone time’ to feel balanced?',
    type: 'options',
    answers: ['Frequently', 'Occasionally', 'Rarely'],
    button: 'Next',
  },
  {
    qid: 'privacy',
    question: 'How important is privacy to you?',
    type: 'options',
    answers: ['Very important', 'Somewhat important', 'Not important'],
    button: 'Next',
  },
  {
    qid: 'rough-day-response',
    question: 'If you had a rough day, would you prefer your roommate to:',
    type: 'options',
    answers: ['Talk and check in with me', 'Give me space', 'Doesn’t matter'],
    button: 'Next',
  },
  {
    qid: 'match-preference',
    question: 'Would you prefer to be matched with someone similar or different from you?',
    type: 'options',
    answers: ['Similar', 'Different', 'Doesn’t matter'],
    button: 'Next',
  },

  // Sleep and Daily Habits
  {
    qid: 'day-night-person',
    question: 'Are you a day person or a night person?',
    type: 'options',
    answers: ['Day', 'Night', 'Both'],
    button: 'Next',
  },
  {
    qid: 'sleep-noise',
    question: 'Do you snore or talk in your sleep?',
    type: 'options',
    answers: ['Yes', 'No', 'Not sure'],
    button: 'Next',
  },
  {
    qid: 'wake-up',
    question: 'Preferred way to wake up?',
    type: 'options',
    answers: ['Alarm', 'Naturally', 'Roommate wake-up'],
    button: 'Next',
  },
  {
    qid: 'religious-lifestyle',
    question: 'Do you have any religious or lifestyle practices that require specific accommodations?',
    type: 'options',
    answers: ['Yes', 'No', 'Prefer not to say'],
    button: 'Next',
  },

  // Final screen
  {
    qid: 'final',
    question: 'Thanks for sharing! We will find the best match for you.',
    type: 'final',
    answers: ['Okay'],
    button: 'Finish',
  },
];

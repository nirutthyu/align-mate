// eslint-disable-next-line import/no-anonymous-default-export
export default [
    {
      qid: 'welcome',
      question:
        'We’ll ask some questions to understand your lifestyle and preferences to find the best roommate for you.',
      type: 'welcome',
      button: 'Get Started',
    },
    {
      qid: 'sleep-schedule',
      question: 'What is your sleep schedule like?',
      type: 'options',
      answers: ['Night Owl', 'Early Bird', 'Flexible'],
      button: 'Next',
    },
    {
      qid: 'cleanliness',
      question: 'How do you prefer your living space?',
      type: 'options',
      answers: ['Very Clean', 'Moderate', 'Messy'],
      button: 'Next',
    },
    {
      qid: 'social-preference',
      question: 'Do you enjoy socializing with your roommates?',
      type: 'options',
      answers: ['Yes', 'No', 'Sometimes'],
      button: 'Next',
    },
    {
      qid: 'study-style',
      question: 'What is your preferred study environment?',
      type: 'options',
      answers: ['Quiet and alone', 'With background noise', 'Group studying'],
      button: 'Next',
    },
    {
      qid: 'final',
      question: 'Thanks for sharing! We will find the best match for you.',
      type: 'final',
      button: 'Finish',
    },
  ];
  
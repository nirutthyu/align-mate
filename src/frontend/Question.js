import { motion } from 'framer-motion';
import './question.css';
import { useState } from 'react';

const spring = {
  type: 'spring',
  stiffness: 700,
  damping: 25,
  duration: 1,
};

const questionVariants = {
  hidden: { opacity: 0, translateY: 200 },
  show: {
    opacity: 1,
    translateY: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const variant = {
  hidden: { opacity: 0, translateY: 50 },
  show: { opacity: 1, translateY: 0 },
};

export function Options({ qid, answers, chosenAnswer, chooseAnswer }) {
  return answers.map((ans, i) => (
    <motion.li
      key={i}
      variants={variant}
      onClick={() => chooseAnswer(qid, ans)}
      className={`${chosenAnswer === ans ? 'active' : ''}`}
    >
      <button className="choiceBtn" style={{'textDecoration':'none','background':'transparent'}}>{ans}</button>
    </motion.li>
  ));
}

export default function Question({ item, chooseAnswer, nextSlide }) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Enable Finish button always, others follow normal rules
  const isEnableNext = item.button.toLowerCase() === 'finish' || 
                     item.chosenAnswer || 
                     item.type === 'welcome';

const handleButtonClick = async () => {
  if (item.button.toLowerCase() === 'finish') {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/assign-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to assign room');
      
      const data = await response.json();
      console.log('Room assignment:', data);
      
      nextSlide();
    } catch (error) {
      console.error('Error assigning room:', error);
    } finally {
      setIsLoading(false);
    }
  } else {
    nextSlide();
  }
};

  return (
    <motion.article
      variants={questionVariants}
      initial="hidden"
      animate="show"
      transition={spring}
      exit={{ opacity: 0, translateY: -50 }}
    >
      <motion.p className="h1" variants={variant}>
        {item.question}
      </motion.p>
      {item.type === 'options' && (
        <ol>
          <Options
            qid={item.qid}
            answers={item.answers}
            chosenAnswer={item.chosenAnswer}
            chooseAnswer={chooseAnswer}
          />
        </ol>
      )}
      
      <motion.div className="button-container">
        <button 
          onClick={handleButtonClick} 
          disabled={(!isEnableNext && item.button.toLowerCase() !== 'finish') || isLoading}
        >
          {isLoading ? 'Processing...' : item.button}
          {item.button.toLowerCase() !== 'finish' && ' →'}
        </button>
        
        {/* Only show message for non-Finish option questions */}
        {item.type === 'options' && !item.chosenAnswer && item.button.toLowerCase() !== 'finish' && (
          <span className="msg">Please choose one to continue</span>
        )}
      </motion.div>
    </motion.article>
  );
}
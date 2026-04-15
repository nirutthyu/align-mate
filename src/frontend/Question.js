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
  show:   { opacity: 1, translateY: 0 },
};

export function Options({ qid, answers, chosenAnswer, chooseAnswer }) {
  return answers.map((ans, i) => (
    <motion.li
      key={i}
      variants={variant}
      onClick={() => chooseAnswer(qid, ans)}
      className={chosenAnswer === ans ? 'active' : ''}
    >
      <button className="choiceBtn">{ans}</button>
    </motion.li>
  ));
}

export default function Question({ item, chooseAnswer, nextSlide }) {
  const [isLoading, setIsLoading] = useState(false);

  const isFinish     = item.button.toLowerCase() === 'finish';
  const isEnableNext = isFinish || item.chosenAnswer || item.type === 'welcome';

  async function handleButtonClick() {
    if (isFinish) {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/assign-rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
  }

  return (
    <motion.article
      variants={questionVariants}
      initial="hidden"
      animate="show"
      transition={spring}
      exit={{ opacity: 0, translateY: -50 }}
    >
      {/* Question text */}
      <motion.p className="h1" variants={variant}>
        {item.question}
      </motion.p>

      {/* Answer options */}
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

      {/* Next / Finish button + hint */}
      <motion.div className="btn-row" variants={variant}>
        <button
          className={`next-btn${isLoading ? ' loading' : ''}`}
          onClick={handleButtonClick}
          disabled={(!isEnableNext && !isFinish) || isLoading}
        >
          {isLoading ? (
            'Processing…'
          ) : (
            <>
              {item.button}
              {!isFinish && <span className="next-btn-arrow">→</span>}
            </>
          )}
        </button>

        {item.type === 'options' && !item.chosenAnswer && !isFinish && (
          <span className="msg">Pick one to continue</span>
        )}
      </motion.div>
    </motion.article>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Question from './Question';
import './styles.css';
import qdata from './questions-list.js';

const item = {
  hidden: { opacity: 0, translateY: -100 },
  show: { opacity: 1, translateY: 0 },
};

export default function App() {
  const length = qdata.length - 1;

  const [questionsList, setQuestionsList] = useState(qdata);
  const [slide, setSlide] = useState(0);

  function handleNextSlide(index) {
    if (index > length || index < 0) return;
    setSlide(index);
  }

  function handleChooseAnswer(qid, answer) {
    const updatedQuestion = questionsList.find((q) => q.qid === qid);
    updatedQuestion.chosenAnswer = answer;
    setQuestionsList([...questionsList, updatedQuestion]);
  }

  return (
    <main>
      {questionsList.map((item, i) => (
        <AnimatePresence key={i}>
          {i === slide && (
            <Question
              item={item}
              chooseAnswer={handleChooseAnswer}
              nextSlide={() => handleNextSlide(slide + 1)}
            />
          )}
        </AnimatePresence>
      ))}

      <motion.nav>
        <div className="logo">Westpac</div>
        {slide > 0 && (
          <motion.div
            className="right"
            variants={item}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.5, duration: 1 }}
          >
            <div className="slide">
              {slide}
              <span>/</span>
              {length}
            </div>
            <div className="buttons">
              <button onClick={() => handleNextSlide(slide - 1)}>&larr;</button>
              <button onClick={() => handleNextSlide(slide + 1)}>&rarr;</button>
            </div>
          </motion.div>
        )}
      </motion.nav>
    </main>
  );
}

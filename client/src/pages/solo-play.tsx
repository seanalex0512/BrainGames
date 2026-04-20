import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayStore, selectCurrentQuestion } from '../stores/play-store';
import { CountdownTimer } from '../components/game/countdown-timer';
import { AnswerButton } from '../components/game/answer-button';
import { FeedbackOverlay } from '../components/game/feedback-overlay';
import { ScoreSummary } from '../components/game/score-summary';

export function SoloPlay() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const phase = usePlayStore((s) => s.phase);
  const quizTitle = usePlayStore((s) => s.quizTitle);
  const questions = usePlayStore((s) => s.questions);
  const currentIndex = usePlayStore((s) => s.currentIndex);
  const score = usePlayStore((s) => s.score);
  const streak = usePlayStore((s) => s.streak);
  const results = usePlayStore((s) => s.results);
  const selectedAnswerId = usePlayStore((s) => s.selectedAnswerId);
  const error = usePlayStore((s) => s.error);
  const loadQuiz = usePlayStore((s) => s.loadQuiz);
  const submitAnswer = usePlayStore((s) => s.submitAnswer);
  const nextQuestion = usePlayStore((s) => s.nextQuestion);
  const reset = usePlayStore((s) => s.reset);

  const currentQuestion = usePlayStore(selectCurrentQuestion);
  const timeRemainingRef = useRef<number>(0);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (id) void loadQuiz(id);
    return () => { reset(); };
  }, [id, loadQuiz, reset]);

  // Reset timer when question changes
  useEffect(() => {
    if (phase === 'question') {
      setTimerKey((k) => k + 1);
      timeRemainingRef.current = currentQuestion?.timeLimit ?? 0;
    }
  }, [phase, currentIndex, currentQuestion]);

  const handleTimerExpire = () => {
    if (phase === 'question') {
      submitAnswer(null, 0);
    }
  };

  const handleAnswerClick = (answerId: string) => {
    if (phase !== 'question') return;
    submitAnswer(answerId, timeRemainingRef.current);
  };

  if (phase === 'idle' && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-white/70">Failed to load quiz. Please try again.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (phase === 'loading' || phase === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <ScoreSummary
        quizTitle={quizTitle}
        score={score}
        results={results}
        onPlayAgain={() => { if (id) void loadQuiz(id); }}
        onHome={() => navigate('/')}
      />
    );
  }

  if (!currentQuestion) return null;

  const lastResult = results[results.length - 1];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/50 text-sm">{quizTitle}</p>
          <p className="text-white/70 text-sm font-semibold">
            Q{currentIndex + 1} / {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {streak >= 3 && (
            <motion.span
              key={streak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl"
              title={`${streak} streak`}
            >
              🔥 {streak}
            </motion.span>
          )}
          <div className="text-right">
            <p className="text-white/50 text-xs">Score</p>
            <p className="text-white font-black text-xl tabular-nums">{score}</p>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-6">
        <CountdownTimer
          key={timerKey}
          timeLimit={currentQuestion.timeLimit}
          running={phase === 'question'}
          onExpire={handleTimerExpire}
          onTick={(t) => { timeRemainingRef.current = t; }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <p className="text-white text-xl font-bold leading-snug">
              {currentQuestion.text}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answers */}
      <div className={[
        'grid gap-3',
        currentQuestion.answers.length === 2 ? 'grid-cols-1' : 'grid-cols-2',
      ].join(' ')}>
        {currentQuestion.answers.map((answer, i) => {
          let showResult: 'correct' | 'incorrect' | undefined;
          if (phase === 'feedback') {
            if (answer.isCorrect) showResult = 'correct';
            else if (answer.id === selectedAnswerId) showResult = 'incorrect';
          }

          return (
            <AnswerButton
              key={answer.id}
              index={i}
              text={answer.text}
              onClick={() => handleAnswerClick(answer.id)}
              disabled={phase === 'feedback'}
              showResult={showResult}
            />
          );
        })}
      </div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {phase === 'feedback' && lastResult && (
          <FeedbackOverlay
            isCorrect={lastResult.isCorrect}
            pointsEarned={lastResult.pointsEarned}
            streak={streak}
            onNext={nextQuestion}
            isLastQuestion={isLastQuestion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

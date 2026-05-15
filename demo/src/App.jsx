import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChefHat, Heart, Send, Sparkles, Utensils } from 'lucide-react';
import { guests, fallbackGuest } from './data/guests';
import { chefs, defaultChef } from './data/chefs';
import { feedbackAgent, fuseDishesAgent, generateDishAgent, guideAgent, startSessionAgent } from './services/apiClient';
import { useTypewriter } from './hooks/useTypewriter';
import { ChefStand, GuestStand } from './components/Actors';
import { DishCard } from './components/DishCard';
import { PixelButton } from './components/PixelButton';
import { ScoreBars } from './components/ScoreBars';
import { StageBadge } from './components/StageBadge';

const maxRounds = 2;

const initialRun = {
  guestIndex: 0,
  stage: 'start',
  round: 1,
  prompt: '',
  answers: [],
  allAnswers: [],
  sessionId: '',
  secondPrompt: '',
  activeDishIndex: 1,
  dish1: null,
  dish2: null,
  finalDish: null,
  feedback: null,
  error: '',
};

export default function App() {
  const [run, setRun] = useState(initialRun);
  const [selectedChefId, setSelectedChefId] = useState(defaultChef.id);
  const guest = guests[run.guestIndex % guests.length] || fallbackGuest;
  const selectedChef = chefs.find((chef) => chef.id === selectedChefId) || defaultChef;

  const setStage = (stage) => setRun((current) => ({ ...current, stage, error: '' }));

  const beginGuest = () => {
    setRun((current) => ({
      ...initialRun,
      guestIndex: current.guestIndex,
      stage: 'arrival',
    }));
  };

  const startCreation = async () => {
    setRun((current) => ({ ...current, stage: 'bubbleTransition', prompt: '', round: 1, answers: [], activeDishIndex: 1 }));
    const sessionPromise = startSessionAgent(guest);
    window.setTimeout(async () => {
      const session = await sessionPromise;
      setRun((current) => ({
        ...current,
        sessionId: session.sessionId || '',
        stage: 'creation',
        prompt: session.prompt || session.nextPrompt,
      }));
    }, 3400);
  };

  const startSecondCreation = async () => {
    setRun((current) => ({ ...current, stage: 'creation', prompt: '', round: 2, answers: [], activeDishIndex: 2 }));
    const prompt = run.secondPrompt || await guideAgent(guest, 2);
    setRun((current) => ({ ...current, prompt }));
  };

  const submitAnswer = async (answer) => {
    const nextAnswers = [...run.answers, answer];

    setRun((current) => ({
      ...current,
      answers: nextAnswers,
      allAnswers: [...current.allAnswers, answer],
      prompt: '灵感已经足够，炉火准备好了。',
      stage: current.activeDishIndex === 1 ? 'generating1' : 'generating2',
    }));
  };

  const finishDish = (index, dish, meta = {}) => {
    setRun((current) => ({
      ...current,
      [`dish${index}`]: dish,
      secondPrompt: index === 1 ? meta.nextPrompt || current.secondPrompt : current.secondPrompt,
      stage: index === 1 ? 'betweenDishes' : 'kitchen',
    }));
  };

  const redoDish = async (index) => {
    setRun((current) => ({
      ...current,
      stage: index === 1 ? 'creation' : 'creation',
      activeDishIndex: index,
      answers: [],
      prompt: guest.prompts[0],
      [`dish${index}`]: null,
    }));
  };

  const fuseDishes = async () => {
    const finalDish = await fuseDishesAgent({ guest, sessionId: run.sessionId, dish1: run.dish1, dish2: run.dish2 });

    setRun((current) => ({ ...current, stage: 'fusion', finalDish, feedback: null }));
  };

  const serveFinalDish = async () => {
    setRun((current) => ({ ...current, stage: 'feedback', feedback: null }));
    const feedback = await feedbackAgent({ guest, sessionId: run.sessionId, answers: run.allAnswers, finalDish: run.finalDish });
    setRun((current) => ({ ...current, feedback }));
  };

  const nextGuest = () => {
    setRun((current) => ({
      ...initialRun,
      guestIndex: current.guestIndex + 1,
      stage: 'arrival',
    }));
  };

  return (
    <main className="app-shell">
      <div className="tile-grid" aria-hidden="true" />
      <header className="topbar">
        <div className="brand-mark">
          <ChefHat size={20} />
          <span>AI厨房</span>
        </div>
        <p>今日试营业</p>
      </header>

      {run.stage === 'start' ? (
        <StartScreen chef={selectedChef} selectedChefId={selectedChefId} onSelectChef={setSelectedChefId} onStart={beginGuest} />
      ) : null}
      {run.stage === 'arrival' ? <Arrival guest={guest} chef={selectedChef} onStart={startCreation} /> : null}
      {run.stage === 'bubbleTransition' ? <BubbleTransition guest={guest} chef={selectedChef} /> : null}
      {run.stage === 'creation' ? (
        <Creation guest={guest} prompt={run.prompt} round={run.round} answers={run.answers} onSubmit={submitAnswer} />
      ) : null}
      {run.stage === 'generating1' ? (
        <GenerateDish guest={guest} sessionId={run.sessionId} answers={run.answers} index={1} onDone={finishDish} />
      ) : null}
      {run.stage === 'betweenDishes' ? (
        <BetweenDishes dish={run.dish1} onNext={startSecondCreation} />
      ) : null}
      {run.stage === 'generating2' ? (
        <GenerateDish guest={guest} sessionId={run.sessionId} answers={run.answers} index={2} firstDish={run.dish1} onDone={finishDish} />
      ) : null}
      {run.stage === 'kitchen' ? (
        <KitchenBoard guest={guest} dish1={run.dish1} dish2={run.dish2} onRedo={redoDish} onFuse={fuseDishes} />
      ) : null}
      {run.stage === 'fusion' ? (
        <Fusion guest={guest} dish1={run.dish1} dish2={run.dish2} finalDish={run.finalDish} onServe={serveFinalDish} />
      ) : null}
      {run.stage === 'finalReveal' ? <FinalReveal guest={guest} finalDish={run.finalDish} /> : null}
      {run.stage === 'feedback' ? (
        <Feedback guest={guest} finalDish={run.finalDish} feedback={run.feedback} onSettle={() => setStage('settlement')} />
      ) : null}
      {run.stage === 'settlement' ? (
        <Settlement guest={guest} feedback={run.feedback} finalDish={run.finalDish} onNext={nextGuest} />
      ) : null}
    </main>
  );
}

function StartScreen({ chef, selectedChefId, onSelectChef, onStart }) {
  return (
    <section className="screen start-screen chef-select-screen">
      <div className="hero-copy chef-select-copy">
        <StageBadge>营业准备</StageBadge>
        <h1>把情绪，做成一道会发光的菜。</h1>
        <p>
          客人会带着说不清的愿望来到厨房。你要作为主厨，把那些抽象的情绪变成料理。
        </p>
        <div className="chef-picker" role="radiogroup" aria-label="选择主厨形象">
          {chefs.map((option) => (
            <button
              className={`chef-option ${option.id === selectedChefId ? 'selected' : ''}`}
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === selectedChefId}
              onClick={() => onSelectChef(option.id)}
              style={{ '--chef-accent': option.accent }}
            >
              <span className="chef-avatar-frame">
                <img src={option.avatar} alt="" draggable="false" />
              </span>
              <span>{option.name}</span>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
        <PixelButton icon={Utensils} onClick={onStart}>开始营业</PixelButton>
      </div>
      <div className="counter-scene chef-preview-scene">
        <ChefStand chef={chef} action="explain" />
        <div className="serving-window">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function Arrival({ guest, chef, onStart }) {
  return (
    <section className="screen game-scene arrival-scene">
      <div className="guest-tag">
        <StageBadge>今日客人</StageBadge>
        <strong>{guest.label}</strong>
      </div>

      <div className="guest-request">
        <p>{guest.opening}</p>
      </div>
      <div className="scene-steam steam-left" aria-hidden="true" />
      <div className="scene-steam steam-right" aria-hidden="true" />
      <div className="scene-sparkle" aria-hidden="true" />

      <div className="scene-actor chef-anchor">
        <ChefStand chef={chef} action="idle" />
      </div>

      <div className="scene-actor guest-anchor">
        <GuestStand guest={guest} />
      </div>

      <button className="star-start" type="button" onClick={onStart} aria-label="start">
        STAR
      </button>
    </section>
  );
}

function BubbleTransition({ guest, chef }) {
  return (
    <section className="screen game-scene bubble-scene">
      <div className="scene-actor chef-anchor">
        <ChefStand chef={chef} action="thinking" />
      </div>
      <div className="thinking-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="scene-actor guest-anchor ghosted">
        <GuestStand guest={guest} />
      </div>
      <div className="chef-thought-bubble">
        <span />
        <span />
        <p>让我想想，这份情绪该怎么下锅...</p>
      </div>
      <div className="thought-white-wipe" aria-hidden="true" />
      <div className="scene-sparkle thought-sparkle" aria-hidden="true" />
    </section>
  );
}

function Creation({ guest, prompt, round, answers, onSubmit }) {
  const [input, setInput] = useState('');
  const [readyToType, setReadyToType] = useState(false);
  const isThinking = !prompt;
  const canType = Boolean(prompt) && readyToType;
  const { displayed, done } = useTypewriter(prompt, 24, canType);

  useEffect(() => {
    setReadyToType(false);
    if (!prompt) return undefined;

    const timer = window.setTimeout(() => setReadyToType(true), 360);
    return () => window.clearTimeout(timer);
  }, [prompt]);

  const send = () => {
    const value = input.trim();
    if (!value || isThinking || !readyToType || !done) return;
    setInput('');
    onSubmit(value);
  };

  return (
    <section className="screen creation-stage">
      <div className="creation-context">
        <StageBadge>主厨的心理对白</StageBadge>
        <h2>{guest.mood}</h2>
        <p>把客人的愿望藏进食材、形状、火候和回忆里。</p>
      </div>

      <div className="chat-panel fullscreen-chat">
        <div className="chat-header">
          <StageBadge>第 {round}/{maxRounds} 轮</StageBadge>
          <span>把抽象情绪转译成可烹饪的概念</span>
        </div>

        <div className="message-list" aria-live="polite">
          {answers.map((answer, index) => (
            <div className="message user-message" key={`${answer}-${index}`}>
              {answer}
            </div>
          ))}
          <div className="message ai-message chef-inner-message">
            {isThinking ? <LoadingText label="主厨正在整理灵感" /> : displayed}
            {!isThinking && readyToType && !done ? <i className="caret" /> : null}
          </div>
        </div>

        <form
          className="input-row"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isThinking}
            placeholder={isThinking ? '等待灵感...' : '可以先写，等主厨说完后发送'}
            aria-label="创作输入"
          />
          <PixelButton type="submit" icon={Send} disabled={!input.trim() || isThinking || !readyToType || !done}>
            发送
          </PixelButton>
        </form>
      </div>
    </section>
  );
}

function GenerateDish({ guest, sessionId, answers, index, firstDish, onDone }) {
  useEffect(() => {
    let cancelled = false;

    generateDishAgent({
      guest,
      sessionId,
      answer: answers[answers.length - 1],
      answers,
      index,
    }).then((result) => {
      if (!cancelled) onDone(index, result.dish, result);
    });

    return () => {
      cancelled = true;
    };
  }, [answers, guest, index, onDone]);

  return (
    <section className="screen dish-wait-screen">
      <div className="dish-generation-stage">
        {index === 2 && firstDish ? <DishCard dish={firstDish} index={1} /> : null}
        <DishCard index={index} loading />
        {index === 1 ? <DishCard index={2} /> : null}
      </div>
    </section>
  );
}

function BetweenDishes({ dish, onNext }) {
  return (
    <section className="screen dish-wait-screen">
      <div className="dish-generation-stage">
        <DishCard dish={dish} index={1} />
        <DishCard index={2} onEmptyClick={onNext} />
      </div>
      <button className="next-arrow" type="button" onClick={onNext} aria-label="继续创作第二道菜">
        <ArrowRight aria-hidden="true" size={34} strokeWidth={3} />
      </button>
    </section>
  );
}

function KitchenBoard({ guest, dish1, dish2, onRedo, onFuse }) {
  return (
    <section className="screen dish-wait-screen fusion-ready-screen">
      <div className="dish-generation-stage">
        <DishCard dish={dish1} index={1} onRedo={onRedo} />
        <DishCard dish={dish2} index={2} onRedo={onRedo} />
      </div>
      <PixelButton icon={Sparkles} className="fusion-ready-action" onClick={onFuse}>融合</PixelButton>
      <GuestStand guest={guest} mood="small" />
    </section>
  );
}

function Fusion({ guest, dish1, dish2, finalDish, onServe }) {
  return (
    <section className="screen evolution-screen" aria-live="polite">
      <div className="fusion-copy">
        <StageBadge>融合进化</StageBadge>
        <h2>把两份灵感轻轻拢在一起</h2>
      </div>
      <div className="fusion-stage" aria-hidden="true">
        <FusionIngredient dish={dish1} className="fusion-left" />
        <div className="fusion-glow" />
        <FusionIngredient dish={dish2} className="fusion-right" />
      </div>
      <div className="evolved-dish">
        <DishCard dish={finalDish} index="Final" />
      </div>
      <div className="fusion-actions">
        <p>{guest.name}正在等待第一口。</p>
        <PixelButton icon={ArrowRight} className="serve-final-action" onClick={onServe}>
          端给客人
        </PixelButton>
      </div>
    </section>
  );
}

function FusionIngredient({ dish, className = '' }) {
  return (
    <div className={`fusion-ingredient ${className}`}>
      {dish?.imageUrl ? (
        <img className="generated-dish-image pixelated" src={dish.imageUrl} alt="" draggable="false" />
      ) : (
        <div
          className="pixel-dish"
          style={{
            '--dish-color': dish?.color || '#ef6b5b',
            '--dish-accent': dish?.accent || '#f6bd4f',
          }}
        >
          <span />
          <span />
          <span />
        </div>
      )}
      <span>{dish?.name || '灵感料理'}</span>
    </div>
  );
}

function FinalReveal({ guest, finalDish }) {
  return (
    <section className="screen final-reveal-screen">
      <div className="serving-trail" aria-hidden="true" />
      <div className="final-spotlight">
        <StageBadge>料理完成</StageBadge>
        <DishCard dish={finalDish} index="Final" />
        <p>主厨把新料理端到{guest.name}面前。</p>
      </div>
    </section>
  );
}

function Feedback({ guest, finalDish, feedback, onSettle }) {
  const { displayed, done } = useTypewriter(feedback?.text || '', 28, Boolean(feedback));

  return (
    <section className="screen feedback-screen">
      <GuestStand guest={guest} />
      <div className="feedback-card">
        <StageBadge>客人反馈</StageBadge>
        <h2>{finalDish.name}</h2>
        <p className="feedback-text">
          {displayed}
          {!done ? <i className="caret" /> : null}
        </p>
        {feedback ? (
          <>
            <ScoreBars scores={feedback.scores} />
            <p className="rarity-chip">{feedback.rarity}</p>
          </>
        ) : (
          <LoadingText label="反馈智能体整理评价中" />
        )}
        <PixelButton icon={Heart} variant="mint" disabled={!done} onClick={onSettle}>
          查看结算
        </PixelButton>
      </div>
    </section>
  );
}

function Settlement({ guest, feedback, finalDish, onNext }) {
  const average = useMemo(() => {
    if (!feedback) return 0;
    const values = Object.values(feedback.scores);
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [feedback]);

  return (
    <section className="screen settlement-screen">
      <div className="receipt">
        <StageBadge>营业结算</StageBadge>
        <h2>{finalDish.name}</h2>
        <p>为 {guest.name} 完成的情绪料理</p>
        <strong>{average}</strong>
        {feedback ? <ScoreBars scores={feedback.scores} /> : null}
        <PixelButton icon={ArrowRight} onClick={onNext}>下一位客人</PixelButton>
      </div>
    </section>
  );
}

function LoadingText({ label }) {
  return (
    <span className="loading-text">
      {label}
      <i />
      <i />
      <i />
    </span>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChefHat, Heart, Send, Sparkles, Utensils } from 'lucide-react';
import { guests } from './data/guests';
import { chefs, defaultChef } from './data/chefs';
import { feedbackAgent, fuseDishesAgent, generateDishAgent, guideAgent, startSessionAgent } from './services/apiClient';
import { useTypewriter } from './hooks/useTypewriter';
import { ChefStand, GuestStand } from './components/Actors';
import { DishCard } from './components/DishCard';
import { PixelButton } from './components/PixelButton';
import { ScoreBars } from './components/ScoreBars';
import { StageBadge } from './components/StageBadge';

const maxRounds = 2;
const gameLogo = '/assets/art-library/ui/title-kit/title-lockup-compact.png';
const ideasPerDish = 2;

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
  const runRef = useRef(run);
  runRef.current = run;
  const guest = guests[run.guestIndex % guests.length];
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
    setRun((current) => ({ ...current, stage: 'bubbleTransition', prompt: '', round: 1, answers: [], activeDishIndex: 1, error: '' }));
    const sessionPromise = startSessionAgent(guest);
    window.setTimeout(async () => {
      try {
        const session = await sessionPromise;
        setRun((current) => ({
          ...current,
          sessionId: session.sessionId || '',
          stage: 'creation',
          prompt: session.prompt || session.nextPrompt,
        }));
      } catch (err) {
        console.error('startCreation failed:', err);
        setRun((current) => ({ ...current, stage: 'arrival', error: '连接厨房失败，请重试。' }));
      }
    }, 3400);
  };

  const startSecondCreation = useCallback(async () => {
    const secondPrompt = runRef.current.secondPrompt;
    setRun((current) => ({ ...current, stage: 'creation', prompt: '', round: 2, answers: [], activeDishIndex: 2, error: '' }));
    try {
      const prompt = secondPrompt || guest.prompts[2] || await guideAgent(guest, 2);
      setRun((current) => ({ ...current, prompt }));
    } catch (err) {
      console.error('startSecondCreation failed:', err);
      setRun((current) => ({ ...current, stage: 'betweenDishes', error: '获取灵感失败，请重试。' }));
    }
  }, [guest]);

  const submitAnswer = useCallback((answer) => {
    setRun((current) => {
      const answers = [...current.answers, answer];
      const allAnswers = [...current.allAnswers, answer];
      const nextPromptIndex = current.activeDishIndex === 1 ? answers.length : answers.length + ideasPerDish;
      const nextPrompt = guest.prompts[nextPromptIndex];

      if (answers.length < ideasPerDish && nextPrompt) {
        return {
          ...current,
          answers,
          allAnswers,
          prompt: nextPrompt,
          error: '',
        };
      }

      return {
        ...current,
        answers,
        allAnswers,
        prompt: '灵感已经足够，炉火准备好了。',
        stage: current.activeDishIndex === 1 ? 'generating1' : 'generating2',
      };
    });
  }, [guest]);

  const finishDish = useCallback((index, dish, meta = {}) => {
    setRun((current) => ({
      ...current,
      [`dish${index}`]: dish,
      secondPrompt: index === 1 ? meta.nextPrompt || current.secondPrompt : current.secondPrompt,
      stage: index === 1 ? 'betweenDishes' : 'kitchen',
    }));
  }, []);

  const redoDish = useCallback((index) => {
    setRun((current) => ({
      ...current,
      stage: 'creation',
      activeDishIndex: index,
      answers: [],
      prompt: guest.prompts[0],
      [`dish${index}`]: null,
    }));
  }, [guest]);

  const fuseDishes = useCallback(async () => {
    setRun((current) => ({ ...current, error: '' }));
    try {
      const current = runRef.current;
      const finalDish = await fuseDishesAgent({ guest, sessionId: current.sessionId, dish1: current.dish1, dish2: current.dish2 });
      setRun((prev) => ({ ...prev, stage: 'fusion', finalDish, feedback: null }));
    } catch (err) {
      console.error('fuseDishes failed:', err);
      setRun((current) => ({ ...current, error: '融合失败，请重试。' }));
    }
  }, [guest]);

  const serveFinalDish = useCallback(async () => {
    setRun((current) => ({ ...current, stage: 'feedback', feedback: null, error: '' }));
    try {
      const current = runRef.current;
      const feedback = await feedbackAgent({ guest, sessionId: current.sessionId, answers: current.allAnswers, finalDish: current.finalDish });
      setRun((prev) => ({ ...prev, feedback }));
    } catch (err) {
      console.error('serveFinalDish failed:', err);
      setRun((current) => ({ ...current, error: '获取反馈失败，请重试。' }));
    }
  }, [guest]);

  const handleGenerateError = useCallback((message) => {
    setRun((current) => ({ ...current, error: message }));
  }, []);

  const retryFromError = useCallback(() => {
    const current = runRef.current;
    setRun((prev) => ({ ...prev, error: '' }));
    if (current.stage === 'arrival') startCreation();
    else if (current.stage === 'betweenDishes') startSecondCreation();
    else if (current.stage === 'kitchen') fuseDishes();
    else if (current.stage === 'feedback') serveFinalDish();
    else if (current.stage === 'generating1' || current.stage === 'generating2') {
      setRun((prev) => ({ ...prev, stage: 'creation', answers: [], prompt: guest.prompts[0] }));
    }
  }, [startCreation, startSecondCreation, fuseDishes, serveFinalDish, guest]);

  const nextGuest = () => {
    setRun((current) => ({
      ...initialRun,
      guestIndex: current.guestIndex + 1,
      stage: 'arrival',
    }));
  };

  return (
    <main className={`app-shell stage-${run.stage}`}>
      <img className="game-logo-corner" src={gameLogo} alt="记忆厨房" draggable="false" />
      <header className="topbar">
        <div className="brand-mark">
          <ChefHat size={20} />
          <span>AI厨房</span>
        </div>
        <p>今日试营业</p>
      </header>

      {run.error ? (
        <div className="error-banner" role="alert">
          <span>{run.error}</span>
          <button type="button" onClick={retryFromError}>重试</button>
        </div>
      ) : null}

      {run.stage === 'start' ? (
        <StartScreen chef={selectedChef} selectedChefId={selectedChefId} onSelectChef={setSelectedChefId} onStart={beginGuest} />
      ) : null}
      {run.stage === 'arrival' ? <Arrival guest={guest} chef={selectedChef} onStart={startCreation} /> : null}
      {run.stage === 'bubbleTransition' ? <BubbleTransition guest={guest} chef={selectedChef} /> : null}
      {run.stage === 'creation' ? (
        <Creation guest={guest} prompt={run.prompt} round={run.round} answers={run.answers} onSubmit={submitAnswer} />
      ) : null}
      {run.stage === 'generating1' ? (
        <GenerateDish guest={guest} sessionId={run.sessionId} answers={run.answers} index={1} onDone={finishDish} onError={handleGenerateError} />
      ) : null}
      {run.stage === 'betweenDishes' ? (
        <BetweenDishes dish={run.dish1} onNext={startSecondCreation} />
      ) : null}
      {run.stage === 'generating2' ? (
        <GenerateDish guest={guest} sessionId={run.sessionId} answers={run.answers} index={2} firstDish={run.dish1} onDone={finishDish} onError={handleGenerateError} />
      ) : null}
      {run.stage === 'kitchen' ? (
        <KitchenBoard guest={guest} dish1={run.dish1} dish2={run.dish2} onRedo={redoDish} onFuse={fuseDishes} />
      ) : null}
      {run.stage === 'fusion' ? (
        <Fusion guest={guest} dish1={run.dish1} dish2={run.dish2} finalDish={run.finalDish} onServe={serveFinalDish} />
      ) : null}
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
        <img className="opening-game-logo" src={gameLogo} alt="记忆厨房" draggable="false" />
        <StageBadge>营业准备</StageBadge>
        <h1>把情绪，做成一道会发光的菜。</h1>
        <p>
          客人会带着说不清的愿望来到厨房。你要作为主厨，把那些抽象的情绪变成料理。
        </p>
        <PixelButton icon={Utensils} onClick={onStart}>开始营业</PixelButton>
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
      </div>
      <div className="counter-scene chef-preview-scene kitchen-stage">
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
      <div className="arrival-room-shell" aria-hidden="true">
        <img className="arrival-env-wall" src="/assets/art-library/environment/arrival-env-wall.png" alt="" draggable="false" />
        <img className="arrival-env-lantern arrival-env-lantern-left" src="/assets/art-library/environment/arrival-env-lantern-left.png" alt="" draggable="false" />
        <img className="arrival-env-lantern arrival-env-lantern-right" src="/assets/art-library/environment/arrival-env-lantern-right.png" alt="" draggable="false" />
      </div>

      <div className="arrival-guest-ticket" aria-hidden="true">
        {guest.art?.src ? <img src={guest.art.src} alt="" draggable="false" /> : null}
        <div>
          <strong>今日客人</strong>
          <span>{guest.label}</span>
        </div>
      </div>

      <div className="arrival-stove-foreground" aria-hidden="true">
        <img className="arrival-env-counter-left" src="/assets/art-library/environment/arrival-env-counter.png" alt="" draggable="false" />
      </div>

      <div className="arrival-counter-midground" aria-hidden="true">
        <img className="arrival-env-counter-main" src="/assets/art-library/environment/arrival-env-counter.png" alt="" draggable="false" />
        <img className="arrival-env-steam-asset" src="/assets/art-library/environment/arrival-env-steam.png" alt="" draggable="false" />
      </div>

      <div className="guest-dialogue-group">
        <div className="guest-tag">
          <StageBadge>今日客人</StageBadge>
          <strong>{guest.label}</strong>
        </div>

        <div className="guest-request">
          <p>{guest.opening}</p>
        </div>

        <div className="dialogue-action-row">
          <span>把她的话变成料理灵感</span>
          <button className="star-start" type="button" onClick={onStart} aria-label="理解这份心情">
            理解这份心情
          </button>
        </div>
      </div>
      <div className="scene-steam steam-left" aria-hidden="true" />
      <div className="scene-steam steam-right" aria-hidden="true" />
      <div className="scene-sparkle" aria-hidden="true" />

      <div className="scene-actor chef-anchor chef-character">
        <ChefStand chef={chef} action="idle" />
      </div>

      <div className="scene-actor guest-anchor guest-character">
        <GuestStand guest={guest} />
      </div>
    </section>
  );
}

function BubbleTransition({ guest, chef }) {
  return (
    <section className="screen game-scene bubble-scene">
      <div className="scene-actor chef-anchor chef-character">
        <ChefStand chef={chef} action="thinking" />
      </div>
      <div className="thinking-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="scene-actor guest-anchor guest-character ghosted">
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
        <p>把客人的愿望藏进食材、形状、火候和回忆里。连续记下 {ideasPerDish} 份灵感后再开火。</p>
      </div>

      <div className="chat-panel fullscreen-chat">
        <div className="chat-header">
          <StageBadge>第 {round}/{maxRounds} 轮 · 灵感 {Math.min(answers.length + 1, ideasPerDish)}/{ideasPerDish}</StageBadge>
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

function GenerateDish({ guest, sessionId, answers, index, firstDish, onError, onDone }) {
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
    }).catch((err) => {
      console.error('generateDish failed:', err);
      if (!cancelled) onError('菜品生成失败，请重试。');
    });

    return () => {
      cancelled = true;
    };
  }, [answers, guest, index, onDone, onError, sessionId]);

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
  useEffect(() => {
    const timer = window.setTimeout(onNext, 1200);
    return () => window.clearTimeout(timer);
  }, [onNext]);

  return (
    <section className="screen dish-wait-screen between-dishes-auto" aria-live="polite">
      <div className="dish-generation-stage">
        <DishCard dish={dish} index={1} />
        <section className="dish-card empty-card auto-next-card">
          <div className="empty-plate" />
          <h3>第二页食谱正在翻开</h3>
          <p>主厨会继续追问这份心情，不需要手动点击。</p>
          <span className="auto-next-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </section>
      </div>
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
        <div className="evolved-dish">
          <DishCard dish={finalDish} index="Final" />
        </div>
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

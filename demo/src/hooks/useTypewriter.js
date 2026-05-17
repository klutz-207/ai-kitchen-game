import { useEffect, useState } from 'react';
import { playSound } from '../services/soundEffects';

export function useTypewriter(text, speed = 28, active = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active || !text) {
      setDisplayed('');
      setDone(false);
      return undefined;
    }

    setDisplayed('');
    setDone(false);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index % 3 === 0 && text[index - 1] !== ' ') {
        playSound('typeTick');
      }
      if (index >= text.length) {
        window.clearInterval(timer);
        setDone(true);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed, active]);

  return { displayed, done };
}

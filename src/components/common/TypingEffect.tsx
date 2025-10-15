'use client';

import { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  className?: string;
  startDelay?: number;
}

export function TypingEffect({
  text,
  speed = 50,
  className,
  startDelay = 0,
}: TypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (startDelay > 0) {
      const startTimer = setTimeout(() => {
        setIsStarted(true);
      }, startDelay);
      return () => clearTimeout(startTimer);
    } else {
      setIsStarted(true);
    }
  }, [startDelay]);

  useEffect(() => {
    if (isStarted) {
      let i = 0;
      setDisplayedText(''); // Reset when text or start status changes
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayedText((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(timer);
        }
      }, speed);

      return () => {
        clearInterval(timer);
      };
    }
  }, [text, speed, isStarted]);

  return <p className={className}>{displayedText}</p>;
}

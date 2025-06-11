
"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password?: string;
}

interface Strength {
  score: number;
  label: string;
  colorClass: string;
  widthClass: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = "" }) => {
  const [strength, setStrength] = useState<Strength>({
    score: 0,
    label: 'Too short',
    colorClass: 'bg-destructive',
    widthClass: 'w-[0%]',
  });

  useEffect(() => {
    let score = 0;
    const newStrength: Partial<Strength> = { score: 0 };

    if (!password) {
      newStrength.label = 'Too short';
      newStrength.colorClass = 'bg-destructive';
      newStrength.widthClass = 'w-[0%]';
      setStrength(newStrength as Strength);
      return;
    }

    // Criterion 1: Length
    if (password.length >= 8) {
      score++;
    } else {
      newStrength.label = 'Too short';
      newStrength.colorClass = 'bg-destructive';
      newStrength.widthClass = 'w-[10%]'; // Show a little red bar
      setStrength(newStrength as Strength);
      return; // Early exit if too short
    }

    // Criterion 2: Uppercase
    if (/[A-Z]/.test(password)) {
      score++;
    }
    // Criterion 3: Number
    if (/[0-9]/.test(password)) {
      score++;
    }
    // Criterion 4 & 5: Special Characters
    const specialCharsCount = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length;
    if (specialCharsCount >= 1) {
      score++;
    }
    if (specialCharsCount >= 2) {
      score++;
    }
    
    newStrength.score = score;

    switch (score) {
      case 0: // Should be caught by length check, but as a fallback
      case 1:
        newStrength.label = 'Very Weak';
        newStrength.colorClass = 'bg-destructive'; // Red
        newStrength.widthClass = 'w-[20%]';
        break;
      case 2:
        newStrength.label = 'Weak';
        newStrength.colorClass = 'bg-orange-500'; // Orange
        newStrength.widthClass = 'w-[40%]';
        break;
      case 3:
        newStrength.label = 'Medium';
        newStrength.colorClass = 'bg-yellow-500'; // Yellow
        newStrength.widthClass = 'w-[60%]';
        break;
      case 4:
        newStrength.label = 'Strong';
        newStrength.colorClass = 'bg-lime-500'; // Lime Green
        newStrength.widthClass = 'w-[80%]';
        break;
      case 5:
        newStrength.label = 'Very Strong';
        newStrength.colorClass = 'bg-green-500'; // Green
        newStrength.widthClass = 'w-[100%]';
        break;
      default: // Should not happen
        newStrength.label = 'Very Weak';
        newStrength.colorClass = 'bg-destructive';
        newStrength.widthClass = 'w-[20%]';
    }
    setStrength(newStrength as Strength);
  }, [password]);

  return (
    <div className="w-full">
      <div className={cn("h-2 w-full bg-muted rounded-full overflow-hidden border", strength.score > 0 ? "border-transparent" : "border-border")}>
        <div
          className={cn("h-full rounded-full transition-all duration-300 ease-in-out", strength.colorClass, strength.widthClass)}
        />
      </div>
      <p className={cn("text-xs mt-1", 
        strength.score <= 1 ? "text-destructive" :
        strength.score === 2 ? "text-orange-500" :
        strength.score === 3 ? "text-yellow-500" :
        strength.score === 4 ? "text-lime-500" :
        "text-green-500"
      )}>
        Password strength: {strength.label}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;


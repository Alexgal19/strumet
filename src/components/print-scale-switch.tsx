'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

export function PrintScaleSwitch() {
  const [isScaled, setIsScaled] = useState(false);

  useEffect(() => {
    if (isScaled) {
      document.documentElement.classList.add('scale-to-a4');
    } else {
      document.documentElement.classList.remove('scale-to-a4');
    }

    // Cleanup function to remove class when component unmounts
    return () => {
      document.documentElement.classList.remove('scale-to-a4');
    };
  }, [isScaled]);

  return (
    <div className="print-switch-container fixed bottom-4 right-4 z-50 rounded-lg border bg-background/80 p-3 shadow-lg backdrop-blur-sm print:hidden">
      <div className="flex items-center space-x-2">
        <Switch
          id="scale-to-a4-switch"
          checked={isScaled}
          onCheckedChange={setIsScaled}
        />
        <Label htmlFor="scale-to-a4-switch" className="cursor-pointer">
          Достосуй вміст до розміру А4
        </Label>
      </div>
       <p className="mt-2 text-xs text-muted-foreground">
        Увімкніть, якщо вміст не поміщається на одній сторінці.
      </p>
    </div>
  );
}

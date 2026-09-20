import { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import DesktopShell from './components/DesktopShell';
import StressLevelBar from './components/StressLevelBar';
import BentoDashboard from './components/BentoDashboard';
import { StressLevel } from './types';

export default function App() {
  const [stress, setStress] = useState<StressLevel>('low');
  return (
    <MotionConfig reducedMotion="user">
      <DesktopShell>
        <StressLevelBar value={stress} onChange={setStress} />
        <BentoDashboard stress={stress} />
      </DesktopShell>
    </MotionConfig>
  );
}

import type { ReactNode } from 'react';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { MarcoApp } from '../../components/MarcoApp.tsx';
import { VigiaAvisos } from '../../components/VigiaAvisos.tsx';

export default function LayoutApp({ children }: { children: ReactNode }) {
  return (
    <MarcoApp>
      <GuardiaApp>
        <VigiaAvisos />
        {children}
      </GuardiaApp>
    </MarcoApp>
  );
}

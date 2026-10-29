import type { ReactNode } from 'react';
import { GuardiaApp } from '../../components/GuardiaApp.tsx';
import { MarcoApp } from '../../components/MarcoApp.tsx';

export default function LayoutApp({ children }: { children: ReactNode }) {
  return (
    <MarcoApp>
      <GuardiaApp>{children}</GuardiaApp>
    </MarcoApp>
  );
}

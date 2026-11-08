import type { ReactNode } from 'react';
import { GuardiaApp } from '../../../components/GuardiaApp.tsx';

// Todo lo de /alta/ exige sesión con la cuenta lista (email verificado y textos aceptados).
export default function LayoutAlta({ children }: { children: ReactNode }) {
  return <GuardiaApp>{children}</GuardiaApp>;
}

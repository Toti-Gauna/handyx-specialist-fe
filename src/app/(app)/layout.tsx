import type { ReactNode } from 'react';
import { MarcoApp } from '../../components/MarcoApp.tsx';

export default function LayoutApp({ children }: { children: ReactNode }) {
  return <MarcoApp>{children}</MarcoApp>;
}

'use client';
import Link from 'next/link';
import { Icono } from './Icono.tsx';

export function Volver({ a, texto = 'Volver' }: { a: string; texto?: string }) {
  return (
    <Link href={a} className="volver">
      <Icono nombre="atras" /> {texto}
    </Link>
  );
}

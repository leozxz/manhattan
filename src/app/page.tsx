"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col p-8 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/background.png')" }}>
      {/* Título no topo */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-4xl font-extralight tracking-[.25em] uppercase text-gray-800">
          Manhattan
        </h1>
      </div>

      {/* Cards como área principal */}
      <div className="flex flex-1 items-center justify-center -mt-12">
        <div className="grid gap-6 sm:grid-cols-3 w-full max-w-5xl">
          {/* Card 1: Open Finance */}
          <div className="relative flex flex-col items-center justify-center gap-5 rounded-2xl border border-gray-200 bg-white p-12 text-center min-h-[420px]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-sm bg-[#E8396B] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              Recomendado
            </span>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Open Finance</h2>
              <p className="mt-1 text-sm text-gray-400">Conecte sua XP, BTG ou outra corretora</p>
            </div>
            <button
              onClick={() => router.push("/openfinance")}
              className="w-full rounded-lg bg-gray-900 px-6 py-3 text-lg font-semibold text-white hover:bg-gray-800 transition"
            >
              Conectar
            </button>
          </div>

          {/* Card 2: Demo */}
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-gray-200 bg-white p-12 text-center min-h-[420px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Demo</h2>
              <p className="mt-1 text-sm text-gray-400">Veja um exemplo com conta real da XP</p>
            </div>
            <button
              onClick={() => router.push("/demo")}
              className="w-full rounded-lg bg-gray-900 px-6 py-3 text-lg font-semibold text-white hover:bg-gray-800 transition"
            >
              Ver demo
            </button>
          </div>

          {/* Card 3: Simulador */}
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-gray-200 bg-white p-12 text-center min-h-[420px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Simulador</h2>
              <p className="mt-1 text-sm text-gray-400">Teste com investimentos simulados</p>
            </div>
            <button
              onClick={() => router.push("/simulator")}
              className="w-full rounded-lg bg-gray-900 px-6 py-3 text-lg font-semibold text-white hover:bg-gray-800 transition"
            >
              Simular
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

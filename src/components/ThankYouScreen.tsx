import { CheckCircle2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ThankYouScreen() {
  return (
    <main className="min-h-screen px-6 py-12 text-stone-900">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-[#d8c9b5] bg-white p-8 shadow-[0_30px_80px_-45px_rgba(78,52,38,0.35)] sm:p-12">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <img
              src="/acaro-logo.png"
              alt="ACARO - Asociación Café Robusta OBC"
              className="mb-6 h-24 w-auto"
            />

            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#eef5ef] text-[#2d5b3c]">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#2d5b3c]">
              Respuesta registrada
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-[#3e291f] sm:text-5xl">
              Gracias por completar la encuesta
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#6f5849]">
              Su información fue registrada correctamente. Puede cerrar esta página o regresar al
              listado de formularios disponibles.
            </p>

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#2d5b3c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4c3428]"
            >
              <Home className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

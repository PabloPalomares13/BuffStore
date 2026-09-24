import React, { useState, useEffect } from 'react';
import { Loader2, Pencil, ShoppingBag } from 'lucide-react';
import { getMyStoreFeedback, saveStoreFeedback } from '../services/StoreFeedbackService';

const MAX_CHARS = 500;

// Para cambiar o agregar preguntas: editar aquí y en RATING_KEYS del backend
// (models/StoreFeedback.js y Controllers/storeFeedbackControllers.js).
const QUESTIONS = [
  {
    key: 'purchaseEase',
    short: 'Facilidad de compra',
    label: '¿Qué tan fácil fue completar tu compra?',
    low: 'Muy difícil',
    high: 'Muy fácil'
  },
  {
    key: 'deliverySpeed',
    short: 'Rapidez de entrega',
    label: '¿Qué tan rápido recibiste tu juego o código?',
    low: 'Muy lento',
    high: 'Inmediato'
  },
  {
    key: 'paymentTrust',
    short: 'Seguridad del pago',
    label: '¿Qué tan seguro te sentiste al pagar?',
    low: 'Nada seguro',
    high: 'Totalmente seguro'
  }
];

const EMPTY_RATINGS = { purchaseEase: 0, deliverySpeed: 0, paymentTrust: 0 };

const ScaleInput = ({ id, label, low, high, value, onChange, disabled }) => (
  <div>
    <p id={id} className="text-sm text-white mb-2">
      {label}
    </p>
    <div role="radiogroup" aria-labelledby={id} className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`w-11 h-11 rounded-lg border font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d9ff] ${
            value === n
              ? 'bg-[#00d9ff] border-[#00d9ff] text-black'
              : 'bg-white/5 border-white/10 text-gray-300 hover:border-[#00d9ff]'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
    <div className="flex justify-between text-xs text-gray-500 mt-1 w-[252px] max-w-full">
      <span>{low}</span>
      <span>{high}</span>
    </div>
  </div>
);

/**
 * Recuadro "Cuéntanos sobre tu compra".
 * Solo se muestra si el usuario tiene una compra pagada de este juego.
 * Es opcional: no bloquea nada y solo lo ve el equipo de la tienda.
 */
const StoreFeedbackBox = ({ productId }) => {
  const token = localStorage.getItem('userToken');

  const [loading, setLoading] = useState(!!token);
  const [eligible, setEligible] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [saved, setSaved] = useState(null);

  const [ratings, setRatings] = useState(EMPTY_RATINGS);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const data = await getMyStoreFeedback(productId);
        if (cancelled) return;
        setEligible(!!data.eligible);
        setOrderId(data.orderId || null);
        setSaved(data.feedback || null);
      } catch (err) {
        // Si falla, simplemente no se muestra el recuadro (es opcional)
        console.error('Error consultando opinión de compra:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, token]);

  if (!token || loading || !eligible) return null;

  const startEdit = () => {
    setRatings({ ...EMPTY_RATINGS, ...saved.ratings });
    setComment(saved.comment || '');
    setFormError('');
    setJustSaved(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (QUESTIONS.some((q) => !ratings[q.key])) {
      return setFormError('Responde las 3 preguntas de calificación para enviar tu opinión.');
    }

    try {
      setSubmitting(true);
      const data = await saveStoreFeedback(orderId, { ratings, comment });
      setSaved(data.feedback);
      setEditing(false);
      setJustSaved(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setFormError('Tu sesión expiró. Inicia sesión de nuevo para enviar tu opinión.');
      } else {
        setFormError(err.response?.data?.message || 'No se pudo guardar tu opinión.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass =
    'bg-white/3 backdrop-blur-sm border border-[#00d9ff]/30 rounded-xl p-6';

  /* ---- Ya envió su opinión: resumen + botón editar ---- */
  if (saved && !editing) {
    return (
      <section className={cardClass}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00d9ff]" />
            <h3 className="font-semibold text-white">
              {justSaved ? 'Gracias por calificar tu compra' : 'Tu opinión sobre la compra'}
            </h3>
          </div>
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-[#00d9ff] hover:text-[#00d9ff] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {QUESTIONS.map((q) => (
            <div key={q.key} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <dt className="text-gray-400 text-xs mb-1">{q.short}</dt>
              <dd className="text-white font-semibold">{saved.ratings[q.key]} / 5</dd>
            </div>
          ))}
        </dl>

        {saved.comment && (
          <p className="text-gray-300 text-sm leading-relaxed mt-4 whitespace-pre-line break-words">
            {saved.comment}
          </p>
        )}
      </section>
    );
  }

  /* ---- Formulario ---- */
  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-5`}>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <ShoppingBag className="w-5 h-5 text-[#00d9ff]" />
          <h3 className="font-semibold text-white">Cuéntanos sobre tu compra</h3>
          <span className="text-xs text-gray-400 border border-white/10 rounded-full px-2 py-0.5">
            Opcional
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Esto es sobre la tienda y el proceso de compra, no sobre el juego. Solo lo ve nuestro equipo.
        </p>
      </div>

      {QUESTIONS.map((q) => (
        <ScaleInput
          key={q.key}
          id={`sf-${q.key}`}
          label={q.label}
          low={q.low}
          high={q.high}
          value={ratings[q.key]}
          disabled={submitting}
          onChange={(n) => setRatings((prev) => ({ ...prev, [q.key]: n }))}
        />
      ))}

      <div>
        <label htmlFor="sf-comment" className="text-sm text-white block mb-2">
          ¿Algo más que quieras contarnos sobre la tienda o el proceso de compra?
        </label>
        <textarea
          id="sf-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_CHARS}
          rows={3}
          disabled={submitting}
          placeholder="Sugerencias, problemas que encontraste, lo que te gustó..."
          className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] resize-y"
        />
        <div className="text-right text-xs text-gray-500">
          {comment.length}/{MAX_CHARS}
        </div>
      </div>

      {formError && (
        <p className="text-sm text-[#ff0055]" role="alert">
          {formError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00d9ff] to-[#0099cc] text-black font-semibold hover:shadow-lg hover:shadow-[#00d9ff]/40 transition-all disabled:opacity-60 flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved ? 'Guardar cambios' : 'Enviar opinión'}
        </button>
        {saved && (
          <button
            type="button"
            onClick={cancelEdit}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default StoreFeedbackBox;
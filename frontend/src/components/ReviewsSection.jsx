import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, BadgeCheck, Pencil, Trash2 } from 'lucide-react';
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview
} from '../services/ReviewService';
import StoreFeedbackBox from './StorefeedbackBox';

const PAGE_SIZE = 10;
const MAX_CHARS = 500;

/* ---------------- helpers ---------------- */

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const timeAgo = (iso) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'hace un momento';
};

const Stars = ({ value }) => (
  <span className="text-[#ffaa00] tracking-wide" aria-label={`${value} de 5 estrellas`}>
    {'★'.repeat(value)}
    <span className="text-gray-600">{'★'.repeat(5 - value)}</span>
  </span>
);

const StarInput = ({ value, onChange, disabled }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`text-3xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d9ff] rounded ${
            n <= (hover || value) ? 'text-[#ffaa00]' : 'text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const Avatar = ({ name, url }) =>
  url ? (
    <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff0055] to-[#00d9ff] flex items-center justify-center font-bold text-sm">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );

const OwnerBadge = () => (
  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/40 px-2 py-0.5 rounded-full">
    <BadgeCheck className="w-3.5 h-3.5" />
    Propietario
  </span>
);

const ReviewCard = ({ review, canDelete, onEdit, onDelete, highlight }) => (
  <article
    className={`bg-white/3 backdrop-blur-sm border rounded-xl p-6 transition-colors ${
      highlight ? 'border-[#00d9ff]/50' : 'border-white/10 hover:border-[#ff0055]'
    }`}
  >
    <div className="flex justify-between items-start mb-4 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={review.author.name} url={review.author.avatarUrl} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{review.author.name}</span>
            {review.isOwner && <OwnerBadge />}
            {highlight && <span className="text-xs text-[#00d9ff]">Tu reseña</span>}
          </div>
          <div className="text-xs text-gray-500">
            {timeAgo(review.createdAt)}
            {review.isEdited && ' (editada)'}
          </div>
        </div>
      </div>
      <Stars value={review.rating} />
    </div>

    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line break-words">
      {review.text}
    </p>

    {(review.isMine || canDelete) && (
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10 text-sm">
        {review.isMine && (
          <button
            onClick={() => onEdit(review)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:border-[#00d9ff] hover:text-[#00d9ff] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        )}
        <button
          onClick={() => onDelete(review)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:border-[#ff0055] hover:text-[#ff0055] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
    )}
  </article>
);

/* ---------------- componente principal ---------------- */

const ReviewsSection = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [myReview, setMyReview] = useState(null);
  const [viewerOwns, setViewerOwns] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const token = localStorage.getItem('userToken');
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  const load = useCallback(
    async (page = 1, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const data = await getReviews(productId, { page, limit: PAGE_SIZE });

        setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
        setStats(data.stats);
        setPagination(data.pagination);
        setMyReview(data.myReview);
        setViewerOwns(data.viewerOwnsProduct);
        setLoadError('');
      } catch (err) {
        console.error('Error cargando reseñas:', err);
        setLoadError('No pudimos cargar las reseñas. Intenta de nuevo en unos segundos.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const resetForm = () => {
    setEditing(false);
    setRating(0);
    setText('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (rating < 1) return setFormError('Elige una calificación de 1 a 5 estrellas.');
    if (text.trim().length < 5) return setFormError('Escribe al menos 5 caracteres.');

    try {
      setSubmitting(true);
      if (editing && myReview) await updateReview(myReview._id, { rating, text });
      else await createReview(productId, { rating, text });

      resetForm();
      await load(1);
    } catch (err) {
      if (err.response?.status === 401) {
        setFormError('Tu sesión expiró. Inicia sesión de nuevo para publicar tu reseña.');
      } else {
        setFormError(err.response?.data?.message || 'No se pudo guardar tu reseña.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (review) => {
    setEditing(true);
    setRating(review.rating);
    setText(review.text);
    setFormError('');
  };

  const handleDelete = async (review) => {
    if (!window.confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return;
    try {
      await deleteReview(review._id);
      resetForm();
      await load(1);
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar la reseña.');
    }
  };

  const others = reviews.filter((r) => !r.isMine);
  const showForm = token && (!myReview || editing);
  const hasMore = pagination.page < pagination.pages;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex items-center gap-4">
        {stats.totalReviews > 0 ? (
          <>
            <div className="text-4xl font-bold text-white font-space-mono">
              {stats.avgRating.toFixed(1)}
            </div>
            <div>
              <Stars value={Math.round(stats.avgRating)} />
              <div className="text-sm text-gray-400">
                {stats.totalReviews} {stats.totalReviews === 1 ? 'reseña' : 'reseñas'} de jugadores
              </div>
            </div>
          </>
        ) : (
          !loading && (
            <p className="text-gray-400">
              Aún no hay reseñas de {productName}. Escribe la primera.
            </p>
          )
        )}
      </div>

      {/* Formulario / invitación a iniciar sesión */}
      {!token && (
        <div className="bg-white/3 border border-white/10 rounded-xl p-5 text-gray-300 text-sm">
          <Link to="/login" className="text-[#00d9ff] font-semibold hover:underline">
            Inicia sesión
          </Link>{' '}
          para escribir una reseña.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/3 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4"
        >
          <h3 className="font-semibold text-white">
            {editing ? 'Edita tu reseña' : `¿Qué te pareció ${productName}?`}
          </h3>

          {viewerOwns && (
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <OwnerBadge /> Tu reseña llevará la etiqueta de propietario.
            </p>
          )}

          <StarInput value={rating} onChange={setRating} disabled={submitting} />

          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_CHARS}
              rows={4}
              disabled={submitting}
              placeholder="Cuenta tu experiencia: jugabilidad, gráficos, rendimiento..."
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] resize-y"
            />
            <div className="text-right text-xs text-gray-500">
              {text.length}/{MAX_CHARS}
            </div>
          </div>

          {formError && <p className="text-sm text-[#ff0055]" role="alert">{formError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0055] to-[#cc0044] text-white font-semibold hover:shadow-lg hover:shadow-[#ff0055]/40 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Guardar cambios' : 'Publicar reseña'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* Opinión sobre la compra: solo aparece si el usuario es propietario del juego */}
      {token && <StoreFeedbackBox productId={productId} />}

      {/* Listado */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d9ff]" />
        </div>
      ) : loadError ? (
        <div className="text-center py-8">
          <p className="text-[#ff0055] mb-3">{loadError}</p>
          <button
            onClick={() => load(1)}
            className="px-5 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myReview && !editing && (
            <ReviewCard
              review={myReview}
              highlight
              canDelete={false}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          )}

          {others.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              canDelete={isAdmin}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => load(pagination.page + 1, true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all disabled:opacity-60 inline-flex items-center gap-2"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                Ver más reseñas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
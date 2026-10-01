import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StarIcon } from './Icons';

const reviewDate = value => {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return null;
  return { value: String(value).slice(0, 10), label: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) };
};

export default function CustomerReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const savingRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    loadingRef.current = true;
    setLoading(true);
    setLoadError('');
    api.get('/reviews/store', { params: { page: 1, limit: 6 }, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setReviews(data.reviews);
        setPage(data.page);
        setHasMore(data.page < data.pages);
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError('Could not load reviews. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) { setLoading(false); loadingRef.current = false; } });
    return () => controller.abort();
  }, [retry]);

  const loadMore = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/reviews/store', { params: { page: page + 1, limit: 6 } });
      setReviews(current => [...new Map([...current, ...data.reviews].map(review => [review.id, review])).values()]);
      setPage(data.page);
      setHasMore(data.page < data.pages);
    } catch { setLoadError('Could not load more reviews. Please try again.'); }
    finally { setLoading(false); loadingRef.current = false; }
  };

  const submit = async event => {
    event.preventDefault();
    if (savingRef.current || !user) return;
    setError('');
    setMessage('');
    if (!rating || !comment.trim()) {
      setError('Select a star rating and write your review.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const { data } = await api.post('/reviews/store', { rating, comment: comment.trim() });
      setReviews(current => [data.review, ...current.filter(review => review.id !== data.review.id)]);
      setMessage('Thank you! Your review is now displayed above.');
      setComment('');
      setRating(0);
    } catch (err) {
      setError(err.response?.status === 401 ? 'Your session has expired. Please sign in again to submit your review.' : err.response?.data?.message || 'Could not save your review. Please try again.');
    } finally { setSaving(false); savingRef.current = false; }
  };

  return (
    <section id="customer-reviews" className="customer-reviews container-x" aria-labelledby="customer-reviews-heading">
      <div className="customer-reviews-heading">
        <p className="reviews-eyebrow">Comfort. Style. Everyday.</p>
        <h2 id="customer-reviews-heading" className="reference-heading">Customer reviews</h2>
        <p className="reviews-preview-note">Your fit. Your style. Your experience. Share it with the Koorm community.</p>
      </div>
      <div className="review-card-grid" aria-busy={loading}>
        {reviews.map(review => {
          const date = reviewDate(review.created_at);
          return (
          <article className="review-card" key={review.id}>
            <div className="review-card-top">
              <span className="review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map(star => <StarIcon key={star} width={16} height={16} filled={star <= review.rating} aria-hidden="true" />)}
              </span>
            </div>
            <blockquote>{review.comment || 'This customer shared a star rating.'}</blockquote>
            {review.admin_reply && <div className="review-admin-reply"><p className="review-admin-reply-label">Koorm team reply</p><p>{review.admin_reply}</p></div>}
            <div className="review-card-footer">
              <div className="review-author"><span>{review.user_name}</span><span className="review-author-caption">Koorm customer</span></div>
              {date && <time className="review-date" dateTime={date.value}>{date.label}</time>}
            </div>
          </article>
          );
        })}
      </div>
      <div className="review-list-status">
        {loading && <p role="status">Loading reviews...</p>}
        {!loading && !loadError && !reviews.length && <p>Be the first to share your experience with Koorm.</p>}
        {loadError && <p role="alert">{loadError} <button className="text-link" onClick={() => page ? loadMore() : setRetry(value => value + 1)}>Try again</button></p>}
        {hasMore && !loadError && <button className="campaign-button" onClick={loadMore} disabled={loading}>{loading ? 'Loading...' : 'More reviews'}</button>}
      </div>
      <div className="review-write-panel">
        <div className="review-write-intro">
          <h3>How does it feel?</h3>
          <p>Tell us about the fit, fabric, and the details you love.</p>
          <p className="review-form-note">Your review and first name will be public. Each submitted review appears as a new card above.</p>
        </div>
        <form onSubmit={submit} className="review-form" aria-label="Write a review">
          <fieldset disabled={!user || saving}>
            <legend>Write a review</legend>
            <fieldset className="review-rating-input">
              <legend>Your rating</legend>
              <div className="review-rating-stars">
                {[1, 2, 3, 4, 5].map(star => <label key={star}>
                  <input type="radio" name="review-rating" value={star} checked={rating === star} onChange={() => setRating(star)} required aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`} />
                  <StarIcon width={26} height={26} filled={star <= rating} aria-hidden="true" />
                </label>)}
                <span aria-live="polite">{rating ? `${rating} / 5` : 'Select a rating'}</span>
              </div>
            </fieldset>
            <label htmlFor="review-comment">Your review</label>
            <textarea id="review-comment" className="input-field" required maxLength={1000} rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="How was the fit and fabric?" aria-describedby="review-comment-limit" />
            <span id="review-comment-limit" className="review-character-count">{comment.length} / 1,000</span>
          </fieldset>
          {error && <p role="alert" className="review-form-error">{error}</p>}
          {message && <p role="status" className="review-form-success">{message}</p>}
          {user ? <button type="submit" className="campaign-button campaign-button-dark" disabled={saving || loading}>{saving ? 'Submitting...' : 'Submit review'}</button>
            : <p className="review-login"><Link to="/login" state={{ from: { pathname: '/' } }} className="campaign-button campaign-button-dark">Sign in to write a review</Link></p>}
        </form>
      </div>
    </section>
  );
}

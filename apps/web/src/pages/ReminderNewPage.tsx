import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateReminder, type ReminderInputBody } from '../hooks/queries';
import ReminderForm from '../components/ReminderForm';
import { SubscribePrompt } from '../components/SubscribePrompt';
import { ApiError } from '../lib/api';

function defaultWallClock(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 15 - (d.getMinutes() % 15));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(
    d.getHours()
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ReminderNewPage() {
  const navigate = useNavigate();
  const create = useCreateReminder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  async function onSubmit(body: ReminderInputBody) {
    setBusy(true);
    setError('');
    try {
      const reminder = await create.mutateAsync(body);
      navigate(`/reminders/${reminder.id}`, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUBSCRIPTION_REQUIRED') {
        setSubscriptionRequired(true);
      } else {
        setError(e instanceof Error ? e.message : 'Could not create reminder');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-narrow">
      <div className="page-head">
        <div>
          <h1>New reminder</h1>
          <p className="dim">We&apos;ll call you and read your message at the scheduled time.</p>
        </div>
      </div>
      {subscriptionRequired ? (
        <SubscribePrompt />
      ) : (
        <ReminderForm
          initial={{ title: '', message: '', timezone: '', localDateTime: defaultWallClock(), repeatRule: 'NONE', phoneNumberId: '' }}
          submitLabel="Schedule call"
          busy={busy}
          error={error}
          onSubmit={onSubmit}
        />
      )}
    </section>
  );
}
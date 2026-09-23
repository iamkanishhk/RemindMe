import { useState } from 'react';
import { useUser, useReverification } from '@clerk/react';
import {
  useCreatePhoneNumber,
  useDeletePhoneNumber,
  usePhoneNumbers,
  useVerifyPhoneNumber
} from '../hooks/queries';
import type { PhoneNumber } from '../lib/types';
import { ApiError } from '../lib/api';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';

function normalizeE164(raw: string): string {
  return raw.replace(/[\s()-]/g, '');
}

function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

export default function PhoneNumbersPage() {
  const { user } = useUser();
  const phones = usePhoneNumbers();
  const createClerkPhone = useReverification(async (phoneNumber: string) => {
    if (!user) throw new Error('Not signed in');
    return user.createPhoneNumber({ phoneNumber });
  });
  const createPhone = useCreatePhoneNumber();
  const verifyPhone = useVerifyPhoneNumber();
  const deletePhone = useDeletePhoneNumber();

  const [e164Input, setE164Input] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState<{ e164: string; clerkPhoneId: string } | null>(null);
  const [code, setCode] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [forceFor, setForceFor] = useState<string | null>(null);

  async function addNumber(e: React.FormEvent) {
    e.preventDefault();
    const e164 = normalizeE164(e164Input);
    if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
      setError('Enter a full phone number with country code, e.g. +60123456789');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createPhone.mutateAsync(e164);
      setE164Input('');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function completeVerify(e164: string, clerkPhoneId: string) {
    await verifyPhone.mutateAsync({ e164, clerkVerificationId: clerkPhoneId });
    setVerifying(null);
    setCode('');
  }

  async function startVerify(e164: string) {
    if (!user) return;
    setError('');
    try {
      let pn = user.phoneNumbers.find((p) => p.phoneNumber === e164);
      if (!pn) pn = await createClerkPhone(e164);

      if (pn.verification?.status === 'verified') {
        await completeVerify(e164, pn.id);
        return;
      }
      await pn.prepareVerification();
      setVerifying({ e164, clerkPhoneId: pn.id });
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!verifying || !user) return;
    setCodeBusy(true);
    setError('');
    try {
      const pn = user.phoneNumbers.find((p) => p.id === verifying.clerkPhoneId);
      if (!pn) throw new Error('This verification session is no longer active. Start again.');
      await pn.attemptVerification({ code: code.trim() });
      if (pn.verification?.status !== 'verified') throw new Error('That code was not accepted. Try again.');
      await completeVerify(verifying.e164, pn.id);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setCodeBusy(false);
    }
  }

  async function doDelete(p: PhoneNumber) {
    setError('');
    try {
      const force = forceFor === p.id;
      await deletePhone.mutateAsync({ id: p.id, force });
      setForceFor(null);
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'CONFLICT' || err.status === 409)) {
        setForceFor(p.id);
        setError(`${err.message} Click delete again to force-cancel those reminders.`);
      } else {
        setError(messageOf(err));
        setForceFor(null);
      }
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Phone numbers</h1>
          <p className="dim">Numbers must be verified (via SMS code) before they can receive reminder calls.</p>
        </div>
      </div>

      <ErrorBanner message={error} />

      <form className="inline-form" onSubmit={(e) => void addNumber(e)}>
        <input
          type="tel"
          inputMode="tel"
          placeholder="+60123456789"
          value={e164Input}
          onChange={(e) => setE164Input(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Spinner /> : 'Add number'}
        </button>
      </form>

      {verifying ? (
        <div className="card verify-card">
          <h2>Verify {verifying.e164}</h2>
          <p className="dim">We sent an SMS code via Clerk. Enter it below.</p>
          <form className="inline-form" onSubmit={(e) => void submitCode(e)}>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={codeBusy || code.trim().length === 0}>
              {codeBusy ? <Spinner /> : 'Verify code'}
            </button>
          </form>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVerifying(null)}>
            Cancel
          </button>
        </div>
      ) : null}

      {phones.isLoading ? (
        <Spinner label="Loading phone numbers…" />
      ) : (phones.data ?? []).length === 0 ? (
        <EmptyState
          title="No phone numbers"
          hint="Add a number above, then verify it with the SMS code so we can call it."
        />
      ) : (
        <div className="list">
          {phones.data?.map((p) => (
            <div key={p.id} className="card row">
              <div className="row-main">
                <span className="mono">{p.e164}</span>
                {p.verified ? <span className="badge badge-ok">Verified</span> : <span className="badge">Unverified</span>}
              </div>
              <div className="row-actions">
                {!p.verified ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void startVerify(p.e164)}>
                    Verify
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`btn btn-sm ${forceFor === p.id ? 'btn-danger' : 'btn-danger-outline'}`}
                  onClick={() => void doDelete(p)}
                >
                  {forceFor === p.id ? 'Confirm force-delete' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
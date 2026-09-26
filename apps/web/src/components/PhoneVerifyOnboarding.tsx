import { useEffect, useRef, useState } from 'react';
import { useUser, useReverification } from '@clerk/react';
import { useCreatePhoneNumber, useVerifyPhoneNumber } from '../hooks/queries';
import { ApiError } from '../lib/api';
import { Spinner } from './Spinner';
import { useErrorToast } from './Toast';

const countries = [
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+91', name: 'India', flag: '🇮🇳' }
];

function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

function formatTimer(seconds: number): string {
  return `00:${String(Math.max(seconds, 0)).padStart(2, '0')}`;
}

export default function PhoneVerifyOnboarding() {
  const { user } = useUser();
  const createPhone = useCreatePhoneNumber();
  const verifyPhone = useVerifyPhoneNumber();
  const createClerkPhone = useReverification(async (phoneNumber: string) => {
    if (!user) throw new Error('Not signed in');
    return user.createPhoneNumber({ phoneNumber });
  });

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryIndex, setCountryIndex] = useState(0);
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState<{ e164: string; clerkPhoneId: string } | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [codeBusy, setCodeBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useErrorToast(error);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otpRef = useRef<{ e164: string; clerkPhoneId: string } | null>(null);

  const country = countries[countryIndex] ?? countries[0]!;
  const e164 = `${country.code}${raw.replace(/\D/g, '')}`;

  useEffect(() => {
    if (step !== 'otp' || remaining <= 0) return;
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [step, remaining]);

  useEffect(() => {
    if (step !== 'otp') return;
    const t = window.setTimeout(() => otpRefs.current[0]?.focus(), 400);
    return () => window.clearTimeout(t);
  }, [step]);

  async function completeVerify(e164p: string, clerkPhoneId: string) {
    await verifyPhone.mutateAsync({ e164: e164p, clerkVerificationId: clerkPhoneId });
  }

  async function sendCode() {
    if (!user) return;
    if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
      setError('Enter a full phone number including your country code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createPhone.mutateAsync(e164);
      let pn = user.phoneNumbers.find((p) => p.phoneNumber === e164);
      if (!pn) pn = await createClerkPhone(e164);

      if (pn.verification?.status === 'verified') {
        await completeVerify(e164, pn.id);
        return;
      }
      await pn.prepareVerification();
      otpRef.current = { e164, clerkPhoneId: pn.id };
      setVerifying({ e164, clerkPhoneId: pn.id });
      setOtp(Array(6).fill(''));
      setRemaining(45);
      setStep('otp');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(codeStr?: string) {
    const code = codeStr ?? otp.join('');
    const target = otpRef.current ?? verifying;
    if (!target || !user) return;
    if (!/^\d{6}$/.test(code)) return;
    setCodeBusy(true);
    setError('');
    try {
      const pn = user.phoneNumbers.find((p) => p.id === target.clerkPhoneId);
      if (!pn) throw new Error('This verification session is no longer active. Start again.');
      await pn.attemptVerification({ code });
      if (pn.verification?.status !== 'verified') throw new Error('That code was not accepted. Try again.');
      await completeVerify(target.e164, pn.id);
    } catch (err) {
      setError(messageOf(err));
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setCodeBusy(false);
    }
  }

  async function resend() {
    const target = otpRef.current ?? verifying;
    if (!target || !user) return;
    setError('');
    try {
      const pn = user.phoneNumbers.find((p) => p.id === target.clerkPhoneId);
      if (!pn) throw new Error('This verification session is no longer active. Start again.');
      await pn.prepareVerification();
      setOtp(Array(6).fill(''));
      setRemaining(45);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  function changeNumber() {
    setStep('phone');
    setVerifying(null);
    otpRef.current = null;
    setOtp(Array(6).fill(''));
    setRemaining(0);
    setError('');
  }

  function onOtpInput(i: number, value: string) {
    if (codeBusy) return;
    const next = [...otp];
    next[i] = value.replace(/\D/g, '').slice(-1);
    setOtp(next);
    if (next[i] && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every(Boolean)) void submitCode(next.join(''));
  }

  function onOtpKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  }

  function onOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    if (codeBusy) return;
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = Array(6).fill('');
    for (const d of digits) next[next.indexOf('')] = d;
    setOtp(next);
    if (next.some(Boolean)) otpRefs.current[Math.min(digits.length, 5)]?.focus();
    if (next.every(Boolean)) void submitCode(next.join(''));
  }

  const canResend = step === 'otp' && remaining <= 0 && !codeBusy && (otpRef.current ?? verifying) !== null;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] flex flex-col items-center justify-center p-6 select-none font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text',sans-serif] antialiased">
      <div className="w-full max-w-[390px] overflow-hidden relative rounded-[38px]  shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6">
        {/* Animated Container Slider */}
        <div
          className={`w-[200%] flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            step === 'otp' ? '-translate-x-1/2' : 'translate-x-0'
          }`}
        >
          {/* STEP 1: PHONE NUMBER INPUT */}
          <div
            className={`w-1/2 shrink-0 flex flex-col justify-between transition-opacity duration-300 ease-out pr-3 ${
              step === 'phone' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <h1 className="text-[28px] font-bold text-[color:var(--text)] tracking-tight leading-snug">
                  Where should we
                  <br />
                  call you?
                </h1>
                <p className="text-[14px] text-neutral-400 font-normal leading-relaxed">
                  We&apos;ll use this number to deliver
                  <br />
                  your reminder calls.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                {/* Country Code Picker */}
                <div className="relative w-[110px] shrink-0">
                  <div className="w-full h-[52px] bg-[color:var(--surface)] border border-white/10 rounded-2xl flex items-center justify-between px-3 shadow-inner active:bg-[color:var(--surface-2)] transition-colors pointer-events-none">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="text-base">
                        {country.flag}
                      </span>
                      <span className="text-sm font-semibold text-[color:var(--text)] tracking-wide">{country.code}</span>
                    </span>
                    <svg viewBox="0 0 320 512" fill="currentColor" className="h-2.5 w-2.5 text-neutral-400" aria-hidden="true">
                      <path d="M301.7 158.3l-137 137a23.9 23.9 0 0 1-33.9 0l-137-137a23.9 23.9 0 0 1 0-33.9l22.6-22.6a23.9 23.9 0 0 1 33.9 0L160 222.1 245.4 101.7a23.9 23.9 0 0 1 33.9 0l22.6 22.6a23.9 23.9 0 0 1-.2 34z" />
                    </svg>
                  </div>
                  <select
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
                    aria-label="Country code"
                    value={countryIndex}
                    onChange={(e) => setCountryIndex(Number(e.target.value))}
                  >
                    {countries.map((c, i) => (
                      <option key={`${c.code}-${i}`} value={i} className="bg-[color:var(--surface)] text-[color:var(--text)]">
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone Input */}
                <div className="flex-1">
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="98765 43210"
                    value={raw}
                    maxLength={14}
                    onChange={(e) => setRaw(e.target.value.replace(/[^\d\s()-]/g, ''))}
                    className="w-full h-[52px] bg-[color:var(--surface)] border border-white/10 rounded-2xl px-4 text-[15px] font-medium text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:outline-none focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)] transition"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => void sendCode()}
                  disabled={busy}
                  className="w-full h-[52px] rounded-2xl font-semibold text-[15px] text-[color:var(--on-primary)] flex items-center justify-center gap-2 bg-[color:var(--primary)] transition active:scale-[0.98] active:bg-[color:var(--primary-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? <Spinner /> : 'Send verification code'}
                </button>
              </div>
            </div>

            <div className="pb-2 text-center space-y-5 mt-10">
              <p className="text-[12px] text-neutral-500 font-normal">Standard call and data rates may apply.</p>
            </div>
          </div>

          {/* STEP 2: OTP INPUT */}
          <div
            className={`w-1/2 shrink-0 flex flex-col justify-between transition-opacity duration-300 ease-out pl-3 ${
              step === 'otp' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <div className="w-full flex items-center h-8 shrink-0">
              <button
                type="button"
                onClick={changeNumber}
                className="w-8 h-8 rounded-full  flex items-center justify-center text-[color:var(--text)] active:bg-[color:var(--surface-2)] transition active:scale-95"
                aria-label="Change number"
              >
                <svg viewBox="0 0 320 512" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M206.7 470.6L22.6 286.5a31.9 31.9 0 0 1 0-45.3L206.7 57.4c12.5-12.5 32.8-12.5 45.3 0l22.6 22.6c12.5 12.5 12.5 32.8 0 45.3L162.1 256l112.5 130.7c12.5 12.5 12.5 32.8 0 45.3l-22.6 22.6c-12.5 12.5-32.8 12.5-45.3 0z" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 pt-2 my-auto">
              <div className="space-y-2">
                <h1 className="text-[28px] font-bold text-[color:var(--text)] tracking-tight leading-snug">
                  Enter the 6-digit code
                  <br />
                  we sent.
                </h1>
                <p className="text-[14px] text-neutral-400 font-normal leading-relaxed">
                  We sent a code to{' '}
                  <span className="font-semibold text-[color:var(--text)]">{verifying ? verifying.e164 : (otpRef.current?.e164 ?? '')}</span>
                </p>
              </div>

              {/* OTP Input Grid */}
              <div className="grid grid-cols-6 gap-2 pt-1">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    maxLength={1}
                    pattern="\d*"
                    inputMode="numeric"
                    value={d}
                    onChange={(e) => onOtpInput(i, e.target.value)}
                    onKeyDown={(e) => onOtpKey(i, e)}
                    onPaste={onOtpPaste}
                    aria-label={`Digit ${i + 1}`}
                    className="w-full h-[52px] bg-[color:var(--surface)] border border-white/10 rounded-2xl text-center font-semibold text-xl text-[color:var(--text)] focus:ring-1 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] focus:bg-[color:var(--surface-2)] outline-none transition-all"
                  />
                ))}
              </div>

              <div className="text-center space-y-3 pt-1">
                {remaining > 0 ? (
                  <p className="text-xs text-neutral-500 font-medium tracking-wide">
                    Resend code (<span>{formatTimer(remaining)}</span>)
                  </p>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void resend()}
                      className="text-xs text-[color:var(--primary)] font-semibold cursor-pointer tracking-wide"
                    >
                      {canResend ? 'Resend code now' : 'Sending…'}
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={changeNumber}
                        className="text-xs font-semibold text-[color:var(--primary)] active:opacity-75 cursor-pointer tracking-wide"
                      >
                        Change number
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center min-h-[24px]">
                {codeBusy ? <Spinner label="Verifying code…" /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
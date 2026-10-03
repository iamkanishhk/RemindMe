import { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { Spinner } from '../components/Spinner';
import { Skeleton } from '../components/Skeleton';
import { useErrorToast } from '../components/Toast';
import { useCompleteOnboarding, useMe } from '../hooks/queries';
import { resolveDisplayName } from '../lib/displayName';
// PLACEHOLDER: swap this asset once the final Maya artwork is ready.
import mayaIllustration from '../../public/assets/maya.gif';
import SoftAurora from '../components/SoftAurora';

const FULL_INTRO_TEXT = "I’m Maya, and I remind you of anything you forget on calls.";
const TYPING_SPEED_MS = 45; // Speed of each character being typed

/**
 * Onboarding step 2: introduce Maya after the phone number is verified.
 * Guarded by OnboardingGate so it only appears until the user presses Continue.
 */
export default function OnboardingMayaPage() {
  const { user } = useUser();
  const me = useMe();
  const complete = useCompleteOnboarding();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  // State for typing animation
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useErrorToast(error);

  const name = resolveDisplayName(
    user?.fullName,
    me.data?.email ?? user?.primaryEmailAddress?.emailAddress
  );

  // Initialize audio and clean up on unmount
  useEffect(() => {
    audioRef.current = new Audio('/assets/introduction.wav');

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  // Simple timer-based typing animation
  const startTypingAnimation = () => {
    setTypedText('');
    setIsTyping(true);

    let index = 0;
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    typingTimerRef.current = setInterval(() => {
      index++;
      setTypedText(FULL_INTRO_TEXT.slice(0, index));

      if (index >= FULL_INTRO_TEXT.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
      }
    }, TYPING_SPEED_MS);
  };

  // Already finished onboarding (e.g. a stale link) - go straight to the dashboard.
  if (me.data && me.data.onboardingCompletedAt) {
    return <Navigate to="/" replace />;
  }

  async function handleContinue() {
    if (complete.isPending) return;

    // First click: Play intro sound and trigger timer typing animation
    if (!hasPlayedSound) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.warn('Audio playback failed:', err);
        });
      }

      startTypingAnimation();
      setHasPlayedSound(true);
      return;
    }

    // Second click: Stop audio, clear timer, and complete onboarding
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    setError('');
    try {
      await complete.mutateAsync();
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your progress. Please try again.');
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col justify-between items-center px-6 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] select-none touch-manipulation bg-[color:var(--bg)] text-[color:var(--text)]">
      
      
               <div className="fixed top-[-40vh] inset-x-0 w-full h-full opacity-50 ">
                   <SoftAurora
                    colorStops={["#AE897F","#B26B56","#B35443"]}
                    blend={0.5}
                    amplitude={1}
                    speed={1}
                   
                  />
               </div>
      {/* Main Container - Balanced vertical center layout */}
      <main className="flex-1 w-full max-w-sm flex flex-col items-center justify-center min-h-0 gap-5 text-center">
        
        {/* Artwork Area with soft radial ambient backlight */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="absolute w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl -z-10 pointer-events-none" />
          <img
            src={mayaIllustration}
            alt="Maya assistant avatar"
            className="w-48 h-48 max-h-[28vh] object-contain transition-transform duration-300 active:scale-105 filter drop-shadow-md"
          />
        </div>

        {/* Text Area - Defined visual hierarchy & reserved layout height to eliminate shifts */}
        <div className="flex flex-col items-center space-y-2.5 px-2 w-full">
          {/* Headline - Primary Accent */}
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-[color:var(--text)]">
            {name ? `Hi, ${name}!` : 'Hi there!'}
          </h1>

          {/* Typing Subtitle Container - Height reserved so layout never jumps */}
          <div className="min-h-[3.75rem] flex items-center justify-center w-full">
            {hasPlayedSound ? (
              <p className="text-lg font-medium leading-snug text-[color:var(--text-muted)] max-w-xs animate-fade-in">
                {typedText}
                {isTyping && <span className="animate-pulse ml-0.5 text-indigo-400 font-bold">|</span>}
              </p>
            ) : (
              <p className="text-sm font-medium text-[color:var(--text-dim)] tracking-wide uppercase opacity-80">
                Tap below to hear my introduction
              </p>
            )}
          </div>

          {/* Secondary Subtext */}
          <p className="text-sm text-[color:var(--text-dim)] font-normal leading-normal max-w-[270px]">
            Just set my schedule and I&rsquo;ll handle the rest.
          </p>
        </div>
      </main>

      {/* Fixed Sticky Action Bar */}
      <footer className="w-full max-w-sm shrink-0 pt-2 space-y-3">
        <button
          type="button"
          aria-label={hasPlayedSound ? 'Continue to Dashboard' : 'Listen Intro and Continue'}
          className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 bg-[image:var(--gradient-primary)] text-[color:var(--on-primary)] shadow-lg shadow-indigo-950/30 transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={complete.isPending}
          onClick={() => void handleContinue()}
        >
          {complete.isPending ? (
            <Spinner />
          ) : (
            <span className="flex items-center gap-2">
              {!hasPlayedSound && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 shrink-0"
                >
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H3.75A1.75 1.75 0 0 0 2 9.25v5.5c0 .966.784 1.75 1.75 1.75h2.69l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM18.53 7.47a.75.75 0 0 0-1.06 1.06 4.5 4.5 0 0 1 0 6.364.75.75 0 0 0 1.06 1.06 6 6 0 0 0 0-8.484Z" />
                </svg>
              )}
              {hasPlayedSound ? 'Continue to Dashboard' : 'Listen'}
            </span>
          )}
        </button>

        {me.isPending && (
          <div className="skeleton-area-light">
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        )}
      </footer>
    </div>
  );
}
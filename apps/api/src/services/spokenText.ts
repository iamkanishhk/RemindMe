// Randomized spoken greeting composed at call time, so recurring reminders get
// a fresh opener on every call and always use the user's current first name
// from their registration.

const GREETINGS = [
  'I hope you are doing great',
  "I hope you're having a wonderful day",
  'Hope everything is going well today',
  'I hope you are doing well today',
  "Hope you're having a peaceful day"
];

export function randomGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)] ?? 'I hope you are doing great';
}

export function composeSpokenText(opts: {
  firstName?: string | null;
  voiceMessage?: string | null;
  message: string;
}): string {
  const core = (opts.voiceMessage && opts.voiceMessage.trim()) || opts.message;
  const opener = opts.firstName ? `Hello ${opts.firstName}, ${randomGreeting()}!` : `Hello there, ${randomGreeting()}!`;
  return `${opener} ${core}`;
}
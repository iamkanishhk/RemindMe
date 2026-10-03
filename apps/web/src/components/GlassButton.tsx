import LiquidGlass from 'liquid-glass-react';
import type { ComponentProps } from 'react';

export type GlassButtonProps = ComponentProps<typeof LiquidGlass>;

export function GlassButton(props: GlassButtonProps) {
  return <LiquidGlass {...props} />;
}

export default GlassButton;

export interface PlaceCallParams {
  to: string;
  from: string;
  message: string;
  reminderId: string;
  webhookUrl: string;
}

export interface PlacedCall {
  providerCallId: string;
}

export interface TelephonyEvent {
  eventType: string;
  occurredAt: string;
  webhookId?: string;
  payload: Record<string, unknown>;
  raw: unknown;
}

export interface TelephonyProvider {
  placeCall(params: PlaceCallParams): Promise<PlacedCall>;
  speak(callControlId: string, message: string): Promise<void>;
  hangup(callControlId: string): Promise<void>;
}
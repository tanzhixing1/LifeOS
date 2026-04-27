import type { ChatCompletionOptions, Message } from './types';
import { createMockProvider, type MockProviderConfig } from './providers/mock';

const provider = createMockProvider();

export async function sendMessage(input: { message: string; system?: string; options?: ChatCompletionOptions }): Promise<string> {
  const messages: Message[] = [];
  if (input.system) messages.push({ role: 'system', content: input.system });
  messages.push({ role: 'user', content: input.message });
  const res = await provider.chatCompletion(messages, input.options);
  return res.content;
}

export async function listModels(): Promise<string[]> {
  return ['mock'];
}

export function configureMockProvider(config: MockProviderConfig) {
  Object.assign(provider, createMockProvider(config));
}


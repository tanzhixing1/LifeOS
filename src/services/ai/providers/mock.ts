import type { IAIProvider } from '../interface';
import type { AIResponse, ChatCompletionOptions, Message } from '../types';

export type MockProviderConfig = {
  fixedReply?: string;
};

export function createMockProvider(config: MockProviderConfig = {}): IAIProvider {
  return {
    id: 'mock',
    name: 'Mock',
    async chatCompletion(messages: Message[], _options?: ChatCompletionOptions): Promise<AIResponse> {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
      const content = config.fixedReply ?? `（Mock）我收到了：${lastUser}`;
      return {
        content,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
  };
}


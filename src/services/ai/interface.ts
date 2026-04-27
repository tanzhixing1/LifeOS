import { Message, AIResponse, ChatCompletionOptions } from './types';

export interface IAIProvider {
  readonly id: string;
  readonly name: string;
  
  chatCompletion(
    messages: Message[], 
    options?: ChatCompletionOptions
  ): Promise<AIResponse>;
}

import { IAIProvider } from './interface';
import { Message, AIResponse, ChatCompletionOptions } from './types';

/**
 * AI 服务中枢
 * 采用策略模式，支持未来动态切换不同的 AI 提供商（如 Gemini, DeepSeek 等）
 */
export class AIService {
  private provider: IAIProvider | null = null;

  /**
   * 注册/切换 AI 提供商
   */
  setProvider(provider: IAIProvider) {
    this.provider = provider;
  }

  /**
   * 发起对话请求
   */
  async chat(messages: Message[], options?: ChatCompletionOptions): Promise<AIResponse> {
    if (!this.provider) {
      throw new Error('[AIService] AI provider not configured. Please call setProvider first.');
    }
    
    try {
      return await this.provider.chatCompletion(messages, options);
    } catch (error) {
      console.error(`[AIService] Chat error with provider ${this.provider.name}:`, error);
      throw error;
    }
  }

  /**
   * 获取当前运行中的提供商名称
   */
  get currentProviderName(): string {
    return this.provider?.name || 'None';
  }
}

// 导出单例
export const aiService = new AIService();

// 导出类型与接口
export * from './types';
export * from './interface';

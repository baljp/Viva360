
import { EventEmitter } from 'events';
import { logger } from '../config/logger';

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms before trying half-open
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private options: CircuitBreakerOptions;
  private nextAttempt: number = Date.now();

  constructor(options: CircuitBreakerOptions = { failureThreshold: 3, resetTimeout: 30000 }) {
    super();
    this.options = options;
  }

  public async fire<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() > this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        logger.warn('Circuit Breaker HALF-OPEN: Trying request...');
      } else {
        throw new Error('Circuit Breaker OPEN: Service unavailable');
      }
    }

    try {
      const result = await action();
      this.success();
      return result;
    } catch (error) {
      this.failure();
      throw error;
    }
  }

  private success() {
    this.failures = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      logger.info('Circuit Breaker CLOSED: Service recovered');
      this.emit('close');
    }
  }

  private failure() {
    this.failures++;
    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      logger.error('Circuit Breaker OPENED: Service failed too many times');
      this.emit('open');
    }
  }
}

// Singleton instance for global external payments
export const paymentCircuitBreaker = new CircuitBreaker();

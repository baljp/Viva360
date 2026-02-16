import type { RequestOptions } from '../requestClient';

export type DomainRequest = <T = any>(endpoint: string, options?: RequestOptions) => Promise<T>;

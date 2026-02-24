type ToastLevel = 'info' | 'success' | 'warning' | 'error';

type ToastFn = (title: string, message: string, type?: ToastLevel) => void;

type ToastConfig = {
  title: string;
  message: string | ((error: unknown) => string);
  type?: ToastLevel;
};

export type RunConfirmedActionOptions<TResult = unknown, TRefetch = unknown> = {
  action: () => Promise<TResult>;
  refresh?: () => Promise<TRefetch> | TRefetch;
  validateResult?: (result: TResult) => boolean;
  validateRefresh?: (refetched: TRefetch, result: TResult) => boolean;
  optimistic?: () => void;
  rollbackOptimistic?: () => void;
  onSuccess?: (ctx: { result: TResult; refetched?: TRefetch }) => Promise<void> | void;
  notify?: ToastFn;
  successToast?: ToastConfig;
  failToast?: ToastConfig;
  navigate?: () => void;
};

export type RunConfirmedActionResult<TResult = unknown, TRefetch = unknown> =
  | { ok: true; result: TResult; refetched?: TRefetch }
  | { ok: false; error: unknown };

const toastMessage = (cfg: ToastConfig, error?: unknown) =>
  typeof cfg.message === 'function' ? cfg.message(error) : cfg.message;

export async function runConfirmedAction<TResult = unknown, TRefetch = unknown>(
  options: RunConfirmedActionOptions<TResult, TRefetch>,
): Promise<RunConfirmedActionResult<TResult, TRefetch>> {
  const {
    action,
    refresh,
    validateResult,
    validateRefresh,
    optimistic,
    rollbackOptimistic,
    onSuccess,
    notify,
    successToast,
    failToast,
    navigate,
  } = options;

  try {
    optimistic?.();

    const result = await action();
    if (validateResult && !validateResult(result)) {
      throw new Error('Ação retornou sucesso sem confirmação válida do backend.');
    }

    let refetched: TRefetch | undefined;
    if (refresh) {
      refetched = await Promise.resolve(refresh());
      if (validateRefresh && !validateRefresh(refetched as TRefetch, result)) {
        throw new Error('Backend respondeu, mas o re-fetch não confirmou o novo estado.');
      }
    }

    await onSuccess?.({ result, refetched });

    if (successToast && notify) {
      notify(successToast.title, toastMessage(successToast), successToast.type || 'success');
    }

    navigate?.();
    return { ok: true, result, refetched };
  } catch (error) {
    rollbackOptimistic?.();
    if (failToast && notify) {
      notify(failToast.title, toastMessage(failToast, error), failToast.type || 'error');
    }
    return { ok: false, error };
  }
}

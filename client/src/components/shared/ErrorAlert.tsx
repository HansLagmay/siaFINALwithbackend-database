interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorAlert = ({ error, onRetry, onDismiss }: ErrorAlertProps) => {
  return (
    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-sm text-red-700 underline hover:text-red-800 font-medium"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm text-red-700 underline hover:text-red-800"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;

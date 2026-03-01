import { useState, useEffect, useRef } from 'react';
import { SelectOption } from '../../hooks/useDialog';

export interface SelectDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  options: SelectOption[];
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

const SelectDialog = ({
  isOpen,
  title,
  message,
  options,
  onSubmit,
  onCancel
}: SelectDialogProps) => {
  const [value, setValue] = useState(options[0]?.value || '');
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (options[0]?.value) {
      setValue(options[0].value);
    }
  }, [options, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Focus select after render
      setTimeout(() => selectRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-dialog-title"
      aria-describedby="select-dialog-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl animate-fade-in">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 id="select-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p id="select-dialog-description" className="text-sm text-gray-600 mb-4">
                  {message}
                </p>
                <select
                  ref={selectRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  aria-label={message}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
              Select
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectDialog;

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isFullscreen?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  isFullscreen = false,
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  const modalClasses = isFullscreen 
    ? 'fixed inset-0 w-full h-full bg-white dark:bg-boxdark'
    : `${sizeClasses[size]} ${className} w-full transform overflow-hidden rounded-lg bg-white dark:bg-boxdark text-left align-middle shadow-xl transition-all`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop */}
        {!isFullscreen && (
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={onClose}
          />
        )}

        {/* Modal */}
        <div className={modalClasses}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
              <div className="flex items-center justify-between">
                {title && (
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Modal };
export default Modal; 
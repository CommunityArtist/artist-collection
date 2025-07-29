import React from 'react';
import { X, ChevronLeft, ChevronRight, ArrowLeft, Download } from 'lucide-react';
import Button from './Button';

interface ImageViewerModalProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDownload?: (imageUrl: string, index: number) => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  onDownload
}) => {
  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'ArrowLeft' && hasPrevious) {
      onPrevious();
    } else if (event.key === 'ArrowRight' && hasNext) {
      onNext();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleDoneClick = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <span className="text-white text-lg font-medium">
            Image {currentIndex + 1} of {images.length}
          </span>
          {images.length > 1 && (
            <div className="flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-electric-cyan' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleDoneClick}
            className="bg-electric-cyan text-deep-bg hover:bg-electric-cyan/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Done
          </Button>
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(currentImage, currentIndex)}
              className="bg-black/50 text-white hover:bg-black/70 border-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 ${
              hasPrevious
                ? 'bg-black/50 text-white hover:bg-white/10 hover:scale-110'
                : 'bg-black/20 text-white/30 cursor-not-allowed'
            }`}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-200 ${
              hasNext
                ? 'bg-black/50 text-white hover:bg-white/10 hover:scale-110'
                : 'bg-black/20 text-white/30 cursor-not-allowed'
            }`}
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div className="max-w-[90vw] max-h-[calc(100vh-160px)] flex items-center justify-center">
        <img
          src={currentImage}
          alt={`Generated artwork ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ 
            maxHeight: 'calc(100vh - 160px)',
            maxWidth: 'calc(100vw - 80px)',
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>

      {/* Bottom Navigation (for mobile) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 md:hidden">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={`p-2 rounded-full transition-all duration-200 ${
              hasPrevious
                ? 'bg-black/50 text-white hover:bg-white/10'
                : 'bg-black/20 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`p-2 rounded-full transition-all duration-200 ${
              hasNext
                ? 'bg-black/50 text-white hover:bg-white/10'
                : 'bg-black/20 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden md:block">
        <div>← → Navigate • ESC Close</div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
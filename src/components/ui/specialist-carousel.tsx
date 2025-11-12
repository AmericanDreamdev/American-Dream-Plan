import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SpecialistCarouselProps {
  images: string[];
  name: string;
  autoplay?: boolean;
  interval?: number;
}

export const SpecialistCarousel = ({
  images,
  name,
  autoplay = true,
  interval = 3000,
}: SpecialistCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para carregar apenas quando visível
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || images.length <= 1 || !isVisible) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % images.length;
        // Preload próxima imagem antes de mudar
        setLoadedImages((prev) => {
          if (!prev.has(next)) {
            return new Set([...prev, next]);
          }
          return prev;
        });
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoplay, interval, images.length, isVisible]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = (prev - 1 + images.length) % images.length;
      if (!loadedImages.has(newIndex)) {
        setLoadedImages((prev) => new Set([...prev, newIndex]));
      }
      return newIndex;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = (prev + 1) % images.length;
      if (!loadedImages.has(newIndex)) {
        setLoadedImages((prev) => new Set([...prev, newIndex]));
      }
      return newIndex;
    });
  };

  const goToSlide = (index: number) => {
    if (!loadedImages.has(index)) {
      setLoadedImages((prev) => new Set([...prev, index]));
    }
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <div ref={containerRef} className="relative w-full h-96 overflow-hidden rounded-lg group">
      {/* Imagens do carrossel - renderizar apenas as que já foram carregadas ou estão visíveis */}
      <div className="relative w-full h-full">
        {images.map((image, index) => {
          // Só renderizar se já foi carregada ou é a atual
          if (!loadedImages.has(index) && index !== currentIndex) {
            return null;
          }
          
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={image}
                alt={`${name} - Foto ${index + 1}`}
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: 
                    image.includes('foto 5') && image.includes('brat')
                      ? '50% 15%' 
                      : image.includes('foto 6') && image.includes('brant')
                      ? '50% 25%'
                      : 'center center'
                }}
                loading={index === 0 && isVisible ? "eager" : "lazy"}
                decoding="async"
                fetchpriority={index === 0 && isVisible ? "high" : "low"}
              />
            </div>
          );
        })}
      </div>

      {/* Botões de navegação */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-sm"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-sm"
            aria-label="Próxima foto"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Indicadores de slide */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Ir para foto ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};


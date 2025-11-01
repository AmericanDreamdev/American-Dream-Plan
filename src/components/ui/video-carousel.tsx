import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type MediaType = "image" | "video";

type Testimonial = {
  quote?: string;
  name?: string;
  designation?: string;
  src: string;
  type?: MediaType;
};

export const VideoCarousel = ({
  testimonials,
  autoplay = false,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(() => {
        setActive((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay, testimonials.length]);

  const currentTestimonial = testimonials[active];
  const isVideo = currentTestimonial.type === "video" || currentTestimonial.src.endsWith(".mp4") || currentTestimonial.src.endsWith(".webm") || currentTestimonial.src.endsWith(".mov");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="relative">
        {/* Carrossel principal - grande e arredondado */}
        <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden glass border border-primary/30 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {isVideo ? (
                <video
                  src={currentTestimonial.src}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  loop
                  muted
                  autoPlay={autoplay}
                />
              ) : (
                <img
                  src={currentTestimonial.src}
                  alt={currentTestimonial.name || "Depoimento"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Overlay com informações do depoimento (se houver) */}
          {currentTestimonial.quote && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8 rounded-b-[3rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`quote-${active}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentTestimonial.name && (
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {currentTestimonial.name}
                    </h3>
                  )}
                  {currentTestimonial.designation && (
                    <p className="text-sm text-primary mb-4">
                      {currentTestimonial.designation}
                    </p>
                  )}
                  {currentTestimonial.quote && (
                    <p className="text-lg text-white/90 leading-relaxed">
                      {currentTestimonial.quote}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Botões de navegação */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 group/button flex h-12 w-12 items-center justify-center rounded-full glass border border-primary/30 hover:bg-primary/20 transition-all hover:scale-110"
            aria-label="Depoimento anterior"
          >
            <IconArrowLeft className="h-6 w-6 text-white transition-transform duration-300 group-hover/button:translate-x-[-2px]" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 group/button flex h-12 w-12 items-center justify-center rounded-full glass border border-primary/30 hover:bg-primary/20 transition-all hover:scale-110"
            aria-label="Próximo depoimento"
          >
            <IconArrowRight className="h-6 w-6 text-white transition-transform duration-300 group-hover/button:translate-x-[2px]" />
          </button>
        </div>

        {/* Indicadores de slide */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActive(index)}
                className={`h-3 rounded-full transition-all ${
                  index === active
                    ? "w-12 bg-primary"
                    : "w-3 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


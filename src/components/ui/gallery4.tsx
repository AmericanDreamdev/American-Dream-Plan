import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export interface Gallery4Item {
  id: string;
  title: string;
  description: string;
  href?: string;
  image: string;
}

export interface Gallery4Props {
  title?: string;
  description?: string;
  items: Gallery4Item[];
}

const Gallery4 = ({
  title = "Case Studies",
  description = "Discover how leading companies and developers are leveraging modern web technologies to build exceptional digital experiences. These case studies showcase real-world applications and success stories.",
  items = [],
}: Gallery4Props) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Preload apenas as primeiras imagens visíveis (primeira e segunda)
  useEffect(() => {
    if (items.length > 0 && typeof window !== 'undefined') {
      // Preload apenas as primeiras 2-3 imagens do carrossel
      const imagesToPreload = items.slice(0, 3).map(item => item.image);
      // Use requestIdleCallback for non-blocking image preload
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          imagesToPreload.forEach((url) => {
            const img = new Image();
            img.src = url;
          });
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          imagesToPreload.forEach((url) => {
            const img = new Image();
            img.src = url;
          });
        }, 100);
      }
    }
  }, [items]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);

    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  const CardContent = ({ item }: { item: Gallery4Item }) => (
    <div className="group relative h-full min-h-[27rem] max-w-full overflow-hidden rounded-xl md:aspect-[5/4] lg:aspect-[16/9]">
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="absolute h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        fetchpriority="low"
        onError={(e) => {
          // Fallback para placeholder se imagem falhar
          e.currentTarget.src = '/placeholder.svg';
        }}
      />
      <div className="absolute inset-0 h-full bg-[linear-gradient(hsl(var(--primary)/0),hsl(var(--primary)/0.4),hsl(var(--primary)/0.8)_100%)] mix-blend-multiply" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start justify-end p-4 text-primary-foreground md:p-6">
        <h3 className="mb-2 text-base font-bold md:text-lg lg:text-lg">
          {item.title}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-4 md:text-base md:line-clamp-4">
          {item.description}
        </p>
      </div>
    </div>
  );

  return (
    <section className="py-24 relative z-10 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="mb-8 flex items-end justify-between md:mb-14 lg:mb-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl text-gray-900">
              {title}
            </h2>
            <p className="max-w-lg text-gray-600">{description}</p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                carouselApi?.scrollPrev();
              }}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto border border-gray-300 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                carouselApi?.scrollNext();
              }}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto border border-gray-300 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            breakpoints: {
              "(max-width: 768px)": {
                dragFree: true,
              },
            },
          }}
        >
          <CarouselContent className="ml-0 2xl:ml-[max(8rem,calc(50vw-700px))] 2xl:mr-[max(0rem,calc(50vw-700px))]">
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className="max-w-[320px] pl-[20px] lg:max-w-[360px]"
              >
                {item.href ? (
                  <a href={item.href} className="group rounded-xl">
                    <CardContent item={item} />
                  </a>
                ) : (
                  <div className="group rounded-xl">
                    <CardContent item={item} />
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="mt-8 flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                currentSlide === index ? "bg-primary" : "bg-primary/20"
              }`}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export { Gallery4 };


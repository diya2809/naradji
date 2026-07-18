"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/utilities/index";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Button, buttonVariants } from "@/components/ui/button";

import type { CarouselNavControls } from "@/components/CarouselSectionHeader";

interface CarouselProps {
  items: React.ReactElement[];
  initialScroll?: number;
  renderHeader?: (controls: CarouselNavControls) => React.ReactNode;
}

type Card = {
  src: string;
  mobileSrc?: string;
  title: string;
  category: string;
  categoryHref?: string;
  content: React.ReactNode;
};

/** Card face sizes: w-56 / h-80 mobile, md:w-96 / md:h-160 desktop */
const CARD_IMAGE_SIZES = "(max-width: 768px) 14rem, 24rem";

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({
  items,
  initialScroll = 0,
  renderHeader,
}: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384; // (md:w-96)
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return window && window.innerWidth < 768;
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        {renderHeader?.({
          canScrollLeft,
          canScrollRight,
          onScrollLeft: scrollLeft,
          onScrollRight: scrollRight,
        })}
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none]"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div
            className={cn(
              "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l",
            )}
          ></div>

          <div
            className={cn(
              "flex flex-row justify-start gap-4",
            )}
          >
            {items.map((item, index) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.2 * index,
                    ease: "easeOut",
                  },
                }}
                key={"card" + index}
                className="rounded-lg last:pr-[5%] md:last:pr-[33%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        {!renderHeader ? (
          <div className="mr-10 flex justify-end gap-2">
            <Button
              aria-label="Previous slide"
              disabled={!canScrollLeft}
              onClick={scrollLeft}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <IconArrowNarrowLeft className="size-4" />
            </Button>
            <Button
              aria-label="Next slide"
              disabled={!canScrollRight}
              onClick={scrollRight}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <IconArrowNarrowRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: Card;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useOutsideClick(containerRef, () => handleClose());

  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  /** Click: navigate if a link is set, otherwise expand the overlay */
  const handleClick = () => {
    if (card.categoryHref) {
      router.push(card.categoryHref);
    } else if (card.content) {
      // Only open overlay if there is content to show
      setOpen(true);
    }
  };

  const cardClassName = cn(
    buttonVariants({ variant: "outline" }),
    "relative z-10 flex h-80 w-56 flex-col items-start justify-end overflow-hidden rounded-lg bg-muted md:h-160 md:w-96 border-0",
  );

  const cardFace = (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-full bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
      <div className="relative z-40 p-8" data-hero-overlay>
        <motion.p
          layoutId={layout ? `category-${card.category}` : undefined}
          className="text-left text-sm font-medium text-foreground md:text-base"
        >
          {card.category}
        </motion.p>
        <motion.p
          layoutId={layout ? `title-${card.title}` : undefined}
          className="mt-2 max-w-xs text-left text-xl font-semibold [text-wrap:balance] text-foreground md:text-3xl"
        >
          {card.title}
        </motion.p>
      </div>
      {card.mobileSrc ? (
        <>
          <CardImage
            alt={card.title}
            className="absolute inset-0 z-10 object-cover md:hidden"
            src={card.mobileSrc}
          />
          <CardImage
            alt={card.title}
            className="absolute inset-0 z-10 hidden object-cover md:block"
            src={card.src}
          />
        </>
      ) : (
        <CardImage
          alt={card.title}
          className="absolute inset-0 z-10 object-cover"
          src={card.src}
        />
      )}
    </>
  );

  return (
    <>
      {/* Expanded overlay — only shown for content cards (no categoryHref) */}
      <AnimatePresence>
        {!card.categoryHref && open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-foreground/80 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-lg bg-card p-4 text-card-foreground md:p-6"
            >
              <Button
                aria-label="Close"
                className="sticky top-4 right-0 ml-auto"
                onClick={handleClose}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <IconX className="size-4" />
              </Button>
              <motion.p
                layoutId={layout ? `category-${card.title}` : undefined}
                className="text-base font-medium text-muted-foreground"
              >
                {card.category}
              </motion.p>
              <motion.p
                layoutId={layout ? `title-${card.title}` : undefined}
                className="mt-4 text-2xl font-semibold text-foreground md:text-5xl"
              >
                {card.title}
              </motion.p>
              <div className="py-10">{card.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Always a button — prevents SSR/client element-type mismatch */}
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleClick}
        type="button"
        className={cardClassName}
      >
        {cardFace}
      </motion.button>
    </>
  );
};



/**
 * Sharp card background — no CSS blur placeholder.
 * Aceternity's BlurImage left blur-sm stuck when cached images skipped onLoad.
 */
export const CardImage = ({
  src,
  className,
  alt,
}: {
  src: string;
  className?: string;
  alt: string;
}) => {
  if (!src) return null;

  const isPayloadMedia = src.startsWith("/api/media/file/");

  return (
    <Image
      alt={alt || "Category"}
      className={cn("object-cover", className)}
      fill
      quality={90}
      sizes={CARD_IMAGE_SIZES}
      src={src}
      unoptimized={isPayloadMedia}
    />
  );
};

/** @deprecated Use CardImage — kept so older demos keep compiling */
export const BlurImage = CardImage;

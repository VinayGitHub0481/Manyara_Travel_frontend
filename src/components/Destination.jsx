
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Globe2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getMostVisited } from "../api/content";

export default function DestinationSection() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] =
    useState(false);

  const [canScrollRight, setCanScrollRight] =
    useState(false);

  /* =========================================================
     FETCH MOST VISITED DESTINATIONS
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    getMostVisited()
      .then((data) => {
        if (!mounted) return;

        const destinationList = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        setPlaces(destinationList);
      })
      .catch((error) => {
        console.error(
          "Most visited destinations loading failed:",
          error
        );

        if (mounted) {
          setPlaces([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     SORT DESTINATIONS

     Preserve admin display_order.
  ========================================================= */

  const sortedPlaces = [...places].sort(
    (a, b) =>
      Number(a?.display_order ?? 0) -
      Number(b?.display_order ?? 0)
  );

  /* =========================================================
     UPDATE CAROUSEL SCROLL STATE

     Blog-style behavior:

     - Beginning  -> hide left chevron
     - Middle     -> show both chevrons
     - End        -> hide right chevron
     - Everything fits -> hide both
  ========================================================= */

  const updateScrollState = useCallback(() => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const maxScroll =
      container.scrollWidth - container.clientWidth;

    const currentScroll = container.scrollLeft;

    const threshold = 4;

    setCanScrollLeft(
      currentScroll > threshold
    );

    setCanScrollRight(
      currentScroll < maxScroll - threshold
    );
  }, []);

  /* =========================================================
     INITIAL + RESPONSIVE SCROLL STATE

     Recalculate when:

     - destinations finish loading
     - number of destinations changes
     - browser is resized
     - screen orientation changes
     - mobile/tablet/desktop breakpoint changes
  ========================================================= */

  useEffect(() => {
    if (
      loading ||
      sortedPlaces.length === 0
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      updateScrollState();
    });

    window.addEventListener(
      "resize",
      updateScrollState
    );

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener(
        "resize",
        updateScrollState
      );
    };
  }, [
    loading,
    sortedPlaces.length,
    updateScrollState,
  ]);

  /* =========================================================
     SCROLL CAROUSEL

     Responsive visible cards:

     Mobile  = 1 card
     Tablet  = 2 cards
     Desktop = 4 cards

     The calculation is based on the actual card width
     and current carousel gap.
  ========================================================= */

  const scrollCarousel = (direction) => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const firstCard = container.querySelector(
      "[data-destination-card]"
    );

    if (!firstCard) {
      return;
    }

    const cardWidth =
      firstCard.getBoundingClientRect().width;

    const computedStyle =
      window.getComputedStyle(container);

    const gap =
      parseFloat(
        computedStyle.columnGap ||
          computedStyle.gap ||
          "0"
      );

    const containerWidth =
      container.clientWidth;

    const cardsPerView = Math.max(
      1,
      Math.round(
        (containerWidth + gap) /
          (cardWidth + gap)
      )
    );

    const scrollAmount =
      (cardWidth + gap) * cardsPerView;

    container.scrollBy({
      left:
        direction === "right"
          ? scrollAmount
          : -scrollAmount,
      behavior: "smooth",
    });
  };

  /* =========================================================
     EMPTY STATE

     Preserve existing behavior.
  ========================================================= */

  if (
    !loading &&
    sortedPlaces.length === 0
  ) {
    return null;
  }

  return (
    <section
      id="most-visited"
      className="bg-navy py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* =====================================================
            SECTION HEADER
        ====================================================== */}

        <div className="mb-7 sm:mb-9 lg:mb-10">
          <p className="flex items-center gap-2 text-accent font-semibold text-xs sm:text-sm uppercase tracking-wide">
            <Globe2
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            Where everyone's headed
          </p>

          <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-ivory">
            Explore Most Visited Destinations
          </h2>

          <p className="mt-3 max-w-2xl text-sm sm:text-base text-ivory/65 leading-7">
            Discover destinations loved by travellers and explore
            the holiday packages available for your next journey.
          </p>
        </div>

        {/* =====================================================
            LOADING SKELETON
        ====================================================== */}

        {loading ? (
          <div className="relative w-full">
            <div
              className="
                flex
                w-full
                gap-5
                overflow-hidden
                sm:gap-6
              "
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="
                    min-w-0
                    shrink-0
                    basis-full
                    snap-start
                    sm:basis-[calc(50%-12px)]
                    lg:basis-[calc(25%-18px)]
                  "
                >
                  <div
                    className="
                      h-64
                      w-full
                      animate-pulse
                      rounded-2xl
                      bg-navy-light
                      sm:h-72
                      lg:h-80
                    "
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ===================================================
             DESTINATIONS HORIZONTAL CAROUSEL
          ==================================================== */

          <div className="relative w-full">
            {/* =================================================
                LEFT CHEVRON

                Only rendered when there is actually a
                previous destination available.
            ================================================== */}

            {canScrollLeft && (
              <button
                type="button"
                onClick={() =>
                  scrollCarousel("left")
                }
                aria-label="Previous destinations"
                className="
                  absolute
                  left-0
                  top-1/2
                  z-30
                  flex
                  h-11
                  w-11
                  -translate-x-1/2
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  text-navy
                  shadow-lg
                  transition-all
                  duration-200
                  hover:scale-105
                  hover:bg-navy
                  hover:text-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-accent
                  focus:ring-offset-2
                  focus:ring-offset-navy
                  sm:h-12
                  sm:w-12
                "
              >
                <ChevronLeft
                  className="h-6 w-6"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>
            )}

            {/* =================================================
                DESTINATION CAROUSEL
            ================================================== */}

            <div
              ref={carouselRef}
              onScroll={updateScrollState}
              className="
                flex
                w-full
                gap-5
                overflow-x-auto
                scroll-smooth
                snap-x
                snap-mandatory
                pb-3
                sm:gap-6
                [&::-webkit-scrollbar]:hidden
                [-ms-overflow-style:none]
                [scrollbar-width:none]
              "
            >
              {sortedPlaces.map((place) => {
                const slug = place?.slug;

                /*
                 * A destination without a slug should not create
                 * an unreliable public URL.
                 */

                if (!slug) {
                  return null;
                }

                const imageUrl =
                  place?.image?.url ||
                  (typeof place?.image === "string"
                    ? place.image
                    : null);

                return (
                  <div
                    key={
                      place?.id ?? slug
                    }
                    data-destination-card
                    className="
                      min-w-0
                      shrink-0
                      basis-full
                      snap-start
                      sm:basis-[calc(50%-12px)]
                      lg:basis-[calc(25%-18px)]
                    "
                  >
                    <Link
                      to={`/destinations/${slug}`}
                      className="
                        group
                        relative
                        block
                        h-64
                        w-full
                        overflow-hidden
                        rounded-2xl
                        focus:outline-none
                        focus:ring-2
                        focus:ring-accent
                        focus:ring-offset-2
                        focus:ring-offset-navy
                        sm:h-72
                        lg:h-80
                      "
                      aria-label={`Explore ${place?.place_name}`}
                    >
                      {/* =================================================
                          DESTINATION IMAGE
                      ================================================== */}

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          loading="lazy"
                          decoding="async"
                          alt={`${place?.place_name} — popular travel destination`}
                          className="
                            h-full
                            w-full
                            object-cover
                            transition-transform
                            duration-500
                            group-hover:scale-105
                          "
                        />
                      ) : (
                        <div className="h-full w-full bg-navy-light" />
                      )}

                      {/* =================================================
                          DARK GRADIENT
                      ================================================== */}

                      <div
                        className="
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-navy-dark
                          via-navy-dark/30
                          to-transparent
                        "
                      />

                      {/* =================================================
                          CONTENT
                      ================================================== */}

                      <div
                        className="
                          absolute
                          bottom-0
                          left-0
                          right-0
                          p-4
                          sm:p-5
                          lg:p-6
                        "
                      >
                        <h3
                          className="
                            flex
                            items-center
                            gap-1.5
                            font-display
                            text-lg
                            font-semibold
                            text-ivory
                            sm:text-xl
                          "
                        >
                          <MapPin
                            className="
                              h-4
                              w-4
                              shrink-0
                              text-accent
                              sm:h-5
                              sm:w-5
                            "
                            aria-hidden="true"
                          />

                          <span className="truncate">
                            {place?.place_name}
                          </span>
                        </h3>

                        {place?.description && (
                          <p
                            className="
                              mt-1
                              line-clamp-2
                              text-xs
                              leading-relaxed
                              text-ivory/70
                              sm:mt-2
                              sm:text-sm
                            "
                          >
                            {place.description}
                          </p>
                        )}

                        {/* =================================================
                            DESTINATION CTA
                        ================================================== */}

                        <div
                          className="
                            mt-3
                            inline-flex
                            items-center
                            gap-1.5
                            text-xs
                            font-semibold
                            text-ivory
                            sm:text-sm
                          "
                        >
                          Explore destination

                          <ArrowRight
                            className="
                              h-4
                              w-4
                              transition-transform
                              duration-300
                              group-hover:translate-x-1
                            "
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                RIGHT CHEVRON

                Only rendered when there is actually a
                next destination available.
            ================================================== */}

            {canScrollRight && (
              <button
                type="button"
                onClick={() =>
                  scrollCarousel("right")
                }
                aria-label="Next destinations"
                className="
                  absolute
                  right-0
                  top-1/2
                  z-30
                  flex
                  h-11
                  w-11
                  translate-x-1/2
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  text-navy
                  shadow-lg
                  transition-all
                  duration-200
                  hover:scale-105
                  hover:bg-navy
                  hover:text-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-accent
                  focus:ring-offset-2
                  focus:ring-offset-navy
                  sm:h-12
                  sm:w-12
                "
              >
                <ChevronRight
                  className="h-6 w-6"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
















































// import { useEffect, useRef, useState, useCallback } from "react";
// import { Link } from "react-router-dom";
// import {
//   MapPin,
//   Globe2,
//   ArrowRight,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import { getMostVisited } from "../api/content";

// export default function DestinationSection() {
//   const [places, setPlaces] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const carouselRef = useRef(null);
//   const [canScrollLeft, setCanScrollLeft] = useState(false);
//   const [canScrollRight, setCanScrollRight] = useState(false);


//   useEffect(() => {
//     let mounted = true;

//     getMostVisited()
//       .then((data) => {
//         if (!mounted) return;

//         const destinationList = Array.isArray(data)
//           ? data
//           : Array.isArray(data?.items)
//           ? data.items
//           : [];

//         setPlaces(destinationList);
//       })
//       .catch((error) => {
//         console.error(
//           "Most visited destinations loading failed:",
//           error
//         );

//         if (mounted) {
//           setPlaces([]);
//         }
//       })
//       .finally(() => {
//         if (mounted) {
//           setLoading(false);
//         }
//       });

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const sortedPlaces = [...places].sort(
//     (a, b) =>
//       Number(a?.display_order ?? 0) -
//       Number(b?.display_order ?? 0)
//   );

//   const updateScrollState = useCallback(() => {
//   const container = carouselRef.current;

//   if (!container) return;

//   const maxScroll =
//     container.scrollWidth - container.clientWidth;

//   const threshold = 4;

//   setCanScrollLeft(
//     container.scrollLeft > threshold
//   );

//   setCanScrollRight(
//     container.scrollLeft < maxScroll - threshold
//   );
// }, []);

//   const scrollCarousel = (direction) => {
//     const container = carouselRef.current;

//     if (!container) return;

//     const firstCard = container.querySelector(
//       "[data-destination-card]"
//     );

//     if (!firstCard) return;

//     const cardWidth =
//       firstCard.getBoundingClientRect().width;

//     const computedStyle =
//       window.getComputedStyle(container);

//     const gap =
//       parseFloat(
//         computedStyle.columnGap ||
//           computedStyle.gap ||
//           "0"
//       );

//     const containerWidth = container.clientWidth;

//     const cardsPerView = Math.max(
//       1,
//       Math.round(
//         (containerWidth + gap) /
//           (cardWidth + gap)
//       )
//     );

//     const scrollAmount =
//       (cardWidth + gap) * cardsPerView;

//     container.scrollBy({
//       left:
//         direction === "right"
//           ? scrollAmount
//           : -scrollAmount,
//       behavior: "smooth",
//     });
//   };

//   if (!loading && sortedPlaces.length === 0) {
//     return null;
//   }

//   return (
//     <section
//       id="most-visited"
//       className="bg-navy py-12 sm:py-16 lg:py-20"
//     >
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

//         {/* =====================================================
//             SECTION HEADER
//         ====================================================== */}
//         <div className="mb-7 sm:mb-9 lg:mb-10">
//           <p className="flex items-center gap-2 text-accent font-semibold text-xs sm:text-sm uppercase tracking-wide">
//             <Globe2
//               className="h-4 w-4 shrink-0"
//               aria-hidden="true"
//             />

//             Where everyone's headed
//           </p>

//           <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-ivory">
//             Explore Most Visited Destinations
//           </h2>

//           <p className="mt-3 max-w-2xl text-sm sm:text-base text-ivory/65 leading-7">
//             Discover destinations loved by travellers and explore
//             the holiday packages available for your next journey.
//           </p>
//         </div>

//         {/* =====================================================
//             LOADING SKELETON
//         ====================================================== */}
//         {loading ? (
//           <div className="relative w-full">

//             {/* Left Chevron */}
//             <button
//               type="button"
//               onClick={() => scrollCarousel("left")}
//               aria-label="Previous destinations"
//               className="
//                 absolute
//                 left-0
//                 top-1/2
//                 z-30
//                 flex
//                 h-11
//                 w-11
//                 -translate-x-1/2
//                 -translate-y-1/2
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-slate-200
//                 bg-white
//                 text-navy
//                 shadow-lg
//                 transition-all
//                 duration-200
//                 hover:scale-105
//                 hover:bg-navy
//                 hover:text-white
//                 sm:h-12
//                 sm:w-12
//               "
//             >
//               <ChevronLeft
//                 className="h-6 w-6"
//                 strokeWidth={2.5}
//                 aria-hidden="true"
//               />
//             </button>

//             <div
//               ref={carouselRef}
//               className="
//                 flex
//                 w-full
//                 gap-5
//                 overflow-x-auto
//                 scroll-smooth
//                 snap-x
//                 snap-mandatory
//                 pb-3
//                 sm:gap-6
//                 [&::-webkit-scrollbar]:hidden
//                 [-ms-overflow-style:none]
//                 [scrollbar-width:none]
//               "
//             >
//               {[1, 2, 3, 4].map((item) => (
//                 <div
//                   key={item}
//                   className="
//                     min-w-0
//                     shrink-0
//                     basis-full
//                     snap-start
//                     sm:basis-[calc(50%-12px)]
//                     lg:basis-[calc(25%-18px)]
//                   "
//                 >
//                   <div
//                     className="
//                       h-64
//                       w-full
//                       animate-pulse
//                       rounded-2xl
//                       bg-navy-light
//                       sm:h-72
//                       lg:h-80
//                     "
//                   />
//                 </div>
//               ))}
//             </div>

//             {/* Right Chevron */}
//             <button
//               type="button"
//               onClick={() => scrollCarousel("right")}
//               aria-label="Next destinations"
//               className="
//                 absolute
//                 right-0
//                 top-1/2
//                 z-30
//                 flex
//                 h-11
//                 w-11
//                 translate-x-1/2
//                 -translate-y-1/2
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-slate-200
//                 bg-white
//                 text-navy
//                 shadow-lg
//                 transition-all
//                 duration-200
//                 hover:scale-105
//                 hover:bg-navy
//                 hover:text-white
//                 sm:h-12
//                 sm:w-12
//               "
//             >
//               <ChevronRight
//                 className="h-6 w-6"
//                 strokeWidth={2.5}
//                 aria-hidden="true"
//               />
//             </button>
//           </div>
//         ) : (
//           /* ===================================================
//              DESTINATIONS HORIZONTAL CAROUSEL
//           ==================================================== */
//           <div className="relative w-full">

//             {/* =================================================
//                 LEFT CHEVRON
//             ================================================== */}
//             <button
//               type="button"
//               onClick={() => scrollCarousel("left")}
//               aria-label="Previous destinations"
//               className="
//                 absolute
//                 left-0
//                 top-1/2
//                 z-30
//                 flex
//                 h-11
//                 w-11
//                 -translate-x-1/2
//                 -translate-y-1/2
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-slate-200
//                 bg-white
//                 text-navy
//                 shadow-lg
//                 transition-all
//                 duration-200
//                 hover:scale-105
//                 hover:bg-navy
//                 hover:text-white
//                 sm:h-12
//                 sm:w-12
//               "
//             >
//               <ChevronLeft
//                 className="h-6 w-6"
//                 strokeWidth={2.5}
//                 aria-hidden="true"
//               />
//             </button>

//             {/* =================================================
//                 DESTINATION CAROUSEL
//             ================================================== */}
//             <div
//               ref={carouselRef}
//               className="
//                 flex
//                 w-full
//                 gap-5
//                 overflow-x-auto
//                 scroll-smooth
//                 snap-x
//                 snap-mandatory
//                 pb-3
//                 sm:gap-6
//                 [&::-webkit-scrollbar]:hidden
//                 [-ms-overflow-style:none]
//                 [scrollbar-width:none]
//               "
//             >
//               {sortedPlaces.map((place) => {
//                 const slug = place?.slug;

//                 // A destination without a slug should not create
//                 // an unreliable public URL.
//                 if (!slug) {
//                   return null;
//                 }

//                 const imageUrl =
//                   place?.image?.url ||
//                   (typeof place?.image === "string"
//                     ? place.image
//                     : null);

//                 return (
//                   <div
//                     key={place?.id ?? slug}
//                     className="
//                       min-w-0
//                       shrink-0
//                       basis-full
//                       snap-start
//                       sm:basis-[calc(50%-12px)]
//                       lg:basis-[calc(25%-18px)]
//                     "
//                   >
//                     <Link
//                       to={`/destinations/${slug}`}
//                       className="
//                         group
//                         relative
//                         block
//                         h-64
//                         w-full
//                         overflow-hidden
//                         rounded-2xl
//                         focus:outline-none
//                         focus:ring-2
//                         focus:ring-accent
//                         focus:ring-offset-2
//                         focus:ring-offset-navy
//                         sm:h-72
//                         lg:h-80
//                       "
//                       aria-label={`Explore ${place?.place_name}`}
//                     >
//                       {/* =================================================
//                           DESTINATION IMAGE
//                       ================================================== */}
//                       {imageUrl ? (
//                         <img
//                           src={imageUrl}
//                           loading="lazy"
//                           decoding="async"
//                           alt={`${place?.place_name} — popular travel destination`}
//                           className="
//                             h-full
//                             w-full
//                             object-cover
//                             transition-transform
//                             duration-500
//                             group-hover:scale-105
//                           "
//                         />
//                       ) : (
//                         <div className="h-full w-full bg-navy-light" />
//                       )}

//                       {/* =================================================
//                           DARK GRADIENT
//                       ================================================== */}
//                       <div
//                         className="
//                           absolute
//                           inset-0
//                           bg-gradient-to-t
//                           from-navy-dark
//                           via-navy-dark/30
//                           to-transparent
//                         "
//                       />

//                       {/* =================================================
//                           CONTENT
//                       ================================================== */}
//                       <div
//                         className="
//                           absolute
//                           bottom-0
//                           left-0
//                           right-0
//                           p-4
//                           sm:p-5
//                           lg:p-6
//                         "
//                       >
//                         <h3
//                           className="
//                             flex
//                             items-center
//                             gap-1.5
//                             font-display
//                             text-lg
//                             font-semibold
//                             text-ivory
//                             sm:text-xl
//                           "
//                         >
//                           <MapPin
//                             className="
//                               h-4
//                               w-4
//                               shrink-0
//                               text-accent
//                               sm:h-5
//                               sm:w-5
//                             "
//                             aria-hidden="true"
//                           />

//                           <span className="truncate">
//                             {place?.place_name}
//                           </span>
//                         </h3>

//                         {place?.description && (
//                           <p
//                             className="
//                               mt-1
//                               line-clamp-2
//                               text-xs
//                               leading-relaxed
//                               text-ivory/70
//                               sm:mt-2
//                               sm:text-sm
//                             "
//                           >
//                             {place.description}
//                           </p>
//                         )}

//                         {/* =================================================
//                             DESTINATION CTA
//                         ================================================== */}
//                         <div
//                           className="
//                             mt-3
//                             inline-flex
//                             items-center
//                             gap-1.5
//                             text-xs
//                             font-semibold
//                             text-ivory
//                             sm:text-sm
//                           "
//                         >
//                           Explore destination

//                           <ArrowRight
//                             className="
//                               h-4
//                               w-4
//                               transition-transform
//                               duration-300
//                               group-hover:translate-x-1
//                             "
//                             aria-hidden="true"
//                           />
//                         </div>
//                       </div>
//                     </Link>
//                   </div>
//                 );
//               })}
//             </div>

//             {/* =================================================
//                 RIGHT CHEVRON
//             ================================================== */}
//             <button
//               type="button"
//               onClick={() => scrollCarousel("right")}
//               aria-label="Next destinations"
//               className="
//                 absolute
//                 right-0
//                 top-1/2
//                 z-30
//                 flex
//                 h-11
//                 w-11
//                 translate-x-1/2
//                 -translate-y-1/2
//                 items-center
//                 justify-center
//                 rounded-full
//                 border
//                 border-slate-200
//                 bg-white
//                 text-navy
//                 shadow-lg
//                 transition-all
//                 duration-200
//                 hover:scale-105
//                 hover:bg-navy
//                 hover:text-white
//                 sm:h-12
//                 sm:w-12
//               "
//             >
//               <ChevronRight
//                 className="h-6 w-6"
//                 strokeWidth={2.5}
//                 aria-hidden="true"
//               />
//             </button>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }

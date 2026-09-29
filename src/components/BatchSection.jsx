


import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  IndianRupee,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUpcomingBatches } from "../api/content";

const formatDate = (dateString) => {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (price) => {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "On Request";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return numericPrice.toLocaleString("en-IN");
};

const getDurationText = (batch) => {
  const days = batch?.duration_days;
  const nights = batch?.duration_nights;

  if (days && nights) {
    return `${days} Days / ${nights} Nights`;
  }

  if (days) {
    return `${days} Days`;
  }

  if (nights) {
    return `${nights} Nights`;
  }

  return "Duration on request";
};

const getAvailabilityLabel = (availability) => {
  switch (availability) {
    case "open":
      return "Available";

    case "limited":
      return "Limited Seats";

    case "almost_full":
      return "Almost Full";

    case "full":
      return "Fully Booked";

    case "closed":
      return "Closed";

    default:
      return "Availability on request";
  }
};

const getAvailabilityClasses = (availability) => {
  switch (availability) {
    case "open":
      return "bg-emerald-50 text-emerald-700";

    case "limited":
      return "bg-amber-50 text-amber-700";

    case "almost_full":
      return "bg-orange-50 text-orange-700";

    case "full":
      return "bg-red-50 text-red-700";

    case "closed":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getPackageImage = (batch) => {
  const images = batch?.package?.images ?? [];

  if (!Array.isArray(images) || images.length === 0) {
    return "/images/placeholder-travel.webp";
  }

  const firstImage = images[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  if (firstImage?.url) {
    return firstImage.url;
  }

  return "/images/placeholder-travel.webp";
};

export default function UpcomingBatchesSection() {
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carouselRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadBatches = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getUpcomingBatches();

        if (!isMounted) {
          return;
        }

        setBatches(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load upcoming batches:",
          err
        );

        if (!isMounted) {
          return;
        }

        setError(
          "Unable to load upcoming trips right now. Please try again later."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBatches();

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollCarousel = (direction) => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const scrollAmount = container.clientWidth * 0.92;

    container.scrollBy({
      left:
        direction === "right"
          ? scrollAmount
          : -scrollAmount,
      behavior: "smooth",
    });
  };

  const handleBatchClick = (batch) => {
    if (!batch?.slug) {
      return;
    }

    navigate(
      `/batches/${encodeURIComponent(batch.slug)}`
    );
  };

  return (
    <section
      id="upcoming-batches"
      className="bg-[#faf8f3] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ==================================================
            SECTION HEADER
        ================================================== */}
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <span className="mb-3 inline-flex items-center rounded-full bg-[#fff0eb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e92f00]">
            Upcoming Trips
          </span>

          <h2 className="font-serif text-3xl font-semibold leading-tight text-[#061b45] sm:text-4xl lg:text-5xl">
            Your Next Journey Starts Here
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Discover our upcoming departures and choose
            the trip that fits your plans. Reserve your spot
            and get ready for an unforgettable experience.
          </p>
        </div>

        {/* ==================================================
            LOADING
        ================================================== */}
        {loading && (
          <div className="relative w-full">

            {/* Left Chevron */}
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              aria-label="Previous upcoming trips"
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
                text-[#061b45]
                shadow-lg
                transition-all
                duration-200
                hover:scale-105
                hover:bg-[#061b45]
                hover:text-white
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

            {/* Skeleton Carousel */}
            <div
              ref={carouselRef}
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
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="h-56 animate-pulse bg-slate-200" />

                    <div className="space-y-4 p-5">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />

                      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />

                      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />

                      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Chevron */}
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              aria-label="Next upcoming trips"
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
                text-[#061b45]
                shadow-lg
                transition-all
                duration-200
                hover:scale-105
                hover:bg-[#061b45]
                hover:text-white
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
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* ==================================================
            EMPTY
        ================================================== */}
        {!loading &&
          !error &&
          batches.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <CalendarDays className="mx-auto mb-4 h-10 w-10 text-slate-400" />

              <h3 className="text-lg font-semibold text-[#061b45]">
                No Upcoming Trips
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We don't have any upcoming departures
                available at the moment. Please check back
                soon for new trips.
              </p>
            </div>
          )}

        {/* ==================================================
            BATCH CAROUSEL
        ================================================== */}
        {!loading &&
          !error &&
          batches.length > 0 && (
            <div className="relative w-full">

              {/* ==================================================
                  LEFT CHEVRON
              ================================================== */}
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                aria-label="Previous upcoming trips"
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
                  text-[#061b45]
                  shadow-lg
                  transition-all
                  duration-200
                  hover:scale-105
                  hover:bg-[#061b45]
                  hover:text-white
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

              {/* ==================================================
                  HORIZONTAL BATCH CAROUSEL
              ================================================== */}
              <div
                ref={carouselRef}
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
                {batches.map((batch) => {
                  const packageData = batch?.package;

                  const title =
                    packageData?.title ||
                    "Travel Package";

                  const destination =
                    packageData?.destination ||
                    "Destination";

                  const image = getPackageImage(batch);

                  return (
                    <div
                      key={batch?.id}
                      className="
                        min-w-0
                        shrink-0
                        basis-full
                        snap-start
                        sm:basis-[calc(50%-12px)]
                        lg:basis-[calc(25%-18px)]
                      "
                    >
                      <article
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          handleBatchClick(batch)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            handleBatchClick(batch);
                          }
                        }}
                        className="
                          group
                          cursor-pointer
                          overflow-hidden
                          rounded-2xl
                          bg-white
                          shadow-[0_8px_30px_rgba(6,27,69,0.08)]
                          transition-all
                          duration-300
                          hover:-translate-y-1
                          hover:shadow-[0_16px_40px_rgba(6,27,69,0.14)]
                          focus:outline-none
                          focus:ring-2
                          focus:ring-[#ff5a2a]
                          focus:ring-offset-2
                        "
                      >
                        {/* ======================================
                            IMAGE
                        ====================================== */}
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={image}
                            alt={title}
                            loading="lazy"
                            className="
                              h-full
                              w-full
                              object-cover
                              transition-transform
                              duration-500
                              group-hover:scale-105
                            "
                            onError={(event) => {
                              event.currentTarget.src =
                                "/images/placeholder-travel.webp";
                            }}
                          />

                          {/* Image Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                          {/* Availability */}
                          <div className="absolute left-4 top-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getAvailabilityClasses(
                                batch?.availability
                              )}`}
                            >
                              {getAvailabilityLabel(
                                batch?.availability
                              )}
                            </span>
                          </div>

                          {/* Destination */}
                          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5 text-sm font-medium text-white">
                            <MapPin className="h-4 w-4 shrink-0" />

                            <span className="truncate">
                              {destination}
                            </span>
                          </div>
                        </div>

                        {/* ======================================
                            CARD CONTENT
                        ====================================== */}
                        <div className="p-5">

                          {/* Package Title */}
                          <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold leading-7 text-[#061b45] transition-colors group-hover:text-[#e92f00]">
                            {title}
                          </h3>

                          {/* Batch Details */}
                          <div className="mt-4 space-y-2.5">

                            {/* Dates */}
                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                              <CalendarDays className="h-4 w-4 shrink-0 text-[#e92f00]" />

                              <span>
                                {formatDate(
                                  batch?.departure_date
                                )}

                                {" – "}

                                {formatDate(
                                  batch?.return_date
                                )}
                              </span>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                              <Clock3 className="h-4 w-4 shrink-0 text-[#e92f00]" />

                              <span>
                                {getDurationText(batch)}
                              </span>
                            </div>
                          </div>

                          {/* ======================================
                              PRICE + ARROW
                          ====================================== */}
                          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">

                            {/* Price */}
                            <div>
                              <p className="text-xs font-medium text-slate-500">
                                Starting from
                              </p>

                              <div className="mt-1 flex items-center">
                                <IndianRupee className="h-4 w-4 text-[#061b45]" />

                                <span className="text-lg font-bold text-[#061b45]">
                                  {formatPrice(
                                    batch?.price_per_person
                                  )}
                                </span>

                                <span className="ml-1 text-xs text-slate-500">
                                  / person
                                </span>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div
                              className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#fff0eb]
                                text-[#e92f00]
                                transition-all
                                duration-300
                                group-hover:bg-[#e92f00]
                                group-hover:text-white
                              "
                            >
                              <ArrowRight
                                className="
                                  h-5
                                  w-5
                                  transition-transform
                                  duration-300
                                  group-hover:translate-x-0.5
                                "
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>

              {/* ==================================================
                  RIGHT CHEVRON
              ================================================== */}
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                aria-label="Next upcoming trips"
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
                  text-[#061b45]
                  shadow-lg
                  transition-all
                  duration-200
                  hover:scale-105
                  hover:bg-[#061b45]
                  hover:text-white
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
            </div>
          )}
      </div>
    </section>
  );
}












































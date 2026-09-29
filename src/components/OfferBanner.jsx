import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import api from "../api/axios";

export default function OfferBanner() {
  const [offerText, setOfferText] = useState("");

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        setOfferText(
          res.data?.offer_banner_text?.trim() || ""
        );
      })
      .catch(() => {
        setOfferText("");
      });
  }, []);

  // Hide the banner when no offer is configured in Admin Settings.
  if (!offerText) {
    return null;
  }

  return (
        <section
        aria-label="Current travel offer"
        className="
            w-full
            bg-gradient-to-r
            from-[#061B45]
            via-[#163866]
            to-[#FBF8F2]
        "
        >
      <div
        className="
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          py-4
          sm:py-5
          lg:py-6
        "
      >
        <div
          className="
            flex
            items-center
            justify-center
            gap-3
            sm:gap-4
            text-center
          "
        >
          {/* Left decorative icon */}
          <Sparkles
            className="
              w-4 h-4
              sm:w-5 sm:h-5
              lg:w-6 lg:h-6
              shrink-0
              text-orange-300
            "
            aria-hidden="true"
          />

          {/* Offer text */}
          <p
            className="
              max-w-5xl
              text-sm
              sm:text-base
              md:text-lg
              lg:text-xl
              font-semibold
              leading-relaxed
              tracking-wide
              text-ivory
            "
          >
            {offerText}
          </p>

          {/* Right decorative icon */}
          <Sparkles
            className="
              w-4 h-4
              sm:w-5 sm:h-5
              lg:w-6 lg:h-6
              shrink-0
              text-orange-300
              hidden sm:block
            "
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Subtle bottom accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
    </section>
  );
}
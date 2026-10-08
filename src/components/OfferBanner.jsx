

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import api from "../api/axios";

export default function OfferBanner() {
  const [offerText, setOfferText] = useState("");

  useEffect(() => {
    let mounted = true;

    api
      .get("/settings")
      .then((res) => {
        if (!mounted) return;

        setOfferText(
          res.data?.offer_banner_text?.trim() || ""
        );
      })
      .catch(() => {
        if (mounted) {
          setOfferText("");
        }
      });

    return () => {
      mounted = false;
    };
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
        border-y border-[#EBD9E1]
        bg-gradient-to-r
        from-[#FFF0F5]
        via-[#FDE4ED]
        to-[#FFF8FA]
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          py-3.5
          sm:px-6
          sm:py-4
          lg:px-8
          lg:py-5
        "
      >
        <div
          className="
            flex
            items-center
            justify-center
            gap-2.5
            text-center
            sm:gap-4
          "
        >
          {/* Left decorative icon */}
          <Sparkles
            className="
              h-4
              w-4
              shrink-0
              text-[#D41F62]
              sm:h-5
              sm:w-5
              lg:h-6
              lg:w-6
            "
            aria-hidden="true"
          />

          {/* Offer text */}
          <p
            className="
              max-w-5xl
              font-sans
              text-sm
              font-semibold
              leading-relaxed
              tracking-wide
              text-[#2F2A33]
              sm:text-base
              md:text-lg
              lg:text-xl
            "
          >
            {offerText}
          </p>

          {/* Right decorative icon */}
          <Sparkles
            className="
              hidden
              h-4
              w-4
              shrink-0
              text-[#D41F62]
              sm:block
              sm:h-5
              sm:w-5
              lg:h-6
              lg:w-6
            "
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Subtle rose accent */}
      <div
        className="
          h-0.5
          w-full
          bg-gradient-to-r
          from-transparent
          via-[#E8286F]/60
          to-transparent
        "
        aria-hidden="true"
      />
    </section>
  );
}













































// import { useEffect, useState } from "react";
// import { Sparkles } from "lucide-react";
// import api from "../api/axios";

// export default function OfferBanner() {
//   const [offerText, setOfferText] = useState("");

//   useEffect(() => {
//     api
//       .get("/settings")
//       .then((res) => {
//         setOfferText(
//           res.data?.offer_banner_text?.trim() || ""
//         );
//       })
//       .catch(() => {
//         setOfferText("");
//       });
//   }, []);

//   // Hide the banner when no offer is configured in Admin Settings.
//   if (!offerText) {
//     return null;
//   }

//   return (
//         <section
//         aria-label="Current travel offer"
//         className="
//             w-full
//             bg-gradient-to-r
//             from-[#061B45]
//             via-[#163866]
//             to-[#FBF8F2]
//         "
//         >
//       <div
//         className="
//           max-w-7xl
//           mx-auto
//           px-4
//           sm:px-6
//           lg:px-8
//           py-4
//           sm:py-5
//           lg:py-6
//         "
//       >
//         <div
//           className="
//             flex
//             items-center
//             justify-center
//             gap-3
//             sm:gap-4
//             text-center
//           "
//         >
//           {/* Left decorative icon */}
//           <Sparkles
//             className="
//               w-4 h-4
//               sm:w-5 sm:h-5
//               lg:w-6 lg:h-6
//               shrink-0
//               text-orange-300
//             "
//             aria-hidden="true"
//           />

//           {/* Offer text */}
//           <p
//             className="
//               max-w-5xl
//               text-sm
//               sm:text-base
//               md:text-lg
//               lg:text-xl
//               font-semibold
//               leading-relaxed
//               tracking-wide
//               text-ivory
//             "
//           >
//             {offerText}
//           </p>

//           {/* Right decorative icon */}
//           <Sparkles
//             className="
//               w-4 h-4
//               sm:w-5 sm:h-5
//               lg:w-6 lg:h-6
//               shrink-0
//               text-orange-300
//               hidden sm:block
//             "
//             aria-hidden="true"
//           />
//         </div>
//       </div>

//       {/* Subtle bottom accent */}
//       <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
//     </section>
//   );
// }
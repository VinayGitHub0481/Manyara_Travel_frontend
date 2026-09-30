

import { useEffect, useMemo, useRef, useState } from "react";

import {

 Search,

 MapPin,

 Sparkles,

 ShieldCheck,

 Headphones,

 Plane,

 ChevronRight,

 Mountain,

 Waves,

 Heart,

 Landmark,

 Globe2,

 X,

 Send,

 MessageCircle,

 Loader2,

 CheckCircle2,

 PlaneTakeoff,

} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { toast, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";



import { getPackages } from "../api/content";

import api from "../api/axios";



// =========================================================

// Package type configuration

// =========================================================



const PACKAGE_TYPE_CONFIG = {

 family: {

  label: "Family Holidays",

  icon: Sparkles,

  fallbackDescription: "Memorable holidays for the whole family",

 },



 pilgrimage: {

  label: "Temples & Pilgrimage",

  icon: Landmark,

  fallbackDescription: "Spiritual journeys & temple tours",

 },



 beach: {

  label: "Beach Holidays",

  icon: Waves,

  fallbackDescription: "Relaxing beaches, islands & coastal escapes",

 },



 mountains_adventure: {

  label: "Mountains & Adventures",

  icon: Mountain,

     fallbackDescription: "Mountains, valleys & adventure",

 },



 romantic: {

     label: "Romantic Getaways",

     icon: Heart,

     fallbackDescription: "Beautiful escapes for couples",

 },



 international: {

     label: "International",

     icon: Globe2,

     fallbackDescription: "Explore the world beyond India",

 },



 wildlife_nature: {

     label: "Wildlife & Nature",

     icon: Mountain,

     fallbackDescription:

      "Wildlife, forests & beautiful natural escapes",

 },

};



// =========================================================

// Priority travel styles

// =========================================================



const PRIORITY_PACKAGE_TYPES = [

 "family",

 "pilgrimage",

 "beach",

 "mountains_adventure",

];



const REMAINING_PACKAGE_TYPES = [

 "romantic",

 "international",

 "wildlife_nature",

];



// =========================================================

// Empty custom enquiry form

// =========================================================



const EMPTY_CUSTOM_FORM = {

 name: "",

 phone: "",

 destination: "",

 package_type: "",

 travellers: "1",

 travel_date: "",

 message: "",

};



// =========================================================

// Local date for <input type="date">

// =========================================================



function getTodayForDateInput() {

    const now = new Date();



    const localDate = new Date(

     now.getTime() - now.getTimezoneOffset() * 60000

    );



    return localDate.toISOString().split("T")[0];

}



// =========================================================

// Normalize package type

// =========================================================



function getPackageType(pkg) {

    return String(pkg?.package_type || pkg?.type || "")

     .trim()

     .toLowerCase();

}



// =========================================================

// Package type config

// =========================================================



function getPackageTypeConfig(type) {

    return (

        PACKAGE_TYPE_CONFIG[type] || {

            label: "Travel Package",

            icon: Sparkles,

            fallbackDescription:

             "Explore beautiful destinations with On a Trip Holidays",

        }

    );

}



// =========================================================

// Safely get package image

// =========================================================



function getPackageImage(pkg) {

    if (Array.isArray(pkg?.images) && pkg.images.length > 0) {

        const firstImage = pkg.images[0];



        if (typeof firstImage === "string") {

            return firstImage;

        }



        if (firstImage?.url) {

            return firstImage.url;

        }

    }



    return (

        pkg?.image?.url ||

        pkg?.cover_image?.url ||

        pkg?.featured_image?.url ||

        pkg?.thumbnail?.url ||

        (typeof pkg?.image === "string" ? pkg.image : null) ||

        (typeof pkg?.cover_image === "string"

         ? pkg.cover_image

         : null) ||

        (typeof pkg?.featured_image === "string"

         ? pkg.featured_image

         : null) ||

        "/images/package-placeholder.webp"

    );

}



// =========================================================

// Package description

// =========================================================



function getPackageDescription(pkg, fallback) {

    if (pkg?.destination) {

        return pkg.destination;

    }



    if (pkg?.short_description) {

        return pkg.short_description;

    }



    if (pkg?.description) {

        return pkg.description.length > 90

         ? `${pkg.description.slice(0, 90)}...`

         : pkg.description;

    }



    return fallback;

}



// =========================================================

// Package key

// =========================================================



function getPackageKey(pkg) {

    return (

        pkg?.id ||

        pkg?.slug ||

        `${pkg?.title || "package"}-${pkg?.destination || ""}`

    );

}



// =========================================================

// Published package

// =========================================================



function isPublishedPackage(pkg) {

    const status = String(pkg?.status ?? "")

        .trim()

        .toLowerCase();

    return (

     status === "" ||

     status === "published" ||

     pkg?.is_published === true

    );

}



// =========================================================

// Normalize destination

// =========================================================



function normalizeDestination(value) {

    return String(value || "")

     .trim()

     .replace(/\s+/g, " ")

     .toLowerCase();

}



// =========================================================

// Hero skeleton

// =========================================================



function Skeleton({ className = "" }) {

    return (

     <div

         className={`animate-pulse rounded-lg bg-white/15 ${className}`}

         aria-hidden="true"

        />

    );

}



// =========================================================

// Travel style/category card

//

// IMPORTANT:

// This is NOT an individual package card.

//

// Family -> /packages?type=family

// Pilgrimage -> /packages?type=pilgrimage

// etc.

//

// Clicking the card opens a listing page containing

// all packages belonging to that travel type.

// =========================================================


function TravelStyleCard({ travelStyle }) {
  if (!travelStyle) {
    return null;
  }

  const { type, count, image } = travelStyle;

  const config = getPackageTypeConfig(type);

  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const title = config.label;
  const description = config.fallbackDescription;

  const packageCountLabel =
    count === 1
      ? "1 package available"
      : `${count} packages available`;

  const packagesUrl =
    `/packages?type=${encodeURIComponent(type)}`;

  return (
    <Link
      to={packagesUrl}
      className="
        group
        relative
        block
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-navy/10
        bg-navy
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:shadow-lg
        focus:outline-none
        focus:ring-2
        focus:ring-accent/50
        focus:ring-offset-2
      "
      aria-label={`View ${count} ${title} packages`}
    >
      {/* Background image */}
      <div
        className="
          relative
          h-[145px]
          w-full
          overflow-hidden
          sm:h-[155px]
          lg:h-[165px]
        "
      >
        <img
          src={image || "/images/package-placeholder.webp"}
          alt={title}
          loading="lazy"
          decoding="async"
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-[1.04]
          "
          onError={(event) => {
            if (
              event.currentTarget.src.includes(
                "package-placeholder.webp"
              )
            ) {
              return;
            }

            event.currentTarget.src =
              "/images/package-placeholder.webp";
          }}
        />

        {/* Image readability overlay */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/85
            via-black/45
            to-black/10
          "
        />

        {/* Content */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            p-3.5
            sm:p-4
          "
        >
          <div className="flex items-end gap-3">

            {/* Text */}
            <div className="min-w-0 flex-1">

              {/* Icon + package count */}
              <div className="mb-1.5 flex items-center gap-2">
                {Icon && (
                  <span
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white/15
                      text-white
                      backdrop-blur-sm
                    "
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </span>
                )}

                <span
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.08em]
                    text-white/80
                  "
                >
                  {packageCountLabel}
                </span>
              </div>

              {/* Title */}
              <h3
                className="
                  font-display
                  text-lg
                  font-semibold
                  leading-tight
                  text-white
                  sm:text-xl
                "
              >
                {title}
              </h3>

              {/* Description */}
              <p
                className="
                  mt-1
                  max-w-3xl
                  text-xs
                  leading-relaxed
                  text-white/75
                  sm:text-sm
                  line-clamp-2
                "
              >
                {description}
              </p>
            </div>

            {/* Arrow */}
            <span
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-white/15
                text-white
                backdrop-blur-sm
                transition-all
                duration-300
                group-hover:translate-x-1
                group-hover:bg-accent
              "
            >
              <ChevronRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}



// =========================================================

// Package card skeleton

// =========================================================



function PackageCardSkeleton() {

 return (

  <div

   className="

       flex
       flex-col
       items-stretch
       gap-3
       rounded-2xl
       border
       border-navy/10
       bg-white
       p-3

   "

   aria-hidden="true"

  >

   <div

       className="

        w-full
        h-24
        sm:h-20

        shrink-0

        rounded-xl

        bg-navy/10

        animate-pulse

          "

         />



         <div className="flex-1 min-w-0 space-y-3">

          <div className="h-5 w-24 rounded-full bg-navy/10 animate-pulse" />



          <div className="h-4 w-4/5 rounded bg-navy/10 animate-pulse" />



          <div className="h-3 w-full rounded bg-navy/10 animate-pulse" />



          <div className="h-3 w-28 rounded bg-navy/10 animate-pulse" />

         </div>



         <div className="h-5 w-5 rounded-full bg-navy/10 animate-pulse" />

     </div>

    );

}



// =========================================================

// Custom package request modal

//

// Enquiry payload:

//

// name

// phone

// destination

// package_type

// travellers

// travel_date

// message

//

// package_id and batch_id intentionally remain null/

// omitted because this is a custom enquiry.

// =========================================================



function CustomPackageModal({

 open,

 destination,

 onClose,

}) {

 const [form, setForm] = useState({

     ...EMPTY_CUSTOM_FORM,

     destination: destination || "",

 });



 const [submitting, setSubmitting] = useState(false);

 const [success, setSuccess] = useState(false);



 // Hard lock prevents rapid double-click / duplicate

 // submit events before React re-renders.

 const submitLockRef = useRef(false);



 const today = getTodayForDateInput();




 const [errors, setErrors] = useState({});

const [touched, setTouched] = useState({});



const currentYear = new Date().getFullYear();

const nextYear = currentYear + 1;



const validateField = (name, value) => {

const trimmedValue = String(value ?? "").trim();




switch (name) {

 case "name":

  if (!trimmedValue) {

      return "Please enter your name.";

  }



  if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmedValue)) {

      return "Name should contain characters only.";

  }



  return "";



 case "phone":

  if (!trimmedValue) {

      return "Please enter your phone number.";

  }



  if (!/^\d+$/.test(trimmedValue)) {

      return "Phone number should contain numbers only.";

 }



 if (trimmedValue.length !== 10) {

     return "Phone number should contain 10 digits.";

 }



 if (!/^[6-9]\d{9}$/.test(trimmedValue)) {

     return "Please enter a valid phone number.";

 }



 return "";



case "destination":

 if (!trimmedValue) {

     return "Please enter your destination.";

 }



 if (!/^[A-Za-z0-9]+(?:[ ,.'-][A-Za-z0-9]+)*$/.test(trimmedValue)) {

     return "Please enter a valid destination.";

 }



 return "";



case "package_type":

 if (!trimmedValue) {

     return "Please select a package type.";

 }

 return "";



case "travellers":

 if (!trimmedValue) {

     return "Please enter the number of travellers.";

 }



 if (!/^\d+$/.test(trimmedValue)) {

     return "Travellers must be a whole number. Decimals are not allowed.";

 }



 if (Number(trimmedValue) < 1) {

     return "There must be at least 1 traveller.";

 }



 return "";



case "travel_date": {

 if (!trimmedValue) {

     return "Please select your travel date.";

 }



 if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {

     return "Please enter a valid travel date.";

 }



 const selectedDate = new Date(`${trimmedValue}T00:00:00`);

         if (Number.isNaN(selectedDate.getTime())) {

             return "Please enter a valid travel date.";

         }



         const selectedYear = selectedDate.getFullYear();



         if (selectedYear !== currentYear && selectedYear !== nextYear) {

             return `Travel date must be in ${currentYear} or ${nextYear}.`;

         }



         const todayDate = new Date();

         todayDate.setHours(0, 0, 0, 0);



         if (selectedDate < todayDate) {

             return "Travel date cannot be in the past.";

         }



         return "";

     }



     default:

         return "";

 }

};



const validateForm = () => {

 const fieldsToValidate = [

     "name",

     "phone",

     "destination",

     "package_type",

     "travellers",

     "travel_date",

 ];

const newErrors = {};



 fieldsToValidate.forEach((field) => {

     const error = validateField(field, form[field]);



     if (error) {

         newErrors[field] = error;

     }

 });



 setErrors(newErrors);



 setTouched((prev) => ({

     ...prev,

     ...Object.fromEntries(

         fieldsToValidate.map((field) => [field, true])

     ),

 }));



 return Object.keys(newErrors).length === 0;

};




 // =======================================================

 // Reset form whenever modal opens

 // =======================================================



 useEffect(() => {

 if (!open) {

     return;

 }



 setForm({

     ...EMPTY_CUSTOM_FORM,

     destination: destination || "",

 });



 setSubmitting(false);

 setSuccess(false);
 setErrors({});
 setTouched({});



 submitLockRef.current = false;

}, [open, destination]);



// =======================================================

// Escape + body lock

// =======================================================



useEffect(() => {

 if (!open) {

     return;

 }



 const handleEscape = (event) => {

     if (event.key === "Escape") {

       if (!submitting) {

        onClose();

         }

     }

    };



    document.addEventListener("keydown", handleEscape);



    document.body.style.overflow = "hidden";



    return () => {

     document.removeEventListener(

         "keydown",

         handleEscape

     );



     document.body.style.overflow = "";

    };

}, [open, onClose, submitting]);



if (!open) {

    return null;

}



// =======================================================

// Input change

// =======================================================



const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
        ...previous,
        [name]: value,
    }));

    setTouched((previous) => ({
        ...previous,
        [name]: true,
    }));

    const error = validateField(name, value);

    setErrors((previous) => ({
        ...previous,
        [name]: error,
    }));
};


// =======================================================

// Submit

// =======================================================



const handleSubmit = async (event) => {
 event.preventDefault();

 // -----------------------------------------------------
 // HARD DUPLICATE PROTECTION
 // -----------------------------------------------------
 if (
     submitLockRef.current ||
     submitting ||
     success
 ) {
     return;
 }

 // Validate every required field before sending the request.
 if (!validateForm()) {
     toast.error("Please correct the highlighted fields.");
     return;
 }

 const name = form.name.trim();
 const phone = form.phone.trim();
 const selectedDestination = form.destination.trim();
 const packageType = form.package_type.trim();
 const travellers = Number(form.travellers);
 const travelDate = form.travel_date;
 const message = form.message.trim();

 // -----------------------------------------------------
 // Lock BEFORE API call.

//

// This prevents rapid double clicks from creating

// multiple enquiry records.

// -----------------------------------------------------



submitLockRef.current = true;

setSubmitting(true);

try {

 await api.post("/enquiries", {

  name,

  phone,

  destination: selectedDestination,

  package_type: packageType,

  travellers,

  travel_date: travelDate,

  message,

 });



 setSuccess(true);



 toast.success(

  "Your travel request has been submitted successfully!"

 );

} catch (error) {

 console.error(

  "Custom package enquiry failed:",

  error

 );



 // Unlock only after a failed request so the user

 // can retry.

 submitLockRef.current = false;



 const backendMessage =

         error?.response?.data?.detail;



     let errorMessage =

         "Unable to submit your request right now. Please try again.";



     if (Array.isArray(backendMessage)) {

         errorMessage = backendMessage

          .map(

              (item) =>

               item?.msg ||

               item?.message ||

               "Invalid enquiry details."

          )

          .join(", ");

     } else if (

         typeof backendMessage === "string"

     ){

         errorMessage = backendMessage;

     }



     toast.error(errorMessage);

 } finally {

     setSubmitting(false);

 }

};



return (

 <div

className="

    fixed

    inset-0

    z-[100]

    flex

    items-center

    justify-center

    bg-black/60

    backdrop-blur-sm

    p-4

"

role="dialog"

aria-modal="true"

aria-labelledby="custom-package-title"

onMouseDown={(event) => {

    if (

        event.target === event.currentTarget &&

        !submitting

    ){

        onClose();

    }

}}

>

<div

    className="

        relative

        w-full

        max-w-lg

    max-h-[90vh]

    overflow-y-auto

    rounded-3xl

    bg-ivory

    p-5

    sm:p-7

    shadow-2xl

"

>

{/* Close */}



<button

    type="button"

    onClick={onClose}

    disabled={submitting}

    className="

     absolute

     right-4

     top-4

     flex

     h-9

     w-9

     items-center

     justify-center

     rounded-full

     bg-navy/5

     text-navy/60

     transition

     hover:bg-navy/10

     hover:text-navy

     disabled:cursor-not-allowed

     disabled:opacity-50

     focus:outline-none

     focus:ring-2

     focus:ring-accent/40

 "

 aria-label="Close custom package form"

>

 <X className="h-5 w-5" />

</button>



{/* =================================================

     SUCCESS

     ================================================= */}



{success ? (

 <div className="py-8 text-center">

     <div

      className="

       mx-auto

       flex

       h-16

       w-16

       items-center

       justify-center

       rounded-full

     bg-green-100

     text-green-600

 "

>

 <CheckCircle2 className="h-8 w-8" />

</div>



<h2

 className="

     mt-5

     font-display

     text-2xl

     sm:text-3xl

     font-semibold

     text-navy

 "

>

 Request received

</h2>



<p

 className="

     mx-auto

     mt-3

     max-w-sm

     text-sm

     leading-relaxed

     text-navy/60

      "

  >

      Thank you. Our travel team will review

      your request and contact you soon.

  </p>



  <button

      type="button"

      onClick={onClose}

      className="

          mt-6

          rounded-xl

          bg-accent

          px-6

          py-3

          text-sm

          font-semibold

          text-white

          transition

          hover:bg-accent-hover

      "

  >

      Done

  </button>

 </div>

):(

 <>

  {/* =================================================

  HEADER

  ================================================= */}



<div className="pr-10">

<div className="flex items-center gap-3">

   <div

    className="

        flex

        h-11

        w-11

        shrink-0

        items-center

        justify-center

        rounded-2xl

        bg-accent/10

        text-accent

    "

   >

    <PlaneTakeoff className="h-5 w-5" />

   </div>



   <h2

    id="custom-package-title"

    className="

        font-display

        text-2xl

        font-semibold

        text-navy

           sm:text-3xl

       "

      >

       Plan a custom trip

      </h2>

  </div>



 <p

  className="

      mt-3

      text-sm

      leading-relaxed

      text-navy/60

  "

 >

  This destination is not currently

  available as a package. Tell us what

  you are looking for and our team can

  help create a customized trip.

 </p>

</div>



{/* =================================================

  FORM

  ================================================= */}



<form

 onSubmit={handleSubmit}

className="mt-6 space-y-4"

noValidate

>

{/* Name */}



<div>

    <label

     htmlFor="custom-name"

     className="

         mb-1.5

         block

         text-sm

         font-semibold

         text-navy

     "

    >

     Name

    </label>



    <input

     id="custom-name"

     name="name"

     type="text"

     value={form.name}

     onChange={handleChange}

     placeholder="Enter your name"

     autoComplete="name"

     disabled={submitting}

     required

     className="

      w-full

      rounded-xl

      border

      border-navy/15

      bg-white

      px-4

      py-3

      text-sm

      text-navy

      outline-none

      transition

      placeholder:text-navy/35

      focus:border-accent/50

      focus:ring-2

      focus:ring-accent/10

      disabled:cursor-not-allowed

      disabled:bg-navy/5

  "

 />

    {touched.name && errors.name && (
      <p className="mt-1.5 text-xs font-medium text-red-500">
        {errors.name}
      </p>
    )}

</div>



{/* Phone */}



<div>

 <label

  htmlFor="custom-phone"

 className="

     mb-1.5

     block

     text-sm

     font-semibold

     text-navy

 "

>

 Phone number

</label>



<input

 id="custom-phone"

 name="phone"

 type="tel"

 value={form.phone}

 onChange={handleChange}

 placeholder="Enter your phone number"

 autoComplete="tel"

 inputMode="numeric"

 maxLength={10}

 disabled={submitting}

 required

 className="

     w-full

     rounded-xl

     border

     border-navy/15

     bg-white

      px-4

      py-3

      text-sm

      text-navy

      outline-none

      transition

      placeholder:text-navy/35

      focus:border-accent/50

      focus:ring-2

      focus:ring-accent/10

      disabled:cursor-not-allowed

      disabled:bg-navy/5

  "

 />

    {touched.phone && errors.phone && (
      <p className="mt-1.5 text-xs font-medium text-red-500">
        {errors.phone}
      </p>
    )}

</div>



{/* Destination */}



<div>

 <label

  htmlFor="custom-destination"

  className="

      mb-1.5

      block

      text-sm

      font-semibold

      text-navy

  "

>

 Destination

</label>



<input

 id="custom-destination"

 name="destination"

 type="text"

 value={form.destination}

 onChange={handleChange}

 placeholder="Enter your destination"

 disabled={submitting}

 required

 className="

    w-full

    rounded-xl

    border

    border-navy/15

    bg-white

    px-4

    py-3

    text-sm

    text-navy

    outline-none

    transition

    placeholder:text-navy/35

    focus:border-accent/50

    focus:ring-2

      focus:ring-accent/10

      disabled:cursor-not-allowed

      disabled:bg-navy/5

  "

 />

    {touched.destination && errors.destination && (
      <p className="mt-1.5 text-xs font-medium text-red-500">
        {errors.destination}
      </p>
    )}

</div>



{/* Package Type */}



<div>

 <label

  htmlFor="custom-package-type"

  className="

      mb-1.5

      block

      text-sm

      font-semibold

      text-navy

  "

 >

  Package type

 </label>



 <select

  id="custom-package-type"

  name="package_type"

  value={form.package_type}

  onChange={handleChange}

disabled={submitting}

required

className="

    w-full

    rounded-xl

    border

    border-navy/15

    bg-white

    px-4

    py-3

    text-sm

    text-navy

    outline-none

    transition

    focus:border-accent/50

    focus:ring-2

    focus:ring-accent/10

    disabled:cursor-not-allowed

    disabled:bg-navy/5

"

>

<option value="">

    Select package type

</option>



{Object.entries(

    PACKAGE_TYPE_CONFIG

).map(([value, config]) => (

   <option

       key={value}

       value={value}

   >

       {config.label}

   </option>

  ))}

 </select>


    {touched.package_type && errors.package_type && (
      <p className="mt-1.5 text-xs font-medium text-red-500">
        {errors.package_type}
      </p>
    )}
</div>



{/* Travellers + Travel Date */}



<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

 {/* Travellers */}



 <div>

  <label

   htmlFor="custom-travellers"

   className="

       mb-1.5

       block

       text-sm

       font-semibold

       text-navy

   "

  >

   Travellers

  </label>

<input

 id="custom-travellers"

 name="travellers"

 type="text"

 value={form.travellers}

 onChange={handleChange}

 placeholder="Number"

 inputMode="numeric"
  pattern="[0-9]*"
  disabled={submitting}

 required

 className="

  w-full

  rounded-xl

  border

  border-navy/15

  bg-white

  px-4

  py-3

  text-sm

  text-navy

  outline-none

  transition

  placeholder:text-navy/35

  focus:border-accent/50

  focus:ring-2

  focus:ring-accent/10

      disabled:cursor-not-allowed

      disabled:bg-navy/5

  "

 />

    {touched.travellers && errors.travellers && (
      <p className="mt-1.5 text-xs font-medium text-red-500">
        {errors.travellers}
      </p>
    )}


</div>



{/* Travel Date */}



<div>

 <label

  htmlFor="custom-travel-date"

  className="

      mb-1.5

      block

      text-sm

      font-semibold

      text-navy

  "

 >

  Travel date

 </label>



 <input

  id="custom-travel-date"

  name="travel_date"

  type="date"

  min={today}

  value={form.travel_date}

   onChange={handleChange}

   disabled={submitting}

   required

   className="

       w-full

       rounded-xl

       border

       border-navy/15

       bg-white

       px-4

       py-3

       text-sm

       text-navy

       outline-none

       transition

       focus:border-accent/50

       focus:ring-2

       focus:ring-accent/10

       disabled:cursor-not-allowed

       disabled:bg-navy/5

   "

  />

    {touched.travel_date && errors.travel_date && (
      <p className="mt-1.5 text-xs font-medium text-red-500">
        {errors.travel_date}
      </p>
    )}

 </div>

</div>



{/* Message */}



<div>

<label

 htmlFor="custom-message"

 className="

     mb-1.5

     block

     text-sm

     font-semibold

     text-navy

 "

>

 Message

</label>



<textarea

 id="custom-message"

 name="message"

 value={form.message}

 onChange={handleChange}

 rows={4}

 disabled={submitting}

 placeholder="Tell us about your trip requirements..."

 className="

     w-full

     resize-none

     rounded-xl

     border

     border-navy/15

     bg-white

         px-4

         py-3

         text-sm

         text-navy

         outline-none

         transition

         placeholder:text-navy/35

         focus:border-accent/50

         focus:ring-2

         focus:ring-accent/10

         disabled:cursor-not-allowed

         disabled:bg-navy/5

     "

 />

</div>



{/* Submit */}



<button

 type="submit"

 disabled={

     submitting ||

     submitLockRef.current

 }

 className="

     flex

     w-full

     items-center

    justify-center

    gap-2

    rounded-xl

    bg-accent

    px-5

    py-3.5

    text-sm

    font-semibold

    text-white

    transition-all

    hover:bg-accent-hover

    disabled:cursor-not-allowed

    disabled:opacity-70

    focus:outline-none

    focus:ring-2

    focus:ring-accent/40

    focus:ring-offset-2

"

>

{submitting ? (

    <>

     <Loader2 className="h-4 w-4 animate-spin" />

     Sending request...

    </>

):(

    <>

     <Send className="h-4 w-4" />

     Submit Enquiry

                    </>

                )}

               </button>



               {submitting && (

                <p className="text-center text-[11px] text-navy/45">

                    Please wait while we submit your request.

                </p>

               )}

               </form>

           </>

          )}

         </div>

     </div>

    );

}



// =========================================================

// Main Hero

// =========================================================



export default function Hero({ onPlanTrip }) {

    const navigate = useNavigate();



    const searchContainerRef = useRef(null);



    const [destination, setDestination] = useState("");

    const [searching, setSearching] = useState(false);

const [searchError, setSearchError] = useState("");



const [settings, setSettings] = useState(null);

const [settingsLoading, setSettingsLoading] =

 useState(true);



const [packages, setPackages] = useState([]);

const [packagesLoading, setPackagesLoading] =

 useState(true);



const [showAllPackages, setShowAllPackages] =

 useState(false);



const [showSuggestions, setShowSuggestions] =

 useState(false);



const [

 customPackageModalOpen,

 setCustomPackageModalOpen,

] = useState(false);



// =======================================================

// Load website settings

// =======================================================



useEffect(() => {

 let mounted = true;

 api

   .get("/settings")

   .then((res) => {

      if (!mounted) return;



      setSettings(res?.data || null);

   })

   .catch((error) => {

      console.error(

         "Failed to load website settings:",

         error

      );



      if (!mounted) return;



      setSettings(null);

   })

   .finally(() => {

      if (!mounted) return;



      setSettingsLoading(false);

   });



 return () => {

   mounted = false;

 };

}, []);

// =======================================================

// Load packages

// =======================================================



useEffect(() => {

 let mounted = true;



 setPackagesLoading(true);



 getPackages()

  .then((data) => {

   if (!mounted) return;



   const packageList = Array.isArray(data)

       ? data

       : Array.isArray(data?.items)

       ? data.items

       : [];



   setPackages(packageList);

  })

  .catch((error) => {

   console.error(

       "Failed to load packages:",

       error

   );



   if (!mounted) return;

       setPackages([]);

   })

   .finally(() => {

       if (!mounted) return;



       setPackagesLoading(false);

   });



 return () => {

   mounted = false;

 };

}, []);



// =======================================================

// Close suggestions outside

// =======================================================



useEffect(() => {

 const handleOutsideClick = (event) => {

   if (

       searchContainerRef.current &&

       !searchContainerRef.current.contains(

           event.target

       )

   ){

       setShowSuggestions(false);

   }

 };



 document.addEventListener(

     "mousedown",

     handleOutsideClick

 );



 return () => {

     document.removeEventListener(

      "mousedown",

      handleOutsideClick

     );

 };

}, []);



// =======================================================

// Published packages

// =======================================================



const publishedPackages = useMemo(() => {

 if (!Array.isArray(packages)) {

     return [];

 }



 return packages.filter(isPublishedPackage);

}, [packages]);



// =======================================================

// Destination list + package count

// =======================================================



const destinationOptions = useMemo(() => {

 const destinationMap = new Map();



 publishedPackages.forEach((pkg) => {

  const rawDestination = String(

      pkg?.destination || ""

  ).trim();



  if (!rawDestination) {

      return;

  }



  const normalized =

      normalizeDestination(rawDestination);



  if (!normalized) {

      return;

  }



  if (!destinationMap.has(normalized)) {

      destinationMap.set(normalized, {

       name: rawDestination,

       count: 0,

      });

  }

     const item =

       destinationMap.get(normalized);



     item.count += 1;

 });



 return Array.from(

     destinationMap.values()

 ).sort((a, b) =>

     a.name.localeCompare(b.name)

 );

}, [publishedPackages]);



// =======================================================

// Destination suggestions

// =======================================================



const filteredDestinationOptions = useMemo(() => {

 const searchTerm =

     normalizeDestination(destination);



 if (!searchTerm) {

     return destinationOptions.slice(0, 8);

 }



 return destinationOptions

     .filter((item) =>

          normalizeDestination(

           item.name

          ).includes(searchTerm)

      )

      .slice(0, 8);

}, [

 destination,

 destinationOptions,

]);



// =======================================================

// Exact destination

// =======================================================



const exactDestination = useMemo(() => {

 const normalized =

      normalizeDestination(destination);



 if (!normalized) {

      return null;

 }



 return (

      destinationOptions.find(

          (item) =>

           normalizeDestination(

            item.name

           ) === normalized

      ) || null

 );

}, [

 destination,

 destinationOptions,

]);



// =======================================================

// BUILD TRAVEL STYLE CARDS

// =======================================================



const travelStyles = useMemo(() => {

 if (

      !Array.isArray(publishedPackages) ||

      publishedPackages.length === 0

 ){

      return [];

 }



 const grouped = new Map();



 publishedPackages.forEach((pkg) => {

      const type = getPackageType(pkg);



      if (!type) {

          return;

      }

 if (!PACKAGE_TYPE_CONFIG[type]) {

      return;

 }



 if (!grouped.has(type)) {

      grouped.set(type, {

       type,

       count: 0,

       representativePackage: pkg,

      });

 }



 const group = grouped.get(type);



 group.count += 1;



 if (

      !getPackageImage(

       group.representativePackage

      ) &&

      getPackageImage(pkg)

 ){

      group.representativePackage = pkg;

 }

});



const selected = [];

PRIORITY_PACKAGE_TYPES.forEach((type) => {

 const item = grouped.get(type);



 if (item) {

      selected.push({

       type: item.type,

       count: item.count,

       image: getPackageImage(

            item.representativePackage

       ),

      });

 }

});



REMAINING_PACKAGE_TYPES.forEach((type) => {

 if (selected.length >= 7) {

      return;

 }



 const item = grouped.get(type);



 if (!item) {

      return;

 }



 selected.push({

      type: item.type,

      count: item.count,

       image: getPackageImage(

        item.representativePackage

       ),

  });

 });



 return selected;

}, [publishedPackages]);



// =======================================================

// Visible travel styles

// =======================================================



const visibleTravelStyles = showAllPackages

 ? travelStyles

 : travelStyles.slice(0, 4);



// =======================================================

// Dynamic admin settings

// =======================================================



const headline =

 settings?.homepage_headline ||

 "Discover holidays worth remembering.";



const trustLine =

 settings?.trust_line ||

 "The two Telugu states' trusted travel company";

const internationalDestinations =

 Array.isArray(

     settings?.featured_international

 )

     ? settings.featured_international

     : [];



const nationalDestinations =

 Array.isArray(

     settings?.featured_national

 )

     ? settings.featured_national

     : [];



const featuredDestinations = [

 ...internationalDestinations,

 ...nationalDestinations,

].slice(0, 8);



// =======================================================

// Open custom package request

// =======================================================



const openCustomPackageRequest = () => {

 setShowSuggestions(false);

 setSearchError("");

 setCustomPackageModalOpen(true);

};



// =======================================================

// Select destination

//

// IMPORTANT:

//

// Selecting a suggestion DOES NOT navigate.

//

// It only:

// 1. fills the input

// 2. closes suggestions

// 3. waits for Explore Packages

//

// Therefore:

//

// Select Kerala

//      ↓

// input = Kerala

//      ↓

// user clicks Explore Packages

//      ↓

// /packages?destination=Kerala

// =======================================================



const handleDestinationSelect = (item) => {

 if (!item?.name) {

     return;

 }



 setDestination(item.name);

 setSearchError("");

 setShowSuggestions(false);

 navigate(
  `/packages?destination=${encodeURIComponent(item.name)}`
 )

};



// =======================================================

// Search / Explore Packages

//

// This is the ONLY place where destination search

// navigates to the packages listing.

//

// IMPORTANT:

//

// /packages?destination=Kerala

//

// is a listing route.

//

// It is NOT:

//

// /packages/:slug

// =======================================================



const handleSearch = async (event) => {

 event.preventDefault();



 const search = destination.trim();

if (!search) {

    setSearchError("");

    setShowSuggestions(false);

    navigate("/packages");

    return;

}



try {

    setSearching(true);

    setSearchError("");

    setShowSuggestions(false);



    // ---------------------------------------------------

    // Exact destination

    // ---------------------------------------------------



    const matchedDestination =

     destinationOptions.find(

      (item) =>

          normalizeDestination(

           item.name

          ) ===

          normalizeDestination(search)

     );



    if (matchedDestination) {

     navigate(

     `/packages?destination=${encodeURIComponent(

         matchedDestination.name

     )}`

    );



    return;

}



// ---------------------------------------------------

// Partial destination

// ---------------------------------------------------



const partialMatch =

    destinationOptions.find(

     (item) =>

         normalizeDestination(

             item.name

         ).includes(

             normalizeDestination(search)

         ) ||

         normalizeDestination(

             search

         ).includes(

             normalizeDestination(item.name)

         )

    );



if (partialMatch) {

        navigate(

         `/packages?destination=${encodeURIComponent(

             partialMatch.name

         )}`

        );



        return;

    }



    // ---------------------------------------------------

    // No destination

    // ---------------------------------------------------



    setSearchError(

        "The current destination package is not available yet."

    );

} catch (error) {

    console.error(

        "Package search failed:",

        error

    );



    setSearchError(

        "Unable to search packages right now. Please try again."

    );

} finally {

    setSearching(false);

}

};



// =======================================================

// Search input

// =======================================================



const handleInputChange = (event) => {

 const value = event.target.value;



 setDestination(value);

 setSearchError("");

 setShowSuggestions(true);

};



// =======================================================

// Render

// =======================================================



return (

 <>

     {/* ===================================================

       TOASTIFY

       =================================================== */}



     <ToastContainer

      position="top-right"

      autoClose={3500}

      hideProgressBar={false}

 newestOnTop

 closeOnClick

 pauseOnFocusLoss

 draggable

 pauseOnHover

 theme="light"

/>



<section

 className="

     relative

     overflow-hidden

     px-4

     py-8

     sm:px-6

     sm:py-10

     lg:px-8

     lg:py-12

 "

>
      <img
    src="/images/view1.webp"
    alt=""
    fetchPriority="high"
    loading="eager"
    decoding="async"
    width="1920"
    height="1080"
    className="
      absolute
      inset-0
      h-full
      w-full
      object-cover
      object-center
    "
  />

 {/* Background overlays */}



 <div

     className="

      absolute

     inset-0

     bg-gradient-to-r

     from-navy/95

     via-navy/80

     to-navy/30

 "

 aria-hidden="true"

/>



<div

 className="

     absolute

     inset-x-0

     bottom-0

     h-2/3

     bg-gradient-to-t

     from-navy/80

     via-navy/20

     to-transparent

 "

 aria-hidden="true"

/>



<div

 className="

     absolute

     -right-40

     -bottom-40

     w-[500px]

     h-[500px]

     rounded-full

     bg-accent/10

     blur-3xl

 "

 aria-hidden="true"

/>



{/* Main content */}



<div

 className="

     relative

     z-10

     w-full

     max-w-7xl

     mx-auto

 "

>

 <div

     className="

      grid

      grid-cols-1

      lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.95fr)]

      xl:grid-cols-[minmax(0,1fr)_560px]

      gap-8

      lg:gap-10

    xl:gap-12

    items-center

"

>

{/* =================================================

        LEFT SIDE

        ================================================= */}



<div

    className="

        min-w-0

        pt-0

        sm:pt-2

        lg:pt-0

    "

>

    {/* Eyebrow */}



    <div

        className="

         inline-flex

         items-center

         gap-2

         mb-5

         rounded-full

         border

         border-ivory/20

         bg-ivory/10

     backdrop-blur-md

     px-4

     py-2

 "

>

 <Sparkles

     className="w-4 h-4 text-accent"

     aria-hidden="true"

 />



 <span

     className="

         uppercase

         tracking-[0.18em]

         text-[11px]

         sm:text-xs

         font-semibold

         text-ivory/90

     "

 >

     Curated holidays, made simple

 </span>

</div>



{/* Heading */}



{settingsLoading ? (

 <div

     className="space-y-3 max-w-3xl"

     aria-label="Loading hero content"

 >

     <Skeleton className="h-12 sm:h-14 md:h-16 w-[85%]" />



     <Skeleton className="h-12 sm:h-14 md:h-16 w-[60%]" />

 </div>

):(

 <h1

     className="

         font-display

         text-3xl

         sm:text-4xl

         md:text-5xl

         lg:text-5xl

         xl:text-6xl

         font-semibold

         leading-[1.05]

         tracking-tight

         max-w-3xl

         text-ivory

     "

 >

     {headline}

 </h1>

)}



{/* Trust line */}

<div

 className="

     mt-5

     inline-flex

     items-center

     gap-2

     text-sm

     sm:text-base

     font-medium

     text-ivory/75

 "

>

 <ShieldCheck

     className="

         w-4

         h-4

         sm:w-5

         sm:h-5

         text-accent

         shrink-0

     "

     aria-hidden="true"

 />



 {settingsLoading ? (

     <Skeleton className="h-4 w-64" />

 ):(

     <span>{trustLine}</span>

 )}

</div>



{/* Subheading */}



<p

 className="

     mt-5

     sm:mt-6

     text-base

     sm:text-lg

     lg:text-lg

     xl:text-xl

     leading-relaxed

     text-ivory/80

     max-w-2xl

 "

>

 Explore thoughtfully curated holiday

 packages, beautiful destinations, and

 hassle-free travel experiences — planned

 around the way you want to travel.

</p>



{/* =================================================

     SEARCH

     ================================================= */}

<div

 ref={searchContainerRef}

 className="max-w-2xl relative"

>

 <form

    onSubmit={handleSearch}

    className="

        relative

        mt-6

        sm:mt-7

        bg-ivory

        text-navy

        rounded-2xl

        shadow-2xl

        shadow-black/30

        w-full

        flex

        flex-col

        sm:flex-row

        items-stretch

        overflow-visible

        ring-1

        ring-black/5

    "

 >

    {/* Input */}

<div

 className="

     flex-1

     flex

     items-center

     gap-3

     px-4

     py-3.5

     sm:py-4

     min-w-0

 "

>

 <MapPin

     className="

         w-5

         h-5

         text-secondary

         shrink-0

     "

     aria-hidden="true"

 />



 <div className="flex-1 min-w-0">

     <label

         htmlFor="destination-search"

         className="

          block

          text-[11px]

     font-semibold

     uppercase

     tracking-wider

     text-navy/50

     mb-0.5

 "

>

 Explore destinations

</label>



<input

 id="destination-search"

 type="text"

 value={destination}

 onChange={handleInputChange}

 onFocus={() =>

     setShowSuggestions(true)

 }

 placeholder="Where do you want to go?"

 aria-label="Search destination"

 autoComplete="off"

 className="

     w-full

     min-w-0

     bg-transparent

     outline-none

     placeholder:text-navy/35

     font-medium

       text-sm

       sm:text-base

   "

  />

 </div>

</div>



{/* Search button */}



<button

 type="submit"

 disabled={searching}

 className="

  flex

  items-center

  justify-center

  gap-2

  bg-accent

  hover:bg-accent-hover

  disabled:opacity-70

  disabled:cursor-not-allowed

  transition-all

  duration-200

  text-ivory

  font-semibold

  px-6

  sm:px-7

  py-3.5

    sm:py-4

    whitespace-nowrap

    hover:shadow-lg

    rounded-b-2xl

    sm:rounded-bl-none

    sm:rounded-r-2xl

"

>

{searching ? (

    <Loader2

     className="

         w-4

         h-4

         animate-spin

     "

    />

):(

    <Search

     className="w-4 h-4"

     aria-hidden="true"

    />

)}



{searching

    ? "Searching..."

    : "Explore Packages"}

</button>

{/* =================================================

 DESTINATION SUGGESTIONS

 ================================================= */}



{showSuggestions &&

!packagesLoading &&

filteredDestinationOptions.length >

 0 && (

 <div

  className="

      absolute

      left-0

      right-0

      top-full

      mt-2

      z-50

      overflow-hidden

      rounded-2xl

      border

      border-navy/10

      bg-white

      shadow-2xl

  "

 >

  <div

      className="

       px-4

       py-3

     border-b

     border-navy/10

 "

>

 <p

     className="

         text-[11px]

         font-semibold

         uppercase

         tracking-wider

         text-navy/45

     "

 >

     Available destinations

 </p>

</div>



<div

 className="

     max-h-80

     overflow-y-auto

     p-2

 "

>

 {filteredDestinationOptions.map(

     (item) => (

         <button

          key={item.name}

type="button"

onClick={() =>

    handleDestinationSelect(

        item

    )

}

className="

    group

    flex

    w-full

    items-center

    gap-3

    rounded-xl

    px-3

    py-3

    text-left

    transition

    hover:bg-navy/5

"

>

<span

    className="

        flex

        h-9

        w-9

        shrink-0

        items-center

        justify-center

     rounded-full

     bg-accent/10

     text-accent

 "

>

 <MapPin className="h-4 w-4" />

</span>



<span className="min-w-0 flex-1">

 <span

     className="

         block

         truncate

         text-sm

         font-semibold

         text-navy

         group-hover:text-accent

     "

 >

     {item.name}

 </span>



 <span

     className="

         mt-0.5

         block

         text-xs

         text-navy/50

                "

            >

                {item.count}{" "}

                {item.count === 1

                    ? "package"

                    : "packages"}{" "}

                available

            </span>

           </span>



           <ChevronRight

            className="

                h-4

                w-4

                shrink-0

                text-navy/30

                transition

                group-hover:translate-x-1

                group-hover:text-accent

            "

           />

           </button>

       )

      )}

     </div>

 </div>

)}

{/* No destination */}



{showSuggestions &&

 !packagesLoading &&

 destination.trim() &&

 filteredDestinationOptions.length ===

  0 && (

  <div

   className="

       absolute

       left-0

       right-0

       top-full

       mt-2

       z-50

       rounded-2xl

       border

       border-navy/10

       bg-white

       p-4

       shadow-2xl

   "

  >

   <div className="flex gap-3">

       <span

        className="

         flex

         h-9

     w-9

     shrink-0

     items-center

     justify-center

     rounded-full

     bg-accent/10

     text-accent

 "

>

 <MapPin className="h-4 w-4" />

</span>



<div>

 <p

     className="

         text-sm

         font-semibold

         text-navy

     "

 >

     No package found for "

     {destination}"

 </p>



 <p

     className="

         mt-1

         text-xs

    leading-relaxed

    text-navy/55

"

>

You can still request a

customized package for this

destination.

</p>



<button

type="button"

onClick={

    openCustomPackageRequest

}

className="

    mt-3

    inline-flex

    items-center

    gap-2

    rounded-lg

    bg-accent

    px-3

    py-2

    text-xs

    font-semibold

    text-white

    transition

    hover:bg-accent-hover

          "

         >

          <MessageCircle className="h-3.5 w-3.5" />

          Request custom package

         </button>

        </div>

       </div>

   </div>

  )}

</form>



{/* =================================================

  UNAVAILABLE DESTINATION

  ================================================= */}



{searchError && (

 <div

  className="

   mt-3

   rounded-2xl

   border

   border-white/15

   bg-navy/55

   backdrop-blur-md

   px-4

   py-3

   text-sm

   text-ivory

"

role="alert"

>

<div className="flex items-start gap-3">

    <div

     className="

         mt-0.5

         flex

         h-8

         w-8

         shrink-0

         items-center

         justify-center

         rounded-full

         bg-accent/15

         text-accent

     "

    >

     <MapPin className="h-4 w-4" />

    </div>



    <div className="min-w-0 flex-1">

     <p

         className="

             font-semibold

             text-ivory

         "

     >

Current destination package is

not available

</p>



<p

className="

    mt-1

    text-xs

    leading-relaxed

    text-ivory/70

"

>

We don't currently have a

package for{" "}

<span className="font-semibold text-ivory">

    "{destination.trim()}"

</span>

. If you want, we can create a

customized package for you.

</p>



<button

type="button"

onClick={

    openCustomPackageRequest

}

className="

    mt-3

             inline-flex

             items-center

             gap-2

             rounded-xl

             bg-accent

             px-3.5

             py-2

             text-xs

             font-semibold

             text-white

             transition

             hover:bg-accent-hover

         "

        >

         <MessageCircle className="h-3.5 w-3.5" />

         Request a custom package

        </button>

       </div>

      </div>

  </div>

 )}

</div>



{/* =================================================

  POPULAR DESTINATIONS

  ================================================= */}



{settingsLoading ? (

 <div className="mt-6 sm:mt-7 max-w-3xl">

  <Skeleton className="mb-3 h-3 w-36" />



  <div className="flex flex-wrap gap-2">

      {[1, 2, 3, 4, 5].map(

          (item) => (

              <Skeleton

               key={item}

               className="h-8 w-20 rounded-full"

              />

          )

      )}

  </div>

 </div>

):(

 featuredDestinations.length > 0 && (

  <div

      className="

          mt-5

          sm:mt-6

          max-w-3xl

      "

  >

      <p

          className="

              text-xs

              sm:text-sm

              text-ivory/60

     mb-2

 "

>

 Popular destinations

</p>



<div

 className="

     flex

     flex-wrap

     gap-2

 "

>

 {featuredDestinations.map(

     (place) => (

      <button

       key={place}

       type="button"

       onClick={() => {

        setDestination(place);

        setSearchError("");

        setShowSuggestions(true);

       }}

       className="

        rounded-full

        border

        border-ivory/20

        bg-ivory/10

                backdrop-blur-sm

                px-3

                py-1.5

                text-xs

                sm:text-sm

                text-ivory/85

                hover:bg-ivory/20

                hover:border-ivory/30

                transition-all

            "

            >

            {place}

            </button>

        )

       )}

      </div>

     </div>

 )

)}



{/* =================================================

     TRUST INDICATORS

     ================================================= */}



<div

 className="

     mt-7

     sm:mt-8

    flex

    flex-wrap

    items-center

    gap-x-6

    gap-y-3

    text-sm

    text-ivory/75

"

>

<div className="flex items-center gap-2">

    <ShieldCheck

     className="

         w-4

         h-4

         text-accent

     "

     aria-hidden="true"

    />



    <span>Curated packages</span>

</div>



<div

    className="

     hidden

     sm:block

     h-4

     w-px

     bg-ivory/20

 "

/>



<div className="flex items-center gap-2">

 <Headphones

     className="

         w-4

         h-4

         text-accent

     "

     aria-hidden="true"

 />



 <span>Travel support</span>

</div>



<div

 className="

     hidden

     sm:block

     h-4

     w-px

     bg-ivory/20

 "

/>



<div className="flex items-center gap-2">

      <Plane

       className="

           w-4

           h-4

           text-accent

       "

       aria-hidden="true"

      />



      <span>Hassle-free planning</span>

     </div>

 </div>

</div>



{/* =================================================

     RIGHT SIDE

     ================================================= */}



<div

 className="

     w-full

     lg:self-center

 "

>

 <div

     className="

      rounded-[28px]

      bg-ivory

    text-navy

    p-4

    sm:p-5

    lg:p-6

    shadow-2xl

    shadow-black/25

    ring-1

    ring-white/40

"

>

{/* Card heading */}



<div className="mb-4 sm:mb-5">

    <p

     className="

         text-xs

         sm:text-sm

         uppercase

         tracking-[0.18em]

         font-semibold

         text-accent

     "

    >

     Start here

    </p>



    <h2

     className="

    mt-2

    font-display

    text-2xl

    sm:text-3xl

    lg:text-4xl

    font-semibold

    leading-tight

    text-navy

"

>

Where do you want to{" "}

<span className="text-accent">

    go?

</span>

</h2>



<p

className="

    mt-2

    text-sm

    sm:text-base

    leading-relaxed

    text-navy/60

"

>

Choose a travel style and explore

all the packages available for it.

</p>

</div>



{/* =================================================

     TRAVEL STYLE CARDS

     ================================================= */}



<div

 className="mt-5 space-y-3"

>

 {packagesLoading ? (

     [1, 2, 3, 4].map(

         (item) => (

             <PackageCardSkeleton

              key={item}

             />

         )

     )

 ):(

     visibleTravelStyles.map(

         (travelStyle) => (

          
             <TravelStyleCard

              key={travelStyle.type}

              travelStyle={travelStyle}

          />

      )

  )

 )}

</div>



{/* No packages */}



{!packagesLoading &&

 travelStyles.length === 0 && (

  <div

      className="

          rounded-2xl

          border

          border-navy/10

          bg-white

          px-5

          py-8

          text-center

      "

  >

      <p

          className="

              text-sm

              font-semibold

              text-navy

          "

     >

      Holiday packages are coming

      soon.

     </p>



     <p

      className="

          mt-1

          text-xs

          text-navy/55

      "

     >

      Our team is preparing new

      destinations for you.

     </p>

 </div>

)}



{/* =================================================

 LOAD MORE

 ================================================= */}



{!packagesLoading &&

travelStyles.length > 4 && (

 <button

     type="button"

     onClick={() =>

      setShowAllPackages(

        (previous) =>

         !previous

    )

}

className="

    mt-5

    mx-auto

    flex

    items-center

    justify-center

    gap-2

    rounded-full

    border

    border-navy/15

    bg-white

    px-5

    py-2.5

    text-sm

    font-semibold

    text-navy

    shadow-sm

    transition-all

    duration-200

    hover:border-accent/40

    hover:text-accent

    hover:shadow-md

    focus:outline-none

    focus:ring-2

          focus:ring-accent/40

      "

  >

      <span>

          {showAllPackages

           ? "Show Less"

           : "Load More"}

      </span>



      <ChevronRight

          className={`

           h-4

           w-4

           transition-transform

           duration-200

           ${

               showAllPackages

                ? "-rotate-90"

                : "rotate-90"

           }

          `}

          aria-hidden="true"

      />

  </button>

 )}



{/* Travel style count */}

{!packagesLoading &&

 travelStyles.length > 4 && (

  <p

      className="

          mt-2

          text-center

          text-[11px]

          text-navy/45

      "

  >

      {showAllPackages

          ? `Showing all ${travelStyles.length} travel styles`

          : `Showing 4 of ${travelStyles.length} travel styles`}

  </p>

 )}



{/* Plan a trip */}



<button

 type="button"

 onClick={onPlanTrip}

 className="

  mt-4

  w-full

  inline-flex

  items-center

  justify-center

  gap-2

    rounded-2xl

    bg-gradient-to-r

    from-navy

    to-accent

    px-6

    py-4

    text-sm

    sm:text-base

    font-semibold

    text-ivory

    shadow-lg

    shadow-navy/15

    transition-all

    duration-200

    hover:-translate-y-0.5

    hover:shadow-xl

    focus:outline-none

    focus:ring-2

    focus:ring-accent/50

    focus:ring-offset-2

"

>

<Plane

    className="w-4 h-4"

    aria-hidden="true"

/>



<span>

         Tell us your plan

       </span>



       <span

         className="

             text-lg

             leading-none

         "

         aria-hidden="true"

       >

         →

       </span>

       </button>

   </div>

  </div>

 </div>

</div>



{/* Bottom fade */}



<div

 className="

  absolute

  bottom-0

  left-0

  right-0

  h-20

  bg-gradient-to-t

                  from-white

                  to-transparent

                  opacity-10

                  pointer-events-none

              "

              aria-hidden="true"

          />

         </section>



         {/* =====================================================

              CUSTOM PACKAGE MODAL

              ===================================================== */}



         <CustomPackageModal

          open={customPackageModalOpen}

          destination={destination}

          onClose={() =>

              setCustomPackageModalOpen(false)

          }

         />

     </>

    );

}












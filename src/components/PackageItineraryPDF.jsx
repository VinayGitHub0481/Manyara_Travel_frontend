

//import html2pdf from "html2pdf.js";


/**
 * PackageItineraryPDF.jsx
 *
 * Generates and downloads a PDF for the selected package.
 *
 * The `pkg` object should be the package returned from the backend.
 * No backend PDF generation or storage is required.
 *
 * PAGE LAYOUT
 * - Page 1 is a cover (image, title, summary cards, About).
 * - Everything after the cover FLOWS continuously. There are no
 *   forced page breaks between sections, so short sections no
 *   longer leave mostly-empty pages.
 * - Itinerary day cards, list items and paragraphs are never
 *   split across two pages.
 */

const COLORS = {
  navy: "#102040",
  red: "#F22727",
  text: "#444444",
  muted: "#555555",
  light: "#777777",
  border: "#e5e5e5",
};

export const generatePackagePDF = async (pkg) => {
  if (!pkg) {
    throw new Error("Package information is required to generate the PDF.");
  }

  const {default: html2pdf} = await import("html2pdf.js");
  

  // ---------------------------------------------------------
  // Normalize package data
  // ---------------------------------------------------------

  const itinerary = (Array.isArray(pkg.itinerary) ? [...pkg.itinerary] : []).sort(
    (a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0)
  );

  const facilities = normalizeList(pkg.facilities);
  const inclusions = normalizeList(pkg.inclusions);
  const exclusions = normalizeList(pkg.exclusions);

  const termsAndConditions = normalizePolicy(pkg.terms_and_conditions);
  const cancellationPolicy = normalizePolicy(pkg.cancellation_policy);

  const images = Array.isArray(pkg.images) ? pkg.images : [];

  const coverImage = images.length > 0 ? getImageUrl(images[0]) : null;

  const hasDuration =
    pkg.duration_days !== null &&
    pkg.duration_days !== undefined &&
    pkg.duration_days !== "";

  const hasPrice =
    pkg.price !== null && pkg.price !== undefined && pkg.price !== "";

  const durationText = hasDuration
    ? `${pkg.duration_days} Days${
        pkg.duration_nights !== null &&
        pkg.duration_nights !== undefined &&
        pkg.duration_nights !== ""
          ? ` / ${pkg.duration_nights} Nights`
          : ""
      }`
    : "";

  // ---------------------------------------------------------
  // HTML builders
  // ---------------------------------------------------------

  const sectionHeading = (text, margin = "0 0 18px") => `
    <h2 style="
      font-size:24px;
      color:${COLORS.navy};
      border-bottom:3px solid ${COLORS.red};
      padding-bottom:10px;
      margin:${margin};
      page-break-after:avoid;
      break-after:avoid;
    ">
      ${escapeHTML(text)}
    </h2>
  `;

  const summaryCard = (label, value, color = COLORS.navy) => `
    <div style="
      border:1px solid #dddddd;
      border-radius:10px;
      padding:18px 25px;
      min-width:140px;
      box-sizing:border-box;
    ">
      <div style="font-size:12px;color:${COLORS.light};letter-spacing:.04em;">
        ${escapeHTML(label)}
      </div>
      <div style="font-size:18px;font-weight:700;color:${color};margin-top:5px;">
        ${escapeHTML(value)}
      </div>
    </div>
  `;

  const bulletList = (items) => `
    <ul style="padding-left:20px;margin:0;">
      ${items
        .map(
          (item) => `
            <li style="
              font-size:14px;
              color:${COLORS.text};
              margin-bottom:9px;
              page-break-inside:avoid;
              break-inside:avoid;
            ">
              ${escapeHTML(item)}
            </li>
          `
        )
        .join("")}
    </ul>
  `;

  const policyBlock = (items) =>
    items
      .map(
        (item) => `
          <p style="
            font-size:13px;
            color:${COLORS.muted};
            white-space:pre-line;
            margin:0 0 10px;
          ">
            ${escapeHTML(item)}
          </p>
        `
      )
      .join("");

  // ---------------------------------------------------------
  // COVER (own page: image, title, summary, about)
  // ---------------------------------------------------------

  const coverHTML = `
    <div style="
      width:794px;
      padding:35px 45px 20px;
      box-sizing:border-box;
      background:#ffffff;
      page-break-after:always;
      break-after:page;
    ">
      ${
        coverImage
          ? `
            <img
              src="${escapeHTML(coverImage)}"
              crossorigin="anonymous"
              style="
                width:100%;
                height:400px;
                object-fit:cover;
                display:block;
                border-radius:12px;
                margin-bottom:30px;
              "
              alt=""
            />
          `
          : ""
      }

      <div style="text-align:center;">
        <div style="
          font-size:34px;
          font-weight:800;
          color:${COLORS.navy};
          letter-spacing:1px;
        ">
          On a Trip Holidays
        </div>

        <div style="
          width:70px;
          height:5px;
          background:${COLORS.red};
          margin:18px auto;
          border-radius:5px;
        "></div>

        <h1 style="
          font-size:30px;
          color:${COLORS.navy};
          margin:15px 0 8px;
          font-weight:700;
          line-height:1.25;
        ">
          ${escapeHTML(pkg.title || "Travel Package")}
        </h1>

        ${
          pkg.destination
            ? `<p style="font-size:18px;color:${COLORS.muted};margin:0;">${escapeHTML(pkg.destination)}</p>`
            : ""
        }

        ${
          hasDuration || hasPrice
            ? `
              <div style="
                margin-top:35px;
                display:flex;
                justify-content:center;
                gap:15px;
              ">
                ${hasDuration ? summaryCard("DURATION", durationText) : ""}
                ${
                  hasPrice
                    ? summaryCard(
                        "STARTING FROM",
                        `₹${formatPrice(pkg.price)}`,
                        COLORS.red
                      )
                    : ""
                }
              </div>
            `
            : ""
        }
      </div>

      ${
        pkg.description
          ? `
            <div style="margin-top:40px;text-align:left;">
              <h2 style="font-size:22px;color:${COLORS.navy};margin:0 0 12px;">
                About This Trip
              </h2>
              <p style="
                font-size:14px;
                color:${COLORS.muted};
                white-space:pre-line;
                margin:0;
              ">
                ${escapeHTML(pkg.description)}
              </p>
            </div>
          `
          : ""
      }

      <div style="
        margin-top:40px;
        text-align:center;
        color:#888888;
        font-size:11px;
      ">
        Your journey begins with On a Trip Holidays
      </div>
    </div>
  `;

  // ---------------------------------------------------------
  // ITINERARY
  // ---------------------------------------------------------

  const itineraryHTML =
    itinerary.length > 0
      ? `
        <div style="padding:0 45px;margin-top:10px;">
          ${sectionHeading("Day-by-Day Itinerary", "0 0 22px")}

          ${itinerary
            .map((day, index) => {
              const dayImage = getImageUrl(day?.image);

              const dayNumber =
                day?.day !== undefined && day?.day !== null && day?.day !== ""
                  ? day.day
                  : index + 1;

              return `
                <div style="
                  margin-bottom:22px;
                  page-break-inside:avoid;
                  break-inside:avoid;
                  border:1px solid ${COLORS.border};
                  border-radius:10px;
                  overflow:hidden;
                  background:#ffffff;
                ">
                  ${
                    dayImage
                      ? `
                        <img
                          src="${escapeHTML(dayImage)}"
                          crossorigin="anonymous"
                          style="width:100%;height:200px;object-fit:cover;display:block;border:0;"
                          alt=""
                        />
                      `
                      : ""
                  }

                  <div style="padding:18px 20px;">
                    <div style="
                      font-size:13px;
                      font-weight:700;
                      color:${COLORS.red};
                      text-transform:uppercase;
                      margin-bottom:5px;
                    ">
                      Day ${escapeHTML(dayNumber)}
                    </div>

                    ${
                      day?.title
                        ? `<h3 style="font-size:19px;color:${COLORS.navy};margin:0 0 8px;">${escapeHTML(day.title)}</h3>`
                        : ""
                    }

                    ${
                      day?.description
                        ? `
                          <p style="
                            font-size:13px;
                            color:${COLORS.muted};
                            margin:0;
                            white-space:pre-line;
                          ">
                            ${escapeHTML(day.description)}
                          </p>
                        `
                        : ""
                    }
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `
      : "";

  // ---------------------------------------------------------
  // FACILITIES / INCLUSIONS / EXCLUSIONS
  // ---------------------------------------------------------

  const listSection = (heading, items, marginTop) =>
    items.length > 0
      ? `
        <div style="padding:0 45px;margin-top:${marginTop}px;">
          ${sectionHeading(heading)}
          ${bulletList(items)}
        </div>
      `
      : "";

  const facilitiesHTML = listSection("Facilities", facilities, 18);
  const inclusionsHTML = listSection("Inclusions", inclusions, 28);
  const exclusionsHTML = listSection("Exclusions", exclusions, 28);

  // ---------------------------------------------------------
  // TERMS / CANCELLATION
  // ---------------------------------------------------------

  const policySection = (heading, items) =>
    items.length > 0
      ? `
        <div style="padding:0 45px;margin-top:28px;">
          ${sectionHeading(heading)}
          ${policyBlock(items)}
        </div>
      `
      : "";

  const termsHTML = policySection("Terms & Conditions", termsAndConditions);
  const cancellationHTML = policySection(
    "Cancellation Policy",
    cancellationPolicy
  );

  // ---------------------------------------------------------
  // FOOTER (flows after the last section, no page break)
  // ---------------------------------------------------------

  const footerHTML = `
    <div style="
      width:794px;
      margin-top:35px;
      padding:32px 45px;
      background:${COLORS.navy};
      color:#ffffff;
      text-align:center;
      box-sizing:border-box;
      page-break-inside:avoid;
      break-inside:avoid;
    ">
      <div style="font-size:22px;font-weight:700;margin-bottom:8px;">
        On a Trip Holidays
      </div>
      <div style="font-size:13px;opacity:.85;">
        Your trusted travel partner
      </div>
      <div style="margin-top:16px;font-size:12px;opacity:.8;">
        Thank you for choosing On a Trip Holidays.
      </div>
    </div>
  `;

  // ---------------------------------------------------------
  // Create PDF container
  //
  // Do NOT use display:none / visibility:hidden / z-index:-1.
  // html2canvas needs the element to participate in rendering,
  // so it is placed off-screen instead.
  // ---------------------------------------------------------

  const container = document.createElement("div");

  container.style.position = "absolute";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0D0D0D";
  container.style.zIndex = "999999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  container.style.overflow = "visible";

  container.innerHTML = `
    <div style="
      width:794px;
      background:#ffffff;
      color:#0D0D0D;
      font-family:Arial,Helvetica,sans-serif;
      line-height:1.5;
      box-sizing:border-box;
    ">
      ${coverHTML}
      ${itineraryHTML}
      ${facilitiesHTML}
      ${inclusionsHTML}
      ${exclusionsHTML}
      ${termsHTML}
      ${cancellationHTML}
      ${footerHTML}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const pdfContent = container.firstElementChild;

    if (!pdfContent) {
      throw new Error("PDF content could not be created.");
    }

    // Force browser layout
    void pdfContent.offsetHeight;

    await waitForImages(container);
    await waitForBrowserRender();

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (fontError) {
        console.warn("Font loading warning:", fontError);
      }
    }

    await waitForBrowserRender();

    const fileName = `${slugify(pkg.title || "package")}-itinerary.pdf`;

    const options = {
      // Top/bottom margin (mm) so content that continues onto a new
      // page does not touch the page edge. Left/right stay 0 because
      // each section already has its own 45px side padding.
      margin: [10, 0, 10, 0],

      filename: fileName,

      image: {
        type: "jpeg",
        quality: 0.95,
      },

      html2canvas: {
        // 1.5 keeps the single tall canvas under browser size limits
        // on long itineraries (prevents blank/black trailing pages).
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: Math.max(pdfContent.scrollHeight, 1123),
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },

      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ["h2", "h3", "li", "p"],
      },
    };

    await html2pdf()
      .set(options)
      .from(pdfContent)
      .toCanvas()
      .toPdf()
      .save();

    return fileName;
  } catch (error) {
    console.error("PDF GENERATION FAILED:", error);
    throw error;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

/**
 * Wait until every image inside the PDF container has either
 * loaded or failed.
 */
async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll("img"));

  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            if (img.naturalWidth === 0) {
              console.warn("Image failed to load:", img.src);
            }
            resolve();
            return;
          }

          img.onload = () => resolve();

          img.onerror = () => {
            console.warn("Image failed to load:", img.src);
            resolve();
          };
        })
    )
  );
}

/**
 * Wait for the browser to complete rendering.
 */
function waitForBrowserRender() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

/**
 * Image URL from a string or an image object.
 */
function getImageUrl(image) {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    return image.trim() || null;
  }

  if (typeof image === "object") {
    return (
      image.url ||
      image.secure_url ||
      image.src ||
      image.image_url ||
      null
    );
  }

  return null;
}

/**
 * Text from a list item (string or object).
 */
function normalizeListItem(item) {
  if (item === null || item === undefined) {
    return "";
  }

  if (typeof item === "string") {
    return item.trim();
  }

  if (typeof item === "number") {
    return String(item);
  }

  if (typeof item === "object") {
    return String(
      item.name ||
        item.title ||
        item.description ||
        item.text ||
        item.value ||
        ""
    ).trim();
  }

  return String(item).trim();
}

/**
 * Normalize facilities/inclusions/exclusions.
 *
 * Matches PackageDetail: also handles a backend that returns
 * ["Hotel, Breakfast, WiFi"] or "Hotel, Breakfast, WiFi"
 * instead of ["Hotel", "Breakfast", "WiFi"].
 */
function normalizeList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        normalizeListItem(item)
          .split(",")
          .map((part) => part.trim())
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Terms / cancellation may be a single text block or a list.
 * Returns a list of text items in both cases.
 */
function normalizePolicy(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeListItem).filter(Boolean);
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text ? [text] : [];
  }

  return [];
}

/**
 * Escape dynamic package data before inserting it into HTML.
 */
function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Format package price.
 */
function formatPrice(price) {
  if (price === null || price === undefined || price === "") {
    return "0";
  }

  const number = Number(price);

  if (Number.isNaN(number)) {
    return String(price);
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

/**
 * Convert package title to a safe PDF filename.
 */
function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "package"
  );
}

export default generatePackagePDF;


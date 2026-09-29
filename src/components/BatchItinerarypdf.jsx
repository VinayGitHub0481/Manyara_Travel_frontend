

import html2pdf from "html2pdf.js";

/**
 * BatchItineraryPDF.jsx
 *
 * Generates and downloads a batch itinerary PDF on the client.
 *
 * Supports:
 *   generateBatchPDF(batch)
 *   generateBatchPDF({ batch, packageData })
 *
 * PAGE LAYOUT
 * - Page 1 is a cover (image, title, summary cards, About).
 * - Everything after the cover FLOWS continuously. There are no
 *   forced page breaks between sections, so short sections no
 *   longer leave mostly-empty pages.
 * - Itinerary day cards, list items and table rows are never
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

export const generateBatchPDF = async (input) => {
  if (!input) {
    throw new Error("Batch information is required to generate the PDF.");
  }

  const actualBatch = input?.batch || input;
  const packageData = input?.packageData || input?.package || {};

  if (!actualBatch || typeof actualBatch !== "object") {
    throw new Error("Invalid batch data.");
  }

  const pkg = actualBatch?.package || actualBatch?.pkg || packageData || {};

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  const firstDefined = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  };

  const firstArray = (...values) => {
    for (const value of values) {
      if (Array.isArray(value) && value.length > 0) {
        return value;
      }
    }
    return [];
  };

  const escapeHTML = (value) => {
    if (value === null || value === undefined) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const getImageUrl = (image) => {
    if (!image) return null;

    if (typeof image === "string") return image.trim() || null;

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
  };

  const normalizeListItem = (item) => {
    if (item === null || item === undefined) return "";

    if (typeof item === "string") return item.trim();

    if (typeof item === "number") return String(item);

    if (typeof item === "object") {
      return String(
        item.name ||
          item.title ||
          item.description ||
          item.text ||
          item.value ||
          item.label ||
          ""
      ).trim();
    }

    return String(item).trim();
  };

  const normalizeList = (value) =>
    Array.isArray(value)
      ? value.map(normalizeListItem).filter(Boolean)
      : [];

  /*
    Terms / cancellation may be a list OR a single text block.
    Returns a list of text items in both cases.
  */
  const normalizePolicy = (value) => {
    if (Array.isArray(value)) return normalizeList(value);

    if (typeof value === "string") {
      const text = value.trim();
      return text ? [text] : [];
    }

    return [];
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "";

    const number = Number(value);

    if (Number.isNaN(number)) return String(value);

    return number.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDuration = (days, nights) => {
    if (days === null || days === undefined || days === "") return "";

    const numericDays = Number(days);

    if (Number.isNaN(numericDays)) return String(days);

    if (nights !== null && nights !== undefined && nights !== "") {
      const numericNights = Number(nights);

      if (!Number.isNaN(numericNights)) {
        return `${numericDays} Days / ${numericNights} Nights`;
      }
    }

    return `${numericDays} Days`;
  };

  const slugify = (value) =>
    String(value || "travel-batch")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "travel-batch";

  // ---------------------------------------------------------
  // Normalize data
  // ---------------------------------------------------------

  const title = firstDefined(
    actualBatch?.title,
    actualBatch?.package_title,
    pkg?.title,
    packageData?.title,
    "Travel Batch"
  );

  const destination = firstDefined(
    actualBatch?.destination,
    actualBatch?.package_destination,
    pkg?.destination,
    packageData?.destination,
    ""
  );

  const description = firstDefined(
    actualBatch?.description,
    pkg?.description,
    packageData?.description,
    ""
  );

  const price = firstDefined(
    actualBatch?.price_per_person,
    actualBatch?.price,
    actualBatch?.batch_price,
    pkg?.price,
    packageData?.price
  );

  const durationDays = firstDefined(
    actualBatch?.days,
    actualBatch?.duration_days,
    actualBatch?.duration,
    pkg?.duration_days,
    packageData?.duration_days
  );

  let durationNights = firstDefined(
    actualBatch?.nights,
    actualBatch?.duration_nights,
    pkg?.duration_nights,
    packageData?.duration_nights
  );

  if (durationNights === null && durationDays !== null) {
    const numericDays = Number(durationDays);

    if (!Number.isNaN(numericDays) && numericDays > 0) {
      durationNights = Math.max(numericDays - 1, 0);
    }
  }

  const departureDate = firstDefined(
    actualBatch?.departure_date,
    actualBatch?.start_date,
    actualBatch?.startDate,
    actualBatch?.departureDate,
    actualBatch?.from_date
  );

  const returnDate = firstDefined(
    actualBatch?.return_date,
    actualBatch?.end_date,
    actualBatch?.endDate,
    actualBatch?.returnDate,
    actualBatch?.to_date
  );

  const batchType = firstDefined(
    actualBatch?.type,
    actualBatch?.batch_type,
    actualBatch?.category,
    ""
  );

  const batchStatus = firstDefined(actualBatch?.status, "");

  const itinerary = [
    ...firstArray(
      actualBatch?.itinerary,
      pkg?.itinerary,
      packageData?.itinerary
    ),
  ].sort((a, b) => Number(a?.day ?? 0) - Number(b?.day ?? 0));

  const facilities = normalizeList(
    firstArray(
      actualBatch?.facilities,
      pkg?.facilities,
      packageData?.facilities
    )
  );

  const inclusions = normalizeList(
    firstArray(
      actualBatch?.inclusions,
      pkg?.inclusions,
      packageData?.inclusions
    )
  );

  const exclusions = normalizeList(
    firstArray(
      actualBatch?.exclusions,
      pkg?.exclusions,
      packageData?.exclusions
    )
  );

  const termsAndConditions = normalizePolicy(
    firstDefined(
      actualBatch?.terms_and_conditions,
      actualBatch?.terms,
      pkg?.terms_and_conditions,
      packageData?.terms_and_conditions
    )
  );

  const cancellationPolicy = normalizePolicy(
    firstDefined(
      actualBatch?.cancellation_policy,
      actualBatch?.cancellation,
      pkg?.cancellation_policy,
      packageData?.cancellation_policy
    )
  );

  const images = firstArray(
    actualBatch?.images,
    pkg?.images,
    packageData?.images
  );

  const coverImage = images.length > 0 ? getImageUrl(images[0]) : null;

  const hasPrice = price !== null && price !== undefined && price !== "";

  // ---------------------------------------------------------
  // HTML builders
  // ---------------------------------------------------------

  const sectionHeading = (text, extraMargin = "0 0 18px") => `
    <h2 style="
      font-size:24px;
      color:${COLORS.navy};
      border-bottom:3px solid ${COLORS.red};
      padding-bottom:10px;
      margin:${extraMargin};
      page-break-after:avoid;
      break-after:avoid;
    ">
      ${escapeHTML(text)}
    </h2>
  `;

  const summaryCard = (label, value, valueColor = COLORS.navy, size = 16) => `
    <div style="
      flex:1;
      min-width:150px;
      border:1px solid #dddddd;
      border-radius:10px;
      padding:16px;
      box-sizing:border-box;
    ">
      <div style="font-size:11px;color:${COLORS.light};font-weight:700;letter-spacing:.04em;">
        ${escapeHTML(label)}
      </div>
      <div style="font-size:${size}px;font-weight:700;color:${valueColor};margin-top:5px;">
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
                height:380px;
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
        <div style="font-size:32px;font-weight:800;color:${COLORS.navy};margin-bottom:12px;">
          On a Trip Holidays
        </div>

        <div style="
          width:70px;
          height:5px;
          background:${COLORS.red};
          margin:15px auto;
          border-radius:5px;
        "></div>

        <h1 style="font-size:30px;line-height:1.25;color:${COLORS.navy};margin:20px 0 10px;">
          ${escapeHTML(title)}
        </h1>

        ${
          destination
            ? `<p style="font-size:18px;color:${COLORS.muted};margin:0;">${escapeHTML(destination)}</p>`
            : ""
        }

        ${
          batchType || batchStatus
            ? `
              <p style="font-size:12px;color:${COLORS.light};margin:10px 0 0;text-transform:capitalize;">
                ${escapeHTML(
                  [batchType, batchStatus]
                    .filter(Boolean)
                    .map((v) => String(v).replaceAll("_", " "))
                    .join("  •  ")
                )}
              </p>
            `
            : ""
        }
      </div>

      <div style="margin-top:35px;display:flex;flex-wrap:wrap;gap:12px;">
        ${departureDate ? summaryCard("DEPARTURE", formatDate(departureDate)) : ""}
        ${returnDate ? summaryCard("RETURN", formatDate(returnDate)) : ""}
        ${
          durationDays
            ? summaryCard(
                "DURATION",
                formatDuration(durationDays, durationNights)
              )
            : ""
        }
        ${hasPrice ? summaryCard("BATCH PRICE", `₹${formatPrice(price)} / person`, COLORS.red, 16) : ""}
      </div>

      ${
        description
          ? `
            <div style="margin-top:35px;">
              <h2 style="font-size:22px;color:${COLORS.navy};margin:0 0 12px;">
                About This Trip
              </h2>
              <p style="font-size:14px;color:${COLORS.muted};white-space:pre-line;margin:0;">
                ${escapeHTML(description)}
              </p>
            </div>
          `
          : ""
      }
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

              const dayTitle = day?.title || day?.name || "";
              const dayDescription = day?.description || day?.details || "";

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
                          style="width:100%;height:200px;object-fit:cover;display:block;"
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
                      dayTitle
                        ? `<h3 style="font-size:19px;color:${COLORS.navy};margin:0 0 8px;">${escapeHTML(dayTitle)}</h3>`
                        : ""
                    }

                    ${
                      dayDescription
                        ? `
                          <p style="font-size:13px;color:${COLORS.muted};margin:0;white-space:pre-line;">
                            ${escapeHTML(dayDescription)}
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
  // FACILITIES
  // ---------------------------------------------------------

  const facilitiesHTML =
    facilities.length > 0
      ? `
        <div style="padding:0 45px;margin-top:18px;">
          ${sectionHeading("Facilities")}
          ${bulletList(facilities)}
        </div>
      `
      : "";

  // ---------------------------------------------------------
  // INCLUSIONS / EXCLUSIONS
  // ---------------------------------------------------------

  const inclusionsHTML =
    inclusions.length > 0
      ? `
        <div style="padding:0 45px;margin-top:28px;">
          ${sectionHeading("Inclusions")}
          ${bulletList(inclusions)}
        </div>
      `
      : "";

  const exclusionsHTML =
    exclusions.length > 0
      ? `
        <div style="padding:0 45px;margin-top:28px;">
          ${sectionHeading("Exclusions")}
          ${bulletList(exclusions)}
        </div>
      `
      : "";

  // ---------------------------------------------------------
  // TERMS / CANCELLATION
  // ---------------------------------------------------------

  const termsHTML =
    termsAndConditions.length > 0
      ? `
        <div style="padding:0 45px;margin-top:28px;">
          ${sectionHeading("Terms & Conditions")}
          ${policyBlock(termsAndConditions)}
        </div>
      `
      : "";

  const cancellationHTML =
    cancellationPolicy.length > 0
      ? `
        <div style="padding:0 45px;margin-top:28px;">
          ${sectionHeading("Cancellation Policy")}
          ${policyBlock(cancellationPolicy)}
        </div>
      `
      : "";

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
  // Temporary container
  //
  // Do NOT use display:none / visibility:hidden, html2canvas
  // cannot render those elements.
  // ---------------------------------------------------------

  const container = document.createElement("div");

  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.style.color = "#111111";
  container.style.zIndex = "-9999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";

  container.innerHTML = `
    <div style="
      width:794px;
      background:#ffffff;
      color:#111111;
      font-family:Arial,Helvetica,sans-serif;
      line-height:1.5;
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

    const fileName = `${slugify(title)}-batch-itinerary.pdf`;

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
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 20000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },

      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ["h2", "h3", "li", "p", "tr"],
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
    console.error("BATCH PDF GENERATION FAILED:", error);
    throw error;
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

// ==========================================================
// WAIT FOR IMAGES
// ==========================================================

async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll("img"));

  if (images.length === 0) return;

  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            if (img.naturalWidth === 0) {
              console.warn("Image failed:", img.src);
            }
            resolve();
            return;
          }

          img.onload = () => resolve();

          img.onerror = () => {
            console.warn("Image failed:", img.src);
            resolve();
          };
        })
    )
  );
}

// ==========================================================
// WAIT FOR BROWSER RENDER
// ==========================================================

function waitForBrowserRender() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

export default generateBatchPDF;







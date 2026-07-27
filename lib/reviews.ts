// Static Google review badge — no live API call (that needs a Google
// Places API key + billing on your Google Cloud account), so these two
// numbers are updated by hand whenever the rating/count changes.
export const GOOGLE_RATING = 4.5;
export const GOOGLE_REVIEW_COUNT = 28;

// The link from Google's search results (with sxsrf/ved/sca_esv params) is
// scoped to that one search session and will eventually stop working. This
// is the stable form: Google Maps listings can always be opened via
// `?cid=<CID>`, where the CID is the same "Customer ID" number embedded in
// that search URL (rldimm=15081634583537418987) — it's tied to the
// business listing itself, not the search session, so it doesn't expire.
export const GOOGLE_MAPS_URL = "https://www.google.com/maps?cid=15081634583537418987";

// Opens Google's own "write a review" dialog directly (the star-rating
// popup with Food/Service/Atmosphere sliders) instead of the place page —
// this is what the badge below links to. Requires a Place ID (the
// "ChIJ..." string — not the CID above, and not the hex Google/Feature ID
// from a Maps URL). Confirmed working: ChIJf19Avqrb5EYR64L-b7-6TNE.
// Heads-up: Place IDs can occasionally rotate (Google says up to once
// every ~12 months) if the listing gets merged or heavily edited. If this
// link ever 404s, re-look the place up with Google's Place ID finder
// (https://developers.google.com/maps/documentation/places/web-service/place-id)
// and swap the id in below.
export const GOOGLE_WRITE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJf19Avqrb5EYR64L-b7-6TNE";

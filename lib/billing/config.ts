// Plan numbers in one place, safe to import from client components.

export const FREE_COURSE_LIMIT = 3;

/** Price of one Pro pass, in paise (Razorpay's unit). 19900 = ₹199. */
export const PRO_PRICE_PAISE = 19900;
export const PRO_CURRENCY = "INR";
/** One payment buys this many days of Pro. Nothing renews by itself. */
export const PRO_DAYS = 30;

export const PRO_PRICE_LABEL = `₹${PRO_PRICE_PAISE / 100}`;

/** Razorpay account is shared with another project; this tag marks our orders. */
export const RAZORPAY_PROJECT_TAG = "syllabai";

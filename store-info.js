/*
 * CSU Bookstore store facts: the one source of truth.
 *
 * Every tool and email template reads these values. To change a policy,
 * edit it here and every email, label and date helper that uses it updates.
 * After editing, bump the ?v= stamp where this file is loaded so browsers
 * pick up the change right away (search the repo for "store-info.js?v=").
 *
 * In email templates, use the placeholder names in STORE_INFO.tokens,
 * for example {pickupHours} or {pickupDays}, instead of typing the value.
 */
(() => {
  const info = {
    pickup: {
      // Days after an order is packed before it is refunded and restocked.
      restockDays: 21,
      // Days after packing when the first pickup reminder goes out.
      reminderDays: 14,
      // Pickup counter hours, written the way they should appear in emails.
      hours: "Monday through Friday, 8 a.m. to 5 p.m.",
      location: "Order Pickup Counter, lower level of the CSU Bookstore"
    },
    contact: {
      ordersEmail: "BookstoreOrders@colostate.edu",
      phone: "970-491-0904",
      // When the phone line above is answered.
      phoneHours: "8 a.m. to 4 p.m. Mountain Time"
    },
    links: {
      cancelUrl: "https://www.bookstore.colostate.edu/cancel",
      cancelText: "bookstore.colostate.edu/cancel"
    }
  };

  // Placeholders templates can use, e.g. "Pickup hours are {pickupHours}."
  info.tokens = {
    pickupDays: String(info.pickup.restockDays),
    reminderDays: String(info.pickup.reminderDays),
    pickupHours: info.pickup.hours,
    pickupLocation: info.pickup.location,
    ordersEmail: info.contact.ordersEmail,
    phone: info.contact.phone,
    phoneHours: info.contact.phoneHours,
    cancelLink: info.links.cancelText
  };

  // Fill {placeholders} in a piece of text with the values above.
  // A value that already ends in a period (like "5 p.m.") absorbs the
  // sentence's own period, so "{pickupHours}." never becomes "p.m..".
  info.fill = (text) => String(text).replace(/\{(\w+)\}(\.?)/g, (match, key, dot) => {
    if (!Object.prototype.hasOwnProperty.call(info.tokens, key)) return match;
    const value = info.tokens[key];
    return value + (dot && !value.endsWith(".") ? "." : "");
  });

  window.STORE_INFO = Object.freeze(info);
})();

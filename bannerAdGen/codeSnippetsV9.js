// random-banner.js
// This script selects two unique promotional banners from a predefined list
// and injects them into designated containers in the HTML document.  

// Each banner has desktop and mobile image versions, alt text, a URL, and an expiration date.
// Banners that have expired are excluded from selection.
// There are use cases for evergreen, seasonal, and promotional banners. Evergreen banners are always eligible,
// seasonal banners are typically time-sensitive, and promotional banners may have specific end dates.

// Usage: Include this script in an HTML document with two containers having IDs "promoTop" and "promoBottom".
// Banner sizes - Desktop: 1300x100px, Mobile: 768x150px; design at 2600x200px and 1536x300px respectively for best quality on high-DPI screens.

// Change Log: 
// - 2025-10-22: Initial creation and implementation.
// - 2025-10-23v1: Added use, endDate properties, and filtering logic for expired banners. Also ensured that if a banner is selected for the top, it won't be selected again for the bottom.
// - 2025-10-23v3: Implemented Google Analytics event tracking for banner clicks. When adding new banners, ensure to include promoName for tracking purposes, and use utm parameters in URLs for better campaign tracking.
// - 2025-10-24: Updated JS to include loading="lazy" for bottom banner images to improve page load performance. 
// - 2025-10-30: Adjusted banner selection logic to prioritize seasonal banners for the top banner when available, followed by promotional, then evergreen. Ensured that if a seasonal banner is selected for the top, the bottom banner will not be seasonal.
// - 2025-11-12: Added additional banners, updated logic to show evergreen and promotional banners in addition to seasonal ones.
// - 2025-12-11: Added logic to allow disabling specific promos without removing them from the array.
// - 2025-12-11v2: Added weighted selection for seasonal/promotional/evergreen and cleaned up syntax.

document.addEventListener("DOMContentLoaded", function () {
  const promos = [
    {
      promoName: "Gift Cards",
      url: "/shop/bookstore/gift-cards/?utm_source=onsite&utm_medium=banner&utm_campaign=gift_cards",
      alt: "Web banner - CSU Bookstore Gift Card: No Expiration, Redeem In-Store and Online, eGift Options Available",
      desktop: "/SiteImages/109-SchoolImages/109-F25-GiftCards1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-F25-GiftCards768x150.jpg",
      use: "evergreen",
      endDate: "2026-12-31"
    },
    {
      promoName: "Textbook Savings",
      url: "/affordable?utm_source=onsite&utm_medium=banner&utm_campaign=affordable_textbooks",
      alt: "Cam the Ram stuffed animal sits on top of a stack of books next to a laptop showing the Canvas LMS. CSU Students Saved Nearly $3 million shopping at the CSU Bookstore for course materials. Includes a 'Learn More' button.",
      desktop: "/SiteImages/109-SchoolImages/109-FA25-TextbookSavings-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-FA25-TextbookSavings-768x150.jpg",
      use: "evergreen", // keep in file but not in rotation
      endDate: "2026-12-31"
    },
    {
      promoName: "Holiday Decor",
      url: "/shop/gifts/holiday-decor/?utm_source=onsite&utm_medium=banner&utm_campaign=holiday_decor",
      alt: "Festive CSU Bookstore banner featuring a star ornament with the Colorado State University ram logo and snowflakes. Text reads: Deck your halls with Ram Pride! Shop our selection of CSU Holiday DÃ©cor. Orange button says Shop Now.",
      desktop: "/SiteImages/109-SchoolImages/109-FA25-HolidayDecor-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-FA25-HolidayDecor-768x150.jpg",
      use: "promotional",
      endDate: "2025-12-31"
    },
    {
      promoName: "Stuffed Animals",
      url: "/shop/gifts/stuffed-animals?utm_source=onsite&utm_medium=banner&utm_campaign=Stuffed_Animals",
      alt: "Plush CSU Rams and bear mascots displayed against a purple background with text reading 'Plush Animals - Fun for All Ages!' and a green button labeled Shop Now.",
      desktop: "/SiteImages/109-SchoolImages/109-F25-StuffedToys-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-F25-StuffedToys-768x150.jpg",
      use: "seasonal",
      endDate: "2026-12-31"
    },
    {
      promoName: "New at the Bookstore",
      url: "/NewArrivals?utm_source=onsite&utm_medium=banner&utm_campaign=new_arrivals",
      alt: "Cam the Ram mascot stands beside text reading 'New Ram Gear - Shop the newest CSU Rams gear available at the CSU Bookstore,' with a green Shop Now button and a photo of apparel inside the store.",
      desktop: "/SiteImages/109-SchoolImages/109-S25-NewRamGear-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-S25-NewRamGear-768x150.jpg",
      use: "seasonal", // keep for later
      endDate: "2026-12-31"
    },
    {
      promoName: "Winter Hats",
      url: "/shop/apparel/csu-rams-beanies-and-winter-hats?utm_source=onsite&utm_medium=banner&utm_campaign=winter_hats",
      alt: "Winter Hats - Three winter hats appear on a winter background. Text reads WINTER HATS and Shop Now Button.",
      desktop: "/SiteImages/109-SchoolImages/109-F25-WinterHats-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-F25-WinterHats-768x150.jpg",
      use: "seasonal",
      endDate: "2026-03-31"
    },
    {
      promoName: "Pickleball Paddle",
      url: "/shop/gifts/sport/CSU-Rams-Erne-Original-Pickleball-Paddle?utm_source=onsite&utm_medium=banner&utm_campaign=pickleball_paddle",
      alt: "Promotional image for the CSU Rams Pickleball Paddle by ERNE. The paddle is green with the Colorado State University Rams logo on the face and rests on a blue and green pickleball court. Text reads â€œNEW CSU Rams Pickleball Paddle by ERNE â€“ Bringing the Heat to the Kitchen.â€ A green button says â€œShop Now,â€ and the ERNE brand mascot appears in the lower right corner wearing sunglasses and a pink headband.",
      desktop: "/SiteImages/109-SchoolImages/109-F25-PickleballPaddle-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-F25-PickleballPaddle-768x150.jpg",
      use: "seasonal",
      endDate: "2026-12-31"
    },
    {
      promoName: "Free Shipping Promo",
      url: "/shipping#promoShipping",
      alt: "Snowman appears in front of a snow-covered hill. Text reads Free Shipping on CSU Rams Gear Orders over $149. Learn More button. Offer ends December 19, 2025, Restrictions apply.",
      desktop: "/SiteImages/109-SchoolImages/109-F25-FreeShipping-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-F25-FreeShipping-768x150.jpg",
      use: "promotional",
      endDate: "2025-12-19"
    },
    {
      promoName: "RAMTech Deal Days",
      url: "/ramtech?utm_source=onsite&utm_medium=banner&utm_campaign=RamTech_Deal_Days",
      alt: "Promotional banner for RamTech Deal Days at the CSU Bookstore. Text reads 'RAMTech Deal Days Dec. 15-19' - Free Gift with purchase of any computer, laptop, or tablet. See in store about terms and details. The image shows computers with gift wrap and gifts.",
      desktop: "/SiteImages/109-SchoolImages/109-RamTech_WinterDeal_1300x100px.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-RamTech_WinterDeal_768x150.jpg",
      use: "promotional",
      endDate: "2025-12-20"
    },
    {
      promoName: "Diploma Frames",
      url: "/diploma-frames?utm_source=onsite&utm_medium=banner&utm_campaign=YouEarnedIt",
      alt: "Promotional banner for Diploma Frames. Text reads You Earned It. Now Frame It. Show it off with an officially licensed CSU Frame - Shop Now Button. Includes image of two diploma frames.",
      desktop: "/SiteImages/109-SchoolImages/109-S26-DiplomaFrames-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-S26-DiplomaFrames-768x150%20.jpg",
      use: "promotional",
      endDate: "2026-12-20"
    },
    {
      promoName: "Hats",
      url: "/shop/apparel/csu-rams-hats-caps?utm_source=onsite&utm_medium=banner&utm_campaign=Cap_It_Off",
      alt: "Promotional banner for Hats. Text reads CAP IT OFF - Truckers, dad caps & more for every fit. - Zephyr â€¢ Colosseum â€¢ Hooey â€¢ League â€¢ and MORE! - SHOP NOW Button with 3 hats.",
      desktop: "/SiteImages/109-SchoolImages/109-banners/109-S26-OrangeCapItOff-1300x100.jpg",
      mobile: "/SiteImages/109-SchoolImages/109-banners/109-S26-OrangeCapItOff-768x150.jpg",
      use: "promotional",
      endDate: "2026-12-20"
    }
  ];

  // Filter expired + disabled promos
  const today = new Date();
  const activePromos = promos.filter(p => {
    if (p.use === "disabled") return false;
    if (!p.endDate) return true;
    const end = new Date(p.endDate + "T23:59:59");
    return end >= today;
  });

  // Build weighted pool: seasonal > promotional > evergreen
  const weightedPromos = [];
  activePromos.forEach(p => {
    if (p.use === "promotional") {
      weightedPromos.push(p, p, p);      // 3Ã— weight for promotional
    } else if (p.use === "seasonal") {
      weightedPromos.push(p, p);         // 2Ã— weight for seasonal
    } else {
      weightedPromos.push(p);            // 1Ã— weight for evergreen
    }
  });

  // TEMPORARY BOOST FOR RAMTECH DURING DEAL DAYS
activePromos.forEach(p => {
  if (p.promoName === "RAMTech Deal Days") {
    weightedPromos.push(p, p, p, p);
  }
});


  // Pick two unique random promos from weighted list
  function pickTwoRandom(list) {
    if (list.length === 0) return [null, null];
    if (list.length === 1) return [list[0], list[0]];

    const first = list[Math.floor(Math.random() * list.length)];
    let second = first;
    while (second === first) {
      second = list[Math.floor(Math.random() * list.length)];
    }
    return [first, second];
  }

  // Build banner HTML
  function buildBanner(promo, isTopBanner = false) {
    const loadingAttr = isTopBanner ? "" : "loading='lazy'";
    return `
      <a href="${promo.url}" aria-label="${promo.alt}" data-promoName="${promo.promoName}">
        <picture>
          <source media="(max-width: 767px)" srcset="${promo.mobile}">
          <source media="(min-width: 768px)" srcset="${promo.desktop}">
          <img src="${promo.desktop}" alt="${promo.alt}" style="width:100%;height:auto;" ${loadingAttr}>
        </picture>
      </a>`;
  }

  // Choose and render promos
  const [topPromo, bottomPromo] = pickTwoRandom(weightedPromos);
  const topContainer = document.getElementById("promoTop");
  const bottomContainer = document.getElementById("promoBottom");

  if (topContainer && topPromo) {
    topContainer.innerHTML = buildBanner(topPromo, true);
  }
  if (bottomContainer && bottomPromo) {
    bottomContainer.innerHTML = buildBanner(bottomPromo, false);
  }

  // GA4 click tracking
  document.addEventListener("click", function (e) {
    const bannerLink = e.target.closest("#promoTop a, #promoBottom a");
    if (bannerLink && window.gtag) {
      const promoName = bannerLink.getAttribute("data-promoName") || "Unknown Promo";
      const container = bannerLink.closest("#promoTop") ? "Top Banner" : "Bottom Banner";
      gtag("event", "select_promotion", {
        promotion_id: promoName.toLowerCase().replace(/\s+/g, "_"),
        promotion_name: promoName,
        creative_name: container,
        creative_slot: container.includes("Top") ? "hero_top" : "hero_bottom",
        location_id: "homepage",
        event_category: "Homepage Banner",
        event_label: `${container}: ${promoName}`,
        value: 1
      });
    }
  });
});
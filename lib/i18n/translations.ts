// ── Translation dictionaries ────────────────────────────────────────────
// Scope: static UI chrome only — the stuff that's hardcoded in components,
// never anything pulled from Supabase (about_page, events, artists, store
// products, etc). Those stay exactly as your team writes them in /admin.
//
// Add new keys as you translate more components: nest under the
// component's name so `t("footer.explore")` reads the same way the file
// is organized.
export interface TranslationShape {
  nav: {
    releases: string;
    artists: string;
    events: string;
    radio: string;
    store: string;
    openMenu: string;
    closeMenu: string;
  };
  footer: {
    tagline: string;
    explore: string;
    club: string;
    aboutKrantas: string;
    lostAndFound: string;
    contact: string;
    bookUs: string;
    findUs: string;
    follow: string;
    poweredBy: string;
    allRightsReserved: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    note: string;
    messageSentTitle: string;
    messageSentBody: (firstName: string) => string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    genericError: string;
    findUs: string;
    follow: string;
  };
  admin: {
    controlPanel: string;
    backToSite: string;
    signOut: string;
    signIn: string;
    signingIn: string;
    email: string;
    password: string;
    wrongCredentials: string;
    backToSiteLong: string;
    groupSiteContent: string;
    groupAccount: string;
    homepageLabel: string;
    homepageDesc: string;
    releasesLabel: string;
    releasesDesc: string;
    artistsLabel: string;
    artistsDesc: string;
    eventsLabel: string;
    eventsDesc: string;
    radioLabel: string;
    radioDesc: string;
    radioLiveLabel: string;
    radioLiveDesc: string;
    storeLabel: string;
    storeDesc: string;
    ordersLabel: string;
    ordersDesc: string;
    reelsLabel: string;
    reelsDesc: string;
    videosLabel: string;
    videosDesc: string;
    galleryLabel: string;
    galleryDesc: string;
    inquiriesLabel: string;
    inquiriesDesc: string;
    aboutLabel: string;
    aboutDesc: string;
    changeLoginLabel: string;
    changeLoginDesc: string;
  };
  sections: {
    artistsEyebrow: string;
    artistsTitle: string;
    artistsNote: string;
    storeEyebrow: string;
    storeTitle: string;
    storeNote: string;
    bookUsEyebrow: string;
    bookUsTitle: string;
    bookUsNote: string;
    radioLiveTitle: string;
    radioOnAirSoon: string;
    radioEyebrow: string;
    radioTitle: string;
    radioNote: string;
    eventsEyebrow: string;
    eventsTitle: string;
    eventsNote: string;
    eventsFeatured: string;
    eventsGetTicketsVia: string;
    eventsGetTickets: string;
    eventsDetails: string;
    eventsArchiveEyebrow: string;
    eventsArchiveTitle: string;
    eventsNoUpcoming: string;
    ticketsLabel: string;
    onPaysera: string;
    onRA: string;
    releasesEyebrow: string;
    releasesTitle: string;
    releasesNote: string;
    releasesComingSoonTitle: string;
    releasesComingSoonBody: string;
    lostFoundEyebrow: string;
    lostFoundTitle: string;
    lostFoundNote: string;
    lostFoundHowItWorks: string;
    reelsComingSoon: string;
    storeSoldOut: string;
    setsUnavailable: string;
    setsOnAir: string;
    setsKrantasSets: string;
    setsCouldntLoad: string;
    setsChooseASet: string;
    setsNextSet: string;
    setsPlayAria: string;
    setsPauseAria: string;
    videosAllGenres: string;
    videosAllArtists: string;
  };
}

export const translations: Record<"lt" | "en", TranslationShape> = {
  lt: {
    nav: {
      releases: "Leidiniai",
      artists: "Atlikėjai",
      events: "Renginiai",
      radio: "Radijas",
      store: "Parduotuvė",
      openMenu: "Atverti meniu",
      closeMenu: "Uždaryti meniu",
    },
    footer: {
      tagline:
        "Naktinis klubas Klaipėdoje. Techno, breaks ir bass nuo tada, kai pasikeitė potvynis.",
      explore: "Naršyti",
      club: "Klubas",
      aboutKrantas: "Apie Krantas",
      lostAndFound: "Pamesta ir rasta",
      contact: "Kontaktai",
      bookUs: "Rezervuokite mus",
      findUs: "Kaip mus rasti",
      follow: "Sekite",
      poweredBy: "Sukūrė",
      allRightsReserved: "Visos teisės saugomos.",
    },
    contact: {
      eyebrow: "Susisiekite",
      title: "Kontaktai",
      note: "Klausimai, žiniasklaida, svečių sąrašai — parašykite mums.",
      messageSentTitle: "Žinutė išsiųsta",
      messageSentBody: (firstName: string) =>
        `Ačiū, ${firstName} — patikrinkite savo pašto dėžutę patvirtinimo laiško. Netrukus su jumis susisieksime.`,
      nameLabel: "Vardas",
      namePlaceholder: "Jūsų vardas",
      emailLabel: "El. paštas",
      emailPlaceholder: "jus@pavyzdys.lt",
      phoneLabel: "Telefonas (nebūtina)",
      phonePlaceholder: "+370...",
      subjectLabel: "Tema (nebūtina)",
      subjectPlaceholder: "Apie ką norėtumėte parašyti?",
      messageLabel: "Žinutė",
      messagePlaceholder: "Papasakokite, kas rūpi...",
      send: "Siųsti žinutę →",
      sending: "Siunčiama...",
      genericError: "Kažkas nutiko — bandykite dar kartą.",
      findUs: "Kaip mus rasti",
      follow: "Sekite",
    },
    admin: {
      controlPanel: "Valdymo skydelis",
      backToSite: "← Svetainė",
      signOut: "Atsijungti →",
      signIn: "Prisijungti",
      signingIn: "Jungiamasi...",
      email: "El. paštas",
      password: "Slaptažodis",
      wrongCredentials: "Neteisingas el. paštas arba slaptažodis.",
      backToSiteLong: "← Grįžti į svetainę",
      groupSiteContent: "Svetainės turinys",
      groupAccount: "Paskyra",
      homepageLabel: "Pagrindinis puslapis",
      homepageDesc: "Slenkančios juostos tekstas ir teiginio skiltis po vaizdo įrašais",
      releasesLabel: "Leidiniai",
      releasesDesc: "Leidyklos diskografija, viršelių dailė ir dainų sąrašai",
      artistsLabel: "Atlikėjai",
      artistsDesc: "Sąrašas, rodomas pagrindiniame ir Atlikėjų puslapyje",
      eventsLabel: "Renginiai",
      eventsDesc: "Pristatomas, būsimas ir praėjęs line-up",
      radioLabel: "Radijas",
      radioDesc: "Įkelkite takelius Radijo puslapiui ir grojimo mygtukui viršuje",
      radioLiveLabel: "Radijas — tiesioginis pultas",
      radioLiveDesc: "Eterio jungiklis, dabar grojama, transliacijos nuoroda, tvarkaraštis ir klausymosi nuorodos",
      storeLabel: "Parduotuvė",
      storeDesc: "Produktai, rodomi Parduotuvės puslapyje",
      ordersLabel: "Užsakymai",
      ordersDesc: "Per Parduotuvės puslapį pateikti užsakymai",
      reelsLabel: "Reels",
      reelsDesc: "Įkelkite klipus arba įklijuokite Facebook/kitas nuorodas prilipusiai Reels skiltiai",
      videosLabel: "Vaizdo įrašai",
      videosDesc: "Įkelkite setus arba įklijuokite YouTube/kitas nuorodas, žymėkite pagal atlikėją ir žanrą",
      galleryLabel: "Galerija",
      galleryDesc: "Klubo nuotraukų juosta pagrindiniame puslapyje — įkėlimas, tvarkymas, alt tekstas",
      inquiriesLabel: "Užklausos",
      inquiriesDesc: "Pranešimai iš Kontaktų, Rezervacijos ir Pamesta ir rasta",
      aboutLabel: "Apie",
      aboutDesc: "Istorija, antraštė, nuotrauka ir statistikos juosta Apie puslapyje",
      changeLoginLabel: "Keisti prisijungimą",
      changeLoginDesc: "Tvarkykite tai iš Supabase valdymo skydelio",
    },
    sections: {
      artistsEyebrow: "Prie pulto",
      artistsTitle: "Susipažinkite su atlikėjais",
      artistsNote: "Portretai ir biografijos",
      storeEyebrow: "Parsineškite namo",
      storeTitle: "Parduotuvė",
      storeNote: "Prekės atnaujinamos kas mėnesį",
      bookUsEyebrow: "Grokite pas mus / samdykite mus",
      bookUsTitle: "Rezervuokite mus",
      bookUsNote: "Rezervuojate setą, rezidenciją ar nuomojate salę privačiam renginiui — papasakokite mums.",
      radioLiveTitle: "Tiesioginė transliacija",
      radioOnAirSoon: "Eteryje dabar — transliacijos nuoroda netrukus",
      radioEyebrow: "Krantas Radijas",
      radioTitle: "Radijas",
      radioNote: "Naujos transliacijos kas antrą savaitę",
      eventsEyebrow: "Kas vyksta",
      eventsTitle: "Būsimi renginiai",
      eventsNote: "Durys 23:00 · Klaipėdos pajūrio rajonas",
      eventsFeatured: "Pristatomas",
      eventsGetTicketsVia: "Bilietai per",
      eventsGetTickets: "Bilietai →",
      eventsDetails: "Daugiau →",
      eventsArchiveEyebrow: "Archyvas",
      eventsArchiveTitle: "Praėję renginiai",
      eventsNoUpcoming: "Šiuo metu būsimų renginių nėra — užsukite vėliau.",
      ticketsLabel: "Bilietai",
      onPaysera: "per Paysera",
      onRA: "per RA",
      releasesEyebrow: "Ant leidyklos",
      releasesTitle: "Leidiniai",
      releasesNote: "Krantas Recordings",
      releasesComingSoonTitle: "Leidiniai netrukus",
      releasesComingSoonBody: "Leidykloje dar nieko nėra — užsukite vėliau.",
      lostFoundEyebrow: "Kažką pamiršote?",
      lostFoundTitle: "Pamesta ir rasta",
      lostFoundNote: "Papasakokite, ką pametėte, ir susisieksime, jei atsiras.",
      lostFoundHowItWorks: "Kaip tai veikia",
      reelsComingSoon: "Netrukus",
      storeSoldOut: "Išparduota — sekite kitą papildymą",
      setsUnavailable: "Nepasiekiama",
      setsOnAir: "Eteryje",
      setsKrantasSets: "Krantas Sets",
      setsCouldntLoad: "Nepavyko įkelti šio seto",
      setsChooseASet: "Pasirinkite setą",
      setsNextSet: "Kitas setas",
      setsPlayAria: "Groti Krantas setą",
      setsPauseAria: "Pristabdyti Krantas setą",
      videosAllGenres: "Visi žanrai",
      videosAllArtists: "Visi atlikėjai",
    },
  },
  en: {
    nav: {
      releases: "Releases",
      artists: "Artists",
      events: "Events",
      radio: "Radio",
      store: "Store",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    footer: {
      tagline:
        "Underground music by the shore. Techno, breaks and bass since the tide turned.",
      explore: "Explore",
      club: "Club",
      aboutKrantas: "About Krantas",
      lostAndFound: "Lost & found",
      contact: "Contact",
      bookUs: "Book us",
      findUs: "Find us",
      follow: "Follow",
      poweredBy: "Powered by",
      allRightsReserved: "All rights reserved.",
    },
    contact: {
      eyebrow: "Get in touch",
      title: "Contact",
      note: "Questions, press, guest lists — drop us a line.",
      messageSentTitle: "Message sent",
      messageSentBody: (firstName: string) =>
        `Thanks, ${firstName} — check your inbox for a confirmation. We'll get back to you soon.`,
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      phoneLabel: "Phone (optional)",
      phonePlaceholder: "+370...",
      subjectLabel: "Subject (optional)",
      subjectPlaceholder: "What's this about?",
      messageLabel: "Message",
      messagePlaceholder: "Tell us what's up...",
      send: "Send message →",
      sending: "Sending...",
      genericError: "Something went wrong — try again.",
      findUs: "Find us",
      follow: "Follow",
    },
    admin: {
      controlPanel: "Control Panel",
      backToSite: "← Site",
      signOut: "Sign out →",
      signIn: "Sign in",
      signingIn: "Signing in...",
      email: "Email",
      password: "Password",
      wrongCredentials: "Wrong email or password.",
      backToSiteLong: "← Back to site",
      groupSiteContent: "Site content",
      groupAccount: "Account",
      homepageLabel: "Homepage",
      homepageDesc: "Scrolling strip text and the statement section below the videos",
      releasesLabel: "Releases",
      releasesDesc: "Label discography, cover art and tracklists",
      artistsLabel: "Artists",
      artistsDesc: "Roster shown on the homepage and Artists page",
      eventsLabel: "Events",
      eventsDesc: "Featured, upcoming and past line-up",
      radioLabel: "Radio",
      radioDesc: "Upload tracks for the Radio page and header play button",
      radioLiveLabel: "Radio — live desk",
      radioLiveDesc: "On-air toggle, now playing, stream link, schedule and listen links",
      storeLabel: "Store",
      storeDesc: "Products shown on the Store page",
      ordersLabel: "Orders",
      ordersDesc: "Orders placed through the Store page",
      reelsLabel: "Reels",
      reelsDesc: "Upload clips or paste Facebook/other reel links for the sticky Reels tab",
      videosLabel: "Videos",
      videosDesc: "Upload sets or paste YouTube/other links, tag by artist and genre",
      galleryLabel: "Gallery",
      galleryDesc: "Venue photo strip on the homepage — upload, reorder, alt text",
      inquiriesLabel: "Inquiries",
      inquiriesDesc: "Submissions from Contact, Book us and Lost & found",
      aboutLabel: "About",
      aboutDesc: "Story, heading, photo and the stats strip on the About page",
      changeLoginLabel: "Change login",
      changeLoginDesc: "Manage this from the Supabase dashboard",
    },
    sections: {
      artistsEyebrow: "In the booth",
      artistsTitle: "Meet the Lineup",
      artistsNote: "Portraits & bios",
      storeEyebrow: "Take it home",
      storeTitle: "Store",
      storeNote: "Merch drops restock monthly",
      bookUsEyebrow: "Play here / hire us",
      bookUsTitle: "Book us",
      bookUsNote: "Booking a set, a residency, or hiring the room for a private event — tell us about it.",
      radioLiveTitle: "Live broadcast",
      radioOnAirSoon: "On air now — stream link coming shortly",
      radioEyebrow: "Krantas Radio",
      radioTitle: "Radio",
      radioNote: "New transmissions every second week",
      eventsEyebrow: "What's on",
      eventsTitle: "Upcoming Events",
      eventsNote: "Doors 23:00 · Klaipėda seafront district",
      eventsFeatured: "Featured",
      eventsGetTicketsVia: "Get tickets via",
      eventsGetTickets: "Get tickets →",
      eventsDetails: "Details →",
      eventsArchiveEyebrow: "Archive",
      eventsArchiveTitle: "Past Events",
      eventsNoUpcoming: "No upcoming events right now — check back soon.",
      ticketsLabel: "Tickets",
      onPaysera: "on Paysera",
      onRA: "on RA",
      releasesEyebrow: "On the label",
      releasesTitle: "Releases",
      releasesNote: "Krantas Recordings",
      releasesComingSoonTitle: "Releases coming soon",
      releasesComingSoonBody: "Nothing on the label yet — check back shortly.",
      lostFoundEyebrow: "Left something behind?",
      lostFoundTitle: "Lost & found",
      lostFoundNote: "Tell us what you lost and we'll reach out if it turns up.",
      lostFoundHowItWorks: "How it works",
      reelsComingSoon: "Coming soon",
      storeSoldOut: "Sold out — check back on the next restock",
      setsUnavailable: "Unavailable",
      setsOnAir: "On air",
      setsKrantasSets: "Krantas Sets",
      setsCouldntLoad: "Couldn't load this set",
      setsChooseASet: "Choose a set",
      setsNextSet: "Next set",
      setsPlayAria: "Play Krantas set",
      setsPauseAria: "Pause Krantas set",
      videosAllGenres: "All genres",
      videosAllArtists: "All artists",
    },
  },
} as const;

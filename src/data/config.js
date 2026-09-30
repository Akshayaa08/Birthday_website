/**
 * Customization Configuration
 * 
 * Edit this file to easily customize names, dates, timezone,
 * and toggle developer test mode.
 */
export const config = {
  // His name to display across the site
  boyfriendName: "My Love",

  // Journey start date (format: YYYY-MM-DD)
  journeyStart: "2026-10-01",

  // His birthday date (format: YYYY-MM-DD)
  birthday: "2026-10-19",

  // Timezone for all date computations
  timezone: "Asia/Kolkata",

  // Final grand message on the birthday page
  finalMessage: "Happy Birthday, My Love ❤️",

  // Homepage journey messaging (editable)
  homeHeading: "Something special is waiting for you... ❤️",
  homeSubheading1: "Starting October 1, a little surprise will be waiting for you every day.",
  homeJourneyBullets: [
    "18 little surprises.",
    "18 little moments.",
    "1 very special birthday."
  ],
  homeJourneyConclusion: "And it all leads to October 19. ❤️",

  // Countdown highlight text
  countdownHeading: "HAPPY BIRTHDAY COUNTDOWN",
  countdownHighlight: "19 Days. 18 Little Surprises. 1 Very Special Birthday. ❤️",
  countdownSubtext: "Counting down every heartbeat until October 19th... ✨",

  // Background romantic song file in public/music/
  music: "/music/our-song.mp3",

  // --------------------------------------------------------------------------
  // DEV / TEST MODE
  // --------------------------------------------------------------------------
  // When devMode is true, the site uses `testDate` instead of current real time.
  // Set devMode to FALSE before sending/deploying the website to him!
  devMode: true,

  // Change this date to simulate any day of the journey:
  // e.g. "2026-09-30" -> Pre-journey countdown
  //      "2026-10-01" -> Day 1 unlocked
  //      "2026-10-07" -> Day 7 unlocked, Days 1-6 completed
  //      "2026-10-19" -> Grand Birthday experience
  testDate: "2026-09-30"
};

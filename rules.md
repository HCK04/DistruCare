Create a cross-platform mobile application (Android and iOS) for a Smart Pill Dispenser built using an Arduino Uno, DS3231 RTC, stepper motor, LCD display, LED indicator, and push button.

The hardware system already works independently and dispenses pills at scheduled AM and PM times, rotates a container using a stepper motor, and detects when the user presses a button to confirm pills are taken. The system displays status on an LCD and uses an LED for alerts. DO NOT modify or require any additional hardware.

The mobile app must act as a companion system that enhances usability, tracking, and control, without relying on internet connectivity or external servers. The app must use a local SQLite database for all data storage.

Core Features:

* Allow users to set and update medication schedules (AM and PM times)
* Display current schedule in a clean and intuitive dashboard
* Track medication adherence manually (user can log "Taken", "Missed", or "Late")
* Store and display historical data (daily, weekly adherence logs)
* Show simple analytics such as adherence percentage and missed doses
* Allow user to simulate or manually confirm pill intake (since hardware is not directly connected)

User Interface & Design Requirements:

* The UI must feel professionally designed and NOT look AI-generated or generic
* Clean, modern, minimal aesthetic with strong attention to spacing and hierarchy
* Use smooth, subtle animations (micro-interactions) for transitions, button presses, and status changes
* Avoid clutter, unnecessary elements, or overly complex layouts

Accessibility (very important):

* Designed primarily for elderly users
* Large, readable fonts with high contrast
* Clear icons paired with text (never icons alone)
* Big touch targets (buttons easy to press)
* Simple navigation with minimal steps (no deep menus)

Visual Feedback:

* Color-coded system:

  * Green = Taken
  * Yellow = Late
  * Red = Missed
* Use soft animations (fade, slide, scale) when status changes
* Provide clear confirmation after user actions

Main Screens:

1. Dashboard:

   * Next pill time (very prominent)
   * Today’s status
   * Large quick-action buttons (Taken / Missed)
   * Friendly, reassuring design

2. History:

   * Daily/weekly logs
   * Simple and readable list or calendar view

3. Settings:

   * Easy schedule configuration (AM/PM times)
   * Minimal inputs, easy to understand

User Experience:

* The app should feel like a calm, helpful health companion
* Avoid technical language
* Include gentle local notifications (no internet required)
* Provide reminders if a dose is not marked as taken
* Keep all interactions fast and simple (max 2–3 taps per action)

Technical Requirements:

* Must work fully offline using SQLite
* Must be built using a cross-platform framework (Flutter or React Native preferred)
* Use local notifications API for reminders
* Code should be modular and clean for future upgrades

Optional Enhancements:

* Daily adherence score (percentage)
* Simple trend visualization (clean charts, not cluttered)
* Friendly feedback messages (subtle and not excessive)

Important Constraints:

* Do NOT assume Bluetooth, Wi-Fi, or cloud connectivity
* Do NOT require any changes to the Arduino hardware setup
* The app should simulate interaction with the dispenser rather than directly control it

Goal:
Deliver a polished, elegant, and highly usable mobile application that feels like a real medical-grade product. The design should be clean, calm, and trustworthy, with smooth animations and excellent accessibility, especially for elderly users.

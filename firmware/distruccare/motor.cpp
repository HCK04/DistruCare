#include "motor.h"
#include "config.h"

// Half-step sequence for 28BYJ-48 — 8 micro-steps per electrical cycle.
// Provides higher torque and smoother motion than full-step.
static const uint8_t HALF_STEP[8][4] = {
  {1, 0, 0, 0},
  {1, 1, 0, 0},
  {0, 1, 0, 0},
  {0, 1, 1, 0},
  {0, 0, 1, 0},
  {0, 0, 1, 1},
  {0, 0, 0, 1},
  {1, 0, 0, 1},
};

static uint8_t stepIndex = 0;

static const uint8_t PINS[4] = { MOTOR_IN1, MOTOR_IN2, MOTOR_IN3, MOTOR_IN4 };

void motorInit() {
  for (uint8_t i = 0; i < 4; i++) {
    pinMode(PINS[i], OUTPUT);
    digitalWrite(PINS[i], LOW);
  }
}

static void applyStep() {
  for (uint8_t i = 0; i < 4; i++) {
    digitalWrite(PINS[i], HALF_STEP[stepIndex][i]);
  }
  stepIndex = (stepIndex + 1) % 8;
  delay(STEP_DELAY_MS);
}

void motorRotate(int slots) {
  // STEPS_PER_SLOT is already expressed in HALF-steps (we drive in half-step),
  // so advance exactly that many half-steps per slot — no extra factor.
  long totalSteps = (long)slots * STEPS_PER_SLOT;
  for (long i = 0; i < totalSteps; i++) {
    applyStep();
  }
  motorStop();
}

void motorStop() {
  for (uint8_t i = 0; i < 4; i++) {
    digitalWrite(PINS[i], LOW);
  }
}

// ── Boot diagnostic ────────────────────────────────────────
// Runs once at startup. Two phases, both deliberately SLOW so the four LEDs
// on the ULN2003 board are easy to watch:
//
//   Phase 1 — energise each coil ON its own, IN1 → IN2 → IN3 → IN4, repeating.
//             Each ULN2003 LED (A, B, C, D) should light in turn. If one LED
//             never lights, that signal wire/pin (D5–D8) is the problem.
//
//   Phase 2 — a slow half-step run, so the LEDs "chase" and the shaft should
//             visibly rotate. If the LEDs chase but the shaft doesn't move,
//             the issue is motor power (VU/5V + ULN2003 jumper) or the motor plug.
void motorSelfTest() {
  Serial.println("Motor self-test: Phase 1 (each coil one by one)");
  for (uint8_t cycle = 0; cycle < 2; cycle++) {
    for (uint8_t i = 0; i < 4; i++) {
      motorStop();
      digitalWrite(PINS[i], HIGH);
      Serial.printf("  coil %u  (IN%u)  ON\n", i + 1, i + 1);
      delay(350);
    }
  }
  motorStop();

  Serial.println("Motor self-test: Phase 2 (slow half-step rotation)");
  for (uint16_t s = 0; s < 700; s++) {           // ~700 half-steps
    for (uint8_t i = 0; i < 4; i++) {
      digitalWrite(PINS[i], HALF_STEP[stepIndex][i]);
    }
    stepIndex = (stepIndex + 1) % 8;
    delay(6);                                     // slow: ~6 ms/step
  }
  motorStop();
  Serial.println("Motor self-test: complete");
}

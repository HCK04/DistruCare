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
  // STEPS_PER_SLOT is a fractional half-step count (the 28BYJ-48 gearbox is
  // 63.68395:1, so a slot is ~2037.9 half-steps, not a round number). We must
  // round to whole steps, but keep the leftover fraction in a static remainder
  // and add it to the NEXT call. That way the rounding error never accumulates
  // and every slot stays locked to its true position, run after run.
  static float remainder = 0.0f;

  float wanted = (float)slots * STEPS_PER_SLOT + remainder;
  long totalSteps = (long)(wanted + 0.5f);   // round to nearest whole half-step
  remainder = wanted - (float)totalSteps;    // carry the fraction forward

  // Add the friction push AFTER the remainder is computed, so these extra steps
  // compensate the badly-mounted gears' slippage without polluting the geometric
  // step count. A fraction of a slot (e.g. 0.25 = +25%) per slot commanded.
  totalSteps += (long)((float)slots * STEPS_PER_SLOT * FRICTION_COMP_FRACTION + 0.5f);

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

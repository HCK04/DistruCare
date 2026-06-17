// ────────────────────────────────────────────────────────────
// Motor-only diagnostic sketch for NodeMCU V3 + ULN2003 + 28BYJ-48
//
// No WiFi, no HTTP, no LCD, no RTC. Just the stepper.
// On boot, prints to Serial @115200 and continuously rotates
// the motor 1/4 turn every 3 seconds, forever.
//
// If the motor does NOT move while these logs print → wiring/power.
// ────────────────────────────────────────────────────────────

#include <Arduino.h>

#define IN1 D5   // GPIO14 → ULN2003 IN1
#define IN2 D6   // GPIO12 → ULN2003 IN2
#define IN3 D7   // GPIO13 → ULN2003 IN3
#define IN4 D8   // GPIO15 → ULN2003 IN4  (must be LOW at boot)

const uint8_t PINS[4] = { IN1, IN2, IN3, IN4 };

// 28BYJ-48 half-step sequence (8 micro-steps per electrical cycle)
const uint8_t SEQ[8][4] = {
  {1, 0, 0, 0},
  {1, 1, 0, 0},
  {0, 1, 0, 0},
  {0, 1, 1, 0},
  {0, 0, 1, 0},
  {0, 0, 1, 1},
  {0, 0, 0, 1},
  {1, 0, 0, 1},
};

uint8_t stepIdx = 0;

void coilsOff() {
  for (int i = 0; i < 4; i++) digitalWrite(PINS[i], LOW);
}

void doStep() {
  for (int i = 0; i < 4; i++) digitalWrite(PINS[i], SEQ[stepIdx][i]);
  stepIdx = (stepIdx + 1) % 8;
  delay(2);  // 2 ms per half-step
}

void rotateHalfSteps(long steps) {
  for (long i = 0; i < steps; i++) doStep();
  coilsOff();  // de-energize so coils don't heat up between cycles
}

void setup() {
  // Drive D8 LOW immediately — GPIO15 must be LOW at boot or ESP won't start
  pinMode(IN4, OUTPUT); digitalWrite(IN4, LOW);
  pinMode(IN1, OUTPUT); digitalWrite(IN1, LOW);
  pinMode(IN2, OUTPUT); digitalWrite(IN2, LOW);
  pinMode(IN3, OUTPUT); digitalWrite(IN3, LOW);

  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println(F("===== MOTOR-ONLY TEST ====="));
  Serial.println(F("NodeMCU alive. Pins D5/D6/D7/D8 set to OUTPUT LOW."));
  Serial.println(F("Will rotate ~1/4 turn (1024 half-steps) every 3 s."));
  Serial.println(F("If logs print but motor stays still → wiring or power."));
  Serial.println();
}

uint32_t cycle = 0;

void loop() {
  cycle++;
  Serial.print(F("[cycle "));
  Serial.print(cycle);
  Serial.println(F("] rotating..."));
  rotateHalfSteps(1024);
  Serial.println(F("  ...stopped. pause 3 s."));
  delay(3000);
}

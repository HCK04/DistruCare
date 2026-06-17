// ════════════════════════════════════════════════════════════
//  MotorTest.ino — wider rotation test
//  Board: LoLin NodeMCU V3 (ESP8266)   Serial: 115200
//
//  Per-cycle (loops forever):
//   A) SLOW chase — 32 half-steps × 50 ms (1.6 s, LEDs visibly chase)
//   B) FORWARD   — 4096 half-steps × 2 ms (≈ ONE FULL REVOLUTION CW)
//   C) REVERSE   — 4096 half-steps × 2 ms (back to start)
//   D) Rest 2 s, then repeat
//
//  Wiring (current):
//   D1 → IN1   D2 → IN2   D3 → IN3   D4 → IN4
//   VV/VU → +   GND → -   jumper installed on the 2 empty pins
// ════════════════════════════════════════════════════════════

#include <Arduino.h>

// Wired to D1/D2/D3/D4 per current user wiring.
// (D3 = GPIO0 and D4 = GPIO2 are strapping pins — built-in pull-ups
//  hold them HIGH between writes, so we force them LOW in setup.)
#define IN1 D1
#define IN2 D2
#define IN3 D3
#define IN4 D4

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

void doStep(int dir, uint16_t delayMs) {
  if (dir > 0) stepIdx = (stepIdx + 1) % 8;
  else         stepIdx = (stepIdx + 7) % 8;
  for (int i = 0; i < 4; i++) digitalWrite(PINS[i], SEQ[stepIdx][i]);
  delay(delayMs);
}

void rotate(long steps, int dir, uint16_t delayMs) {
  for (long i = 0; i < steps; i++) doStep(dir, delayMs);
  coilsOff();
}

void setup() {
  pinMode(IN1, OUTPUT); digitalWrite(IN1, LOW);
  pinMode(IN2, OUTPUT); digitalWrite(IN2, LOW);
  pinMode(IN3, OUTPUT); digitalWrite(IN3, LOW);
  pinMode(IN4, OUTPUT); digitalWrite(IN4, LOW);

  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println(F("══════════════════════════════════════════"));
  Serial.println(F("   MotorTest — wider rotation"));
  Serial.println(F("══════════════════════════════════════════"));
  Serial.println(F("Pins: D1 D2 D3 D4 → IN1 IN2 IN3 IN4"));
  Serial.println(F("Each cycle = full turn forward + full turn back"));
  Serial.println();
}

uint32_t cycle = 0;

void loop() {
  cycle++;
  Serial.print(F("\n──── Cycle "));
  Serial.print(cycle);
  Serial.println(F(" ────"));

  Serial.println(F("A) SLOW chase  (32 half-steps × 50 ms)"));
  rotate(32, +1, 50);

  Serial.println(F("B) FORWARD     (4096 half-steps × 2 ms = 1 full turn CW)"));
  rotate(4096, +1, 2);

  Serial.println(F("C) REVERSE     (4096 half-steps × 2 ms = 1 full turn back)"));
  rotate(4096, -1, 2);

  Serial.println(F("D) rest 2 s"));
  delay(2000);
}

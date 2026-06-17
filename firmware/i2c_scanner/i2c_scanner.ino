// ════════════════════════════════════════════════════════════
//  i2c_scanner.ino — find the address of the I2C LCD backpack
//  Board: LoLin NodeMCU V3 (ESP8266)   Serial: 115200
//
//  Wiring (same bus the main firmware uses):
//    LCD SDA → D2 (GPIO4)
//    LCD SCL → D1 (GPIO5)
//    LCD VCC → VU (5V)   LCD GND → GND
//
//  Prints every responding I2C address once per second.
//  Common LCD backpack (PCF8574) addresses: 0x27 or 0x3F.
//  Whatever it reports goes into config.h → LCD_ADDRESS.
// ════════════════════════════════════════════════════════════

#include <Wire.h>

#define I2C_SDA D2
#define I2C_SCL D1

void setup() {
  Serial.begin(115200);
  delay(300);
  Wire.begin(I2C_SDA, I2C_SCL);
  Serial.println();
  Serial.println(F("==== I2C scanner ===="));
  Serial.println(F("SDA=D2  SCL=D1"));
}

void loop() {
  uint8_t found = 0;
  Serial.println(F("Scanning..."));
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print(F("  device at 0x"));
      if (addr < 16) Serial.print('0');
      Serial.println(addr, HEX);
      found++;
    }
  }
  if (found == 0) Serial.println(F("  none found — check SDA/SCL/VCC/GND wiring"));
  Serial.println();
  delay(1500);
}

#pragma once
#include <Arduino.h>

void    rtcInit();
bool    rtcIsRunning();
bool    rtcHardwarePresent();   // true only if a real DS3231 was detected on I2C
void    rtcSetTime(uint16_t year, uint8_t month, uint8_t day,
                   uint8_t h, uint8_t m, uint8_t s);
uint8_t rtcHour();
uint8_t rtcMinute();
String  rtcTimeString();   // returns "HH:MM"

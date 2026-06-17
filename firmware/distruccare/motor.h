#pragma once
#include <Arduino.h>

void motorInit();
void motorRotate(int slots);   // rotate forward by N slots
void motorStop();              // de-energise all coils
void motorSelfTest();          // boot diagnostic: slow coil chase + slow turn

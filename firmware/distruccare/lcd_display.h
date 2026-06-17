#pragma once
#include <Arduino.h>

void lcdInit();
void lcdShowSchedule(const char* am, const char* pm);
void lcdShowStatus(const char* line1, const char* line2);
void lcdShowDispensing();
void lcdShowDone();
void lcdShowNoSync();

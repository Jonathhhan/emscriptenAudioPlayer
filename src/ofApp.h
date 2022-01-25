/*
 * Copyright (c) 2011 Dan Wilcox <danomatika@gmail.com>
 *
 * BSD Simplified License.
 * For information on usage and redistribution, and for a DISCLAIMER OF ALL
 * WARRANTIES, see the file, "LICENSE.txt," in this distribution.
 *
 * See https://github.com/danomatika/ofxPd for documentation
 *
 */
#pragma once

#include "ofMain.h"
#include "ofxPd.h"

#include "hSlider.h"
#include "bang.h"
#include "toggle.h"
#include "label.h"
#include "number.h"
#include "hRadio.h"

// a namespace for the Pd types
using namespace pd;

// inherit pd receivers to receive message and midi events
class ofApp : public ofBaseApp, public PdReceiver, public PdMidiReceiver {

	public:

		// main
		void setup();
		void update();
		void draw();
		void exit();

		// do something
		void playTone(int pitch);
		
		// input callbacks
		void keyPressed(int key);
		
		// audio callbacks
		void audioReceived(float * input, int bufferSize, int nChannels);
		void audioRequested(float * output, int bufferSize, int nChannels);
		
		// pd message receiver callbacks
		void print(const std::string &message);
		
		void receiveBang(const std::string &dest);
		void receiveFloat(const std::string &dest, float value);
		void receiveSymbol(const std::string &dest, const std::string &symbol);
		void receiveList(const std::string &dest, const pd::List &list);
		void receiveMessage(const std::string &dest, const std::string &msg, const pd::List &list);
		
		// pd midi receiver callbacks
		void receiveNoteOn(const int channel, const int pitch, const int velocity);
		void receiveControlChange(const int channel, const int controller, const int value);
		void receiveProgramChange(const int channel, const int value);
		void receivePitchBend(const int channel, const int value);
		void receiveAftertouch(const int channel, const int value);
		void receivePolyAftertouch(const int channel, const int pitch, const int value);
		
		void receiveMidiByte(const int port, const int byte);
		void hSlider_1onMousePressed(float & e);
		void hSlider_2onMousePressed(float & e);
		void hSlider_3onMousePressed(float & e);
		void toggle_1onMousePressed(bool & e);
		void bang_1onMousePressed(bool & e);
		void audioChangedLeft(std::vector<float> & rv);
		void audioChangedRight(std::vector<float> & rv);

		ofxPd pd;
		Patch patch;
		bool toggle;
		vector<float> scopeArray;
		vector<Patch> instances;
		class toggle toggle_1;
		class bang bang_1;
		class hSlider hSlider_1;
		class hSlider hSlider_2;
		class hSlider hSlider_3;
		class label label_1;	
		class label label_2;
		class label label_3;
		class label label_4;
		class label label_5;
		class label label_7;
		int midiChan;
		std::vector<int> x;
};

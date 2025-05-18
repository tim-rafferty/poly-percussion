### Play PolyPerc

#### Requirement

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

#### Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/tim-rafferty/poly-percussion.git

#### Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

#### Step 3: Install the necessary dependencies.
npm install or sudo npm install

#### Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev or sudo npm run dev

#### Step 5: Start the development server with auto-reloading and an instant preview.
navigate to http://192.168.4.23:8080/ in your browser and click play :)

#### Example of PolyPerc

![poly-percussion](https://github.com/user-attachments/assets/25834d20-e6cc-4619-9f6d-1564e1c969df)

## PolyPerc: Polyrhythmic Percussion Sequencer

#### Overview

PolyPerc is an interactive web application that allows users to create complex polyrhythms and euclidean beats through a visually intuitive interface. Users can manipulate 8 separate percussion tracks, each with individual time signatures and independent effects, creating rich rhythmic patterns that would be challenging to perform manually.

#### Built with

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

#### Visual Interface:

1	Main Sequencer Area:
		  -Central vertical timeline with 8 colored nodes
	  	-Nodes can be clicked, dragged horizontally, and released to create pendulum-like oscillations
		  -Each oscillation triggers the corresponding sound when crossing the center line
		  -Oscillation width determines the "intensity" of the rhythm pattern
2	Track Selection Panel:
		  -Bottom panel featuring 8 colored circles matching the sequencer nodes
		  -Clicking a circle selects the corresponding track for parameter editing
3	Parameter Controls (appears when a track is selected):
		  -Volume slider
		  -Attack/Decay controls
		  -Sound selection dropdown (various percussion samples)
		  -Time signature selector (ranging from 1/16 to 16/16)
		  -Mute/Solo options
 
#### Audio Engine
•	Master tempo control (BPM) that synchronizes all tracks
•	Individual timing controls per track while maintaining global synchronization
•	Real-time audio processing 
 
#### Interaction Model
1	Select a track by clicking its corresponding colored circle
2	Configures track parameters by clicking the subsequent colored circle on the bottom (sound, volume, time signature, etc.)
3	Activate the sequencer by clicking play and by pulling a node from the center line
4	Once released, the node oscillates at a rate determined by:
		    -The distance pulled 
		    -The track's time signature
		    -The master tempo

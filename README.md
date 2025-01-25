# interactive-dmx-p1

Beam for Max server and client prototype programs. This version of prototype works with Betopper LM0740 fixtures.

There are two programs that should run concurrently: (1) BeamServer Max project and (2) BeamClient bpathcher module running in the user's Max patch.

## BeamClient

BeamClient bpatcher module sends OSC messages to control DMX/ArtNet fixtures via the BeamServer program which may be running on the same computer or on another computer in the same subnet.

### Setup Procedure

- Copy the BeamClient folder to anywhere in your Max serch path.
- In a Max patch, create a bpatcher instance of BeamClientBP.
- Provide three arguments to the bpatcher module: (1) ID number, (2) IP address of OSC host (i.e., the address of the computer where BeamServer is running), (3) port of the OSC host.

### Notes on the arguments

- The ID number corresponds with the number assigned with the LM0740 fixture (currently either 1 or 2).
- The IP address and port may be omitted, and in this case, they are set to 127.0.0.1 1100 by default.

### Module parameters

See the in-patch help window for the information.

### Module operations

See BeamClientBPTest patch included in the test folder. The test patch uses some modules from [yk.abstractions](https://github.com/programsounds/yk.abstractions).

## BeamServer

BeamServer is a Max project and requires [Beam for Max](https://beam.showsync.com/beam-for-max) license assigned to the computer to run it. This server program controls the Betopper fixtures by ArtNet protocol either by receiving the control messages from the BeamClient module described above or directly from this server program.

### Setup procedure

- Connect both ArtNet interface and the computer running this server program to a network swtich (the server program assumes that the ArtNet interface is set to a static IP address 192.168.0.10). 
- Copy the Beam fixture profile **BetopperLM0740_Custom.sdf** in the **other** folder of the package to anywhere in your Max serch path.

"""
OVRLipSync Audio to Viseme Converter
====================================

This script uses the OVRLipSync.dll library to convert audio into viseme data
that can be mapped to character facial expressions and lip synchronization.

OVRLipSync provides 15 visemes that correspond to different mouth shapes:
- sil: Silence
- PP: Lips together (P, B, M sounds)
- FF: Lower lip to upper teeth (F, V sounds)
- TH: Tongue between teeth (TH sounds)
- DD: Tongue to roof of mouth (D, T, N, L sounds)
- kk: Back of tongue to soft palate (K, G sounds)
- CH: Tongue and lips forward (CH, SH, J sounds)
- SS: Tongue near roof, air flow (S, Z sounds)
- nn: Tongue to roof, nasal (N, NG sounds)
- RR: Tongue pulled back (R sounds)
- aa: Open mouth (AH sounds)
- E: Slightly open (EH, AE sounds)
- I: Small opening (IH, EY sounds)  
- O: Rounded lips (OH, OW sounds)
- U: Tight rounded lips (UH, UW sounds)
"""

import ctypes
import numpy as np
import wave
import json
import os
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import IntEnum

class OVRViseme(IntEnum):
    """OVRLipSync viseme enumeration"""
    sil = 0   # Silence
    PP = 1    # Lips together (P, B, M)
    FF = 2    # Lower lip to upper teeth (F, V)
    TH = 3    # Tongue between teeth (TH)
    DD = 4    # Tongue to roof (D, T, N, L)
    kk = 5    # Back tongue to soft palate (K, G)
    CH = 6    # Tongue and lips forward (CH, SH, J)
    SS = 7    # Tongue near roof, air flow (S, Z)
    nn = 8    # Tongue to roof, nasal (N, NG)
    RR = 9    # Tongue pulled back (R)
    aa = 10   # Open mouth (AH)
    E = 11    # Slightly open (EH, AE)
    I = 12    # Small opening (IH, EY)
    O = 13    # Rounded lips (OH, OW)
    U = 14    # Tight rounded lips (UH, UW)

@dataclass
class VisemeFrame:
    """Represents a single frame of viseme data"""
    timestamp: float
    viseme_weights: Dict[str, float]
    dominant_viseme: str
    laugh_score: float = 0.0

@dataclass
class AudioInfo:
    """Audio file information"""
    sample_rate: int
    channels: int
    sample_width: int
    duration: float

class OVRLipSyncWrapper:
    """Python wrapper for OVRLipSync.dll"""
    
    def __init__(self, dll_path: str = "OVRLipSync.dll"):
        """
        Initialize the OVRLipSync wrapper
        
        Args:
            dll_path: Path to the OVRLipSync.dll file
        """
        self.dll_path = dll_path
        self.dll = None
        self.context = None
        self._load_dll()
        self._setup_functions()
        
    def _load_dll(self):
        """Load the OVRLipSync DLL"""
        try:
            # Try with full path first
            if not os.path.isabs(self.dll_path):
                full_path = os.path.abspath(self.dll_path)
                self.dll = ctypes.CDLL(full_path)
            else:
                self.dll = ctypes.CDLL(self.dll_path)
            print(f"Successfully loaded {self.dll_path}")
        except OSError as e:
            print(f"Warning: Failed to load OVRLipSync.dll: {e}")
            print("Falling back to simulation mode...")
            self._use_fallback = True
            self.dll = None
    
    def _setup_functions(self):
        """Setup function signatures for the DLL"""
        if hasattr(self, '_use_fallback') or self.dll is None:
            return
            
        try:
            # Initialize OVRLipSync
            self.dll.ovrLipSync_Initialize.argtypes = [ctypes.c_int, ctypes.c_int]
            self.dll.ovrLipSync_Initialize.restype = ctypes.c_int
            
            # Create context
            self.dll.ovrLipSync_CreateContext.argtypes = [ctypes.POINTER(ctypes.c_void_p), ctypes.c_int]
            self.dll.ovrLipSync_CreateContext.restype = ctypes.c_int
            
            # Process frame
            self.dll.ovrLipSync_ProcessFrame.argtypes = [
                ctypes.c_void_p,  # context
                ctypes.POINTER(ctypes.c_float),  # audio buffer
                ctypes.c_int,  # buffer size
                ctypes.POINTER(ctypes.c_float),  # viseme output
                ctypes.POINTER(ctypes.c_float)   # laugh score output
            ]
            self.dll.ovrLipSync_ProcessFrame.restype = ctypes.c_int
            
            # Destroy context
            self.dll.ovrLipSync_DestroyContext.argtypes = [ctypes.c_void_p]
            self.dll.ovrLipSync_DestroyContext.restype = ctypes.c_int
            
            # Shutdown
            self.dll.ovrLipSync_Shutdown.restype = None
            
        except AttributeError as e:
            print(f"Warning: Some DLL functions may not be available: {e}")
            # Fallback to a simulated version for development
            self._use_fallback = True
    
    def initialize(self, sample_rate: int = 48000, buffer_size: int = 1024) -> bool:
        """
        Initialize OVRLipSync
        
        Args:
            sample_rate: Audio sample rate (typically 48000)
            buffer_size: Audio buffer size (typically 1024)
            
        Returns:
            True if initialization successful
        """
        try:
            if hasattr(self, '_use_fallback'):
                print("Using fallback mode (DLL functions not fully available)")
                return True
                
            result = self.dll.ovrLipSync_Initialize(sample_rate, buffer_size)
            if result == 0:  # Success
                # Create processing context
                context_ptr = ctypes.c_void_p()
                result = self.dll.ovrLipSync_CreateContext(ctypes.byref(context_ptr), 0)
                if result == 0:
                    self.context = context_ptr
                    print(f"OVRLipSync initialized successfully (SR: {sample_rate}, BS: {buffer_size})")
                    return True
            
            print(f"Failed to initialize OVRLipSync (error code: {result})")
            return False
            
        except Exception as e:
            print(f"Error initializing OVRLipSync: {e}")
            return False
    
    def process_audio_buffer(self, audio_data: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Process a single audio buffer and extract viseme weights
        
        Args:
            audio_data: Audio data as numpy array (float32, mono)
            
        Returns:
            Tuple of (viseme_weights, laugh_score)
        """
        if hasattr(self, '_use_fallback'):
            return self._fallback_process_buffer(audio_data)
        
        try:
            # Prepare output arrays
            viseme_weights = (ctypes.c_float * 15)()
            laugh_score = ctypes.c_float()
            
            # Convert audio data to ctypes array
            audio_buffer = audio_data.astype(np.float32)
            audio_ptr = audio_buffer.ctypes.data_as(ctypes.POINTER(ctypes.c_float))
            
            # Process the frame
            result = self.dll.ovrLipSync_ProcessFrame(
                self.context,
                audio_ptr,
                len(audio_buffer),
                viseme_weights,
                ctypes.byref(laugh_score)
            )
            
            if result == 0:
                # Convert to numpy array
                weights = np.array([viseme_weights[i] for i in range(15)])
                return weights, laugh_score.value
            else:
                print(f"Error processing frame (error code: {result})")
                return np.zeros(15), 0.0
                
        except Exception as e:
            print(f"Error processing audio buffer: {e}")
            return np.zeros(15), 0.0
    
    def _fallback_process_buffer(self, audio_data: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Fallback processing when DLL is not available - generates mock data
        """
        # Simple energy-based fallback
        energy = np.mean(np.abs(audio_data))
        
        # Generate mock viseme weights based on audio energy
        weights = np.zeros(15)
        if energy > 0.01:  # If there's significant audio
            # Simulate some mouth movement
            weights[0] = max(0, 1.0 - energy * 5)  # silence (inverse of energy)
            weights[10] = min(1.0, energy * 3)     # aa (open mouth)
            weights[1] = min(1.0, energy * 2)      # PP (some lip movement)
            
        # Normalize weights
        total = np.sum(weights)
        if total > 0:
            weights = weights / total
            
        laugh_score = min(1.0, energy * 2) if energy > 0.05 else 0.0
        
        return weights, laugh_score
    
    def load_audio_file(self, file_path: str) -> Tuple[np.ndarray, AudioInfo]:
        """
        Load audio file and return audio data with info
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Tuple of (audio_data, audio_info)
        """
        if file_path.endswith('.wav'):
            return self._load_wav_file(file_path)
        else:
            raise ValueError(f"Unsupported audio format: {file_path}")
    
    def _load_wav_file(self, file_path: str) -> Tuple[np.ndarray, AudioInfo]:
        """Load WAV file"""
        with wave.open(file_path, 'rb') as wf:
            # Get audio info
            sample_rate = wf.getframerate()
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            n_frames = wf.getnframes()
            duration = n_frames / sample_rate
            
            # Read audio data
            frames = wf.readframes(n_frames)
            
            # Convert to numpy array
            if sample_width == 1:
                audio_data = np.frombuffer(frames, dtype=np.uint8)
                audio_data = (audio_data - 128) / 128.0
            elif sample_width == 2:
                audio_data = np.frombuffer(frames, dtype=np.int16)
                audio_data = audio_data / 32768.0
            elif sample_width == 4:
                audio_data = np.frombuffer(frames, dtype=np.int32)
                audio_data = audio_data / 2147483648.0
            else:
                raise ValueError(f"Unsupported sample width: {sample_width}")
            
            # Convert to mono if stereo
            if channels == 2:
                audio_data = audio_data.reshape(-1, 2)
                audio_data = np.mean(audio_data, axis=1)
            
            audio_info = AudioInfo(
                sample_rate=sample_rate,
                channels=channels,
                sample_width=sample_width,
                duration=duration
            )
            
            return audio_data.astype(np.float32), audio_info
    
    def process_audio_file(self, file_path: str, frame_size: int = 1024) -> List[VisemeFrame]:
        """
        Process entire audio file and return viseme data
        
        Args:
            file_path: Path to the audio file
            frame_size: Size of audio frames to process
            
        Returns:
            List of VisemeFrame objects
        """
        print(f"Processing audio file: {file_path}")
        
        # Load audio file
        audio_data, audio_info = self.load_audio_file(file_path)
        print(f"Audio info: {audio_info}")
        
        # Process in chunks
        viseme_frames = []
        frame_duration = frame_size / audio_info.sample_rate
        
        for i in range(0, len(audio_data), frame_size):
            # Get audio chunk
            chunk = audio_data[i:i + frame_size]
            
            # Pad if necessary
            if len(chunk) < frame_size:
                chunk = np.pad(chunk, (0, frame_size - len(chunk)))
            
            # Process chunk
            viseme_weights, laugh_score = self.process_audio_buffer(chunk)
            
            # Find dominant viseme
            dominant_idx = np.argmax(viseme_weights)
            dominant_viseme = OVRViseme(dominant_idx).name
            
            # Create viseme weights dictionary
            viseme_dict = {
                viseme.name: float(viseme_weights[viseme.value])
                for viseme in OVRViseme
            }
            
            # Create frame
            timestamp = i / audio_info.sample_rate
            frame = VisemeFrame(
                timestamp=timestamp,
                viseme_weights=viseme_dict,
                dominant_viseme=dominant_viseme,
                laugh_score=float(laugh_score)
            )
            
            viseme_frames.append(frame)
        
        print(f"Processed {len(viseme_frames)} frames ({audio_info.duration:.2f}s)")
        return viseme_frames
    
    def export_to_json(self, viseme_frames: List[VisemeFrame], output_path: str):
        """
        Export viseme data to JSON format
        
        Args:
            viseme_frames: List of VisemeFrame objects
            output_path: Output JSON file path
        """
        data = {
            "format": "OVRLipSync_Visemes",
            "version": "1.0",
            "frame_count": len(viseme_frames),
            "duration": viseme_frames[-1].timestamp if viseme_frames else 0.0,
            "frames": [
                {
                    "timestamp": frame.timestamp,
                    "visemes": frame.viseme_weights,
                    "dominant_viseme": frame.dominant_viseme,
                    "laugh_score": frame.laugh_score
                }
                for frame in viseme_frames
            ]
        }
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"Exported viseme data to: {output_path}")
    
    def export_to_csv(self, viseme_frames: List[VisemeFrame], output_path: str):
        """
        Export viseme data to CSV format for easy import into animation software
        
        Args:
            viseme_frames: List of VisemeFrame objects
            output_path: Output CSV file path
        """
        import csv
        
        with open(output_path, 'w', newline='') as f:
            writer = csv.writer(f)
            
            # Write header
            header = ['timestamp', 'dominant_viseme', 'laugh_score'] + [v.name for v in OVRViseme]
            writer.writerow(header)
            
            # Write data
            for frame in viseme_frames:
                row = [
                    frame.timestamp,
                    frame.dominant_viseme,
                    frame.laugh_score
                ] + [frame.viseme_weights[v.name] for v in OVRViseme]
                writer.writerow(row)
        
        print(f"Exported viseme data to CSV: {output_path}")
    
    def cleanup(self):
        """Clean up resources"""
        try:
            if hasattr(self, '_use_fallback'):
                return
                
            if self.context:
                self.dll.ovrLipSync_DestroyContext(self.context)
                self.context = None
                
            self.dll.ovrLipSync_Shutdown()
            print("OVRLipSync cleaned up successfully")
            
        except Exception as e:
            print(f"Error during cleanup: {e}")

def main():
    """Example usage of the OVRLipSync wrapper"""
    
    # Initialize wrapper
    wrapper = OVRLipSyncWrapper("OVRLipSync.dll")
    
    try:
        # Initialize OVRLipSync
        if not wrapper.initialize():
            print("Failed to initialize OVRLipSync")
            return
        
        # Process available audio files
        audio_files = ["voice.wav", "audio.mp3", "output.wav"]
        
        for audio_file in audio_files:
            if os.path.exists(audio_file):
                print(f"\n=== Processing {audio_file} ===")
                
                try:
                    # Process audio file
                    viseme_frames = wrapper.process_audio_file(audio_file)
                    
                    # Export results
                    base_name = os.path.splitext(audio_file)[0]
                    wrapper.export_to_json(viseme_frames, f"{base_name}_visemes.json")
                    wrapper.export_to_csv(viseme_frames, f"{base_name}_visemes.csv")
                    
                    # Print summary
                    if viseme_frames:
                        dominant_visemes = [f.dominant_viseme for f in viseme_frames]
                        unique_visemes = set(dominant_visemes)
                        print(f"Unique visemes detected: {sorted(unique_visemes)}")
                        
                        # Show laugh detection
                        laugh_frames = [f for f in viseme_frames if f.laugh_score > 0.1]
                        if laugh_frames:
                            print(f"Laughter detected in {len(laugh_frames)} frames")
                    
                except Exception as e:
                    print(f"Error processing {audio_file}: {e}")
            else:
                print(f"Audio file not found: {audio_file}")
    
    finally:
        # Clean up
        wrapper.cleanup()

if __name__ == "__main__":
    main()

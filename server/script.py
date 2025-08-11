#!/usr/bin/env python3
"""
Audio to Character Expression Converter
=======================================

Simple script that converts audio files to character expression data
using OVRLipSync.dll for realistic lip-sync and facial animations.

Usage:
    python script.py [audio_file]

Example:
    python script.py voice.wav
    python script.py audio.mp3
"""

import sys
import os
from ovrlipsync_wrapper import OVRLipSyncWrapper

def convert_audio_to_expressions(audio_file: str):
    """
    Convert audio file to character expression data
    
    Args:
        audio_file: Path to the audio file to process
    """
    print(f"🎤 Converting audio to character expressions: {audio_file}")
    
    # Initialize the OVRLipSync wrapper
    wrapper = OVRLipSyncWrapper("OVRLipSync.dll")
    
    try:
        # Initialize OVRLipSync
        if not wrapper.initialize(sample_rate=48000, buffer_size=1024):
            print("❌ Failed to initialize OVRLipSync")
            return False
        
        print("✅ OVRLipSync initialized successfully")
        
        # Process the audio file
        viseme_frames = wrapper.process_audio_file(audio_file, frame_size=1024)
        
        if not viseme_frames:
            print("❌ No viseme data generated")
            return False
        
        # Generate output file names
        base_name = os.path.splitext(audio_file)[0]
        json_output = f"{base_name}_expressions.json"
        csv_output = f"{base_name}_expressions.csv"
        
        # Export the results
        wrapper.export_to_json(viseme_frames, json_output)
        wrapper.export_to_csv(viseme_frames, csv_output)
        
        # Print analysis summary
        print(f"\n📊 Analysis Summary:")
        print(f"   Duration: {viseme_frames[-1].timestamp:.2f} seconds")
        print(f"   Total frames: {len(viseme_frames)}")
        
        # Show dominant visemes
        dominant_visemes = [f.dominant_viseme for f in viseme_frames]
        unique_visemes = set(dominant_visemes)
        print(f"   Visemes detected: {sorted(unique_visemes)}")
        
        # Show most active visemes
        viseme_counts = {}
        for viseme in dominant_visemes:
            viseme_counts[viseme] = viseme_counts.get(viseme, 0) + 1
        
        top_visemes = sorted(viseme_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        print(f"   Most active visemes:")
        for viseme, count in top_visemes:
            percentage = (count / len(viseme_frames)) * 100
            print(f"     {viseme}: {percentage:.1f}% ({count} frames)")
        
        # Check for laughter
        laugh_frames = [f for f in viseme_frames if f.laugh_score > 0.1]
        if laugh_frames:
            print(f"   😄 Laughter detected: {len(laugh_frames)} frames")
            avg_laugh = sum(f.laugh_score for f in laugh_frames) / len(laugh_frames)
            print(f"   Average laugh intensity: {avg_laugh:.2f}")
        
        print(f"\n📁 Output files:")
        print(f"   JSON: {json_output}")
        print(f"   CSV:  {csv_output}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error processing audio: {e}")
        return False
        
    finally:
        # Clean up resources
        wrapper.cleanup()

def main():
    """Main entry point"""
    
    # Check command line arguments
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
    else:
        # Look for audio files in current directory
        audio_files = []
        for file in os.listdir('.'):
            if file.lower().endswith(('.wav', '.mp3', '.ogg')):
                audio_files.append(file)
        
        if not audio_files:
            print("No audio files found. Please provide an audio file as argument.")
            print("Usage: python script.py <audio_file>")
            return
        
        print("Available audio files:")
        for i, file in enumerate(audio_files, 1):
            print(f"  {i}. {file}")
        
        # Use the first available file
        audio_file = audio_files[0]
        print(f"\nUsing: {audio_file}")
    
    # Check if file exists
    if not os.path.exists(audio_file):
        print(f"❌ Audio file not found: {audio_file}")
        return
    
    # Convert audio to expressions
    success = convert_audio_to_expressions(audio_file)
    
    if success:
        print("\n✅ Conversion completed successfully!")
        print("\n💡 How to use the output:")
        print("   - JSON file: For programmatic access to viseme data")
        print("   - CSV file: For importing into animation software (Blender, Maya, etc.)")
        print("   - Each viseme weight ranges from 0.0 to 1.0")
        print("   - Apply these weights to your character's facial rig")
    else:
        print("\n❌ Conversion failed!")

if __name__ == "__main__":
    main()

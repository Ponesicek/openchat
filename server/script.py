from phonemizer import phonemize
from phonemizer.backend import EspeakBackend
import librosa
import json
import sys
import os

text="Aloy here. I don't know this world, but my arrows are sharp and my bow's ready. If your party needs help, I'll do what I can."
audio_path="E:\\AI\\openchat\\server\\voice.wav"

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
espeak_path = os.path.join(script_dir, "espeak.exe")

# Step 1: Convert text to phonemes
# Configure espeak backend to use local executable
backend = EspeakBackend(
    language='en-us',
    executable=espeak_path
)

phonemes_str = phonemize(
    text,
    language='en-us',
    backend=backend,
    strip=True,
    preserve_punctuation=False
)
phonemes = phonemes_str.split()

# Step 2: Get audio duration
y, sr = librosa.load(audio_path, sr=None)
duration = librosa.get_duration(y=y, sr=sr)

# Step 3: Distribute timings evenly
time_per_phoneme = duration / len(phonemes)
timings = []
t = 0
for p in phonemes:
    timings.append({
        "phoneme": p,
        "start": round(t, 3),
        "end": round(t + time_per_phoneme, 3)
    })
    t += time_per_phoneme

# Step 4: Save to JSON
output_path = audio_path.replace(".wav", "_phonemes.json")
with open(output_path, "w") as f:
    json.dump(timings, f, indent=2)

print(f"Phoneme timings saved to {output_path}")
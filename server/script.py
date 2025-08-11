from phonemizer import phonemize
import librosa
import json
import sys
import os

text = "Aloy here. I don't know this world, but my arrows are sharp and my bow's ready. If your party needs help, I'll do what I can."
audio_path = "E:\\AI\\openchat\\server\\voice.wav"
os.environ["PHONEMIZER_ESPEAK_LIBRARY"] = r"C:\\Program Files\\eSpeak NG\\libespeak-ng.dll"

# Step 1: Convert text to phonemes
phonemes_str = phonemize(
    text,
    language='en-us',
    backend='espeak',
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

import json

# Load your phoneme timing JSON
with open("E:\\AI\\openchat\\server\\voice_phonemes.json", "r", encoding="utf-8") as f:
    phoneme_data = json.load(f)

# IPA → VRM mapping
ipa_to_vrm = {
    "a": "A", "aː": "A", "aɪ": "A", "aʊ": "A", "æ": "A", "ɑ": "A", "ɒ": "A", "ʌ": "A",
    "i": "I", "iː": "I", "ɪ": "I", "eɪ": "I",
    "u": "U", "uː": "U", "ʊ": "U", "oʊ": "U",
    "e": "E", "ɛ": "E", "eː": "E",
    "o": "O", "ɔ": "O", "ɔː": "O"
}

# Convert to VRM viseme events
viseme_timeline = []
for entry in phoneme_data:
    ipa = entry["phoneme"]
    vrm_shape = None
    # Find the first matching vowel in the IPA string
    for ipa_vowel, shape in ipa_to_vrm.items():
        if ipa_vowel in ipa:
            vrm_shape = shape
            break
    if vrm_shape:
        viseme_timeline.append({
            "shape": vrm_shape,
            "start": entry["start"],
            "end": entry["end"]
        })

# Save VRM viseme timeline
with open("viseme_timeline.json", "w", encoding="utf-8") as f:
    json.dump(viseme_timeline, f, indent=2)

print("Saved viseme_timeline.json")
import os
import base64
import tempfile

import whisper
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import requests
import sounddevice as sd
import numpy as np

app = FastAPI()

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to ["http://localhost:3000", "http://127.0.0.1:3000"] if desired
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_model = "faster-whisper-large-v3"
if active_model == "faster-whisper-large-v3":
    model = WhisperModel("turbo", device="cuda")
elif active_model == "whisper-turbo":
    model = whisper.load_model("turbo")

@app.post("/transcribe")
def transcribe(model_name: str = Form(...), file: str = Form(...)):
    global active_model, model
    temp_file_path = None
    if model_name == active_model:
        try:
            # Decode base64 to a temporary mp3 file (Windows requires delete=False to reopen by path)
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_file.write(base64.b64decode(file))
                temp_file_path = temp_file.name
                if model_name == "faster-whisper-large-v3":
                    segments, info = model.transcribe(temp_file_path, beam_size=5, language="en")
                    for segment in segments:
                        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
                    return {"text": segment.text}
                elif model_name == "whisper-turbo":
                    result = model.transcribe(temp_file_path)
                    return {"text": result["text"]}

        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    # Best-effort cleanup; ignore if removal fails
                    pass
    else:
        print("loading new model")
        if model_name == "faster-whisper-large-v3":
            model = WhisperModel("large-v3", device="cuda", compute_type="float16")
        elif model_name == "whisper-turbo":
            model = whisper.load_model("turbo")
        active_model = model_name
        return transcribe(model_name, file)

@app.post("/speech")
def speech(text: str = Form(...)):
    voice="E:\\AI\\openchat\\server\\voice.ogg"
    prompt_text="The work of the astrologer is to show people what fate has in store for them, and that's exactly what I do."
    url = (
        "http://127.0.0.1:9880/tts"
        "?text={}"
        "&text_lang=en"
        "&ref_audio_path={}"
        "&prompt_lang=en"
        "&prompt_text={}"
        "&text_split_method=cut5"
        "&batch_size=1"
        "&media_type=wav"
        "&streaming_mode=true"
    ).format(text, voice, prompt_text)

    samplerate = 32000 
    channels = 1  # or 2 depending on your TTS output
    with requests.get(url, stream=True) as r:
        header_skipped = False
        with sd.OutputStream(samplerate=samplerate, channels=channels, dtype="int16") as stream:
            for chunk in r.iter_content(chunk_size=4096):
                if not chunk:
                    continue
                if not header_skipped:
                    # Skip WAV header (44 bytes for PCM)
                    if len(chunk) <= 44:
                        continue
                    chunk = chunk[44:]
                    header_skipped = True
                audio_array = np.frombuffer(chunk, dtype=np.int16)
                if len(audio_array) > 0:
                    stream.write(audio_array)
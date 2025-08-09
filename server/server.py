import whisper
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to ["http://localhost:3000", "http://127.0.0.1:3000"] if desired
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

turbo_model = whisper.load_model("turbo")


@app.post("/transcribe")
def transcribe(file: str = Form(...)):
    import base64
    import tempfile
    
    # Decode base64 to mp3 file
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
        audio_data = base64.b64decode(file)
        temp_file.write(audio_data)
        temp_file_path = temp_file.name
    
    # Transcribe the temporary mp3 file
    result = turbo_model.transcribe(temp_file_path)
    return {"text": result["text"]}
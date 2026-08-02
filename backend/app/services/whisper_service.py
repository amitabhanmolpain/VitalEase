from faster_whisper import WhisperModel
import os

model = None

def get_whisper_model():
    global model
    if model is None:
        # Load small model on CPU with int8 quantization for low footprint and fast inference
        print("[Whisper] Initializing Faster-Whisper Model ('small', CPU, int8)...")
        model = WhisperModel("small", device="cpu", compute_type="int8")
        print("[Whisper] Model loaded successfully.")
    return model

def transcribe_audio(audio_path: str) -> str:
    whisper_model = get_whisper_model()
    segments, info = whisper_model.transcribe(audio_path)
    return " ".join([segment.text for segment in segments])

try:
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer
    import torch
    import soundfile as sf
    print("Imports completed successfully!")
except Exception as e:
    print("Import failed:", e)

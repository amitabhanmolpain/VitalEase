try:
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer
    import torch
    import soundfile as sf
    import os

    text = "How can I help you today?"
    description = "Divya speaks in a warm, friendly Indian-accented English tone."

    print("Loading model...")
    model = ParlerTTSForConditionalGeneration.from_pretrained(
        "parler-tts/parler-tts-mini-v1"
    ).to("cuda" if torch.cuda.is_available() else "cpu")

    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained("parler-tts/parler-tts-mini-v1")
    description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

    print("Tokenizing...")
    input_ids = description_tokenizer(description, return_tensors="pt").input_ids
    prompt_ids = tokenizer(text, return_tensors="pt").input_ids

    print("Generating...")
    generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_ids)
    audio = generation.cpu().numpy().squeeze()
    
    print("Writing audio...")
    sf.write("test_out.wav", audio, model.config.sampling_rate)
    print("Done!")
except Exception as e:
    import traceback
    traceback.print_exc()

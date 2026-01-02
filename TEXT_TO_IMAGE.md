import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedream-v4.5",
    "enable_base64_output": False,
    "prompt": "Nighttime outdoor photoshoot: A young man standsinside a public phone booth, holding a blue phonereceiver to his ear. One hand is casually tucked into his pocket, and he strikes a relaxed posture. He wears a white T-shirt with a pattern, loose brown pants, and jacket draped over his arm. The booth's glass reflects city streetlights with a bokeh effect, creating a vintage film style.",
    "size": "2048*2048"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedream-v4.5/sequential",
    "enable_base64_output": False,
    "max_images": 1,
    "prompt": "Generate a sequence of 6 atmospheric city alley scenes that all take place in the same narrow street, with consistent architecture, signs, perspective and overall style.\nStyle: realistic photography with a slight cinematic film look, soft grain, subtle lens bloom, inspired by Japanese backstreets.\n\nScene 1 – Early Morning: the alley is quiet and almost empty, cool blue light, shutters half-closed, a faint mist on the ground.\nScene 2 – Late Morning: shops are open, warmer sunlight enters the alley, a few people walking and bicycles parked, brighter colors.\nScene 3 – Golden Hour: warm orange light from the low sun at the end of the alley, long shadows, vending machines glowing softly.\nScene 4 – Blue Hour: sky is deep blue, shop signs and lanterns turn on, reflections on slightly wet pavement.\n\nKeep the street layout, buildings, signs and vantage point consistent across all 6 images so they feel like different times of day in the exact same location",
    "size": "2048*2048"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/nano-banana-pro/text-to-image-ultra",
    "aspect_ratio": "example_value",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "output_format": "png",
    "prompt": "A beautiful landscape with mountains and lake",
    "resolution": "4k"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/nano-banana-pro/text-to-image",
    "aspect_ratio": "example_value",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "output_format": "png",
    "prompt": "A beautiful landscape with mountains and lake",
    "resolution": "1k"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/hunyuan-image-3",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "prompt": "A beautiful landscape with mountains and lake",
    "seed": -1,
    "size": "1024*1024"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.5/text-to-image",
    "enable_prompt_expansion": False,
    "negative_prompt": "example_value",
    "prompt": "A beautiful landscape with mountains and lake",
    "seed": -1,
    "size": "1280*1280"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedream-v4",
    "enable_base64_output": False,
    "prompt": "A beautiful landscape with mountains and lake",
    "size": "2048*2048"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "z-image/turbo-lora",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "loras": [],
    "prompt": "A dramatic cinematic movie poster with dark atmospheric lighting, central silhouette of a lone figure, smoky background, bold large title text “BEYOND THE SHADOWS”, smaller tagline “Every secret has a price”, credit block at bottom, lens flare, professional Hollywood poster style",
    "seed": -1,
    "size": "1024*1024"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "z-image/turbo",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "prompt": "Wong Kar-wai film style, a lonely man smoking a cigarette in a narrow Hong Kong hallway, 1990s. Greenish fluorescent lighting, heavy shadows, moody atmosphere. Slight motion blur to create a dreamlike quality. Film grain, vignetting, emotional, cinematic composition, dutch angle shot.",
    "seed": -1,
    "size": "1024*1024"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedream-v4/sequential",
    "enable_base64_output": False,
    "max_images": 4,
    "prompt": "Generate a set of 4 consecutive illustrations, detailing the life cycle of a butterfly, from a tiny egg on a leaf, to a caterpillar, then to a chrysalis, and finally to a beautiful butterfly.",
    "size": "2048*2048"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/nano-banana-pro/text-to-image-developer",
    "aspect_ratio": "3:4",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "output_format": "png",
    "prompt": "Create a vibrant and modern magazine cover for Women’s Health, themed for April 2025. The main background is a warm, orange gradient with soft shadows, evoking a fresh spring mood. Centered is a stylish young woman sitting confidently on color-blocked orange cubes. She has long, voluminous, wavy blonde hair and a natural, glowing complexion. She’s dressed in a forest green zip-up windbreaker jacket with loose sleeves and an orange top underneath, paired with white athletic crew socks branded ‘SAMOLA’ and retro-style white sneakers with thick black stripes and tan soles. One leg is propped up, creating a confident, athletic pose. Her expression is calm and poised. Include magazine headlines in stylish fonts, balancing black, white, and lime green text, placed thoughtfully around the subject: • Top left: ‘Covid: five years on’ in pale lime green with subtext in black: ‘Has the pandemic reshaped your identity?’ • Top right: ‘Spring forward’ in bold black with subtext: ‘How to eat, travel and sweat for your healthiest season yet’ • Center right: ‘15 skincare habits beauty founders swear by’ with large lime green ‘15’ • Bottom left: ‘FAKE VIEWS: Inside the scroll holes telling women how to “fix” themselves’ in black and pale pink • Bottom left corner with a green plus sign: ‘The workout that experts are calling a magic pill’ • Bottom right over the box: ‘Em the nutritionist’ in elegant white serif font, with yellow subheading: ‘In the kitchen with wellness’s favourite foodie’ Design should reflect an empowering, clean, editorial style, with an emphasis on health, wellness, and bold femininity. Lighting should be studio-bright, shadows soft and controlled.",
    "resolution": "2k"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/nano-banana/text-to-image-developer",
    "aspect_ratio": "example_value",
    "prompt": "A little girl blowing soap bubbles in a backyard, sunlight making rainbow colors in the bubbles, candid photography style.",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "output_format": "png"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()
import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/nano-banana/text-to-image",
    "aspect_ratio": "example_value",
    "prompt": "A little girl blowing soap bubbles in a backyard, sunlight making rainbow colors in the bubbles, candid photography style.",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "output_format": "png"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.6/text-to-image",
    "enable_prompt_expansion": False,
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "negative_prompt": "example_value",
    "prompt": "A cinematic portrait of a woman standing under neon signs in a rainy night street, raindrops shimmering, reflective puddles, vivid colors, hyper realistic, 8K detail, photography style.",
    "seed": 0,
    "size": "1280*1280"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/gemini-2.5-flash-image/text-to-image-developer",
    "aspect_ratio": "2:3",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "output_format": "png",
    "prompt": "Miniature Chocolate Brand Fun "
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()
import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/gemini-2.5-flash-image/text-to-image",
    "aspect_ratio": "16:9",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "output_format": "png",
    "prompt": "A wolf wearing a fluffy sheep's wool coat stands confidently among a flock of sheep, its sharp eyes peeking out from the hood, with the soft fleece blending into the background of a foggy pasture."
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedream-v3.1",
    "seed": 1519608423,
    "size": "1024*1024",
    "prompt": "A smiling young woman in a sunlit field, wearing a flowing yellow dress, realistic lighting, bright colors, ultra-detailed face, high-resolution, photo-realistic",
    "enable_sync_mode": False,
    "enable_base64_output": False,
    "enable_prompt_expansion": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/neta-lumina",
    "seed": -1,
    "size": "1024*1024",
    "prompt": "",
    "output_format": "jpeg",
    "enable_sync_mode": False,
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "recraft-ai/recraft-20b-svg",
    "style": "vector_illustration",
    "prompt": "A serene landscape with mountains reflected in a crystal clear lake at sunset",
    "aspect_ratio": "1:1",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "recraft-ai/recraft-20b",
    "style": "realistic_image/b_and_w",
    "prompt": "A serene landscape with mountains reflected in a crystal clear lake at sunset",
    "aspect_ratio": "1:1",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "recraft-ai/recraft-v3-svg",
    "style": "example_value",
    "prompt": "A serene landscape with mountains reflected in a crystal clear lake at sunset",
    "aspect_ratio": "1:1",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "ideogram-ai/ideogram-v2a-turbo",
    "image": "example_value",
    "style": "Auto",
    "prompt": "A stylish model, fashion show, showcase a designer outfit, orange colour suit, conspicuous jewelry, fashion show background, vibrant color, dramatic makeup",
    "mask_image": "example_value",
    "aspect_ratio": "1:1",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "ideogram-ai/ideogram-v2",
    "image": "example_value",
    "style": "Auto",
    "prompt": "A stylish model, fashion show, showcase a designer outfit, orange colour suit, conspicuous jewelry, fashion show background, vibrant color, dramatic makeup",
    "mask_image": "example_value",
    "aspect_ratio": "1:1",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "ideogram-ai/ideogram-v2-turbo",
    "image": "example_value",
    "style": "Auto",
    "prompt": "A stylish model, fashion show, showcase a designer outfit, orange colour suit, conspicuous jewelry, fashion show background, vibrant color, dramatic makeup",
    "mask_image": "example_value",
    "aspect_ratio": "1:1",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "luma/photon-flash",
    "prompt": "Teen girl journaling in bed by phone flashlight, stuffed animals around her, stickers on the wall, cozy and introspective vibe",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "luma/photon",
    "prompt": "Young man sketching in a notebook under a streetlight at night, quiet alley, distant voices and city hum",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/imagen3",
    "seed": 1,
    "prompt": "A serene landscape with mountains reflected in a crystal clear lake at sunset",
    "num_images": 1,
    "aspect_ratio": "1:1",
    "negative_prompt": "",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "ideogram-ai/ideogram-v3-balanced",
    "image": "example_value",
    "style": "Auto",
    "prompt": "A stylish model, fashion show, showcase a designer outfit, orange colour suit, conspicuous jewelry, fashion show background, vibrant color, dramatic makeup",
    "mask_image": "example_value",
    "aspect_ratio": "1:1",
    "reference_images": [],
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()
import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/imagen3-fast",
    "seed": 1,
    "prompt": "A serene landscape with mountains reflected in a crystal clear lake at sunset",
    "num_images": 1,
    "aspect_ratio": "1:1",
    "negative_prompt": "",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()
import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.1/text-to-image-lora",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "loras": [],
    "prompt": "",
    "strength": 0.6,
    "output_format": "jpeg",
    "enable_sync_mode": False,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()
import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-krea-dev-lora",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "loras": [],
    "prompt": "",
    "strength": 0.8,
    "output_format": "jpeg",
    "guidance_scale": 3.5,
    "enable_sync_mode": False,
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-krea-dev-lora",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "loras": [],
    "prompt": "",
    "strength": 0.8,
    "output_format": "jpeg",
    "guidance_scale": 3.5,
    "enable_sync_mode": False,
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/imagen4",
    "seed": 1,
    "prompt": "Capture an intimate close-up bathed in warm, soft, late-afternoon sunlight filtering into a quintessential 1960s kitchen. The focal point is a charmingly designed vintage package of all-purpose flour, resting invitingly on a speckled Formica countertop. The packaging itself evokes pure nostalgia: perhaps thick, slightly textured paper in a warm cream tone, adorned with simple, bold typography (a friendly serif or script) in classic red and blue “ALL-PURPOSE FLOUR”, featuring a delightful illustration like a stylized sheaf of wheat or a cheerful baker character. In smaller bold print at the bottom of the package: “NET WT 5 LBS (80 OZ) 2.27kg”. Focus sharply on the package details – the slightly soft edges of the paper bag, the texture of the vintage printing, the inviting \"All-Purpose Flour\" text. Subtle hints of the 1960s kitchen frame the shot – the chrome edge of the counter gleaming softly, a blurred glimpse of a pastel yellow ceramic tile backsplash, or the corner of a vintage metal canister set just out of focus. The shallow depth of field keeps attention locked on the beautifully designed package, creating an aesthetic rich in warmth, authenticity, and nostalgic appeal.",
    "num_images": 1,
    "aspect_ratio": "1:1",
    "negative_prompt": ""
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/qwen-image/text-to-image",
    "seed": -1,
    "size": "1024*1024",
    "prompt": "",
    "output_format": "jpeg",
    "enable_sync_mode": False,
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-1.1-pro",
    "seed": 1,
    "prompt": "A colossal retro-futuristic flying machine hovering above a lush mountain valley, massive green industrial metal structure with exposed pipes, rivets, antennas and glowing orange lights, brutalist sci-fi architecture fused with dieselpunk aesthetics. A lone human explorer standing on a rocky path in the foreground, emphasizing scale and grandeur. Cinematic lighting, soft volumetric clouds, epic sense of scale, ultra-detailed environment, atmospheric perspective, dramatic clouds, concept art quality, realistic materials, painterly realism, high-end sci-fi illustration, sharp focus, ultra high resolution, 16:9 aspect ratio",
    "aspect_ratio": "16:9",
    "output_format": "jpg",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-1.1-pro-ultra",
    "raw": False,
    "seed": 1,
    "prompt": "A grand steampunk airship soaring through the sky, with intricate brass and copper details, large propellers spinning, and a massive balloon filled with hot air. The airship is adorned with Victorian-style architecture, featuring ornate railings and decorative elements. The sky is a brilliant blue with fluffy white clouds, and the airship casts a shadow on the landscape below. The scene conveys a sense of adventure and exploration",
    "aspect_ratio": "1:1",
    "output_format": "jpg",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "recraft-ai/recraft-v3",
    "style": "example_value",
    "prompt": "A serene landscape with mountains reflected in a crystal clear lake at sunset",
    "aspect_ratio": "1:1",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "ideogram-ai/ideogram-v3-turbo",
    "image": "example_value",
    "style": "Auto",
    "prompt": "A stylish model, fashion show, showcase a designer outfit, orange colour suit, conspicuous jewelry, fashion show background, vibrant color, dramatic makeup",
    "mask_image": "example_value",
    "aspect_ratio": "1:1",
    "reference_images": [],
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/imagen4-fast",
    "seed": 1,
    "prompt": "A  ant lifts a tiny barbell in a miniature gym, showing off its impressive strength against the backdrop of small dumbbells and workout equipment.",
    "num_images": 1,
    "aspect_ratio": "16:9",
    "negative_prompt": "",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-dev",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "prompt": "A stylish model, fashion show, showcase a designer outfit, orange colour suit, conspicuous jewelry, fashion show background, vibrant color, dramatic makeup",
    "strength": 0.8,
    "mask_image": "example_value",
    "num_images": 1,
    "guidance_scale": 3.5,
    "num_inference_steps": 28,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-dev-ultra-fast",
    "seed": -1,
    "size": "1024*1024",
    "image": "example_value",
    "prompt": "A young, attractive Indian couple standing side by side at their traditional wedding ceremony, both facing the camera with warm smiles. The bride wears a red and gold lehenga with intricate embroidery, heavy jewelry, and a maang tikka; the groom in an ivory sherwani with a red stole and turban. Background: lavish wedding decor with marigold flowers and fairy lights. Rich colors, sharp focus, photorealistic, cinematic lighting, full-body portrait, authentic Indian wedding atmosphere.",
    "strength": 0.8,
    "mask_image": "example_value",
    "num_images": 1,
    "guidance_scale": 3.5,
    "num_inference_steps": 28,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-dev-lora",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "loras": [
        {
            "path": "strangerzonehf/Flux-Super-Realism-LoRA",
            "scale": 1
        }
    ],
    "prompt": "A quiet residential street covered in fresh snow at dusk, Japanese suburban neighborhood with small houses, warm light glowing from windows, snow piled along the road, wet asphalt reflecting soft sky colors. A black cat sitting in the foreground, looking down the street. Overhead power lines and street lamps framing the scene, birds flying across a pale blue winter sky. Calm, peaceful atmosphere, cinematic composition, soft natural lighting, ultra-detailed environment, painterly realism, high-quality illustration, depth and perspective",
    "strength": 0.8,
    "mask_image": "example_value",
    "num_images": 1,
    "guidance_scale": 3.5
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-dev-lora-ultra-fast",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "loras": [
        {
            "path": "strangerzonehf/Flux-Super-Realism-LoRA",
            "scale": 1
        }
    ],
    "prompt": "Super Realism, High-resolution photograph, woman, UHD, photorealistic, shot on a Sony A7III --chaos 20 --ar 1:2 --style raw --stylize 250",
    "strength": 0.8,
    "mask_image": "example_value",
    "num_images": 1,
    "guidance_scale": 3.5,
    "num_inference_steps": 28,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "ideogram-ai/ideogram-v3-quality",
    "image": "example_value",
    "style": "Auto",
    "prompt": "A stylish model, fashion show, showcase a designer outfit, orange colour suit, conspicuous jewelry, fashion show background, vibrant color, dramatic makeup",
    "mask_image": "example_value",
    "aspect_ratio": "1:1",
    "reference_images": [],
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/imagen4-ultra",
    "seed": 1,
    "prompt": "A serene landscape with mountains reflected in a crystal clear lake at sunset",
    "aspect_ratio": "1:1",
    "negative_prompt": "",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/imagen4",
    "seed": 1,
    "prompt": "A startled cat, holding a large fish, runs through a busy market as an angry vendor chases after it.",
    "num_images": 1,
    "aspect_ratio": "16:9",
    "negative_prompt": "",
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/hidream-i1-full",
    "seed": -1,
    "size": "1024*1024",
    "prompt": "photograph of an alternative female with an orange bandana, light brown long hair, clear frame glasses, septum piecing, beige overalls hanging off one shoulder, a white tube top underneath, she is sitting in her apartment on a bohemian rug, in the style of a vogue magazine shoot. She holds a sign saying \"HiDream on atlascloud.ai\"",
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-kontext-max/text-to-image",
    "seed": 1,
    "prompt": "A bustling cyberpunk cityscape at night, with neon lights reflecting off skyscrapers, flying cars zipping through the air, and holographic advertisements illuminating the streets. The scene is filled with diverse futuristic architecture, blending sleek metal and glass with glowing neon elements. The atmosphere is vibrant and chaotic, with a slight haze adding depth to the scene",
    "num_images": 1,
    "aspect_ratio": "1:1",
    "guidance_scale": 3.5,
    "safety_tolerance": "2"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-kontext-pro/text-to-image",
    "seed": 1,
    "prompt": "A grand steampunk airship soaring through the sky, with intricate brass and copper details, large propellers spinning, and a massive balloon filled with hot air. The airship is adorned with Victorian-style architecture, featuring ornate railings and decorative elements. The sky is a brilliant blue with fluffy white clouds, and the airship casts a shadow on the landscape below. The scene conveys a sense of adventure and exploration",
    "num_images": 1,
    "aspect_ratio": "1:1",
    "guidance_scale": 3.5,
    "safety_tolerance": "2"
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/hidream-i1-dev",
    "seed": -1,
    "size": "1024*1024",
    "prompt": "A Ghibli-inspired scene featuring a giant, friendly creature walking through a lush forest and holding a sign saying \"HiDream on atlascloud.ai\", with vibrant colors, soft lighting, and whimsical details like floating lights and colorful, magical creatures. The scene captures a peaceful, enchanted atmosphere",
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()


import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-schnell-lora",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "loras": [
        {
            "path": "strangerzonehf/Flux-Super-Realism-LoRA",
            "scale": 1
        }
    ],
    "prompt": "Super realism, ultra-realistic, a stylish woman sitting by a window, reading a book, sunlight streaming in, bright soft lighting, cozy modern interior, subtle skin texture, natural smile, casual elegance, lifestyle photography, crisp details, 85mm lens",
    "strength": 0.8,
    "mask_image": "example_value",
    "num_images": 1,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.1/text-to-image",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "prompt": "",
    "strength": 0.8,
    "output_format": "jpeg",
    "enable_sync_mode": False,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-schnell",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "prompt": "A young Chinese woman wearing an elegant traditional Hanfu, standing in an ancient Chinese street. She has delicate facial features, fair skin, soft smile, and expressive eyes. Her hair is styled in a classical updo adorned with intricate golden hairpins and red ornaments. She wears a rich red embroidered Hanfu with phoenix and floral patterns, flowing sleeves, and layered fabrics. Warm backlighting creates a soft halo around her hair, cinematic depth of field. The background shows old-style Chinese buildings, lanterns, and people walking softly blurred. Ultra-realistic photography, natural skin texture, shallow depth of field, soft daylight, high detail, cultural atmosphere, cinematic portrait.",
    "strength": 0.8,
    "mask_image": "example_value",
    "num_images": 1,
    "enable_sync_mode": False,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "black-forest-labs/flux-schnell",
    "seed": -1,
    "size": "1024*1024",
    "image": "",
    "prompt": "A young Chinese woman wearing an elegant traditional Hanfu, standing in an ancient Chinese street. She has delicate facial features, fair skin, soft smile, and expressive eyes. Her hair is styled in a classical updo adorned with intricate golden hairpins and red ornaments. She wears a rich red embroidered Hanfu with phoenix and floral patterns, flowing sleeves, and layered fabrics. Warm backlighting creates a soft halo around her hair, cinematic depth of field. The background shows old-style Chinese buildings, lanterns, and people walking softly blurred. Ultra-realistic photography, natural skin texture, shallow depth of field, soft daylight, high detail, cultural atmosphere, cinematic portrait.",
    "strength": 0.8,
    "mask_image": "example_value",
    "num_images": 1,
    "enable_sync_mode": False,
    "enable_base64_output": False,
    "enable_safety_checker": True
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedream-v3",
    "seed": 1357097597,
    "size": "1280*720",
    "prompt": "A girl lying in a field of dandelions, wind gently blowing her hair, golden hour sunlight, dreamlike slow motion, soft focus",
    "guidance_scale": 2.5,
    "enable_sync_mode": False,
    "enable_base64_output": False
}

generate_response = requests.post(generate_url, headers=headers, json=data)
generate_result = generate_response.json()
prediction_id = generate_result["data"]["id"]

# Step 2: Poll for result
poll_url = f"https://api.atlascloud.ai/api/v1/model/prediction/{prediction_id}"

def check_status():
    while True:
        response = requests.get(poll_url, headers={"Authorization": "Bearer $ATLASCLOUD_API_KEY"})
        result = response.json()

        if result["data"]["status"] == "completed":
            print("Generated image:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

image_url = check_status()

import requests
import time

# Step 1: Start image generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateImage"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.6/image-edit",
    "enable_prompt_expansion": False,
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "images": [
        "https://static.atlascloud.ai/media/images/34e49c00-cd78-460e-be5e-67d4ece4bdba.png"
    ],
    "prompt": "Add an old man wearing a straw raincoat to the path in the image, ensuring the style is consistent with the original image.",
    "negative_prompt": "example_value",
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
    "model": "bytedance/seedream-v4.5/edit",
    "enable_base64_output": False,
    "images": [],
    "prompt": "dit this image into a clean, minimal exhibition poster without any meaningless filler text.\nKeep the desert landscape, the two standing figures, the mirrors, and the glowing neon circle in the center, preserving the overall composition and realistic photographic style.\nSimplify the typography: keep only the main title ‘DESERT REFLECTIONS’ at the top in bold white sans-serif, and one short subtitle under it: ‘New Media Installations by Studio Meridian’.\nRemove all other small blocks of text from the sky area so the design feels spacious and minimal.\nSlightly enhance the sky with a soft gradient from pale blue to turquoise and add a subtle hint of tiny stars for a dreamy atmosphere, with gentle grain and high-end art poster look, no extra logos or text.",
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
    "model": "bytedance/seedream-v4.5/edit-sequential",
    "enable_base64_output": False,
    "images": [],
    "max_images": 1,
    "prompt": "Create a sequence of 2 images in a soft comic style using the provided portrait as the main character reference.\n\nMaintain the same girl’s face, expression range, eye color and hair style in both images. Her age and appearance must remain natural and unchanged.\nOverall style: gentle shōjo manga / watercolor comic, pastel colors, soft outlines, subtle film grain, dreamy and calm mood.\n\nImage 1: Close-up half-body shot of the girl standing in the same meadow at golden hour, inspired by the reference. She looks slightly to the side, a light breeze moving a few strands of her hair, soft sunlight and blurred wildflowers behind her.\n\nImage 2: Wider shot in the same meadow and lighting. The girl is now standing a bit farther from the camera, holding a small bouquet of wildflowers in front of her, with more of the field and sky visible. Her expression is gently smiling and hopeful. The background and color palette should clearly match Image 1 so they feel like two consecutive moments from the same short comic, with no text or speech bubbles.",
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
    "model": "alibaba/wan-2.5/image-edit",
    "images": [],
    "prompt": "A beautiful landscape with mountains and lake",
    "negative_prompt": "example_value",
    "seed": -1,
    "size": "1280*1280",
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
    "model": "google/nano-banana-pro/edit",
    "aspect_ratio": "example_value",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "images": [
        "https://static.atlascloud.ai/media/images/1764554306856384747_xLJRPNLJ.png"
    ],
    "output_format": "png",
    "prompt": "Live action movie still, Japanese youth film style. A beautiful young woman in a collegiate outfit running through a campus gate, laughing. Dynamic motion, hair flying. Surrounded by falling pink cherry blossom petals. Soft sunlight, airy atmosphere, shallow depth of field, bokeh background of other students, Fujifilm color tone, realistic, sharp focus on eyes.",
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
    "model": "google/nano-banana-pro/edit-ultra",
    "aspect_ratio": "example_value",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "images": [
        "https://static.atlascloud.ai/media/images/1763663642170358426_rcwQxM5q.jpeg"
    ],
    "output_format": "png",
    "prompt": "Translate the anime subject into cinematic photorealism.  Natural skin texture, accurate facial anatomy, grounded proportions. High-dynamic-range lighting, shallow depth of field, filmic contrast. 35mm lens perspective, subtle grain, live-action production design, True-to-life color grading. Frame as a live-action movie still.",
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
    "model": "black-forest-labs/flux-2-dev/edit",
    "enable_base64_output": False,
    "images": [],
    "prompt": "Transform this neon sign image into a cinematic title card while keeping the original text and composition. \nEnhance the lighting with dramatic film-noir contrast, soft neon bloom, and deeper shadows in the surrounding environment. \nIncrease the wet ground reflection, making it glossier and more cinematic with stronger color diffusion. \nAdd subtle atmospheric elements such as light fog, faint rain particles, and a richer nighttime palette with deep blues and magentas. \nOverall style: cinematic movie opening title, moody film lighting, atmospheric neon glow, high-end visual storytelling.\n",
    "seed": -1,
    "size": "example_value"
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
    "model": "black-forest-labs/flux-2-pro/edit",
    "enable_base64_output": False,
    "images": [],
    "prompt": "Transform this portrait into a high-end fashion editorial style while keeping the subject’s facial features and natural expression unchanged. \nEnhance the lighting with refined directional highlights and deeper soft shadows to create a dramatic, elegant magazine look. \nApply subtle skin refinement without losing natural texture, improving clarity and tonal depth. \nShift the color grading toward warm neutral tones with a hint of cinematic contrast, adding a polished professional finish. \nOverall style: Vogue-level editorial portrait, premium natural beauty, sophisticated light shaping, high-fashion atmosphere.\n",
    "seed": -1,
    "size": "example_value"
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
    "model": "black-forest-labs/flux-2-flex/edit",
    "enable_base64_output": False,
    "images": [],
    "prompt": "Transform this image into a divine surreal Renaissance-inspired scene while keeping the original statue and museum structure unchanged. \nEnhance the lighting with warm celestial rays, soft volumetric beams, and floating dust particles for a sacred atmosphere. \nIntroduce subtle ethereal glow around the marble surface, enriching texture without altering the sculpture’s form. \nDeepen shadows and add gentle atmospheric haze to create a timeless, mystical mood. \nOverall style: divine surrealism, sacred Renaissance ambience, warm dramatic light, ethereal museum atmosphere.\n",
    "seed": -1,
    "size": "example_value"
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
    "model": "black-forest-labs/flux-2-flex/text-to-image",
    "enable_base64_output": False,
    "prompt": "A vintage 1860s sepia-toned daguerreotype photograph. It depicts a serious Abraham Lincoln sitting in a formal chair, wearing his traditional suit and top hat, but he is wearing large, colorful, modern DJ headphones around his neck and holding a shiny silver microphone. The photo has scratches, dust particles, and heavy vignette typical of the 19th century, but the modern equipment looks physically present in the scene, not just pasted on.",
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
    "model": "bytedance/seededit-v3",
    "seed": 745712601,
    "image": "https://static.atlascloud.ai/media/images/1752702982965634620_R0lzwsol.jpeg",
    "prompt": "\"A bright yellow cartoon school bus arriving at a jungle bus stop. The bear and the monkey in matching school uniforms (navy blazer, white shirt, gray shorts, caps with 'B' and 'M') prepare to board. The monkey looks confident, the bear looks clumsy. Background with jungle trees and vines.\"\n\n",
    "guidance_scale": 0.5,
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
    "model": "black-forest-labs/flux-kontext-max",
    "seed": 1,
    "image": "https://static.atlascloud.ai/media/images/1750499863413941379_I6hX6gpy.jpg",
    "prompt": "To ghibli style",
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
    "model": "black-forest-labs/flux-kontext-max/multi",
    "images": [
        "https://static.atlascloud.ai/media/images/1750592630644621512_wxGCzvqn.png",
        "https://static.atlascloud.ai/media/images/1750651475543258372_mxurokgd.png",
        "https://static.atlascloud.ai/media/images/1750651331146489846_GS62YUQM.jpg"
    ],
    "prompt": "A woman wears the dress and the hat, near the sea",
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
    "model": "black-forest-labs/flux-kontext-pro",
    "image": "https://static.atlascloud.ai/media/images/1750499863413941379_I6hX6gpy.jpg",
    "prompt": "A man eating noddles",
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
    "model": "black-forest-labs/flux-kontext-pro/multi",
    "seed": 1,
    "images": [
        "https://static.atlascloud.ai/media/images/1749344321541574643_0YXUQNJF.png",
        "https://static.atlascloud.ai/media/images/1749344293284235298_OxTiqvHP.png",
        "https://static.atlascloud.ai/media/images/1749344248896918675_xmlhd9uu.png"
    ],
    "prompt": "A woman wears the dress and holds a bag, in the flowers.",
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
    "model": "black-forest-labs/flux-kontext-dev/multi-ultra-fast",
    "seed": -1,
    "size": "example_value",
    "images": [
        "https://static.atlascloud.ai/media/images/1750592630644621512_wxGCzvqn.png",
        "https://static.atlascloud.ai/media/images/1750651475543258372_mxurokgd.png",
        "https://static.atlascloud.ai/media/images/1750651331146489846_GS62YUQM.jpg"
    ],
    "prompt": "A woman wears the dress and the hat, near the sea",
    "num_images": 1,
    "guidance_scale": 2.5,
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
    "model": "black-forest-labs/flux-kontext-dev-lora",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "guidance_scale": 2.5,
    "image": "https://static.atlascloud.ai/media/images/7445c155b6aacdde57ec699797a22b50.jpeg",
    "loras": [],
    "num_images": 1,
    "num_inference_steps": 28,
    "output_format": "jpeg",
    "prompt": "Restore this old photograph with high fidelity and realism. Remove scratches, dust, stains, creases, and noise while preserving the original facial features, expressions, and historical authenticity. Improve clarity, sharpness, and contrast gently without over-smoothing. Correct faded tones and restore natural skin color while maintaining the original lighting and atmosphere. Do not alter clothing, pose, or background. Keep the photo realistic, natural, and True to the original era.Subtle and historically accurate colorization, realistic skin tones, natural fabric colors, no oversaturation, no modern color palette.",
    "seed": -1,
    "size": "example_value"
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
    "model": "black-forest-labs/flux-kontext-dev-lora-ultra-fast",
    "seed": -1,
    "size": "example_value",
    "image": "https://static.atlascloud.ai/media/images/1750946150521827253_czYURNKG.jpg",
    "loras": [],
    "prompt": "A restored and colorized vintage black-and-white photograph, removing scratches, dust, and tears. The image features enhanced clarity, natural skin tones, and realistic colors while preserving the original nostalgic atmosphere. The photo looks vivid and fresh, with balanced lighting and rich detail, as if carefully brought back to life from the past.",
    "num_images": 1,
    "guidance_scale": 2.5,
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
    "model": "black-forest-labs/flux-kontext-dev/multi",
    "seed": -1,
    "size": "example_value",
    "images": [
        "https://static.atlascloud.ai/media/images/1750946221123208007_M1YURNLH.png",
        "https://static.atlascloud.ai/media/images/1750946250550516343_7mSOLHEA.webp",
        "https://static.atlascloud.ai/media/images/1750946240650738815_zAOLGDzv.jpg"
    ],
    "prompt": "A man standing by the ocean, wearing a crisp white shirt with sleeves casually rolled up. He’s holding a fresh coconut in one hand and gazing toward the horizon. The beach is sunlit and peaceful, with soft waves, golden sand, and a gentle breeze ruffling his shirt. Relaxed and summery mood.",
    "num_images": 1,
    "guidance_scale": 2.5,
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
    "model": "black-forest-labs/flux-kontext-dev-ultra-fast",
    "seed": -1,
    "size": "example_value",
    "image": "https://static.atlascloud.ai/media/images/1750941148466319080_zQWSOLIE.jpg",
    "prompt": "Replace 'KONTEXT' on the juice pouch, keeping the same bubbly font style,gradient colors, soft shadow, and exact position.",
    "num_images": 1,
    "guidance_scale": 2.5,
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
    "model": "black-forest-labs/flux-kontext-dev",
    "seed": -1,
    "size": "example_value",
    "image": "https://static.atlascloud.ai/media/images/1750940187685254815_W4yPaBQU.jpg",
    "prompt": "Change the car color to red.",
    "num_images": 1,
    "guidance_scale": 2.5,
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
    "model": "bytedance/portrait",
    "seed": -1,
    "image": "https://static.atlascloud.ai/media/images/1751365236608960947_3e830WTP.jpeg",
    "prompt": "An extremely mundane iphone selfie with no clear subject or sense of composition, the image is a somewhat poorly held motion blur, and the Luffy cosplayer who is cosplaying with a straw hat",
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
    "model": "luma/photon-modify",
    "image": "https://static.atlascloud.ai/media/images/1752747680320847853_mwP31WUR.jpeg",
    "prompt": "Turn her hair blonde.",
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
    "model": "luma/photon-flash-modify",
    "image": "https://static.atlascloud.ai/media/images/1752748297743237599_Furomjfb.jpeg",
    "prompt": "Put some sunglasses on him.",
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
    "model": "luma/photon-flash-modify",
    "image": "https://static.atlascloud.ai/media/images/1752748297743237599_Furomjfb.jpeg",
    "prompt": "Put some sunglasses on him.",
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
    "model": "atlascloud/ghibli",
    "image": "https://static.atlascloud.ai/media/images/1744801810716060625_FQVSNKGD.jpg",
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
    "model": "atlascloud/real-esrgan",
    "image": "https://static.atlascloud.ai/media/images/1744206178039419379_bDY951YU.png",
    "scale": 4,
    "face_enhance": False
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
    "model": "atlascloud/instant-character",
    "seed": 1,
    "size": "1024*1024",
    "image": "https://static.atlascloud.ai/media/images/1745853771145444122_WW40XTQM.jpg",
    "prompt": "A futuristic android girl with glowing blue eyes, wearing green suit, standing next to a holographic sign displaying \"I Love AtlasCloud\", neon-lit cyberpunk city background, sleek and high-tech vibe, Sci-fi movie style"
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
    "model": "google/nano-banana-pro/edit-ultra",
    "aspect_ratio": "example_value",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "images": [
        "https://static.atlascloud.ai/media/images/1763663642170358426_rcwQxM5q.jpeg"
    ],
    "output_format": "png",
    "prompt": "Translate the anime subject into cinematic photorealism.  Natural skin texture, accurate facial anatomy, grounded proportions. High-dynamic-range lighting, shallow depth of field, filmic contrast. 35mm lens perspective, subtle grain, live-action production design, True-to-life color grading. Frame as a live-action movie still.",
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
    "model": "atlascloud/qwen-image/edit",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "image": "https://static.atlascloud.ai/media/images/1756289999957910982_RbEAwtqn.jpeg",
    "output_format": "jpeg",
    "prompt": "Remove freckles from a woman's face.",
    "seed": 773706377
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
    "model": "atlascloud/qwen-image/edit-plus",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "images": [],
    "output_format": "jpeg",
    "prompt": "change the cloth to blue and make the hair to brown",
    "seed": 1589337687,
    "size": "example_value"
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
    "model": "bytedance/seedream-v4/edit",
    "enable_base64_output": False,
    "images": [
        "https://static.atlascloud.ai/media/images/1757414803256445130_67hywrpl.png"
    ],
    "prompt": "Turn this photo into a clay-style image. Place it in a Polaroid photo.",
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
    "model": "bytedance/seedream-v4/edit-sequential",
    "enable_base64_output": False,
    "images": [
        "https://static.atlascloud.ai/media/images/1757418174503178510_Ybqmkfd8.png"
    ],
    "max_images": 3,
    "prompt": "Based on this character, generate 3 images depicting this girl's life in a cyberpunk-style city.",
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
    "model": "google/nano-banana/edit-developer",
    "aspect_ratio": "example_value",
    "images": [
        "https://static.atlascloud.ai/media/images/1756225737101577458_sDJ73ZVR.jpeg"
    ],
    "prompt": "Transform into Disney animation style",
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
    "model": "google/nano-banana-pro/edit-developer",
    "aspect_ratio": "example_value",
    "enable_base64_output": False,
    "enable_sync_mode": False,
    "images": [
        "https://static.atlascloud.ai/media/images/1764554306856384747_xLJRPNLJ.png"
    ],
    "output_format": "png",
    "prompt": "Live action movie still, Japanese youth film style. A beautiful young woman in a collegiate outfit running through a campus gate, laughing. Dynamic motion, hair flying. Surrounded by falling pink cherry blossom petals. Soft sunlight, airy atmosphere, shallow depth of field, bokeh background of other students, Fujifilm color tone, realistic, sharp focus on eyes.",
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
    "model": "google/nano-banana/edit",
    "aspect_ratio": "example_value",
    "images": [
        "https://static.atlascloud.ai/media/images/1756225737101577458_sDJ73ZVR.jpeg"
    ],
    "prompt": "Transform into Disney animation style",
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
    "model": "black-forest-labs/flux-redux-dev",
    "seed": 0,
    "size": "1024*1024",
    "image": "https://static.atlascloud.ai/media/images/1747759609242653889_0W52YVRN.jpg",
    "num_images": 1,
    "output_format": "jpeg",
    "guidance_scale": 3.5,
    "enable_sync_mode": False,
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
    "model": "recraft-ai/recraft-crisp-upscale",
    "image": "https://static.atlascloud.ai/media/images/1753423963399564767_zQYURNIF.jpeg",
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
    "model": "image-effects/micro-landscape-mini-world",
    "image": "https://static.atlascloud.ai/media/images/1751875369439538133_zAQNMKJI.jpeg",
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
    "model": "image-effects/my-world",
    "image": "https://static.atlascloud.ai/media/images/1751879444703946225_5qEByuqm.jpeg",
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
    "model": "image-effects/plastic-bubble-figure",
    "image": "https://static.atlascloud.ai/media/images/1751870583583940440_MLQOKIEA.jpeg",
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
    "model": "image-effects/glass-ball",
    "image": "https://static.atlascloud.ai/media/images/1751871750942348421_oLoqzXnC.jpeg",
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
    "model": "image-effects/felt-keychain",
    "image": "https://static.atlascloud.ai/media/images/1751874272863324078_ewROLHEA.jpeg",
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
    "model": "image-effects/felt-3d-polaroid",
    "image": "https://static.atlascloud.ai/media/images/1751870028517159328_K3oporxH.jpeg",
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
    "model": "atlascloud/step1x-edit",
    "seed": 1,
    "image": "https://static.atlascloud.ai/media/images/1748334637981075510_pdqmjea7.jpeg",
    "prompt": "change outfit",
    "guidance_scale": 4,
    "negative_prompt": "",
    "num_inference_steps": 30,
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
    "model": "image-effects/advanced-photography",
    "image": "https://static.atlascloud.ai/media/images/upload_bada876d0cb71c5598a6e0885f14c83c.png",
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
    "model": "image-effects/american-comic-style",
    "image": "https://static.atlascloud.ai/media/images/upload_bada876d0cb71c5598a6e0885f14c83c.png",
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
    "model": "recraft-ai/recraft-creative-upscale",
    "image": "https://static.atlascloud.ai/media/images/1753424356591336839_okMHDAws.jpg",
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
    "model": "atlascloud/image-zoom-out",
    "size": "example_value",
    "image": "example_value",
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
    "model": "atlascloud/image-watermark-remover",
    "image": "example_value",
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
    "model": "black-forest-labs/flux-controlnet-union-pro-2.0",
    "seed": 0,
    "size": "1024*1024",
    "loras": [],
    "prompt": "A robot is giving a speech.",
    "num_images": 1,
    "control_image": "https://static.atlascloud.ai/media/images/1753966328189680819_5Za842YV.png",
    "output_format": "jpeg",
    "guidance_scale": 3.5,
    "enable_sync_mode": False,
    "num_inference_steps": 28,
    "control_guidance_end": 0.8,
    "enable_base64_output": False,
    "enable_safety_checker": True,
    "control_guidance_start": 0,
    "controlnet_conditioning_scale": 0.7
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
    "model": "black-forest-labs/flux-fill-dev",
    "seed": 0,
    "size": "1024*1024",
    "image": "https://static.atlascloud.ai/media/images/1754366573795217564_823ZVRok.jpeg",
    "loras": [],
    "prompt": "A white translucent silk scarf is wrapped around the neck and flutters in the wind.",
    "mask_image": "https://static.atlascloud.ai/media/images/1754366690014011991_yEMJFByu.png",
    "num_images": 1,
    "guidance_scale": 30,
    "num_inference_steps": 28,
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
    "model": "black-forest-labs/flux-redux-pro",
    "seed": 0,
    "size": "1024*1024",
    "image": "https://static.atlascloud.ai/media/images/1745413935078739480_xIVRNKGD.png",
    "prompt": "",
    "num_images": 1,
    "guidance_scale": 3.5,
    "num_inference_steps": 28,
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
    "model": "atlascloud/instant-character",
    "seed": 1,
    "size": "1024*1024",
    "image": "https://static.atlascloud.ai/media/images/1745853771145444122_WW40XTQM.jpg",
    "prompt": "A futuristic android girl with glowing blue eyes, wearing green suit, standing next to a holographic sign displaying \"I Love AtlasCloud\", neon-lit cyberpunk city background, sleek and high-tech vibe, Sci-fi movie style"
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
    "model": "atlascloud/hidream-e1-full",
    "seed": -1,
    "image": "https://static.atlascloud.ai/media/images/1747376730398194676_K2jByuqm.jpeg",
    "prompt": "for a light gray sweater and gold thin-rimmed glasses.",
    "output_format": "jpeg",
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

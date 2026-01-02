import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedance-v1.5-pro/image-to-video",
    "aspect_ratio": "16:9",
    "camera_fixed": False,
    "duration": 5,
    "generate_audio": True,
    "image": "https://static.atlascloud.ai/media/images/06a309ac0adecd3eaa6eee04213e9c69.png",
    "last_image": "example_value",
    "prompt": "Use the provided image as the first frame.\nOn a quiet residential street in a summer afternoon, a young girl in high-quality Japanese anime style slowly walks forward.\nHer steps are natural and light, with her arms gently swinging in rhythm with her walk. Her body movement remains stable and well-balanced.\nAs she walks, her expression gradually softens into a gentle, warm smile. The corners of her mouth lift slightly, and her eyes look calm and bright.\nA soft breeze moves her short hair and headband, with individual strands subtly flowing. Her clothes show slight natural motion from the wind.\nSunlight comes from the upper side, creating soft highlights and natural shadows on her face and body.\nBackground trees sway gently, and distant clouds drift slowly, enhancing the peaceful summer atmosphere.\nThe camera stays at a medium to medium-close distance, smoothly tracking forward with cinematic motion, stable and controlled.\nHigh-quality Japanese hand-drawn animation style, clean linework, warm natural colors, smooth frame rate, consistent character proportions.\nThe mood is calm, youthful, and healing, like a slice-of-life moment from an animated film.",
    "resolution": "720p",
    "seed": -1
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.6/image-to-video",
    "audio": "example_value",
    "duration": 15,
    "enable_prompt_expansion": False,
    "image": "https://static.atlascloud.ai/media/images/decd0dfa-379e-454c-9e83-645986383251.png",
    "negative_prompt": "example_value",
    "prompt": "Panoramic shot: The figures slowly walk towards the building in the distance; mist fills the air.\nMedium shot: The camera slowly zooms in on the figures.\nClose-up: The figure takes a deep breath.",
    "resolution": "1080p",
    "seed": -1,
    "shot_type": "single",
    "generate_audio": True
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()


import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-v2.6-pro/image-to-video",
    "cfg_scale": 0.5,
    "duration": 5,
    "image": "example_value",
    "negative_prompt": "example_value",
    "prompt": "A young female artist on a hillside is painting on an easel, facing a field of lavender. She smiles to herself as she dabs a stroke of purple onto the canvas, a light breeze rustling her hair.",
    "sound": True
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)


video_url = check_status()


import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-video-o1/image-to-video",
    "aspect_ratio": "16:9",
    "duration": 5,
    "image": "https://static.atlascloud.ai/media/images/fc7a34ba8c6a263b9ffa84362ea08ef2.png",
    "last_image": "example_value",
    "prompt": "A young woman smiling brightly at the camera in a sunny outdoor setting with a blue sky and soft clouds, filmed in a handheld selfie perspective, her face centered and in sharp focus, arms naturally extended toward the camera, gentle wind moving her hair, natural blinking and subtle breathing, slight head movement, warm soft sunlight illuminating her face, clouds drifting slowly in the background, bright, joyful, and uplifting mood, realistic cinematic style, stable camera."
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "openai/sora-2/image-to-video-pro-developer",
    "duration": 10,
    "image": "example_value",
    "prompt": "A beautiful sunset over the ocean with gentle waves",
    "size": "720*1280"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()


import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "openai/sora-2/image-to-video-developer",
    "duration": 10,
    "image": "example_value",
    "prompt": "A beautiful sunset over the ocean with gentle waves",
    "size": "720*1280"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "lightricks/ltx-2-fast/image-to-video",
    "duration": 8,
    "generate_audio": True,
    "image": "https://static.atlascloud.ai/media/images/1761253445609915119_EzHEAxtq.jpeg",
    "prompt": "A cinematic, intense cyberpunk ninja duel, starting slightly before the sword lock.The scene opens with a rapid exchange of blows: the traditional ninja and the cybernetic ninja clash their glowing katanas twice in quick succession. Bright sparks erupt *only* at the moment of blade impact.After the brief exchange, they lock blades fiercely, pushing against each other with immense force. The camera moves into a tight close-up, focusing on the strained lock. Sparks now only burst intermittently when one side applies sudden, increased pressure, highlighting the struggle for dominance. Their arms tremble with the strain. Camera slowly pushes in even closer, focusing on their masked faces/visors. The traditional ninja speaks first, his muffled voice filled with conviction (implied): &quot;Is this power worth your soul?&quot; The cybernetic ninja remains still, its glowing blue eyes unwavering. After a deliberate pause, it replies in a cold, synthetic tone (implied): &quot;The future has no soul.Immediately following the final word, the cybernetic ninja surges forward with mechanical force, briefly creating a shower of sparks as it overpowers the lock. The traditional ninja is pushed back slightly, breaking the stalemate."
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "lightricks/ltx-2-pro/image-to-video",
    "duration": 8,
    "generate_audio": True,
    "image": "https://static.atlascloud.ai/media/images/1761252996494178825_xF5wNRVa.png",
    "prompt": "Cinematic fantasy video starting from the input image. The warrior woman stands stoically on the snowy peak. Suddenly, an ancient dwarven rune carved into the rock beneath the snow at her feet flares with intense, cold blue magical energy. This unleashes a localized vortex of swirling snow and ice particles around her. She instinctively grips her massive warhammer tighter, bracing herself against the arcane power, eyes narrowed. Camera slightly pushes in as the vortex erupts. Style: Photorealistic, masterpiece, high detail, dramatic lighting, magical particle effects, slow-motion effect on vortex."
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "minimax/hailuo-2.3/i2v-standard",
    "duration": 6,
    "enable_prompt_expansion": False,
    "image": "example_value",
    "prompt": "A beautiful sunset over the ocean with gentle waves"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()


import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "minimax/hailuo-2.3/i2v-pro",
    "enable_prompt_expansion": True,
    "image": "example_value",
    "prompt": "A beautiful sunset over the ocean with gentle waves"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()


import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "minimax/hailuo-2.3/fast",
    "duration": 6,
    "enable_prompt_expansion": True,
    "go_fast": True,
    "image": "example_value",
    "prompt": "A beautiful sunset over the ocean with gentle waves"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()
import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "bytedance/seedance-v1-pro-fast/image-to-video",
    "aspect_ratio": "16:9",
    "camera_fixed": False,
    "duration": 5,
    "image": "https://static.atlascloud.ai/media/images/8c4a5fb761e55abc2a3ffd880508797f.jpeg",
    "prompt": "Use the provided image as the first frame: in a vintage train station at winter dusk, two anthropomorphic orange cats are fully visible head to toe, walking slowly side by side, the older cat holding the younger cat’s hand and carrying a small vintage suitcase; they briefly pause and look into each other’s eyes with a calm, gentle expression before continuing forward, movements natural and synchronized, hands stable, light snowflakes drifting softly, warm station lights contrasting with cool ambient tones, stable eye-level medium-wide tracking shot, cinematic depth of field, realistic fairytale style with detailed fur, warm and healing atmosphere.",
    "resolution": "720p",
    "seed": -1
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/veo3.1/reference-to-video",
    "generate_audio": True,
    "images": [
        "https://static.atlascloud.ai/media/images/1760529949369193025_jLUQMJFC.jpeg"
    ],
    "negative_prompt": "example_value",
    "prompt": "The dog is playing with a ball.",
    "resolution": "1080p",
    "seed": 1
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/veo3.1/image-to-video",
    "aspect_ratio": "16:9",
    "duration": 8,
    "generate_audio": True,
    "image": "https://static.atlascloud.ai/media/images/1760591777032682106_XaFByurn.jpeg",
    "last_image": "https://d1q70pf5vjeyhc.cloudfront.net/media/fb8f674bbb1a429d947016fd223cfae1/images/1760591780225778646_nqDAwsql.jpeg",
    "negative_prompt": "example_value",
    "prompt": "The sports car is running, and its color turns red.\n",
    "resolution": "1080p",
    "seed": 1
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/veo3.1-fast/image-to-video",
    "aspect_ratio": "16:9",
    "duration": 8,
    "generate_audio": True,
    "image": "https://static.atlascloud.ai/media/images/1760150611820925011_Z7a558dh.png",
    "last_image": "example_value",
    "negative_prompt": "example_value",
    "prompt": "A street reporter holds a mic and speaks to camera with excitement.\nDialogue: \"Breaking news! Veo 3.1 just dropped on AtlasCloud. It can talk, act, and think—on video!\"\nFast zooms, background city traffic, upbeat tone.",
    "resolution": "1080p",
    "seed": 1
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "openai/sora-2/image-to-video",
    "duration": 8,
    "image": "https://static.atlascloud.ai/media/images/f931a6f8817344d0e59e2ff2370cab8e.png",
    "prompt": "Action: A young woman stands in a sunlit countryside field, holding a small bouquet of sunflowers.\nA gentle breeze moves through the scene: her long blonde hair and the ribbon on her straw hat sway softly, and her dress fabric ripples naturally.\nShe blinks slowly, tilts her head slightly, looks toward the camera, and speaks with a warm, friendly smile.\nEnvironment：The sunflowers in her hands shift gently with her movement, while distant windmills rotate slowly in the background.\nSoft sunlight creates moving highlights and shadows across her face, flowers, and the grass field.\n\nCharacter Dialogue: (Voice is gentle )\n“Welcome to Happy Farm，wish you a pleasant day!”"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "openai/sora-2/image-to-video-pro",
    "duration": 8,
    "image": "https://static.atlascloud.ai/media/images/b4b1b6ce7dec4a4f4f2edfe57894c858.jpg",
    "prompt": "A cinematic, ultra-realistic scene of a futuristic car racing through a glowing space-time tunnel. The tunnel is formed by swirling light streaks, energy waves, and warped space textures, creating a sense of extreme speed. The car’s body reflects neon blues, purples, and whites from the tunnel walls. Motion blur trails stretch behind the vehicle as space bends and distorts around it. Subtle particle effects and light flares fill the tunnel. The camera follows closely from behind, then slightly shifts to a dynamic side angle, emphasizing acceleration and depth. Epic sci-fi atmosphere, high contrast, smooth cinematic motion, IMAX quality, photorealistic, no text, no watermark.\nfuturistic hypercar, holographic dashboard glow, digital light grids, cyberpunk color palette, intense energy pulses\n"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-v2.5-turbo-pro/image-to-video",
    "duration": 5,
    "guidance_scale": 0.5,
    "image": "example_value",
    "last_image": "example_value",
    "negative_prompt": "example_value",
    "prompt": "A young female artist on a hillside is painting on an easel, facing a field of lavender. She smiles to herself as she dabs a stroke of purple onto the canvas, a light breeze rustling her hair. Cinematography: Begins over-the-shoulder to show her painting, then slowly pans to her profile, capturing her focused and content expression. Style & Atmosphere: Bright, soft, and artistic. The lighting is late afternoon sun, soft and angled, creating a golden rim light on everything. Environment & Details: The thick texture of the oil paint on the canvas is visible. The distant lavender field sways in the breeze. Technical Specs: 4K, high Color Rendering Index (CRI), emulating a cinematic prime lens for soft, beautiful bokeh."
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()


import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-v2.1-i2v-pro/start-end-frame",
    "duration": 5,
    "end_image": "example_value",
    "guidance_scale": 0.5,
    "image": "example_value",
    "negative_prompt": "example_value",
    "prompt": "Pikachu turned around and put on a hat and sunglasses."
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-v1.6-multi-i2v-pro",
    "aspect_ratio": "1:1",
    "duration": 5,
    "images": [],
    "negative_prompt": "example_value",
    "prompt": "breathtaking mountain landscape at sunrise, golden light spilling over snowy peaks, clouds drifting slowly across the sky, river flowing gently in the valley, camera panning smoothly from left to right, ultra high resolution, vibrant colors, cinematic atmosphere\n\n"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-v1.6-multi-i2v-standard",
    "aspect_ratio": "1:1",
    "duration": 5,
    "images": [],
    "negative_prompt": "example_value",
    "prompt": "model in a flowing silk gown standing on top of a sand dune, golden sunset light illuminating the fabric, camera circling to capture the dress fluttering dramatically in the wind, high-contrast editorial style\n\n\n"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-effects",
    "effect_scene": "firework_2026",
    "image": "https://static.atlascloud.ai/media/images/kling-effects-sample-portrait.jpg"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.5/image-to-video",
    "audio": "example_value",
    "duration": 5,
    "enable_prompt_expansion": False,
    "image": "https://static.atlascloud.ai/media/images/1758601850605840214_HR41XUQN.jpeg",
    "negative_prompt": "example_value",
    "prompt": "A cute magical girl with pink twin-tails is undergoing a brilliant transformation sequence. She is surrounded by shimmering starlight and floating ribbons as her clothes magically dissolve into a detailed battle dress. A close-up shot focuses on her determined, large blue eyes. The background is a fantastical starry sky. Japanese anime style, vibrant colors, magical particle effects, dynamic motion, a mix of Studio Ghibli and Makoto Shinkai art styles.\n",
    "resolution": "720p",
    "generate_audio": True,
    "seed": 579955138
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.5/image-to-video-fast",
    "audio": "example_value",
    "duration": 5,
    "enable_prompt_expansion": False,
    "image": "https://static.atlascloud.ai/media/images/0f67c624d343e136528c876b281a3e6d.png",
    "negative_prompt": "example_value",
    "prompt": "A sliced apple falls into clear water in slow motion, the two halves slightly separated.\nThe impact creates a sharp, elegant splash as water arcs upward and droplets scatter.\nTiny bubbles stream from the cut surfaces while ripples expand across the surface.\nHigh-speed macro style, clean white background, realistic water physics, smooth slow-motion.",
    "resolution": "720p",
    "seed": 427713494
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/ltx-video-v097/i2v-720p",
    "seed": 1,
    "size": "1280*720",
    "image": "https://static.atlascloud.ai/media/images/1747783541334382211_M5iZVRNJ.jpg",
    "prompt": "A confident young tech professional standing in a modern office space, talking to the camera with calm gestures. Soft daylight, clean environment, business casual outfit, focused expression. Center frame, smooth motion",
    "negative_prompt": "worst quality, inconsistent motion, blurry, jittery, distorted"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "atlascloud/magi-1-24b",
    "seed": 1,
    "image": "https://static.atlascloud.ai/media/images/1745552832830322655_jemjfbyu.jpg",
    "prompt": "In front of the pyramid under the setting sun, an African queen slowly walked out of the temple. She wore golden armor and her eyes were firm. The wind brought dust and cape. She slowly walked towards the throne. The background music was solemn and magnificent, as if it heralded the awakening and revival of a kingdom.",
    "num_frames": 96,
    "resolution": "720p",
    "aspect_ratio": "auto",
    "frames_per_second": 24,
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "vidu/reference-to-video-q1",
    "seed": 0,
    "images": [
        "https://static.atlascloud.ai/media/images/1752044067562333610_05bBXmGY.PNG"
    ],
    "prompt": "A character takes two natural steps in front of the camera and then strikes some poses",
    "aspect_ratio": "16:9",
    "movement_amplitude": "auto"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "vidu/reference-to-video-2.0",
    "seed": 0,
    "images": [
        "https://static.atlascloud.ai/media/images/1745492230971199265_J3J5tO7p.jpg",
        "https://static.atlascloud.ai/media/images/1745492247387641003_Z3jDAxur.jpg"
    ],
    "prompt": "the girl walks from the painting to the room, put the coffee cup on the table",
    "aspect_ratio": "16:9",
    "movement_amplitude": "auto"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/zoom-out",
    "image": "https://static.atlascloud.ai/media/images/1751714038338986799_DRSTYZ9w.jpeg"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/shake-dance",
    "image": "https://scene.cf.vidu.studio/media-asset/073109-1Qfe2xMWivzqA8wk.png"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()


import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/love-drop",
    "image": "https://image01.cf.vidu.studio/vidu-maas/Tempmates_material/lovedrop_0520/lovedrop_upload.png"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/jiggle-up",
    "image": "https://static.atlascloud.ai/media/images/1751548275932447106_iQ952YUQ.jpeg"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "alibaba/wan-2.2/i2v-5b-720p-lora",
    "seed": -1,
    "image": "",
    "loras": [],
    "prompt": ""
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "vidu/start-end-to-video-2.0",
    "seed": 0,
    "images": [
        "https://static.atlascloud.ai/media/images/1745494594983907143_liqlhd9u.jpg",
        "https://static.atlascloud.ai/media/images/1745494607637805608_31gIDzwr.jpg"
    ],
    "prompt": "the iron man transform into the sport car ",
    "duration": 4,
    "movement_amplitude": "auto"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/veo2/image-to-video",
    "seed": 1,
    "image": "https://static.atlascloud.ai/media/images/17f3d6bafdfb9d1869f2ac60a5fd4be8.jpg",
    "prompt": "A futuristic humanoid robot facing forward, with a transparent digital screen as its face.\n\nDynamic numerical data, symbols, and abstract UI elements continuously shifting and updating across the screen, visualizing real-time computation and analysis.\n\nNumbers smoothly transform, fade, and reassemble into new patterns, including grids, charts, coordinates, and signal pulses.\n\nSoft glowing light emitted from the screen illuminates the robot’s metallic facial frame, creating subtle reflections and depth.\n\nMinimalist dark environment with gentle ambient lighting, keeping full focus on the robot’s face and data movement.\n\nSlow cinematic camera push-in, steady framing, calm and controlled motion.\n\nClean futuristic UI design, precise animation timing, elegant and readable data flow.\n\nHigh-tech cinematic style, premium AI visualization aesthetic, calm and intelligent mood.\n\nHigh resolution, smooth transitions, professional color grading.\n\nNo text labels, no logos, no watermarks.",
    "duration": 8,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "negative_prompt": "example_value",
    "enable_prompt_expansion": False
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "minimax/hailuo-02/t2v-pro",
    "prompt": "A cinematic, ultra-realistic autumn park scene. Golden and amber leaves gently fall from tall trees, drifting slowly through the air. Sunlight filters through the branches, creating warm volumetric light rays and soft shadows on the ground. A quiet park path is covered with fallen leaves, subtly rustling in a light breeze. The camera moves slowly forward at walking pace, capturing leaves floating past the lens in slow motion. Warm color grading, shallow depth of field, natural atmospheric haze, calm and peaceful mood, film-like realism, IMAX-quality, photorealistic, no text, no watermark.\ncinematic establishing shot of an autumn park, gentle camera push-in, emotional tone, nostalgic mood",
    "enable_prompt_expansion": False
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/veo3-fast/image-to-video",
    "seed": 1,
    "image": "https://static.atlascloud.ai/media/images/1753973059445707017_cD2XUQMJ.png",
    "prompt": "the elephant moves around naturally.",
    "duration": 8,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": False,
    "negative_prompt": "example_value"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "google/veo3/image-to-video",
    "seed": 1,
    "image": "https://static.atlascloud.ai/media/images/1753973059445707017_cD2XUQMJ.png",
    "prompt": "the elephant moves around naturally.",
    "duration": 8,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": True,
    "negative_prompt": "example_value"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "kwaivgi/kling-v2.0-i2v-master",
    "duration": 5,
    "end_image": "example_value",
    "guidance_scale": 0.5,
    "image": "example_value",
    "negative_prompt": "example_value",
    "prompt": "On a sunny afternoon, an elderly couple in their sixties, dressed in simple and comfortable clothes, is sitting on a park bench. The wife gently pats her husband's back with her wrinkled hand. Both of them are smiling happily, their eyes full of warmth. The sunlight filters through the dense leaves, casting dappled shadows on them, creating a serene and cozy atmosphere."
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "luma/ray-2-i2v",
    "size": "1280*720",
    "image": "https://static.atlascloud.ai/media/images/1752740578864245722_XP0WTPNJ.jpeg",
    "prompt": "A father and daughter preparing dinner in a cozy apartment kitchen, chopping vegetables, oil sizzling in the pan, casual conversation, natural warm lighting",
    "duration": "5"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "pika/v2.0-turbo-i2v",
    "size": "1280*720",
    "image": "https://static.atlascloud.ai/media/images/1752751552131775950_ugplhea6.jpeg",
    "prompt": "Old man watering plants on his balcony, city skyline behind him, birds chirping, peaceful everyday ritual",
    "duration": "5"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "pika/v2.0-turbo-i2v",
    "size": "1280*720",
    "image": "https://static.atlascloud.ai/media/images/1752751552131775950_ugplhea6.jpeg",
    "prompt": "Old man watering plants on his balcony, city skyline behind him, birds chirping, peaceful everyday ritual",
    "duration": "5"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "pixverse/pixverse-v4.5-i2v-fast",
    "seed": 0,
    "image": "https://v3.fal.media/files/zebra/qL93Je8ezvzQgDOEzTjKF_KhGKZTEebZcDw6T5rwQPK_output.png",
    "style": "example_value",
    "prompt": "A woman warrior with her hammer walking with his glacier wolf.",
    "resolution": "540p",
    "negative_prompt": "example_value"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/fishermen",
    "image": "https://image01.cf.vidu.studio/vidu/media-asset/2-75289ebf.webp"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/flying",
    "image": "https://image01.cf.vidu.studio/vidu-maas/Tempmates_material/Funny/Funny/0317/flying_upload.png"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/gender-swap",
    "image": "https://image01.cf.vidu.studio/vidu-maas/Tempmates_material/Funny/Funny/0331/haiwai/xingzhuan_upload.png"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

import requests
import time

# Step 1: Start video generation
generate_url = "https://api.atlascloud.ai/api/v1/model/generateVideo"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer $ATLASCLOUD_API_KEY"
}
data = {
    "model": "video-effects/hulk",
    "image": "https://prod-ss-images.s3.cn-northwest-1.amazonaws.com.cn/img_v3_02jg_ab583ab9-4cae-4b67-8dc7-5781d317f7cg.png"
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

        if result["data"]["status"] in ["completed", "succeeded"]:
            print("Generated video:", result["data"]["outputs"][0])
            return result["data"]["outputs"][0]
        elif result["data"]["status"] == "failed":
            raise Exception(result["data"]["error"] or "Generation failed")
        else:
            # Still processing, wait 2 seconds
            time.sleep(2)

video_url = check_status()

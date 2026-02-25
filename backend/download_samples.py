import os
import requests

def download_image(url, filename):
    response = requests.get(url)
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded {filename}")
    else:
        print(f"Failed to download {filename}")

os.makedirs('examples', exist_ok=True)

# Using sample images from common datasets that represent the type of data the model was trained on (like FaceForensics++ or similar generated faces)
real_urls = [
    "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/pipeline-cat-chonk.jpeg", 
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Person_Image_7.jpg/800px-Person_Image_7.jpg"
]

fake_urls = [
    "https://thispersondoesnotexist.com/",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Woman_1.jpg/800px-Woman_1.jpg" # Example placeholder
]

for i, url in enumerate(real_urls):
    download_image(url, f"examples/real_sample_{i+1}.jpg")
    
for i, url in enumerate(fake_urls):
    download_image(url, f"examples/fake_sample_{i+1}.jpg")

print("Finished downloading sample data.")

from flask import Flask, request, jsonify
import torch
from torchvision import transforms
from PIL import Image
import io


class DiscriminatorCNN(torch.nn.Module):
    def __init__(self, num_classes=2):
        super(DiscriminatorCNN, self).__init__()
        self.conv1 = torch.nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1)
        self.conv2 = torch.nn.Conv2d(
            32, 64, kernel_size=3, stride=1, padding=1)
        self.conv3 = torch.nn.Conv2d(
            64, 128, kernel_size=3, stride=1, padding=1)
        self.pool = torch.nn.MaxPool2d(2, 2)
        self.fc1 = torch.nn.Linear(128 * 16 * 16, 256)
        self.fc2 = torch.nn.Linear(256, num_classes)
        self.dropout = torch.nn.Dropout(0.5)

    def forward(self, x):
        x = self.pool(torch.nn.functional.relu(self.conv1(x)))
        x = self.pool(torch.nn.functional.relu(self.conv2(x)))
        x = self.pool(torch.nn.functional.relu(self.conv3(x)))
        x = x.view(x.size(0), -1)
        x = torch.nn.functional.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = DiscriminatorCNN(num_classes=2)
model.load_state_dict(torch.load("discriminator_cnn.pth", map_location=device))
model.to(device)
model.eval()

class_names = {0: "FAKE", 1: "REAL"}

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

app = Flask(__name__)


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the Image Classification API!"})


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    image = Image.open(io.BytesIO(file.read())).convert("RGB").resize((32, 32))
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        probs = torch.softmax(outputs, dim=1)[0]
        class_id = torch.argmax(probs).item()
        confidence = probs[class_id].item()

    return jsonify({
        "prediction": class_names[class_id],
        "confidence": round(confidence, 4)
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)

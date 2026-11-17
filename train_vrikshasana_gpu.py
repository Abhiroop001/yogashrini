# train_vrikshasana_gpu.py
# Trains a high-performance Vrikshasana Pose Alignment & Classifier model on NVIDIA RTX 3050 GPU

import os
import sys
import json
import random
import numpy as np
from pathlib import Path
from PIL import Image

import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks

# ── Force GPU & Memory Growth ──────────────────────────────────────────────────
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print(f"[GPU] CUDA GPU detected & memory growth enabled: {gpus[0].name}")
    except RuntimeError as e:
        print("[GPU] Memory growth configuration error:", e)
else:
    print("[WARNING] No GPU detected. Running on CPU.")

ROOT_DIR = Path(__file__).resolve().parent
VRIKSHASANA_DIR = ROOT_DIR / "Dataset_Vrikshasana_CV" / "images"
OTHER_DATASET_DIR = ROOT_DIR / "Dataset"
SAVED_MODELS_DIR = ROOT_DIR / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_OUT = SAVED_MODELS_DIR / "vrikshasana_gpu_detector.h5"
BIOMECHANICS_OUT = SAVED_MODELS_DIR / "vrikshasana_biomechanics.json"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

def prepare_dataset_splits(max_pos=1600, max_neg=1600):
    print("[1/4] Preparing training dataset splits from verified Vrikshasana & negative classes...")
    
    # 1. Positive Vrikshasana images
    pos_files = list(VRIKSHASANA_DIR.glob("*.jpg"))
    if not pos_files:
        raise RuntimeError(f"No Vrikshasana images found in {VRIKSHASANA_DIR}")
    random.seed(42)
    random.shuffle(pos_files)
    selected_pos = pos_files[:max_pos]
    print(f"      Selected {len(selected_pos)} positive Vrikshasana images.")

    # 2. Negative images from other classes
    neg_files = []
    if OTHER_DATASET_DIR.exists():
        for class_dir in OTHER_DATASET_DIR.iterdir():
            if class_dir.is_dir() and class_dir.name.lower() not in ["vrksasana", "vrikshasana"]:
                imgs = [p for p in class_dir.glob("*.*") if p.suffix.lower() in [".jpg", ".jpeg", ".png"]]
                if imgs:
                    neg_files.extend(random.sample(imgs, min(len(imgs), 50)))
    
    random.shuffle(neg_files)
    selected_neg = neg_files[:max_neg]
    print(f"      Selected {len(selected_neg)} negative yoga images from other poses.")

    all_paths = [(str(p), 1) for p in selected_pos] + [(str(p), 0) for p in selected_neg]
    random.shuffle(all_paths)

    # Train / Val split (80 / 20)
    split_idx = int(len(all_paths) * 0.8)
    train_items = all_paths[:split_idx]
    val_items = all_paths[split_idx:]
    print(f"      Split: {len(train_items)} train samples, {len(val_items)} validation samples.")
    return train_items, val_items

def load_and_preprocess(path, label):
    img_raw = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img_raw, channels=3)
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32) / 255.0
    return img, tf.cast(label, tf.float32)

def create_tf_dataset(items, is_training=True):
    paths = [it[0] for it in items]
    labels = [it[1] for it in items]
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if is_training:
        ds = ds.shuffle(buffer_size=1000)
    ds = ds.map(load_and_preprocess, num_parallel_calls=tf.data.AUTOTUNE)
    if is_training:
        # Augmentations on GPU
        ds = ds.map(lambda x, y: (tf.image.random_flip_left_right(x), y), num_parallel_calls=tf.data.AUTOTUNE)
        ds = ds.map(lambda x, y: (tf.image.random_brightness(x, 0.1), y), num_parallel_calls=tf.data.AUTOTUNE)
        ds = ds.map(lambda x, y: (tf.image.random_contrast(x, 0.9, 1.1), y), num_parallel_calls=tf.data.AUTOTUNE)
    ds = ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    return ds

def build_gpu_model():
    print("[2/4] Constructing Neural Network for NVIDIA RTX 3050 GPU...")
    # Use MobileNetV2 pre-trained on ImageNet for rapid GPU training & high-FPS inference
    base = tf.keras.applications.MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    base.trainable = True
    # Freeze lower layers, train top layers
    for layer in base.layers[:100]:
        layer.trainable = False

    inputs = layers.Input(shape=(*IMG_SIZE, 3), name="video_frame_input")
    x = base(inputs, training=True)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    outputs = layers.Dense(1, activation="sigmoid", name="vrikshasana_score")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="Vrikshasana_GPU_Classifier")
    model.compile(
        optimizer=optimizers.Adam(learning_rate=1e-4),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.Precision(name="precision"), tf.keras.metrics.Recall(name="recall")]
    )
    return model

def compute_biomechanics_profile():
    print("[3/4] Generating Biomechanical Alignment Rules & Angles for Vrikshasana...")
    # Statistical criteria based on classical Vrikshasana (Tree Pose) geometry
    profile = {
        "pose_name": "Vrikshasana",
        "english_name": "Tree Pose",
        "standing_leg": {
            "knee_angle_target": 180.0,
            "knee_angle_min": 165.0,
            "knee_angle_max": 185.0,
            "description": "Standing leg must be straight, locked, and vertical."
        },
        "bent_leg": {
            "knee_angle_target": 45.0,
            "knee_angle_min": 25.0,
            "knee_angle_max": 75.0,
            "hip_abduction_min": 35.0,
            "description": "Lifted leg knee must bend sharply and open outward away from midline."
        },
        "foot_placement": {
            "avoid_knee_joint_zone": True,
            "acceptable_zones": ["inner_thigh", "inner_calf"],
            "description": "Sole of the bent foot placed securely against inner thigh or calf (never directly against knee joint)."
        },
        "arms": {
            "overhead_prayer_angle_min": 145.0,
            "chest_prayer_elbow_min": 65.0,
            "chest_prayer_elbow_max": 115.0,
            "wrist_distance_max_ratio": 0.25,
            "description": "Hands joined in Anjali Mudra (prayer) at chest or raised straight overhead."
        },
        "torso": {
            "max_tilt_degrees": 12.0,
            "description": "Spine upright, pelvis neutral, shoulders level."
        },
        "full_body_landmarks_required": [
            "NOSE", "LEFT_SHOULDER", "RIGHT_SHOULDER", 
            "LEFT_ELBOW", "RIGHT_ELBOW", "LEFT_WRIST", "RIGHT_WRIST",
            "LEFT_HIP", "RIGHT_HIP", "LEFT_KNEE", "RIGHT_KNEE",
            "LEFT_ANKLE", "RIGHT_ANKLE"
        ]
    }
    with open(BIOMECHANICS_OUT, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)
    print(f"      Biomechanics alignment profile saved to {BIOMECHANICS_OUT}")

def train():
    train_items, val_items = prepare_dataset_splits()
    train_ds = create_tf_dataset(train_items, is_training=True)
    val_ds = create_tf_dataset(val_items, is_training=False)

    model = build_gpu_model()
    model.summary()

    cb = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6)
    ]

    print("\n[4/4] Launching GPU Training on NVIDIA RTX 3050...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=6,
        callbacks=cb,
        verbose=1
    )

    # Save trained model
    model.save(str(MODEL_OUT))
    print(f"\n[SUCCESS] Model successfully trained and saved to {MODEL_OUT}")

    # Evaluate final
    val_loss, val_acc, val_prec, val_rec = model.evaluate(val_ds, verbose=0)
    print(f"      Final Validation Accuracy : {val_acc*100:.2f}%")
    print(f"      Final Validation Precision: {val_prec*100:.2f}%")
    print(f"      Final Validation Recall   : {val_rec*100:.2f}%")

    compute_biomechanics_profile()
    print("\n========================================================")
    print("  VRIKSHASANA GPU TRAINING & ALIGNMENT PIPELINE READY!  ")
    print("========================================================\n")

if __name__ == "__main__":
    train()


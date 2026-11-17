"""
Evaluation script for EfficientNetB0_Yoga – ASCII-safe output.
"""
import os, warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, top_k_accuracy_score

import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for g in gpus:
        tf.config.experimental.set_memory_growth(g, True)
    print(f'GPU ready ({len(gpus)} device(s))')
else:
    print('No GPU - using CPU')

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization, Input
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

DATASET_DIR  = r'd:\Yoga Website\Dataset'
WEIGHTS_PATH = r'd:\Yoga Website\saved_models\efficientnetb0_yoga.weights.h5'
IMG_SIZE     = (224, 224)
BATCH_SIZE   = 32
VALID_EXT    = {'.jpg', '.jpeg', '.png'}

# ── Discover files ────────────────────────────────────────────────────────────
classes = sorted([
    d for d in os.listdir(DATASET_DIR)
    if os.path.isdir(os.path.join(DATASET_DIR, d))
])
NUM_CLASSES = len(classes)
print(f'Classes: {NUM_CLASSES}')

filepaths, labels = [], []
for c in classes:
    class_dir = os.path.join(DATASET_DIR, c)
    for fname in os.listdir(class_dir):
        if os.path.splitext(fname)[1].lower() in VALID_EXT:
            filepaths.append(os.path.join(class_dir, fname))
            labels.append(c)

df = pd.DataFrame({'filepath': filepaths, 'label': labels})
print(f'Total images : {len(df)}')

_, val_df = train_test_split(df, test_size=0.20, random_state=42, stratify=df['label'])
val_df = val_df.reset_index(drop=True)
print(f'Val samples  : {len(val_df)}')

# ── Rebuild model (Phase-2 state) ─────────────────────────────────────────────
print('Rebuilding model...')
inputs     = Input(shape=(*IMG_SIZE, 3))
base_model = EfficientNetB0(weights='imagenet', include_top=False, input_tensor=inputs)
base_model.trainable = True
for layer in base_model.layers[:150]:
    layer.trainable = False

x = base_model(inputs, training=False)
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.5)(x)
outputs = Dense(NUM_CLASSES, activation='softmax')(x)
model = Model(inputs=inputs, outputs=outputs)

# ── Load weights ──────────────────────────────────────────────────────────────
print(f'Loading weights...')
try:
    model.load_weights(WEIGHTS_PATH)
    print('Weights loaded OK')
except Exception as e:
    print(f'Load failed: {e}')
    print('Trying by_name+skip_mismatch...')
    try:
        model.load_weights(WEIGHTS_PATH, by_name=True, skip_mismatch=True)
        print('Weights loaded (partial)')
    except Exception as e2:
        print(f'Still failed: {e2}')
        print('Using ImageNet weights only.')

# ── Val generator ─────────────────────────────────────────────────────────────
val_gen = ImageDataGenerator().flow_from_dataframe(
    val_df, x_col='filepath', y_col='label',
    target_size=IMG_SIZE, batch_size=BATCH_SIZE,
    class_mode='categorical', shuffle=False, classes=classes
)

# ── Evaluate ──────────────────────────────────────────────────────────────────
print('Evaluating...')
model.compile(optimizer='sgd', loss='categorical_crossentropy', metrics=['accuracy'])
loss, acc = model.evaluate(val_gen, verbose=1)

print()
print('=' * 45)
print(f'  Validation Loss     : {loss:.4f}')
print(f'  Validation Accuracy : {acc * 100:.2f}%')
print('=' * 45)

val_gen.reset()
y_prob = model.predict(val_gen, verbose=1)
y_pred = np.argmax(y_prob, axis=1)
y_true = val_gen.classes

for k in (1, 3, 5):
    topk = top_k_accuracy_score(y_true, y_prob, k=k, labels=list(range(NUM_CLASSES)))
    print(f'  Top-{k} Accuracy : {topk * 100:.2f}%')

print()
print('Classification Report:')
print(classification_report(y_true, y_pred, target_names=classes))

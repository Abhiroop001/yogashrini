"""
Classify all images in Some_tests/ using the saved EfficientNetB0 weights.
Outputs: console table + saved_models/some_tests_results.png visual grid.
"""
import os, sys, warnings
warnings.filterwarnings('ignore')

import numpy as np
import matplotlib
matplotlib.use('Agg')          # headless – no display needed
import matplotlib.pyplot as plt
import matplotlib.patches as patches

import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for g in gpus:
        tf.config.experimental.set_memory_growth(g, True)

from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization, Input
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# ── Config ────────────────────────────────────────────────────────────────────
DATASET_DIR  = r'd:\Yoga Website\Dataset'
WEIGHTS_PATH = r'd:\Yoga Website\saved_models\efficientnetb0_yoga.weights.h5'
TEST_DIR     = r'd:\Yoga Website\Some_tests'
IMG_SIZE     = (224, 224)
VALID_EXT    = {'.jpg', '.jpeg', '.png', '.webp'}

# ── Class list ────────────────────────────────────────────────────────────────
classes = sorted([
    d for d in os.listdir(DATASET_DIR)
    if os.path.isdir(os.path.join(DATASET_DIR, d))
])
NUM_CLASSES = len(classes)

# ── Build model ───────────────────────────────────────────────────────────────
print('Building model...')
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

print('Loading weights...')
model.load_weights(WEIGHTS_PATH)
print(f'Weights loaded. ({NUM_CLASSES} classes)\n')

# ── Collect test images ───────────────────────────────────────────────────────
test_images = sorted([
    os.path.join(TEST_DIR, f)
    for f in os.listdir(TEST_DIR)
    if os.path.splitext(f)[1].lower() in VALID_EXT
])
print(f'Test images found: {len(test_images)}\n')

# ── Run inference ─────────────────────────────────────────────────────────────
results = []
for img_path in test_images:
    img  = load_img(img_path, target_size=IMG_SIZE)
    arr  = img_to_array(img)[np.newaxis, ...]          # (1, 224, 224, 3)
    prob = model.predict(arr, verbose=0)[0]            # (47,)
    top5_idx  = np.argsort(prob)[-5:][::-1]
    results.append({
        'path':      img_path,
        'filename':  os.path.basename(img_path),
        'top1_class': classes[top5_idx[0]],
        'top1_conf':  prob[top5_idx[0]],
        'top5':       [(classes[i], prob[i]) for i in top5_idx],
    })

# ── Console table ─────────────────────────────────────────────────────────────
LINE = '-' * 72
print(LINE)
print(f'  {"#":<3}  {"Predicted Class":<35}  {"Conf":>6}  {"Image File"}')
print(LINE)
for i, r in enumerate(results, 1):
    fname = r['filename'][:30]
    print(f'  {i:<3}  {r["top1_class"]:<35}  {r["top1_conf"]*100:5.1f}%  {fname}')
print(LINE)

# ── Visual grid ───────────────────────────────────────────────────────────────
N     = len(results)
COLS  = 4
ROWS  = (N + COLS - 1) // COLS

fig, axes = plt.subplots(ROWS, COLS, figsize=(COLS * 4, ROWS * 4.8))
axes = axes.flatten()

for ax, r in zip(axes, results):
    img = load_img(r['path'], target_size=(300, 300))
    ax.imshow(img)
    ax.axis('off')

    # Confidence bar inside the image
    bar_w = r['top1_conf']
    color = '#2ecc71' if r['top1_conf'] >= 0.70 else \
            '#f39c12' if r['top1_conf'] >= 0.45 else '#e74c3c'

    rect_bg  = patches.FancyBboxPatch((0.02, 0.01), 0.96, 0.06,
                                       boxstyle='round,pad=0.01',
                                       linewidth=0, facecolor='#222222aa',
                                       transform=ax.transAxes, clip_on=False)
    rect_bar = patches.FancyBboxPatch((0.02, 0.01), 0.96 * bar_w, 0.06,
                                       boxstyle='round,pad=0.01',
                                       linewidth=0, facecolor=color,
                                       transform=ax.transAxes, clip_on=False)
    ax.add_patch(rect_bg)
    ax.add_patch(rect_bar)

    # Title with predicted label + confidence
    short = r['top1_class'][:28]
    ax.set_title(
        f'{short}\n{r["top1_conf"]*100:.1f}% confidence',
        fontsize=9,
        color=color,
        fontweight='bold',
        pad=4
    )

    # Top-3 mini list below the image
    top3_text = '\n'.join(
        f'  {cls[:22]}: {c*100:.1f}%'
        for cls, c in r['top5'][:3]
    )
    ax.text(0.5, -0.08, top3_text,
            transform=ax.transAxes,
            fontsize=6.5, va='top', ha='center',
            color='#cccccc',
            bbox=dict(facecolor='#111111cc', edgecolor='none', pad=3))

# Hide unused axes
for ax in axes[len(results):]:
    ax.set_visible(False)

fig.patch.set_facecolor('#1a1a2e')
fig.suptitle('Yoga Pose Classification — Some_tests Results',
             fontsize=14, color='white', y=1.01)
plt.tight_layout(rect=[0, 0.04, 1, 1])

out_path = r'd:\Yoga Website\saved_models\some_tests_results.png'
plt.savefig(out_path, dpi=140, bbox_inches='tight',
            facecolor=fig.get_facecolor())
print(f'\nVisual grid saved -> {out_path}')

# ── Detailed top-5 for each image ─────────────────────────────────────────────
print('\n=== Detailed Top-5 Predictions ===\n')
for i, r in enumerate(results, 1):
    print(f'[{i}] {r["filename"]}')
    for rank, (cls, c) in enumerate(r['top5'], 1):
        bar = '#' * int(c * 30)
        print(f'     {rank}. {cls:<35} {c*100:5.1f}%  {bar}')
    print()

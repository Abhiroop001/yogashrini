import os, json
import numpy as np
from PIL import Image

DATASET_DIR = r'd:\Yoga Website\Dataset'
VALID_EXT = {'.jpg', '.jpeg', '.png'}

stats = {}
for c in sorted(os.listdir(DATASET_DIR)):
    d = os.path.join(DATASET_DIR, c)
    if not os.path.isdir(d): continue
    files = [f for f in os.listdir(d) if os.path.splitext(f)[1].lower() in VALID_EXT]
    sizes, widths, heights, modes = [], [], [], []
    for f in files:
        p = os.path.join(d, f)
        sz = os.path.getsize(p)
        sizes.append(sz)
        try:
            with Image.open(p) as img:
                widths.append(img.width)
                heights.append(img.height)
                modes.append(img.mode)
        except:
            pass
    stats[c] = {
        'count': len(files),
        'total_bytes': int(sum(sizes)),
        'avg_size_kb': round(sum(sizes)/len(sizes)/1024, 1) if sizes else 0,
        'avg_w': int(round(float(np.mean(widths)), 0)) if widths else 0,
        'avg_h': int(round(float(np.mean(heights)), 0)) if heights else 0,
        'modes': list(set(modes)),
        'widths': [int(x) for x in widths],
        'heights': [int(x) for x in heights],
    }

total_images = sum(v['count'] for v in stats.values())
total_mb = sum(v['total_bytes'] for v in stats.values()) / 1024**2

print(f'Total images : {total_images}')
print(f'Total size MB: {total_mb:.1f}')
print(f'Num classes  : {len(stats)}')
print()
for c, v in stats.items():
    print(f"{c}: count={v['count']} avg_kb={v['avg_size_kb']} avg_wh={v['avg_w']}x{v['avg_h']} modes={v['modes']}")

with open('dataset_stats.json', 'w') as f:
    json.dump({'classes': stats, 'total_images': total_images, 'total_mb': total_mb}, f, indent=2)
print('\nSaved dataset_stats.json')

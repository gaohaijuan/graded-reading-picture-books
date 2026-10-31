"""Record print-resolution requirements without altering source artwork."""
import csv
import hashlib
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
project = root.parent / 'little-protagonist'
audit = json.loads((root / 'a5-native-resolution-audit.json').read_text(encoding='utf-8'))
labels = {'intro': '你好，我是小石头', 'flower': '我的花', 'family': '我家有几口人？',
          'hands': '我的小手', 'rain': '下雨了', 'stone': '小石头回家'}
bad = [asset for asset in audit['assets'] if not asset['passes300']]
with (root / 'A5印刷清晰度待修复清单.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.writer(stream)
    writer.writerow(['素材路径', '当前宽px', '当前高px', '最低有效ppi', '最差取景故事',
                     '故事内页码', '达到300ppi所需整图最小宽px', '达到300ppi所需整图最小高px', '当前状态'])
    for asset in bad:
        writer.writerow(['preview' + asset['asset'], asset['width'], asset['height'], asset['minimumPpi'],
                         labels[asset['worstBook']], asset['worstPage'], *asset['requiredFullMaster'],
                         '未达标：需要原生高清稿或保真细节重建；未替换原图'])

trial = root / 'hires-courtyard-trial.png'
record = {
    'audit': {'target_effective_ppi': 300, 'physical_art_panel_mm': [128, 131],
              'measured_assets': len(audit['assets']), 'below_300_assets': len(bad),
              'minimum_effective_ppi': min(a['minimumPpi'] for a in audit['assets']),
              'affected_story_pages': sum(p['kind'] == 'story' and p['minimumLayerPpi'] < 300 for p in audit['pages']),
              'scope': 'Current A5 renderer, six stories, default painted avatar and three-person family; no real user portraits.'},
    'trial': {'tool': 'built-in image_gen',
              'edit_target': 'art-samples/my-family-production/courtyard.png',
              'requested_dimensions': [3840, 2160], 'actual_dimensions': list(Image.open(trial).size),
              'candidate': str(trial), 'accepted': False, 'production_assets_replaced': 0,
              'reason': 'Output remains 1672x941 pixels, below the measured 2705x1523 requirement. No sampling improvement; visual sharpening is not a 300ppi qualification.',
              'prompt': 'Conservation-quality higher-resolution restoration of the same empty courtyard, native 3840x2160 requested; identical normalized geometry, objects, palette, gouache/watercolor paper-collage style; no people, no faces, no objects added or moved, no text. Improve only resolved fine texture and edge detail.'},
    'original_asset_sha256': {a['asset']: hashlib.sha256((project / ('preview' + a['asset'])).read_bytes()).hexdigest()
                              for a in audit['assets']},
    'status': 'NOT_PRINT_READY: original artwork retained; awaiting suitable high-resolution sources.'
}
(root / '高清化测试与原素材记录.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(record['audit'], ensure_ascii=False))
print('Production assets replaced:', record['trial']['production_assets_replaced'])

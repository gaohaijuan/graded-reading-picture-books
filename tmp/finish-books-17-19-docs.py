from pathlib import Path
root=Path(__file__).resolve().parents[1]/'little-protagonist'
def update(name,replacements):
    p=root/name;raw=p.read_bytes();text=raw.decode('utf8').replace('\r\n','\n')
    for old,new in replacements:
        assert old in text,(name,old)
        text=text.replace(old,new)
    p.write_bytes(text.replace('\n','\r\n').encode('utf8') if b'\r\n' in raw else text.encode('utf8'))
update('tests/print-service.browser.cjs',[('/16 个故事/','/19 个故事/'),('/第2册 · 6个故事/','/第2册 · 9个故事/'),("count(),16)","count(),19)")])
update('tests/download-print.browser.cjs',[('[84,53]','[84,80]'),('84 and 53 pages','84 and 80 pages')])
p=root/'README.md'
with p.open('a',encoding='utf8',newline='') as f:f.write('\r\n### 第17—19本分层绘本\r\n\r\n正式原稿顺序为《小纸片飞了》《大果子和小果子》《小猫的床》，各8页，逐字沿用 `content/level1-stories-11-20.json`，第20本仍待制作。场景在 `miniprogram/lib/books-seventeen-nineteen-art.js`，原生PNG在 `art-samples/books-17-19-native/`，无损WebP在 `preview/art/sequence/books-17-19/`，完整提示词、参考图及生成来源在 `content/books-17-19-art-provenance.json`。内置图像工具补充10个素材：吃果子动作、完整/咬过的同款苹果、同一伙伴的分享/吃果子动作、透明猫床、3个完整室内视角及困倦小猫；另复用14项场景/道具。未调用图像API。\r\n\r\n纸片左右飞的两页固定观察方向；落地纸片仅对道具施加平面透视，石头出现后才压纸。大小果子来自同款苹果，始终只有两个；小果子先出现咬口，大果子在伙伴吃过后才变化。猫床从球到车再清空，所有搬放由孩子完成，结尾小猫才进入床上睡觉。`eat-fruit` 从已登记 `carry-play` 仅编辑手臂，源画布1024×1536、领口501/225与衣服/腿脚保持母版比例，注册手部接触点，场景没有逐页头部参数。\r\n\r\n浏览器目录现为19本，第2册包含第11—19本9个故事、68页正文、9页小结与1页目录，阅读PDF80页、连续书芯76页，目录正文起始页码为1、8、17、26、33、42、51、60、69。保持阅读顺序，不额外补空白；80页按4的倍数无需补齐，但实际装订仍以印厂审稿为准。有效分辨率逐层实测最低约243ppi，RGB校样不等于原生300ppi或已完成实体打样。默认/真人/窄屏浏览器检查与实际PDF检查保存在仓库外。\r\n')
print('Updated browser regression expectations and production documentation.')

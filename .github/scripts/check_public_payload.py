"""Public-repository deployment gate; contains no private evidence or locators."""
from pathlib import Path
import argparse
import csv
import io
import hashlib
import html
import json
import re
import shutil
from urllib.parse import unquote, urlsplit
from PIL import Image

ROOT = Path.cwd()
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check-only',action='store_true')
args=parser.parse_args()
read = lambda path: json.loads(path.read_text(encoding='utf-8-sig'))
policy = read(ROOT / '.github/deployment.json')
allowed = set(policy['root_files'] + policy['asset_files'] + policy['data_files'])
catalog = read(ROOT / 'assets/data/visual-catalog.json')
assert catalog and len({row['id'] for row in catalog})==len(catalog)
program=read(ROOT/'assets/data/program.json')
assert {area['id'] for area in program['program_areas']}=={'teaching','communities','parks','research'}
cases={case['id']:case for case in program['case_studies']}
assert cases['mtukuzi']['program_areas']==['communities'] and cases['hot-unza']['program_areas']==['teaching']
assert {'communities','parks'}<=set(cases['north-shore']['program_areas'])
assert {'parks','research'}<=set(cases['morningside']['program_areas'])
assert cases['highbridge']['status']=='forthcoming' and not cases['highbridge']['cover'] and not cases['highbridge']['visuals']
milestones=read(ROOT/'assets/data/timeline-milestones.json')['milestones']
assert 8<=len(milestones)<=12
approved_rights = {'owned', 'permission_documented', 'institutional_archive_approved'}
for row in catalog:
    assert set(row)<=set(policy['public_visual_fields']), row['id']+': unexpected public field'
    assert row['rights_status'] in approved_rights and row['publication_status'] == 'approved_display_derivative', row['id']
    allowed.update([row['image'], row['thumb']])
    for path in (ROOT / 'assets/responsive').glob(row['id'] + '-*.webp'):
        if path.stem.removeprefix(row['id'] + '-').isdigit():
            allowed.add(path.relative_to(ROOT).as_posix())
allowed.update(['assets/learning/river-ortho.jpg', 'assets/learning/village-ortho.jpg'])
for identity in ['learning-river-ortho','learning-village-ortho']:
    for path in (ROOT/'assets/responsive').glob(identity+'-*.webp'):
        assert path.stem.removeprefix(identity+'-').isdigit()
        allowed.add(path.relative_to(ROOT).as_posix())
references = {row['url'] for row in read(ROOT / '.github/public-references.json')['references'] if row['decision'] == 'keep' and row['verified_public']}
bad = re.compile(r'(?:drive|docs|mail)\.google\.com|sitescan\.arcgis\.com|\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b|\b[A-Za-z]:[\\/]|(?<![A-Za-z0-9:/])/(?:Users|home)/|local[\\/]communications|[?&](?:access_token|token|sig|signature|x-amz-[^=]+)=|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?<![0-9a-f.])(?=[0-9a-f]{16}(?![0-9a-f]))(?=[0-9a-f]*[a-f])(?=[0-9a-f]*[0-9])[0-9a-f]{16}(?![0-9a-f])', re.I)
opaque_drive = re.compile(r'\b1(?=[A-Za-z0-9_-]{24,}\b)(?=[A-Za-z0-9_-]*[A-Z])(?=[A-Za-z0-9_-]*[a-z])[A-Za-z0-9_-]+\b')
private_keys = {'source_url', 'sourceUrl', 'source_filename', 'source_file', 'source_collection', 'mission_id', 'project_id', 'organization_id', 'viewer_url', 'mission_url', 'metadata_sources', 'metadata_confidence', 'confidence', 'field_sources', 'private_gps', 'gps_latitude', 'gps_longitude', 'origin_xyz', 'privateRefs', 'source_registry_id'}


def keys(value):
    if isinstance(value, dict):
        for key, child in value.items():
            assert key not in private_keys, key
            keys(child)
    elif isinstance(value, list):
        for child in value:
            keys(child)


for name in sorted(allowed):
    path = (ROOT / name).resolve()
    assert path.is_relative_to(ROOT.resolve()) and path.is_file() and not path.is_symlink(), name
    if path.suffix.lower() in {'.html', '.js', '.json', '.csv', '.css', '.svg', '.txt', '.xml'}:
        text = path.read_text(encoding='utf-8-sig')
        decoded = text
        for _ in range(3):
            decoded = html.unescape(unquote(decoded)).replace('\\/', '/')
            decoded = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m:chr(int(m.group(1),16)), decoded)
            decoded = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m:chr(int(m.group(1),16)), decoded)
        assert not bad.search(decoded) and not opaque_drive.search(decoded), name + ': private workspace/token/path pattern'
        if path.suffix == '.json':
            keys(json.loads(text))
        values=[decoded] if path.suffix!='.csv' else [value for row in csv.DictReader(io.StringIO(decoded)) for value in row.values() if isinstance(value,str)]
        for value in values:
            for url in re.findall(r'https?://[^\s<>"\x27\\)\]]+', value):
                url = url.rstrip('.,;')
                host = urlsplit(url).hostname
                assert host in {'kyttmacmanus.github.io', 'www.w3.org', 'www.sitemaps.org'} or url in references, name + ': unreviewed external URL'
    if path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp', '.avif'}:
        with Image.open(path) as image:
            assert not image.getexif() and not any(key.lower() in {'exif', 'xmp', 'xml:com.adobe.xmp', 'comment', 'photoshop'} for key in image.info), name + ': embedded metadata'

# An unexpected file cannot silently enter the artifact through a recursive copy.
actual = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and not any(part in {'.git', '.github', '_site', '__pycache__'} for part in p.relative_to(ROOT).parts)}
assert actual <= allowed | {'README.md'}, sorted(actual - allowed - {'README.md'})
target = ROOT / '_site'
if args.check_only:
    print(json.dumps({'passed': True, 'public_visuals': len(catalog), 'approved_files': len(allowed), 'mode': 'check only'}))
    raise SystemExit(0)
assert not target.exists(), 'Use a fresh checkout for the deployment artifact'
target.mkdir()
for name in sorted(allowed):
    output = target / name
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / name, output)
print(json.dumps({'passed': True, 'public_visuals': len(catalog), 'approved_files': len(allowed), 'private_source_registry': 'excluded'}))

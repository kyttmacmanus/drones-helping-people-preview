"""Check public copy and compare its full inventory with the V6 wording.

The linter reads text nodes, accessibility labels, known public data fields and
UI string literals. It does not scan machine metadata values, JS identifiers,
comments or the private evidence registries. No third-party modules are needed.
"""
import argparse
from collections import Counter
import csv
import fnmatch
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess

ROOT=Path(__file__).resolve().parents[1]
DEFAULT_POLICY=ROOT/'content/public-copy-policy.json'

def load_policy(policy=None):
    if isinstance(policy,dict):return policy
    path=Path(policy) if policy is not None else DEFAULT_POLICY
    if not path.is_file():
        path=Path(__file__).with_name('public-copy-policy.json')
    return json.loads(path.read_text(encoding='utf-8-sig'))

def plain(value):return ' '.join(unescape(value).split())

class ReaderHTML(HTMLParser):
    """Collect prose and accessible labels, keeping component IDs where present."""
    def __init__(self,name):
        super().__init__(convert_charrefs=True)
        self.name=name;self.stack=[];self.skip=0;self.rows=[];self.counts=Counter()
    def add(self,kind,value):
        value=plain(value)
        if not value:return
        owner=next((identifier for _,identifier in reversed(self.stack) if identifier),'page')
        key=(owner,kind);self.counts[key]+=1
        self.rows.append({'component':f'{self.name}#{owner}/{kind}[{self.counts[key]}]','wording':value,'context':self.name})
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag in {'script','style'}:self.skip+=1
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append((tag,attrs.get('id','')))
        if self.skip:return
        for name in ['alt','aria-label','title','placeholder']:
            if attrs.get(name):self.add(tag+'@'+name,attrs[name])
        if tag=='meta' and (attrs.get('name')=='description' or attrs.get('property') in {'og:title','og:description','og:image:alt'}):
            self.add('meta@'+(attrs.get('name') or attrs.get('property')),attrs.get('content',''))
    def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
    def handle_endtag(self,tag):
        if tag in {'script','style'}:self.skip=max(0,self.skip-1)
        for index in range(len(self.stack)-1,-1,-1):
            if self.stack[index][0]==tag:
                self.stack=self.stack[:index];break
    def handle_data(self,data):
        if not self.skip:self.add(self.stack[-1][0] if self.stack else 'text',data)

def html_rows(name,text):
    parser=ReaderHTML(name);parser.feed(text);return parser.rows

def json_rows(name,data,policy):
    fields=set(policy['reader_json_fields']);rows=[]
    def visit(value,path='',selected=False):
        if isinstance(value,dict):
            for key,child in value.items():
                if key=='points':continue
                visit(child,path+'/'+key,key in fields)
        elif isinstance(value,list):
            for index,child in enumerate(value):
                label=str(child.get('id',child.get('case_study_id',index))) if isinstance(child,dict) else str(index)
                visit(child,path+'/'+label,selected)
        elif selected and isinstance(value,str) and plain(value):
            rows.append({'component':name+path,'wording':plain(value),'context':name})
    visit(data)
    return rows

# A small lexer avoids mistaking quote characters inside JS regular expressions
# for strings. It inspects text only; it never evaluates JavaScript.
def js_literals(text):
    values=[];length=len(text)
    def scan(start,expression=False):
        i=start;depth=1 if expression else 0;previous='='
        while i<length:
            char=text[i]
            if char.isspace():i+=1;continue
            if text.startswith('//',i):
                end=text.find('\n',i);i=length if end<0 else end+1;continue
            if text.startswith('/*',i):
                end=text.find('*/',i+2);i=length if end<0 else end+2;continue
            if char=='/' and previous in '=(:,[!&|?;{':
                i+=1;in_class=False
                while i<length:
                    if text[i]=='\\':i+=2;continue
                    if text[i]=='[':in_class=True
                    elif text[i]==']':in_class=False
                    elif text[i]=='/' and not in_class:
                        i+=1
                        while i<length and text[i].isalpha():i+=1
                        break
                    i+=1
                previous='x';continue
            if char in "'\"`":
                quote=char;buffer=[];literal_start=i;i+=1
                while i<length:
                    char=text[i]
                    if char=='\\' and i+1<length:
                        escaped=text[i+1];buffer.append({'n':' ','t':' ','r':' '}.get(escaped,escaped));i+=2;continue
                    if char==quote:
                        values.append((''.join(buffer),text[max(0,literal_start-100):literal_start]));i+=1;break
                    if quote=='`' and text.startswith('${',i):
                        buffer.append(' ');i=scan(i+2,True);continue
                    buffer.append(char);i+=1
                previous='x';continue
            if expression:
                if char=='{':depth+=1
                elif char=='}':
                    depth-=1
                    if depth==0:return i+1
            previous=char;i+=1
        return i
    scan(0)
    return values

def js_rows(name,text,policy):
    rows=[];counts=Counter();short=set(policy.get('short_ui_literals',[]))
    for value,prefix in js_literals(text):
        if not value:continue
        value=value.replace('\\n',' ').replace('\\t',' ').replace('\\r',' ').replace("\\'","'").replace('\\"','"')
        # A template contains static UI text plus values audited in their data files.
        if '<' in value and re.search(r'<[a-z][^>]*>',value,re.I):
            for _ in range(6):value=re.sub(r'\$\{[^{}]*\}',' ',value)
            parts=html_rows(name,value)
            candidates=[row['wording'] for row in parts]
        else:
            value=plain(value)
            direct_ui=bool(re.search(r'(?:textContent|innerText|innerHTML|aria-label|createTextNode|\badd\()[^;\n]{0,60}$',prefix))
            flagged_label=direct_ui and any(re.search(rule['pattern'],value,re.I) for rule in policy['rules'])
            if not (value in short or flagged_label or (re.search(r'[A-Za-z]',value) and ' ' in value)):continue
            if any(token in value for token in ['${','=>','function(','querySelector','document.','window.','https://','http://']):continue
            if '\\' in value or re.search(r'\.(?:html|json|csv|js|css|jpe?g|png|svg|webp)(?:[?#]|$)',value):continue
            if re.search(r'(?:^|\s)(?:class|style|href|src|width|height|loading|decoding|alt|title|aria-[\w-]+|data-[\w-]+)=',value):continue
            if re.fullmatch(r'[\w.{}:#>\[\](),\s-]+',value) and not (' ' in value or value in short or flagged_label):continue
            if len(value)>1000 or re.match(r'^[\d.]+px\s',value):continue
            candidates=[value]
        for value in candidates:
            if not value or not re.search(r'[A-Za-z]',value) or re.search(r'[{}<>]|\$\{|=>|\.join\(',value):continue
            counts[value]+=1
            rows.append({'component':f'{name}/ui[{value}][{counts[value]}]','wording':value,'context':name})
    return rows

def inventory(site,policy=None,contents=None):
    policy=load_policy(policy);site=Path(site)
    rows=[]
    if contents is None:
        names=[p.relative_to(site).as_posix() for p in site.glob('*.html')]
        names += [p.relative_to(site).as_posix() for p in (site/'assets').glob('*.js')]
        names += [name for name in policy['reader_data_files'] if (site/name).is_file()]
        get=lambda name:(site/name).read_text(encoding='utf-8-sig')
    else:
        names=list(contents);get=contents.get
    for name in sorted(set(names)):
        text=get(name)
        if name.endswith('.html'):rows.extend(html_rows(name,text))
        elif name.endswith('.js'):rows.extend(js_rows(name,text,policy))
        elif name in policy['reader_data_files']:rows.extend(json_rows(name,json.loads(text),policy))
    return rows

def audit_site(site,policy=None):
    """Return copy findings for a site tree; importing this module writes nothing."""
    policy=load_policy(policy);findings=[]
    for row in inventory(Path(site),policy):
        allowed=set()
        for pattern,values in policy.get('allowed_rules_by_context',{}).items():
            if fnmatch.fnmatch(row['context'],pattern):allowed.update(values)
        for rule in policy['rules']:
            if rule['pattern'] in allowed:continue
            if re.search(rule['pattern'],row['wording'],re.I):
                findings.append(dict(row,issue=rule['issue'],rule=rule['pattern']))
    return findings

def baseline_inventory(ref,policy):
    names=subprocess.check_output(['git','ls-tree','-r','--name-only',ref,'site'],cwd=ROOT,text=True).splitlines()
    chosen=[name for name in names if (name.count('/')==1 and name.endswith('.html')) or (name.startswith('site/assets/') and name.count('/')==2 and name.endswith('.js')) or name.removeprefix('site/') in policy['reader_data_files']]
    contents={}
    for name in chosen:
        contents[name.removeprefix('site/')]=subprocess.check_output(['git','show',ref+':'+name],cwd=ROOT).decode('utf-8-sig')
    return inventory(ROOT/'site',policy,contents)

def issue_for(before,after,component):
    if before==after:return 'good_as_is'
    if ('drive-lamont-jan2023-overhead/alt_text' in component or 'lamont-march-visible/alt_text' in component):return 'unsupported_claim'
    if re.search(r'canonical|registry|source-review|public projection|private provenance|approved|derivative|archive|implementation|reader-facing|metadata schema',before,re.I):return 'internal_language'
    if re.search(r'people and place|shared work|connect.*relationships|starts a conversation|made possible|developed with many groups',before,re.I):return 'too_abstract'
    if not after:return 'redundant'
    if len(before.split())>35 and len(after.split())<len(before.split())*.85:return 'too_verbose'
    if re.search(r'innovative|reimagin|reveals a new perspective',before,re.I):return 'marketing_or_slogan'
    if re.search(r'Participants and equipment are shown|standing together outdoors',before,re.I):return 'unclear_actor'
    if re.search(r'EXIF|CRS|rendered.*viewer',before):return 'technical_jargon'
    return 'voice_mismatch'

def write_audit(site,policy,destination,ref=None):
    before=baseline_inventory(ref or policy['baseline_commit'],policy)
    after=inventory(site,policy)
    current={row['component']:row for row in after}
    baseline={row['component']:row for row in before}
    rows=[]
    for component in sorted(set(baseline)|set(current)):
        old=baseline.get(component,{}).get('wording','');new=current.get(component,{}).get('wording','')
        issue=issue_for(old,new,component)
        dependency='Existing project/source description; facts, dates and scientific limits retained.'
        if issue=='unsupported_claim':
            dependency=('Visual inspection of assets/drive/lamont-jan2023-overhead.jpg confirms a field-group photograph, not a photogrammetric point-cloud display.' if 'drive-lamont-jan2023-overhead' in component else 'Visual inspection of assets/students/lamont-march-visible.jpg confirms a visible-light group photograph, not a thermal display.')
        elif 'samara' in component:dependency='Author account and November 19 team feedback: electrification context, participation and spin-up stage; no scored flight claim.'
        elif 'highbridge' in component:dependency='November 16 field operation, processing notices and inspected SiteScan True Ortho and tower-mesh views. Mission dates do not verify individual camera times; unresolved image counts remain withheld.'
        elif 'staten-island' in component or 'mtukuzi' in component:dependency='Existing community/collaborator record; no new partner-use or outcome claim.'
        action='retain' if old==new else 'add' if not old else 'remove' if not new else 'rewrite'
        rows.append({'page/component':component,'current wording':old,'issue':issue,'proposed wording':new,'action':action,'evidence/claim dependency if applicable':dependency})
    destination=Path(destination);destination.parent.mkdir(parents=True,exist_ok=True)
    with destination.open('w',encoding='utf-8-sig',newline='') as handle:
        writer=csv.DictWriter(handle,fieldnames=['page/component','current wording','issue','proposed wording','action','evidence/claim dependency if applicable'])
        writer.writeheader();writer.writerows(rows)
    return rows

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site-dir',type=Path,default=ROOT/'site')
    parser.add_argument('--policy',type=Path)
    parser.add_argument('--report',type=Path)
    parser.add_argument('--write-audit',type=Path,help='Write the full before/after reader-copy inventory as CSV.')
    parser.add_argument('--baseline',help='Override the private V6 baseline commit used only for CSV creation.')
    args=parser.parse_args();policy=load_policy(args.policy)
    findings=audit_site(args.site_dir,policy)
    result={'passed':not findings,'reader_strings_checked':len(inventory(args.site_dir,policy)),'findings':findings}
    if args.write_audit:
        rows=write_audit(args.site_dir,policy,args.write_audit,args.baseline)
        result['audit_rows']=len(rows);result['actions']=dict(Counter(row['action'] for row in rows));result['issues']=dict(Counter(row['issue'] for row in rows))
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=True,indent=2))
    return 0 if result['passed'] else 1

if __name__=='__main__':raise SystemExit(main())
